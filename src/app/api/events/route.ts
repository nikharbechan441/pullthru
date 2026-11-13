import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  listEvents,
  getEventBySlug,
  createEvent,
  updateEvent,
  getOrderByReference,
  markOrderPaidAndCreateRsvp,
  unclaimBringItem,
  cancelEventAndRefundAll,
  expirePaydayPledges,
  recoverHostToken,
} from "@/lib/store";
import {
  validateEventCompliance,
  validateSaBankAccount,
  determineSettlementSchedule,
  deriveGatePin,
  MAX_SINGLE_CONTRIBUTION_ZAR,
  MAX_UNVERIFIED_EVENT_POOL_ZAR,
} from "@/lib/compliance";
import { BringItem, EventMode, EventTier, PaymentChannel } from "@/types/database";
import { parseSaBankSms } from "@/lib/popEngine";
import {
  enforceRateLimit,
  enforceSameOrigin,
  sanitizeErrorMessage,
} from "@/lib/security";

const VALID_MODES: EventMode[] = ["fixed", "tiered", "pot", "free"];
const SEED_HOST_TOKENS = new Set([
  "host-secret-tariq-fives",
  "host-secret-riaan-braai",
  "host-secret-mbali-pot",
  "host-secret-chloe-boat",
  "host-secret-sbu-run",
]);

async function provisionPaystackSubaccount(params: {
  hostName: string;
  bankCode: string;
  accountNumber: string;
  shortBankName: string;
  last4: string;
  settlementSchedule: "auto" | "manual";
}): Promise<{ subaccountCode: string; error?: string }> {
  const fallbackCode = `ACCT_za_${params.shortBankName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")}_${params.last4}`;
  return { subaccountCode: fallbackCode };
}

function verifyHostToken(
  supplied: string | null | undefined,
  expected: string | null | undefined
): boolean {
  if (!supplied || !expected) return false;
  if (
    process.env.NODE_ENV === "production" &&
    SEED_HOST_TOKENS.has(String(supplied))
  ) {
    return false;
  }
  const a = Buffer.from(String(supplied), "utf8");
  const b = Buffer.from(String(expected), "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const ref = searchParams.get("ref");
    const rsvpId = searchParams.get("rsvpId");
    const swapToken = searchParams.get("swapToken");
    const hostToken =
      request.headers.get("x-host-token") || searchParams.get("hostToken");

    if (slug) {
      let eventData = await getEventBySlug(slug);
      if (!eventData) {
        return NextResponse.json(
          { error: "Event not found." },
          { status: 404 }
        );
      }

      const isHost = verifyHostToken(
        hostToken,
        eventData.event.host_secret_token
      );

      // Verify order belongs to THIS event and is actually paid (prevents cross-event IDOR & pending order pin unlock)
      const rawOrder = ref ? await getOrderByReference(ref) : null;
      const order =
        rawOrder && rawOrder.event_id === eventData.event.id ? rawOrder : null;
      const isPaidGuest = Boolean(order && order.status === "paid");

      // Verify Free RSVP / Spot-Holder ownership strictly via secret swapToken
      // Parameter pollution (e.g. unverified rsvpId or synthetic ref) must NEVER unlock secret pins
      // Additionally, a standalone R0 tier ("Kids Under 12") on a paid tiered event, unconfirmed Cash on Arrival, or unverified Standard EFT must NOT unlock private estate gate codes
      const matchedSwapRsvp = swapToken
        ? (eventData.rsvps || []).find(
            (r) =>
              Boolean(r.swap_token && r.swap_token === swapToken) &&
              r.pop_rail_badge !== "standard_eft" &&
              (r.status === "locked_paid" ||
                (r.status === "cash_logged" &&
                  !r.pop_reference_note?.includes("Pending Host Confirmation")) ||
                (r.status === "going_free" &&
                  (eventData.event.mode === "free" ||
                    Number(r.amount_contributed_zar) > 0)))
          )
        : null;
      const canSeeSecretPin =
        isHost || isPaidGuest || Boolean(matchedSwapRsvp);

      const hasSecretLocationPin = Boolean(
        eventData.event.secret_location_pin &&
          String(eventData.event.secret_location_pin).trim()
      );

      // Strip host_secret_token from public responses
      const { host_secret_token, ...safeEvent } = eventData.event;
      void host_secret_token;
      safeEvent.has_secret_location_pin = hasSecretLocationPin;

      // Server-side compute total_raised_zar, verified_gateway_zar, and cash_logged_zar across confirmed RSVPs before privacy masking
      let verifiedGatewayZar = 0;
      let cashLoggedZar = 0;
      const totalRaisedZar = (eventData.rsvps || []).reduce((acc, r) => {
        if (r.refund_status === "refunded") return acc;
        if (r.status === "locked_paid") {
          const amt = Number(r.amount_contributed_zar) || 0;
          verifiedGatewayZar += amt;
          return acc + amt;
        }
        if (
          r.status === "cash_logged" &&
          !r.pop_reference_note?.includes("Pending Host Confirmation")
        ) {
          const amt = Number(r.amount_contributed_zar) || 0;
          cashLoggedZar += amt;
          return acc + amt;
        }
        return acc;
      }, 0);
      safeEvent.total_raised_zar = Math.round(totalRaisedZar * 100) / 100;
      safeEvent.verified_gateway_zar = Math.round(verifiedGatewayZar * 100) / 100;
      safeEvent.cash_logged_zar = Math.round(cashLoggedZar * 100) / 100;

      if (!isHost) {
        safeEvent.host_account_number = null;
      }
      if (!canSeeSecretPin) {
        safeEvent.secret_location_pin = null;
      }
      // On paid events, host_phone is the host's PayShap Cellphone ID (ShapID) required by guests to pay; only hide on free events prior to RSVP
      if (!isHost && !canSeeSecretPin && safeEvent.mode === "free") {
        safeEvent.host_phone = "";
      }

      // Sanitize bring_items on public wall: mask claimed_by_name for anonymous guests (POPIA Section 18)
      if (!isHost && Array.isArray(safeEvent.bring_items)) {
        const ownVerifiedRsvpId =
          order
            ? (eventData.rsvps || []).find((r) => r.order_id === order.id)?.id
            : matchedSwapRsvp?.id;
        const anonRsvpIds = new Set(
          (eventData.rsvps || [])
            .filter(
              (r) => r.is_anonymous_on_wall && r.id !== ownVerifiedRsvpId
            )
            .map((r) => r.id)
        );
        safeEvent.bring_items = safeEvent.bring_items.map((item) =>
          item.claimed_rsvp_id && anonRsvpIds.has(item.claimed_rsvp_id)
            ? { ...item, claimed_by_name: "🔒 Anonymous Legend" }
            : item
        );
      }

      // Sanitize RSVP social wall (POPIA Section 18 & Spot-Swap Token Protection)
      const safeRsvps = (eventData.rsvps || []).map((r) => {
        const isOwnPaidRsvp = Boolean(
          isPaidGuest && order && r.order_id === order.id
        );
        const isOwnVerifiedSwapRsvp = Boolean(
          swapToken && r.swap_token === swapToken
        );
        const isOwnVerifiedRsvp = isOwnPaidRsvp || isOwnVerifiedSwapRsvp;
        const { swap_token, guest_whatsapp, ...safeRsvp } = r;

        if (!isHost) {
          if (eventData.event.hide_amounts_on_wall && !isOwnVerifiedRsvp) {
            safeRsvp.amount_contributed_zar = 0;
          }
          if (safeRsvp.is_anonymous_on_wall && !isOwnVerifiedRsvp) {
            safeRsvp.guest_name = "🔒 Anonymous Legend";
            safeRsvp.plus_one_names = [];
            safeRsvp.comment = null;
          }
          safeRsvp.custom_answer = null;
          safeRsvp.pop_reference_note = null;
        } else if (guest_whatsapp) {
          (safeRsvp as Record<string, unknown>).guest_whatsapp = guest_whatsapp;
        }

        // Only return swap_token and 4-digit gate_pin to the verified owner of this RSVP or host
        if (isHost || isOwnVerifiedRsvp) {
          return {
            ...safeRsvp,
            swap_token,
            gate_pin: deriveGatePin(swap_token || r.id),
          };
        }
        return safeRsvp;
      });

      // Sanitize order if requested: mask buyer whatsapp/email unless verified host
      let safeOrder = null;
      if (order) {
        safeOrder = isHost
          ? order
          : {
              ...order,
              buyer_whatsapp:
                order.buyer_whatsapp.slice(0, 4) +
                "•••••" +
                order.buyer_whatsapp.slice(-2),
              buyer_email: "masked@rsvp.pullthru.co.za",
            };
      }

      return NextResponse.json(
        {
          event: safeEvent,
          rsvps: safeRsvps,
          ...(safeOrder ? { order: safeOrder } : {}),
        },
        { status: 200 }
      );
    }

    const rawEvents = await listEvents();
    const events = rawEvents.map((e) => {
      const {
        host_secret_token,
        secret_location_pin,
        host_phone,
        host_account_number,
        ...safe
      } = e;
      void host_secret_token;
      void host_phone;
      void host_account_number;
      return {
        ...safe,
        host_account_number: null,
        has_secret_location_pin: Boolean(
          secret_location_pin && String(secret_location_pin).trim()
        ),
      };
    });
    return NextResponse.json({ events }, { status: 200 });
  } catch (error) {
    const message = sanitizeErrorMessage(error, "Failed to load events.");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const originErr = enforceSameOrigin(request);
    if (originErr) return originErr;

    const rateErr = enforceRateLimit(request, "events:create", 15, 60_000);
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

    const {
      title,
      description = "",
      mode = "fixed",
      category_vibe = "🥩 Braai & Potjie",
      price_zar = 0,
      min_pot_contribution_zar,
      max_spots = null,
      target_pot_zar = null,
      event_date,
      location_name,
      secret_location_pin = null,
      host_name,
      host_phone,
      bank_code,
      account_number,
      tiers = [],
      bring_items = [],
      custom_question = null,
      hide_amounts_on_wall = false,
      allow_payday_promise = true,
      allow_cash_on_arrival = true,
      venue_name = null,
      venue_deposit_zar = null,
      venue_bank_name = null,
      venue_account_number = null,
      venue_account_number_last4 = null,
    } = body;

    if (!VALID_MODES.includes(mode as EventMode)) {
      return NextResponse.json(
        { error: "Invalid event mode. Must be fixed, tiered, pot, or free." },
        { status: 400 }
      );
    }

    const trimmedTitle = String(title || "").trim();
    if (!trimmedTitle || trimmedTitle.length < 3 || trimmedTitle.length > 140) {
      return NextResponse.json(
        { error: "Event title is required and must be between 3 and 140 characters." },
        { status: 400 }
      );
    }

    if (
      price_zar !== undefined &&
      price_zar !== null &&
      price_zar !== "" &&
      (!Number.isFinite(Number(price_zar)) || Number(price_zar) < 0)
    ) {
      return NextResponse.json(
        { error: "Invalid price_zar: price must be a finite non-negative number." },
        { status: 400 }
      );
    }

    if (
      max_spots !== null &&
      max_spots !== undefined &&
      max_spots !== "" &&
      (!Number.isInteger(Number(max_spots)) ||
        Number(max_spots) < 1 ||
        Number(max_spots) > 500)
    ) {
      return NextResponse.json(
        { error: "Invalid max_spots: must be a whole number between 1 and 500." },
        { status: 400 }
      );
    }

    if (
      target_pot_zar !== null &&
      target_pot_zar !== undefined &&
      target_pot_zar !== "" &&
      (!Number.isFinite(Number(target_pot_zar)) || Number(target_pot_zar) < 50)
    ) {
      return NextResponse.json(
        { error: "Invalid target_pot_zar: must be at least R50.00." },
        { status: 400 }
      );
    }

    const parsedTiers: EventTier[] = Array.isArray(tiers)
      ? tiers
          .filter((t): t is EventTier => Boolean(t && typeof t === "object"))
          .slice(0, 20)
          .map((t, idx) => ({
            id: t.id ? String(t.id).slice(0, 60) : `tier-${idx + 1}`,
            label: String(t.label || "").trim().slice(0, 80),
            price_zar: Math.round(Number(t.price_zar)),
            ...(t.description ? { description: String(t.description).slice(0, 140) } : {}),
            ...(t.max_spots !== undefined && t.max_spots !== null
              ? { max_spots: Math.max(1, Math.round(Number(t.max_spots))) }
              : {}),
          }))
      : [];
    const parsedBringItems: BringItem[] = Array.isArray(bring_items)
      ? bring_items
          .filter((b): b is BringItem => Boolean(b && typeof b === "object" && b.label))
          .slice(0, 50)
          .map((b, idx) => ({
            id: b.id ? String(b.id).slice(0, 60) : `bi-${idx + 1}`,
            label: String(b.label).trim().slice(0, 120),
            ...(b.emoji ? { emoji: String(b.emoji).slice(0, 8) } : {}),
            claimed_by_name: null,
            claimed_rsvp_id: null,
          }))
      : [];

    const extraTextsForCompliance: string[] = [
      ...(custom_question ? [String(custom_question)] : []),
      ...parsedTiers.map((t) => `${t.label || ""} ${t.description || ""}`),
      ...parsedBringItems.map((b) => String(b.label || "")),
    ];

    const compliance = validateEventCompliance(
      trimmedTitle,
      String(description || ""),
      extraTextsForCompliance
    );
    if (!compliance.compliant) {
      return NextResponse.json(
        {
          error: compliance.reason,
          statute: compliance.statute,
        },
        { status: 400 }
      );
    }

    if (mode !== "free" && body.mandate_accepted !== true) {
      return NextResponse.json(
        {
          error:
            "SARB Directive 1 & SARS Section 54 Disclosed Agent Mandate acceptance is required for paid events.",
        },
        { status: 400 }
      );
    }

    let hostBankName: string | null = body.host_bank_name
      ? String(body.host_bank_name).slice(0, 80)
      : null;
    let paystackSubaccountCode: string | null = body.paystack_subaccount_code
      ? String(body.paystack_subaccount_code).slice(0, 80)
      : null;

    const resolvedBankCode = bank_code || body.host_bank_code;
    let validatedBankInfo: {
      bankCode: string;
      accountNumber: string;
      shortName: string;
      last4: string;
    } | null = null;

    if (mode !== "free" && (resolvedBankCode || account_number)) {
      const bankValidation = validateSaBankAccount(
        String(resolvedBankCode || ""),
        String(account_number || "")
      );
      if (!bankValidation.valid || !bankValidation.bank || !bankValidation.last4) {
        return NextResponse.json(
          { error: bankValidation.error || "Invalid SA bank account details." },
          { status: 400 }
        );
      }
      hostBankName = `${bankValidation.bank.shortName} (•••• ${bankValidation.last4})`;
      validatedBankInfo = {
        bankCode: String(resolvedBankCode),
        accountNumber: String(account_number),
        shortName: bankValidation.bank.shortName,
        last4: bankValidation.last4,
      };
    }

    const numericPriceZar =
      mode === "free" ? 0 : Math.round(Math.max(0, Number(price_zar) || 0));
    const numericMaxSpots =
      max_spots !== null && max_spots !== undefined && max_spots !== ""
        ? Math.round(Number(max_spots))
        : null;
    const numericTargetPotZar =
      target_pot_zar !== null &&
      target_pot_zar !== undefined &&
      target_pot_zar !== ""
        ? Math.round(Number(target_pot_zar))
        : null;

    if ((mode === "fixed" || mode === "pot") && numericPriceZar < 15) {
      return NextResponse.json(
        {
          error:
            "Minimum paid spot or suggested kitty contribution is R15.00 (use 'free' mode for R0 events).",
        },
        { status: 400 }
      );
    }

    const maxSingleSpotZar = 25000;
    const maxEventPoolZar = 250000;

    if (
      mode === "pot" &&
      min_pot_contribution_zar !== undefined &&
      min_pot_contribution_zar !== null &&
      (!Number.isFinite(Number(min_pot_contribution_zar)) ||
        Number(min_pot_contribution_zar) < 15 ||
        Number(min_pot_contribution_zar) > maxSingleSpotZar)
    ) {
      return NextResponse.json(
        {
          error: `Minimum gift pot contribution floor must be between R15.00 and R${maxSingleSpotZar.toLocaleString("en-ZA")}.00.`,
        },
        { status: 400 }
      );
    }

    if (mode === "tiered") {
      if (parsedTiers.length === 0) {
        return NextResponse.json(
          { error: "Tiered events require at least one ticket tier." },
          { status: 400 }
        );
      }
      for (const tier of parsedTiers) {
        const tPrice = Number(tier.price_zar);
        if (!tier.label || !String(tier.label).trim()) {
          return NextResponse.json(
            { error: "Each tier must have a label." },
            { status: 400 }
          );
        }
        if (
          !Number.isFinite(tPrice) ||
          tPrice < 0 ||
          (tPrice > 0 && tPrice < 15) ||
          tPrice > maxSingleSpotZar
        ) {
          return NextResponse.json(
            {
              error: `Tier "${tier.label}" has an invalid price (R${tPrice}). Tiers must be R0 (free/kids) or between R15.00 and R${maxSingleSpotZar.toLocaleString("en-ZA")}.00.`,
            },
            { status: 400 }
          );
        }
      }
    }

    if (mode !== "free" && numericPriceZar > maxSingleSpotZar) {
      return NextResponse.json(
        {
          error: `Maximum single spot or suggested contribution is R${maxSingleSpotZar.toLocaleString("en-ZA")}.00.`,
        },
        { status: 400 }
      );
    }

    const settlementInfo = determineSettlementSchedule({
      mode: mode as EventMode,
      priceZar: numericPriceZar,
      maxSpots: numericMaxSpots,
      targetPotZar: numericTargetPotZar,
      tiers: parsedTiers,
    });

    if (
      mode !== "free" &&
      settlementInfo.estimatedPoolZar > maxEventPoolZar
    ) {
      return NextResponse.json(
        {
          error: `Estimated event pool (R${settlementInfo.estimatedPoolZar.toLocaleString("en-ZA")}) exceeds the R${maxEventPoolZar.toLocaleString("en-ZA")} single-event limit.`,
        },
        { status: 400 }
      );
    }

    if (validatedBankInfo && !paystackSubaccountCode) {
      const subResult = await provisionPaystackSubaccount({
        hostName: String(host_name || "PullThru Host"),
        bankCode: validatedBankInfo.bankCode,
        accountNumber: validatedBankInfo.accountNumber,
        shortBankName: validatedBankInfo.shortName,
        last4: validatedBankInfo.last4,
        settlementSchedule: settlementInfo.schedule,
      });
      if (subResult.error) {
        return NextResponse.json({ error: subResult.error }, { status: 400 });
      }
      paystackSubaccountCode = subResult.subaccountCode;
    }

    let cleanCapitecPaymeUrl: string | null = null;
    if (body.capitec_payme_url && String(body.capitec_payme_url).trim()) {
      const rawPayme = String(body.capitec_payme_url).trim().slice(0, 260);
      try {
        const parsedUrl = new URL(rawPayme);
        if (parsedUrl.protocol !== "https:") {
          return NextResponse.json(
            { error: "Capitec PayMe link must be a valid https:// URL." },
            { status: 400 }
          );
        }
        cleanCapitecPaymeUrl = parsedUrl.toString();
      } catch {
        return NextResponse.json(
          { error: "Invalid Capitec PayMe URL format. Must start with https://." },
          { status: 400 }
        );
      }
    }

    const event = await createEvent({
      title: trimmedTitle,
      description: String(description || "").trim().slice(0, 2000),
      mode: mode as EventMode,
      category_vibe: String(category_vibe || "🥩 Braai & Potjie").slice(0, 80),
      price_zar: numericPriceZar,
      min_pot_contribution_zar:
        mode === "pot" &&
        min_pot_contribution_zar !== undefined &&
        min_pot_contribution_zar !== null
          ? Math.round(Number(min_pot_contribution_zar))
          : undefined,
      max_spots: numericMaxSpots,
      target_pot_zar: numericTargetPotZar,
      event_date:
        event_date || new Date(Date.now() + 86400000 * 3).toISOString(),
      location_name: String(location_name || "TBA").slice(0, 200),
      secret_location_pin: secret_location_pin
        ? String(secret_location_pin).slice(0, 300)
        : null,
      host_name: String(host_name || "Host").slice(0, 80),
      host_phone: String(host_phone || "").trim().slice(0, 30),
      host_bank_name: hostBankName,
      host_account_number: account_number
        ? String(account_number).replace(/\D/g, "").slice(0, 16)
        : null,
      capitec_payme_url: cleanCapitecPaymeUrl,
      bake_pro_boost_into_price: Boolean(body.bake_pro_boost_into_price),
      is_pro_boosted:
        Boolean(body.is_pro_boosted) &&
        (Boolean(body.bake_pro_boost_into_price) ||
          (typeof body.pro_boost_reference === "string" &&
            body.pro_boost_reference.trim().length >= 10 &&
            /^(PRO-|YOCO_|PT_|pop_|ch_)/i.test(body.pro_boost_reference.trim()))),
      paystack_subaccount_code: paystackSubaccountCode,
      settlement_schedule: settlementInfo.schedule,
      tiers: parsedTiers,
      bring_items: parsedBringItems,
      custom_question: custom_question ? String(custom_question).slice(0, 200) : null,
      hide_amounts_on_wall: Boolean(hide_amounts_on_wall),
      allow_payday_promise: Boolean(allow_payday_promise),
      allow_cash_on_arrival:
        allow_cash_on_arrival !== undefined
          ? Boolean(allow_cash_on_arrival)
          : true,
      venue_name: venue_name ? String(venue_name).slice(0, 100) : null,
      venue_deposit_zar:
        venue_deposit_zar !== null && venue_deposit_zar !== undefined
          ? Math.max(0, Math.round(Number(venue_deposit_zar)))
          : null,
      venue_bank_name: venue_bank_name ? String(venue_bank_name).slice(0, 50) : null,
      venue_account_number_last4:
        (venue_account_number || venue_account_number_last4) &&
        String(venue_account_number || venue_account_number_last4).replace(/\D/g, "").length >= 4
          ? String(venue_account_number || venue_account_number_last4).replace(/\D/g, "").slice(-4)
          : null,
    });

    const hostAdminUrl = `/e/${event.slug}?hostToken=${event.host_secret_token}`;
    return NextResponse.json(
      {
        event,
        host_secret_token: event.host_secret_token,
        host_admin_url: hostAdminUrl,
        settlementInfo,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = sanitizeErrorMessage(error, "Failed to create event.");
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

    const { slug, action, ...payload } = body;

    if (!slug || !action) {
      return NextResponse.json(
        { error: "Both slug and action are required." },
        { status: 400 }
      );
    }

    const rateErr =
      action === "recover_host_token"
        ? enforceRateLimit(request, "events:recover_host", 5, 60_000)
        : enforceRateLimit(request, "events:patch", 25, 60_000);
    if (rateErr) return rateErr;

    const existingData = await getEventBySlug(slug);
    if (!existingData) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    const existingEvent = existingData.event;
    const existingRsvps = existingData.rsvps || [];

    if (action === "recover_host_token") {
      const hostPhone =
        payload.host_phone ||
        payload.hostPhone ||
        payload.whatsappNumber ||
        "";
      const secretCheck =
        payload.secret_check ||
        payload.secretCheck ||
        payload.secret_location_pin ||
        payload.account_last4 ||
        "";
      if (!String(hostPhone).trim() || !String(secretCheck).trim()) {
        return NextResponse.json(
          {
            error:
              "Please enter both your Organiser WhatsApp number and your Secret Location / Gate Code (or last 4 digits of your linked bank account) to verify ownership.",
          },
          { status: 400 }
        );
      }

      const recovered = await recoverHostToken({
        slug: String(slug),
        hostPhone: String(hostPhone),
        secretCheck: String(secretCheck),
      });
      if (!recovered) {
        return NextResponse.json(
          {
            error:
              "Verification failed: The WhatsApp number and secret verification details did not match this event's organiser record.",
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          host_secret_token: recovered.host_secret_token,
          slug: recovered.slug,
          title: recovered.title,
          message:
            "👑 Host Admin Access Recovered! Your host controls are now unlocked on this device.",
        },
        { status: 200 }
      );
    }

    // Strict Host-Action Authorization: Valid host secret token is REQUIRED for all host actions
    const suppliedHostToken =
      payload.host_token ||
      payload.hostSecretToken ||
      request.headers.get("x-host-token");
    if (!verifyHostToken(suppliedHostToken, existingEvent.host_secret_token)) {
      return NextResponse.json(
        { error: "Unauthorized: Valid host secret token required for host actions." },
        { status: 403 }
      );
    }

    if (action === "expire_payday_pledges") {
      const expRes = await expirePaydayPledges(String(slug));
      if (!expRes) {
        return NextResponse.json({ error: "Event not found." }, { status: 404 });
      }
      const { host_secret_token: _t, ...safeUpdated } = expRes.event;
      void _t;
      return NextResponse.json(
        {
          event: safeUpdated,
          expired_count: expRes.expiredCount,
          removed_count: expRes.expiredCount,
          message: `🧹 Cleared ${expRes.expiredCount} unpaid Payday Standby pledge(s) from the wall!`,
        },
        { status: 200 }
      );
    }

    if (action === "postpone_date") {
      const newDate = payload.event_date || payload.new_date;
      if (!newDate) {
        return NextResponse.json(
          { error: "New event_date is required to postpone the event." },
          { status: 400 }
        );
      }

      const updated = await updateEvent(slug, {
        previous_event_date: existingEvent.event_date,
        event_date: String(newDate).slice(0, 120),
      });
      const safeUpdated = updated ? (({ host_secret_token: _t, ...rest }) => rest)(updated) : null;

      return NextResponse.json(
        {
          event: safeUpdated,
          message:
            "Event date updated! All locked spots, Bring-'n-Bak items, and guest passes remain intact.",
        },
        { status: 200 }
      );
    }

    if (action === "unclaim_bring_item") {
      const itemId = payload.item_id || payload.itemId;
      if (!itemId) {
        return NextResponse.json(
          { error: "item_id is required to release a Bring-'n-Bak item." },
          { status: 400 }
        );
      }
      const res = await unclaimBringItem(slug, String(itemId));
      if (!res) {
        return NextResponse.json(
          { error: "Item or event not found." },
          { status: 404 }
        );
      }
      const { host_secret_token: _t, ...safeUpdated } = res.event;
      void _t;
      return NextResponse.json(
        {
          event: safeUpdated,
          unclaimed_item: res.item,
          message: "Bring-'n-Bak item released back to the open checklist!",
        },
        { status: 200 }
      );
    }

    if (action === "edit_details") {
      const updates: Record<string, unknown> = {};
      if (payload.title && String(payload.title).trim().length >= 3) {
        const cleanTitle = String(payload.title).trim().slice(0, 140);
        const comp = validateEventCompliance(cleanTitle);
        if (!comp.compliant) {
          return NextResponse.json({ error: comp.reason }, { status: 400 });
        }
        updates.title = cleanTitle;
      }
      if (payload.event_date && String(payload.event_date).trim()) {
        if (String(payload.event_date).trim() !== existingEvent.event_date) {
          updates.previous_event_date = existingEvent.event_date;
        }
        updates.event_date = String(payload.event_date).trim().slice(0, 120);
      }
      if (payload.location_name !== undefined) {
        const cleanLoc = String(payload.location_name || "").trim().slice(0, 140);
        const locComp = validateEventCompliance(cleanLoc);
        if (!locComp.compliant) {
          return NextResponse.json({ error: locComp.reason }, { status: 400 });
        }
        updates.location_name = cleanLoc;
      }
      if (payload.secret_location_pin !== undefined) {
        const cleanPin = String(payload.secret_location_pin || "").trim().slice(0, 180);
        if (cleanPin) {
          const pinComp = validateEventCompliance(cleanPin);
          if (!pinComp.compliant) {
            return NextResponse.json({ error: pinComp.reason }, { status: 400 });
          }
        }
        updates.secret_location_pin = cleanPin || null;
      }
      if (payload.max_spots !== undefined) {
        if (payload.max_spots === null || payload.max_spots === "") {
          if (existingEvent.mode === "fixed" || existingEvent.mode === "tiered") {
            updates.settlement_schedule = "manual";
          }
          updates.max_spots = null;
        } else {
          const parsedMax = Math.round(Number(payload.max_spots));
          const currentLocked = existingRsvps
            .filter(
              (r) =>
                r.refund_status !== "refunded" &&
                (r.status === "locked_paid" ||
                  r.status === "cash_logged" ||
                  r.status === "going_free")
            )
            .reduce((sum, r) => sum + (r.spots_locked || 1), 0);
          if (!Number.isFinite(parsedMax) || parsedMax < Math.max(1, currentLocked) || parsedMax > 500) {
            return NextResponse.json(
              {
                error: `Spot limit must be between ${Math.max(1, currentLocked)} (already locked spots) and 500.`,
              },
              { status: 400 }
            );
          }
          updates.max_spots = parsedMax;
        }
      }

      const updated = await updateEvent(slug, updates);
      const safeUpdated = updated ? (({ host_secret_token: _t, ...rest }) => rest)(updated) : null;
      return NextResponse.json(
        {
          event: safeUpdated,
          message: "Event details updated cleanly!",
        },
        { status: 200 }
      );
    }

    if (action === "cancel_event") {
      const cancelRes = await cancelEventAndRefundAll(
        slug,
        payload.reason ? String(payload.reason).slice(0, 200) : undefined
      );
      if (!cancelRes) {
        return NextResponse.json({ error: "Event not found." }, { status: 404 });
      }
      const { host_secret_token: _t, ...safeUpdated } = cancelRes.event;
      void _t;
      return NextResponse.json(
        {
          event: safeUpdated,
          refunded_count: cancelRes.refundedCount,
          batch_refund_reference: cancelRes.batchRefundReference,
          message: `Event cancelled. ${cancelRes.refundedCount} paid guest pass(es) marked as cancelled (Ref: ${cancelRes.batchRefundReference}) so you can settle direct PayShap / EFT refunds to your squad.`,
        },
        { status: 200 }
      );
    }

    if (action === "link_bank") {
      if (existingEvent.mode === "free") {
        return NextResponse.json(
          { error: "Free RSVP events do not require a bank subaccount." },
          { status: 400 }
        );
      }
      const hasPaidRsvps = existingRsvps.some(
        (r) => r.status === "locked_paid" || r.status === "cash_logged"
      );
      if (existingEvent.paystack_subaccount_code && hasPaidRsvps) {
        return NextResponse.json(
          {
            error:
              "Anti-Hijack Lock: Cannot overwrite the linked SA bank subaccount once paid guest contributions have already been locked on this event.",
          },
          { status: 403 }
        );
      }

      const { bank_code, account_number } = payload;
      const validation = validateSaBankAccount(
        String(bank_code || ""),
        String(account_number || "")
      );
      if (!validation.valid || !validation.bank || !validation.last4) {
        return NextResponse.json(
          { error: validation.error || "Invalid SA bank account." },
          { status: 400 }
        );
      }

      const hostBankName = `${validation.bank.shortName} (•••• ${validation.last4})`;
      const scheduleInfo = determineSettlementSchedule({
        trustTier: "tier_0_new",
        mode: existingEvent.mode,
        priceZar: existingEvent.price_zar,
        maxSpots: existingEvent.max_spots,
        targetPotZar: existingEvent.target_pot_zar,
        tiers: existingEvent.tiers,
      });

      const subResult = await provisionPaystackSubaccount({
        hostName: existingEvent.host_name || "PullThru Host",
        bankCode: String(bank_code || ""),
        accountNumber: String(account_number || ""),
        shortBankName: validation.bank.shortName,
        last4: validation.last4,
        settlementSchedule: scheduleInfo.schedule,
      });
      if (subResult.error) {
        return NextResponse.json({ error: subResult.error }, { status: 400 });
      }
      const subaccountCode = subResult.subaccountCode;

      const updated = await updateEvent(slug, {
        host_bank_name: hostBankName,
        host_account_number: String(account_number || "").replace(/\D/g, "").slice(0, 16),
        ...(payload.host_phone && String(payload.host_phone).trim().length >= 9
          ? { host_phone: String(payload.host_phone).trim().slice(0, 30) }
          : {}),
        ...(payload.host_name && String(payload.host_name).trim().length >= 2
          ? { host_name: String(payload.host_name).trim().slice(0, 80) }
          : {}),
        paystack_subaccount_code: subaccountCode,
        settlement_schedule: scheduleInfo.schedule,
      });
      const safeUpdated = updated ? (({ host_secret_token: _t, ...rest }) => rest)(updated) : null;

      return NextResponse.json(
        {
          event: safeUpdated,
          paystack_subaccount_code: subaccountCode,
          host_bank_name: hostBankName,
          settlement_schedule: scheduleInfo.schedule,
        },
        { status: 200 }
      );
    }

    if (action === "add_bring_item") {
      const label = payload.label || payload.item_label;
      if (!label || !String(label).trim()) {
        return NextResponse.json(
          { error: "Bring item label is required." },
          { status: 400 }
        );
      }

      const currentItems: BringItem[] = Array.isArray(existingEvent.bring_items)
        ? existingEvent.bring_items
        : [];
      if (currentItems.length >= 50) {
        return NextResponse.json(
          { error: "Maximum of 50 Bring-'n-Bak items reached for this event." },
          { status: 400 }
        );
      }

      const cleanLabel = String(label).trim().slice(0, 120);
      const itemCompliance = validateEventCompliance(cleanLabel);
      if (!itemCompliance.compliant) {
        return NextResponse.json(
          { error: itemCompliance.reason },
          { status: 400 }
        );
      }

      const newItem: BringItem = {
        id: `item_${Date.now()}_${crypto.randomBytes(2).toString("hex")}`,
        label: cleanLabel,
        emoji: payload.emoji ? String(payload.emoji).slice(0, 8) : "🧺",
        claimed_by_name: null,
        claimed_rsvp_id: null,
      };

      const updated = await updateEvent(slug, {
        bring_items: [...currentItems, newItem],
      });
      const safeUpdated = updated ? (({ host_secret_token: _t, ...rest }) => rest)(updated) : null;

      return NextResponse.json(
        {
          event: safeUpdated,
          added_item: newItem,
        },
        { status: 200 }
      );
    }

    if (action === "unlock_pro_boost") {
      const rawRef = String(
        payload.pro_boost_reference || payload.reference || ""
      ).trim();
      const hasRepeatedChars = /(.)\1{4,}/.test(rawRef);
      const isStructuredRef =
        rawRef.length >= 10 &&
        !hasRepeatedChars &&
        ((/^(PRO-|YOCO_|PT_|pop_|ch_)/i.test(rawRef) &&
          /(R29|R79|PAID|[0-9]{4,})/i.test(rawRef)) ||
          parseSaBankSms(rawRef, 29).isValid);
      if (!rawRef || !isStructuredRef) {
        return NextResponse.json(
          {
            error:
              "Please enter a valid R29 Pro Boost or R79/mo Club Pass payment reference / POP confirmation.",
          },
          { status: 400 }
        );
      }

      const updated = await updateEvent(slug, {
        is_pro_boosted: true,
        pro_boost_reference: rawRef.slice(0, 120),
      });
      const safeUpdated = updated
        ? (({ host_secret_token: _t, ...rest }) => rest)(updated)
        : null;

      return NextResponse.json(
        {
          event: safeUpdated,
          is_pro_boosted: true,
          pro_boost_reference: rawRef.slice(0, 120),
          message:
            "⚡ Pro Event Boost Active! Unlimited 7+ spots, 1-Tap Weekly Clone, and Pro Organiser tools are now unlocked.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: `Unsupported host action: ${action}` },
      { status: 400 }
    );
  } catch (error) {
    const message = sanitizeErrorMessage(error, "Failed to update event.");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
