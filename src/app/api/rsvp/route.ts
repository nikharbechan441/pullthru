import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  getEventBySlug,
  createDirectRsvp,
  isPopHashAlreadyUsed,
  swapRsvpSpot,
  toggleCheckInRsvp,
  moderateRsvp,
  toggleRsvpPrivacy,
  recoverGuestPass,
  requestOrProcessRefund,
} from "@/lib/store";
import {
  validateVelocityCaps,
  sanitizeGuestComment,
  deriveGatePin,
} from "@/lib/compliance";
import {
  parseSaBankSms,
  validatePopFile,
  computeCanonicalSmsHash,
} from "@/lib/popEngine";
import { PaymentChannel, RsvpStatus } from "@/types/database";
import {
  enforceRateLimit,
  enforceSameOrigin,
  sanitizeErrorMessage,
} from "@/lib/security";

const SEED_HOST_TOKENS = new Set([
  "host-secret-tariq-fives",
  "host-secret-riaan-braai",
  "host-secret-mbali-pot",
  "host-secret-chloe-boat",
  "host-secret-sbu-run",
]);

function verifyHostToken(
  supplied: string | null | undefined,
  expected: string | null | undefined
): boolean {
  if (!supplied || !expected) return false;
  if (
    process.env.NODE_ENV === "production" &&
    SEED_HOST_TOKENS.has(String(supplied).trim())
  ) {
    return false;
  }
  const a = Buffer.from(String(supplied), "utf8");
  const b = Buffer.from(String(expected), "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  try {
    const originErr = enforceSameOrigin(request);
    if (originErr) return originErr;

    const rateErr = enforceRateLimit(request, "rsvp:post", 25, 60_000);
    if (rateErr) return rateErr;

    let body: Record<string, any>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload." },
        { status: 400 }
      );
    }

    let {
      slug,
      guest_name,
      spots_locked = 1,
      plus_one_names = [],
      amount_contributed_zar = 0,
      tier_label = null,
      comment = null,
      claimed_item_id = null,
      custom_answer = null,
      is_anonymous_on_wall = false,
      badge_label,
      status,
      payday_preauthorized = false,
      action,
      pop_hash = null,
      pop_rail_badge = null,
    } = body;

    if (!slug || !String(slug).trim() || !guest_name || !String(guest_name).trim()) {
      return NextResponse.json(
        { error: "Event slug and guest_name are required." },
        { status: 400 }
      );
    }

    const rawSpots = Number(spots_locked);
    if (!Number.isInteger(rawSpots) || rawSpots < 1 || rawSpots > 20) {
      return NextResponse.json(
        { error: "Invalid spots_locked: must be a whole number between 1 and 20." },
        { status: 400 }
      );
    }

    if (
      amount_contributed_zar !== undefined &&
      amount_contributed_zar !== null &&
      (!Number.isFinite(Number(amount_contributed_zar)) || Number(amount_contributed_zar) < 0)
    ) {
      return NextResponse.json(
        { error: "Invalid amount_contributed_zar: cannot be negative." },
        { status: 400 }
      );
    }

    const VALID_DIRECT_STATUSES: RsvpStatus[] = [
      "going_free",
      "cash_logged",
      "payday_promise",
    ];
    if (
      status !== undefined &&
      status !== null &&
      !VALID_DIRECT_STATUSES.includes(status as RsvpStatus)
    ) {
      return NextResponse.json(
        {
          error:
            "Unsupported direct RSVP status. Use going_free, cash_logged, or payday_promise.",
        },
        { status: 400 }
      );
    }

    const existingData = await getEventBySlug(String(slug).trim());
    if (!existingData) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    const { event, rsvps } = existingData;
    if (event.is_cancelled || event.is_active === false) {
      return NextResponse.json(
        {
          error:
            "This event has been cancelled or closed by the host and is no longer accepting RSVPs.",
        },
        { status: 400 }
      );
    }
    const requestedSpots = rawSpots;

    // Validate claimed_item_id against event.bring_items
    if (claimed_item_id !== undefined && claimed_item_id !== null && String(claimed_item_id).trim() !== "") {
      const targetItem = (event.bring_items || []).find(
        (item) => item.id === String(claimed_item_id).trim()
      );
      if (!targetItem) {
        return NextResponse.json(
          { error: "Selected bring-something item does not exist on this event." },
          { status: 400 }
        );
      }
      if (targetItem.claimed_by_name) {
        return NextResponse.json(
          {
            error: `Eish! "${targetItem.label}" was already claimed by ${targetItem.claimed_by_name}.`,
          },
          { status: 409 }
        );
      }
    }

    // Non-gateway RSVPs:
    // 1. "cash_logged": Host 1-Tap Manual Cash / Direct EFT Tick-Off (POPIA: no guest phone number required!)
    // 2. "payday_promise": Soft hold on the wall when event.allow_payday_promise is true
    // 3. "going_free": Strictly restricted to Free events (event.mode === "free") or genuine R0 tiers (e.g. Kids under 12)
    let resolvedStatus: RsvpStatus = "going_free";
    let paymentChannel: PaymentChannel = "cash_manual";
    let resolvedTierLabel: string | null = tier_label ? String(tier_label) : null;
    let resolvedAmountZar = 0;

    if (event.mode === "tiered" && Array.isArray(event.tiers) && (body.tier_id || tier_label)) {
      const matchedTier = event.tiers.find((t) => {
        const hasIdMatch = Boolean(body.tier_id && t.id === body.tier_id);
        const hasLabelMatch = Boolean(tier_label && t.label === tier_label);
        if (body.tier_id && tier_label) return hasIdMatch && hasLabelMatch;
        return hasIdMatch || hasLabelMatch;
      });
      if (!matchedTier) {
        return NextResponse.json(
          { error: "Selected tier does not exist on this tiered event." },
          { status: 400 }
        );
      }
      resolvedTierLabel = matchedTier.label;
    }

    let matchedFreeTier: { id: string; label: string; price_zar: number; max_spots?: number | null } | null = null;

    const suppliedHostToken =
      body.host_token ||
      body.hostSecretToken ||
      request.headers.get("x-host-token");
    const isHost = verifyHostToken(suppliedHostToken, event.host_secret_token);

    if (action === "verify_cash_received") {
      if (!isHost) {
        return NextResponse.json(
          { error: "Unauthorized: Only the host with a valid secret token can verify cash." },
          { status: 403 }
        );
      }
      const targetRsvpId = String(body.rsvp_id || "").trim();
      const modRes = await moderateRsvp(event.slug, targetRsvpId, "verify_cash");
      if (!modRes) {
        return NextResponse.json({ error: "RSVP not found." }, { status: 404 });
      }
      const safeModEvent = modRes.event
        ? (({ host_secret_token: _ht, ...rest }) => {
            void _ht;
            return rest;
          })(modRes.event)
        : null;
      return NextResponse.json({
        success: true,
        event: safeModEvent,
        rsvp: modRes.rsvp,
      });
    }

    if (action === "verify_direct_pop") {
      let cleanPopHash = String(pop_hash || "").trim();
      if (
        !cleanPopHash ||
        cleanPopHash.length < 8 ||
        (!cleanPopHash.startsWith("pop_file_sha256_") &&
          !cleanPopHash.startsWith("pop_file_") &&
          !cleanPopHash.startsWith("pop_sms_") &&
          !cleanPopHash.startsWith("demo_pop_"))
      ) {
        return NextResponse.json(
          {
            error:
              "Please upload your PayShap / Capitec PayMe / EFT Proof of Payment (screenshot or PDF) or paste your bank confirmation SMS.",
          },
          { status: 400 }
        );
      }

      const DEMO_EVENT_SLUGS = new Set([
        "thursday-fives-sandton",
        "bokke-test-spitbraai",
        "mrs-dlamini-baby-shower",
        "clifton-sunset-catamaran",
        "seapoint-sunrise-run-club",
        "sunday-spitbraai-bryanston",
        "atlantic-seaboard-padel",
        "stokvel-year-end-pot",
        "saturday-sunrise-run-club",
      ]);
      if (
        cleanPopHash.startsWith("demo_pop_") &&
        !DEMO_EVENT_SLUGS.has(event.slug)
      ) {
        return NextResponse.json(
          {
            error:
              "Demo POP test slips are only permitted on official demo events. Please upload your real bank POP screenshot/PDF or paste your bank confirmation SMS.",
          },
          { status: 400 }
        );
      }

      // Compute expected baseline minimum for the requested spots
      let expectedMinZar = 15 * requestedSpots;
      if (event.mode === "fixed") {
        expectedMinZar = Math.max(15, Number(event.price_zar) || 15) * requestedSpots;
      } else if (event.mode === "pot") {
        expectedMinZar =
          Math.max(15, Number(event.min_pot_contribution_zar || event.price_zar || 15)) *
          requestedSpots;
      } else if (event.mode === "tiered" && Array.isArray(event.tiers)) {
        const selectedTierObj = event.tiers.find(
          (t) =>
            (body.tier_id && t.id === body.tier_id) ||
            (resolvedTierLabel && t.label === resolvedTierLabel)
        );
        if (!selectedTierObj) {
          return NextResponse.json(
            { error: "Please select a valid ticket tier for this event." },
            { status: 400 }
          );
        }
        expectedMinZar = Math.max(0, Number(selectedTierObj.price_zar) || 0) * requestedSpots;
      }

      let canonicalSmsHash: string | null = null;
      let detectedSmsAmountZar: number | null = null;

      if (cleanPopHash.startsWith("pop_sms_")) {
        const rawSmsNote = String(
          body.pop_sms_text || body.pop_reference_note || ""
        ).trim();

        // Run full South African Bank POP Verification & Anti-Fraud Engine
        const parseResult = parseSaBankSms(rawSmsNote, expectedMinZar, event.host_name);
        if (!parseResult.isValid) {
          return NextResponse.json(
            {
              error:
                parseResult.rejectionReason ||
                "Please paste a valid South African bank payment confirmation SMS (including the R amount, bank name, or reference).",
            },
            { status: 400 }
          );
        }

        canonicalSmsHash = parseResult.canonicalHash;
        detectedSmsAmountZar = parseResult.detectedAmountZar;
        if (!pop_rail_badge || pop_rail_badge === "standard_eft") {
          pop_rail_badge = parseResult.paymentRail;
        }

        const dupByCanonicalSms = (rsvps || []).find((r) => {
          if (r.status === "refunded") return false;
          if (r.pop_hash === canonicalSmsHash || r.pop_hash === cleanPopHash) {
            return true;
          }
          if (r.pop_reference_note) {
            const existingNorm = computeCanonicalSmsHash(r.pop_reference_note);
            if (existingNorm === canonicalSmsHash) {
              return true;
            }
          }
          return false;
        });
        if (dupByCanonicalSms) {
          return NextResponse.json(
            {
              error:
                "Chancer Alert: This Proof of Payment slip or bank SMS has already been used to lock a spot on this event.",
            },
            { status: 409 }
          );
        }
      } else if (cleanPopHash.startsWith("pop_file_")) {
        const hashSuffix = cleanPopHash
          .replace(/^pop_file_sha256_/, "")
          .replace(/^pop_file_/, "");
        if (hashSuffix.length < 12 || /(.)\1{5,}/.test(hashSuffix)) {
          return NextResponse.json(
            {
              error:
                "Invalid or unverified Proof of Payment slip hash. Please upload a real bank POP screenshot or PDF.",
            },
            { status: 400 }
          );
        }
        if (body.pop_file_size !== undefined && body.pop_file_size !== null) {
          const fileVal = validatePopFile({
            name: String(body.pop_file_name || "slip.png"),
            size: Number(body.pop_file_size) || 0,
          });
          if (!fileVal.isValid) {
            return NextResponse.json(
              { error: fileVal.rejectionReason },
              { status: 400 }
            );
          }
        }
      }

      // Check for global or in-event duplicate POP hashes
      const effectivePopHash = canonicalSmsHash || cleanPopHash;
      const duplicatePop = (rsvps || []).find(
        (r) =>
          r.status !== "refunded" &&
          r.pop_hash &&
          (r.pop_hash === effectivePopHash ||
            r.pop_hash === cleanPopHash ||
            (canonicalSmsHash && r.pop_hash === canonicalSmsHash))
      );
      const globallyUsed = await isPopHashAlreadyUsed([
        cleanPopHash,
        ...(canonicalSmsHash ? [canonicalSmsHash] : []),
      ]);
      if (duplicatePop || globallyUsed) {
        return NextResponse.json(
          {
            error:
              "Chancer Alert: This Proof of Payment slip or bank SMS has already been used to lock a spot.",
          },
          { status: 409 }
        );
      }

      // If canonicalSmsHash is present, save the canonical hash as pop_hash
      if (canonicalSmsHash) {
        cleanPopHash = canonicalSmsHash;
      }

      const clientAmountZar =
        detectedSmsAmountZar !== null && detectedSmsAmountZar !== undefined
          ? Math.round(detectedSmsAmountZar)
          : amount_contributed_zar !== undefined &&
            amount_contributed_zar !== null &&
            Number(amount_contributed_zar) > 0
          ? Math.round(Number(amount_contributed_zar))
          : expectedMinZar;

      if (clientAmountZar < expectedMinZar) {
        return NextResponse.json(
          {
            error: `Underpaid amount: Minimum contribution for ${requestedSpots} spot(s) is R${expectedMinZar}.00.`,
          },
          { status: 400 }
        );
      }

      resolvedAmountZar = clientAmountZar;
      resolvedStatus = "locked_paid";
      paymentChannel =
        pop_rail_badge === "standard_eft" ? "eft" : "capitec_pay";
    } else if (action === "reserve_cash_on_arrival") {
      const isPayShapClaim =
        Boolean(body.is_payshap_claim) ||
        /payshap/i.test(String(badge_label || ""));
      if (event.allow_cash_on_arrival === false && !isPayShapClaim) {
        return NextResponse.json(
          { error: "Cash on arrival is not enabled for this event." },
          { status: 400 }
        );
      }
      if (requestedSpots > 4) {
        return NextResponse.json(
          {
            error:
              "Cash on arrival reservations are limited to 4 spots per booking to prevent hoarding.",
          },
          { status: 400 }
        );
      }
      let expectedMinZar = 15 * requestedSpots;
      if (event.mode === "fixed") {
        expectedMinZar = Math.max(15, Number(event.price_zar) || 15) * requestedSpots;
      } else if (event.mode === "pot") {
        const minPot = Math.max(15, Number(event.min_pot_contribution_zar || event.price_zar || 15)) * requestedSpots;
        const clientPot = Number(amount_contributed_zar) || 0;
        expectedMinZar = clientPot >= minPot ? Math.round(clientPot) : minPot;
      } else if (event.mode === "tiered") {
        const t = (event.tiers || []).find(
          (x) => x.id === body.tier_id || x.label === tier_label
        );
        if (!t) {
          return NextResponse.json(
            { error: "Please select a valid ticket tier for this event." },
            { status: 400 }
          );
        }
        expectedMinZar = Math.max(0, Number(t.price_zar) || 0) * requestedSpots;
      }
      resolvedAmountZar = expectedMinZar;
      resolvedStatus = "cash_logged";
      paymentChannel = isPayShapClaim ? "payshap" : "cash_manual";
    } else if (status === "cash_logged") {
      if (!isHost) {
        return NextResponse.json(
          { error: "Unauthorized: Only the host with a valid secret token can log cash/direct EFT guests." },
          { status: 403 }
        );
      }

      resolvedAmountZar = Math.round(Math.max(0, Number(amount_contributed_zar) || 0));
      const currentPoolRaisedZar = (rsvps || [])
        .filter(
          (r) =>
            r.status === "locked_paid" ||
            r.status === "cash_logged" ||
            r.status === "going_free"
        )
        .reduce((sum, r) => sum + (r.amount_contributed_zar || 0), 0);

      const velocityCheck = validateVelocityCaps({
        totalBasePriceZar: resolvedAmountZar,
        currentPoolRaisedZar,
        trustTier: "tier_0_new",
      });
      if (!velocityCheck.valid) {
        return NextResponse.json(
          { error: velocityCheck.error },
          { status: 400 }
        );
      }

      resolvedStatus = "cash_logged";
      paymentChannel = "cash_manual";
    } else if (status === "payday_promise") {
      if (!event.allow_payday_promise) {
        return NextResponse.json(
          { error: "Payday 25th Promise is not enabled for this event." },
          { status: 400 }
        );
      }
      resolvedStatus = "payday_promise";
      paymentChannel = "capitec_pay";
      // Payday promise is a soft unpaid pledge; never inflate confirmed pot total
      resolvedAmountZar = 0;
    } else {
      matchedFreeTier = null;
      if (event.mode === "tiered" && Array.isArray(event.tiers)) {
        matchedFreeTier =
          event.tiers.find((t) => {
            if (t.price_zar !== 0) return false;
            const hasIdMatch = Boolean(body.tier_id && t.id === body.tier_id);
            const hasLabelMatch = Boolean(tier_label && t.label === tier_label);
            if (body.tier_id && tier_label) {
              return hasIdMatch && hasLabelMatch;
            }
            return hasIdMatch || hasLabelMatch;
          }) || null;
      }

      if (event.mode !== "free" && !matchedFreeTier) {
        return NextResponse.json(
          {
            error:
              "Geen Kansvatters! This is a paid event — spots can only be locked via verified PayShap / Capitec PayMe / EFT proof of payment, Payday Promise, or Host Cash Log.",
          },
          { status: 400 }
        );
      }

      if (matchedFreeTier) {
        resolvedTierLabel = matchedFreeTier.label;
      }
      resolvedStatus = "going_free";
      paymentChannel = "cash_manual";
      resolvedAmountZar = 0;
    }

    // Overbooking Capacity Guard across all direct RSVP statuses
    if (event.max_spots !== null) {
      const currentLockedSpots = (rsvps || [])
        .filter(
          (r) =>
            r.refund_status !== "refunded" &&
            (r.status === "locked_paid" ||
              r.status === "cash_logged" ||
              r.status === "going_free")
        )
        .reduce((sum, r) => sum + (r.spots_locked || 1), 0);

      if (currentLockedSpots + requestedSpots > event.max_spots) {
        const remaining = Math.max(0, event.max_spots - currentLockedSpots);
        return NextResponse.json(
          {
            error: `Eish! Those spots were just taken. Only ${remaining} spot(s) left!`,
          },
          { status: 409 }
        );
      }
    }

    // Per-tier max_spots guard if applicable
    if (
      event.mode === "tiered" &&
      resolvedTierLabel &&
      Array.isArray(event.tiers)
    ) {
      const targetTier = event.tiers.find((t) => t.label === resolvedTierLabel);
      if (
        targetTier &&
        typeof targetTier.max_spots === "number" &&
        targetTier.max_spots > 0
      ) {
        const tierSpotsLocked = (rsvps || [])
          .filter(
            (r) =>
              r.refund_status !== "refunded" &&
              (r.status === "locked_paid" ||
                r.status === "cash_logged" ||
                r.status === "going_free") &&
              r.tier_label === targetTier.label
          )
          .reduce((sum, r) => sum + (r.spots_locked || 1), 0);
        if (tierSpotsLocked + requestedSpots > targetTier.max_spots) {
          const tierRem = Math.max(0, targetTier.max_spots - tierSpotsLocked);
          return NextResponse.json(
            {
              error: `Eish! Tier "${targetTier.label}" only has ${tierRem} spot(s) left!`,
            },
            { status: 409 }
          );
        }
      }
    }

    const parsedPlusOnes = Array.isArray(plus_one_names)
      ? plus_one_names
          .slice(0, 20)
          .map((n: unknown) => String(n).trim().slice(0, 60))
          .filter(Boolean)
      : [];

    const validRailBadge =
      pop_rail_badge === "instant_payshap" ||
      pop_rail_badge === "capitec_payme" ||
      pop_rail_badge === "standard_eft"
        ? pop_rail_badge
        : null;

    const cleanClientBadge =
      badge_label &&
      !/verified|official|pre-authorized|pop\b|certified/i.test(String(badge_label))
        ? String(badge_label).slice(0, 80)
        : null;

    const resolvedBadgeLabel =
      resolvedStatus === "payday_promise"
        ? Boolean(payday_preauthorized)
          ? "🔒 Payday Pre-Authorized"
          : "🗓️ Payday Pledge (Standby)"
        : action === "reserve_cash_on_arrival"
        ? /payshap/i.test(String(badge_label || ""))
          ? "📲 PayShap Sent"
          : "💵 Cash on Arrival"
        : action === "verify_direct_pop"
        ? cleanClientBadge ||
          (validRailBadge === "capitec_payme"
            ? "⚡ Capitec PayMe Verified"
            : validRailBadge === "standard_eft"
            ? "⏳ EFT POP Uploaded"
            : "⚡ PayShap POP Verified")
        : cleanClientBadge
        ? cleanClientBadge
        : resolvedStatus === "cash_logged"
        ? "💵 Cash Legend"
        : "🏃 Crew Locked In";

    const { rsvp, event: updatedEvent } = await createDirectRsvp({
      order_id: null,
      event_id: event.id,
      guest_name: String(guest_name).trim().slice(0, 80),
      spots_locked: requestedSpots,
      plus_one_names: parsedPlusOnes,
      amount_contributed_zar: resolvedAmountZar,
      tier_label: resolvedTierLabel,
      status: resolvedStatus,
      payment_channel: paymentChannel,
      badge_label: resolvedBadgeLabel,
      comment: sanitizeGuestComment(comment ? String(comment) : null),
      claimed_item_id: claimed_item_id ? String(claimed_item_id).trim() : null,
      claimed_item_label: null,
      custom_answer: custom_answer ? String(custom_answer).trim().slice(0, 280) : null,
      is_anonymous_on_wall: Boolean(is_anonymous_on_wall),
      payday_preauthorized: Boolean(payday_preauthorized),
      pop_hash: action === "verify_direct_pop" ? String(pop_hash).trim().slice(0, 128) : null,
      pop_rail_badge: validRailBadge,
      pop_reference_note:
        action === "reserve_cash_on_arrival"
          ? /payshap/i.test(String(badge_label || ""))
            ? "📲 PayShap Sent (Pending Host Confirmation)"
            : "💵 Cash on Arrival (Pending Host Confirmation)"
          : action === "verify_direct_pop" && body.pop_reference_note
          ? String(body.pop_reference_note).trim().slice(0, 160)
          : null,
      guest_whatsapp:
        body.guest_whatsapp || body.buyer_whatsapp
          ? String(body.guest_whatsapp || body.buyer_whatsapp)
              .replace(/\D/g, "")
              .slice(0, 20)
          : null,
      settling_rsvp_id:
        body.settling_rsvp_id || body.settlingRsvpId
          ? String(body.settling_rsvp_id || body.settlingRsvpId).trim()
          : null,
    });

    const { host_secret_token, ...safeUpdatedEvent } = updatedEvent;
    void host_secret_token;
    safeUpdatedEvent.has_secret_location_pin = Boolean(
      updatedEvent.secret_location_pin &&
        String(updatedEvent.secret_location_pin).trim()
    );
    // Standalone R0 tier on a paid tiered event or unconfirmed cash on arrival must NOT unlock private estate gate codes
    const canUnlockPin =
      isHost ||
      (action === "verify_direct_pop" && validRailBadge !== "standard_eft") ||
      (resolvedStatus === "cash_logged" && action !== "reserve_cash_on_arrival") ||
      (resolvedStatus === "going_free" && event.mode === "free");
    if (!isHost) {
      safeUpdatedEvent.host_account_number = null;
    }
    if (!canUnlockPin) {
      safeUpdatedEvent.secret_location_pin = null;
      if (event.mode === "free") {
        safeUpdatedEvent.host_phone = "";
      }
    }

    return NextResponse.json(
      {
        rsvp: {
          ...rsvp,
          gate_pin: deriveGatePin(rsvp.swap_token || rsvp.id),
        },
        event: safeUpdatedEvent,
      },
      { status: 201 }
    );
  } catch (error) {
    const rawMessage =
      error instanceof Error ? error.message : "Failed to record RSVP.";
    if (rawMessage.startsWith("CAPACITY_EXCEEDED:")) {
      return NextResponse.json(
        { error: rawMessage.replace("CAPACITY_EXCEEDED: ", "") },
        { status: 409 }
      );
    }
    const message = sanitizeErrorMessage(error, "Failed to record RSVP.");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const originErr = enforceSameOrigin(request);
    if (originErr) return originErr;

    let body: Record<string, any>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload." },
        { status: 400 }
      );
    }

    const { action, slug } = body;

    if (!action || !slug) {
      return NextResponse.json(
        { error: "Both action and slug are required." },
        { status: 400 }
      );
    }

    const rateErr =
      action === "recover_pass"
        ? enforceRateLimit(request, "rsvp:recover_pass", 6, 60_000)
        : enforceRateLimit(request, "rsvp:patch", 25, 60_000);
    if (rateErr) return rateErr;

    if (action === "swap_spot") {
      const swapToken = body.swapToken || body.swap_token;
      const newGuestName = body.newGuestName || body.new_guest_name;
      const newComment = body.newComment ?? body.new_comment;
      const newBadgeLabel =
        body.newBadgeLabel || body.new_badge_label || body.badge_label;

      if (!swapToken || !newGuestName || !String(newGuestName).trim()) {
        return NextResponse.json(
          {
            error:
              "swapToken and newGuestName are required to transfer your spot.",
          },
          { status: 400 }
        );
      }

      const swapped = await swapRsvpSpot({
        slug: String(slug),
        swapToken: String(swapToken),
        newGuestName: String(newGuestName).trim(),
        newGuestWhatsapp:
          body.newGuestWhatsapp || body.new_guest_whatsapp
            ? String(body.newGuestWhatsapp || body.new_guest_whatsapp)
                .replace(/\D/g, "")
                .slice(0, 20)
            : null,
        newComment:
          newComment !== undefined && newComment !== null
            ? sanitizeGuestComment(String(newComment)) ?? undefined
            : undefined,
        newBadgeLabel: newBadgeLabel ? String(newBadgeLabel).trim() : undefined,
        unclaimItem: Boolean(body.unclaimItem || body.unclaim_item),
        newPlusOneNames: Array.isArray(body.newPlusOneNames || body.plus_one_names)
          ? (body.newPlusOneNames || body.plus_one_names)
          : undefined,
      });

      if (!swapped) {
        return NextResponse.json(
          {
            error:
              "Could not find matching confirmed RSVP, invalid swap token, or unpaid Payday Standby pledges cannot be transferred.",
          },
          { status: 404 }
        );
      }

      const updatedEventData = await getEventBySlug(String(slug));
      let safeEvent = null;
      if (updatedEventData) {
        const { host_secret_token, ...rest } = updatedEventData.event;
        void host_secret_token;
        rest.host_account_number = null;
        if (swapped.status !== "locked_paid") {
          rest.secret_location_pin = null;
        }
        safeEvent = rest;
      }

      const { guest_whatsapp: _gw, ...safeSwapped } = swapped;
      void _gw;

      return NextResponse.json(
        {
          rsvp: {
            ...safeSwapped,
            gate_pin: deriveGatePin(swapped.swap_token || swapped.id),
          },
          event: safeEvent,
          message:
            "Spot transferred on the wall with R0.00 fee!",
        },
        { status: 200 }
      );
    }

    if (action === "toggle_checkin") {
      const rsvpId = body.rsvpId || body.rsvp_id;
      if (!rsvpId) {
        return NextResponse.json(
          { error: "rsvpId is required to toggle check-in." },
          { status: 400 }
        );
      }

      const existingData = await getEventBySlug(String(slug));
      if (!existingData) {
        return NextResponse.json(
          { error: "Event not found." },
          { status: 404 }
        );
      }

      const suppliedHostToken =
        body.host_token ||
        body.hostSecretToken ||
        request.headers.get("x-host-token");
      if (
        !verifyHostToken(suppliedHostToken, existingData.event.host_secret_token)
      ) {
        return NextResponse.json(
          { error: "Unauthorized: Valid host secret token required to check in guests." },
          { status: 403 }
        );
      }

      const updated = await toggleCheckInRsvp(String(slug), String(rsvpId));
      if (!updated) {
        return NextResponse.json(
          { error: "RSVP not found for this event." },
          { status: 404 }
        );
      }

      return NextResponse.json({ rsvp: updated }, { status: 200 });
    }

    if (action === "recover_pass") {
      const buyerWhatsapp =
        body.buyerWhatsapp ||
        body.buyer_whatsapp ||
        body.whatsappNumber ||
        body.whatsapp_number ||
        "";
      const buyerName =
        body.buyerName ||
        body.buyer_name ||
        body.guestName ||
        body.guest_name ||
        "";
      if (!String(buyerWhatsapp).trim() && !String(buyerName).trim()) {
        return NextResponse.json(
          { error: "Please enter the WhatsApp number used at checkout to find your pass." },
          { status: 400 }
        );
      }

      const recovered = await recoverGuestPass({
        slug: String(slug),
        buyerWhatsapp: String(buyerWhatsapp),
        buyerName: String(buyerName),
      });

      if (!recovered) {
        return NextResponse.json(
          {
            error:
              "No confirmed pass found matching that WhatsApp number for this event. Check the number used at checkout or contact the host.",
          },
          { status: 404 }
        );
      }

      const passQuery = new URLSearchParams();
      if (recovered.order?.paystack_reference) {
        passQuery.set("ref", recovered.order.paystack_reference);
      }
      passQuery.set("rsvpId", recovered.rsvp.id);
      if (recovered.recovered_swap_token || recovered.rsvp.swap_token) {
        passQuery.set(
          "swapToken",
          String(recovered.recovered_swap_token || recovered.rsvp.swap_token)
        );
      }

      return NextResponse.json(
        {
          rsvp: {
            ...recovered.rsvp,
            gate_pin:
              recovered.rsvp.gate_pin ||
              deriveGatePin(recovered.rsvp.swap_token || recovered.rsvp.id),
          },
          order: recovered.order,
          secret_location_pin: recovered.secret_location_pin,
          recovered_swap_token: recovered.recovered_swap_token || null,
          passUrl: `/e/${encodeURIComponent(String(slug))}/success?${passQuery.toString()}`,
          message: "Pass recovered! Your Boarding Pass & Gate PIN are unlocked.",
        },
        { status: 200 }
      );
    }

    if (action === "toggle_privacy") {
      const swapToken = body.swapToken || body.swap_token || "";
      const isAnonymous = Boolean(body.isAnonymous ?? body.is_anonymous_on_wall);
      if (!String(swapToken).trim()) {
        return NextResponse.json(
          { error: "Valid swapToken is required to update wall privacy." },
          { status: 400 }
        );
      }

      const updated = await toggleRsvpPrivacy(
        String(slug),
        String(swapToken),
        isAnonymous
      );
      if (!updated) {
        return NextResponse.json(
          { error: "RSVP not found or invalid swap token." },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          rsvp: updated,
          message: isAnonymous
            ? "🔒 POPIA Privacy Active: Your name is now hidden as 'Anonymous Legend' on the public wall."
            : "👋 Your name is now visible on the Squad Wall.",
        },
        { status: 200 }
      );
    }

    if (action === "request_refund" || action === "report_dispute") {
      const existingData = await getEventBySlug(String(slug));
      if (!existingData) {
        return NextResponse.json({ error: "Event not found." }, { status: 404 });
      }
      const suppliedHostToken =
        body.host_token ||
        body.hostSecretToken ||
        request.headers.get("x-host-token");
      const isHost = verifyHostToken(
        suppliedHostToken,
        existingData.event.host_secret_token
      );

      const res = await requestOrProcessRefund({
        slug: String(slug),
        swapToken: body.swapToken || body.swap_token,
        ref: body.ref || body.reference,
        rsvpId: body.rsvpId || body.rsvp_id,
        reason: String(body.reason || (action === "report_dispute" ? "Host no-show / event issue reported" : "Guest refund requested")),
        isHostInitiated: isHost,
        isDisputeReport: action === "report_dispute",
      });

      if (!res.success) {
        return NextResponse.json(
          { error: res.error || "Unable to process refund/dispute request." },
          { status: res.statusCode || 400 }
        );
      }

      const { host_secret_token: _t, ...safeEvent } = res.event!;
      void _t;
      return NextResponse.json(
        {
          rsvp: res.rsvp,
          order: res.order,
          event: safeEvent,
          refund_reference: res.refundReference,
          payout_frozen: res.payoutFrozen,
          message: res.message,
        },
        { status: 200 }
      );
    }

    if (action === "moderate_rsvp") {
      const existingData = await getEventBySlug(String(slug));
      if (!existingData) {
        return NextResponse.json({ error: "Event not found." }, { status: 404 });
      }
      const suppliedHostToken =
        body.host_token ||
        body.hostSecretToken ||
        request.headers.get("x-host-token");
      if (
        !verifyHostToken(suppliedHostToken, existingData.event.host_secret_token)
      ) {
        return NextResponse.json(
          { error: "Unauthorized: Valid host secret token required for moderation." },
          { status: 403 }
        );
      }

      const rsvpId = body.rsvpId || body.rsvp_id;
      const modType =
        body.moderationAction === "remove_unpaid"
          ? "remove_unpaid"
          : body.moderationAction === "verify_pop"
          ? "verify_pop"
          : body.moderationAction === "verify_cash"
          ? "verify_cash"
          : "hide_comment";
      if (!rsvpId) {
        return NextResponse.json(
          { error: "rsvpId is required for moderation." },
          { status: 400 }
        );
      }

      const modRes = await moderateRsvp(String(slug), String(rsvpId), modType);
      if (!modRes) {
        return NextResponse.json(
          {
            error:
              modType === "remove_unpaid"
                ? "Cannot delete a verified gateway-paid spot without issuing a refund."
                : "RSVP not found.",
          },
          { status: 400 }
        );
      }

      let safeModEvent = undefined;
      if (modRes.event) {
        const { host_secret_token: _ht, ...restEvt } = modRes.event;
        void _ht;
        safeModEvent = restEvt;
      }

      return NextResponse.json(
        {
          ...modRes,
          event: safeModEvent,
          message:
            modType === "remove_unpaid"
              ? "Unpaid entry removed from the wall."
              : modType === "verify_pop"
              ? "✅ Guest POP / EFT verified and marked as Paid!"
              : "Comment hidden from the public wall.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: `Unsupported RSVP action: ${action}` },
      { status: 400 }
    );
  } catch (error) {
    const message = sanitizeErrorMessage(error, "Failed to update RSVP.");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
