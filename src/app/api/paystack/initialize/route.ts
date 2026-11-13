import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  calculateCheckoutSplit,
  generateSyntheticEmail,
  normalizeSaPhone,
} from "@/lib/fees";
import {
  AUTO_SETTLEMENT_THRESHOLD_ZAR,
  sanitizeGuestComment,
  validateVelocityCaps,
} from "@/lib/compliance";
import {
  getEventBySlug,
  updateEvent,
  createOrder,
} from "@/lib/store";
import { PaymentChannel } from "@/types/database";
import {
  enforceRateLimit,
  enforceSameOrigin,
  sanitizeErrorMessage,
} from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    const originErr = enforceSameOrigin(req);
    if (originErr) return originErr;

    const rateErr = enforceRateLimit(req, "paystack:initialize", 20, 60_000);
    if (rateErr) return rateErr;

    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload." },
        { status: 400 }
      );
    }

    const {
      slug,
      buyerName,
      buyerWhatsapp,
      buyerEmail,
      spotsCount = 1,
      plusOneNames = [],
      tierId,
      customAmountZar,
      comment,
      badgeLabel,
      claimedItemId,
      customAnswer,
      isAnonymousOnWall = false,
      paymentChannel = "capitec_pay",
      cpaS49Accepted = false,
      settlingRsvpId,
    } = body as {
      slug?: string;
      buyerName?: string;
      buyerWhatsapp?: string;
      buyerEmail?: string;
      spotsCount?: number;
      plusOneNames?: string[];
      tierId?: string;
      customAmountZar?: number;
      comment?: string;
      badgeLabel?: string;
      claimedItemId?: string;
      customAnswer?: string;
      isAnonymousOnWall?: boolean;
      paymentChannel?: PaymentChannel;
      cpaS49Accepted?: boolean;
      settlingRsvpId?: string;
      companyName?: string;
      companyVat?: string;
    };

    // Legal Guardrail 1 (CPA s49)
    if (cpaS49Accepted !== true) {
      return NextResponse.json(
        {
          error:
            "Please accept the CPA Section 49 Disclosed Agent & Non-Refundable Service Fee notice before paying.",
        },
        { status: 400 }
      );
    }

    if (
      !slug ||
      typeof slug !== "string" ||
      !slug.trim() ||
      !buyerName ||
      typeof buyerName !== "string" ||
      !buyerName.trim() ||
      !buyerWhatsapp ||
      typeof buyerWhatsapp !== "string" ||
      !buyerWhatsapp.trim() ||
      buyerWhatsapp.replace(/\D/g, "").length < 9
    ) {
      return NextResponse.json(
        {
          error:
            "Missing or invalid required guest checkout details (slug, name, or valid South African WhatsApp number).",
        },
        { status: 400 }
      );
    }

    const VALID_CHANNELS: PaymentChannel[] = [
      "capitec_pay",
      "eft",
      "apple_pay",
      "card",
      "cash_manual",
    ];
    const resolvedPaymentChannel: PaymentChannel = VALID_CHANNELS.includes(
      paymentChannel as PaymentChannel
    )
      ? (paymentChannel as PaymentChannel)
      : "capitec_pay";

    const rawSpots = Number(spotsCount);
    if (!Number.isInteger(rawSpots) || rawSpots < 1 || rawSpots > 20) {
      return NextResponse.json(
        { error: "Invalid spotsCount: must be a whole number between 1 and 20." },
        { status: 400 }
      );
    }

    const eventData = await getEventBySlug(slug.trim());
    if (!eventData) {
      return NextResponse.json(
        { error: "Event not found." },
        { status: 404 }
      );
    }

    const event = "event" in eventData ? eventData.event : eventData;
    const rsvps = "rsvps" in eventData ? eventData.rsvps : [];

    if (event.is_cancelled || !event.is_active) {
      return NextResponse.json(
        {
          error:
            "This event has been cancelled or closed by the host. No further payments can be processed.",
        },
        { status: 400 }
      );
    }

    if (event.payout_frozen) {
      return NextResponse.json(
        {
          error:
            "Buyer Protection Freeze Active: New checkouts are paused on this event while a guest dispute is under review.",
        },
        { status: 400 }
      );
    }

    if (event.mode === "free") {
      return NextResponse.json(
        {
          error:
            "Free events do not use payment gateway checkout. Please lock your free RSVP via /api/rsvp.",
        },
        { status: 400 }
      );
    }

    // Legal Guardrail 2 (SARB Directive 1 of 2007)
    if (!event.paystack_subaccount_code) {
      return NextResponse.json(
        {
          error:
            "SARB Compliance Lock: Host has not linked a South African payout subaccount yet. No funds can be collected without a split subaccount.",
        },
        { status: 400 }
      );
    }

    // Overbooking Race-Condition Guard
    const normalizedSpotsCount = rawSpots;
    const currentSpots = rsvps
      .filter(
        (r) =>
          r.status === "locked_paid" ||
          r.status === "cash_logged" ||
          r.status === "going_free"
      )
      .reduce((sum, r) => sum + r.spots_locked, 0);

    if (
      event.max_spots !== null &&
      currentSpots + normalizedSpotsCount > event.max_spots
    ) {
      const remaining = Math.max(0, event.max_spots - currentSpots);
      return NextResponse.json(
        {
          error: `Eish! Those spots were just taken. Only ${remaining} spot(s) left!`,
        },
        { status: 409 }
      );
    }

    // Verify settlingRsvpId if provided (must be an active payday_promise RSVP on this event)
    let verifiedSettlingPledgeId: string | null = null;
    if (
      settlingRsvpId !== undefined &&
      settlingRsvpId !== null &&
      String(settlingRsvpId).trim() !== ""
    ) {
      const matchedPledge = rsvps.find(
        (r) =>
          r.id === String(settlingRsvpId).trim() &&
          r.event_id === event.id &&
          r.status === "payday_promise"
      );
      if (!matchedPledge) {
        return NextResponse.json(
          {
            error:
              "Invalid settlingRsvpId: Payday promise RSVP not found for this event or already settled.",
          },
          { status: 400 }
        );
      }
      verifiedSettlingPledgeId = matchedPledge.id;
    }

    // Bring-Item Claim Validation (allows keeping item if settling own payday_promise RSVP)
    if (claimedItemId !== undefined && claimedItemId !== null && String(claimedItemId).trim() !== "") {
      const bringItem = (event.bring_items || []).find(
        (item) => item.id === String(claimedItemId).trim()
      );
      if (!bringItem) {
        return NextResponse.json(
          { error: "Selected bring-something item does not exist on this event." },
          { status: 400 }
        );
      }
      const isOwnSettlingPledgeClaim =
        Boolean(verifiedSettlingPledgeId) &&
        bringItem.claimed_rsvp_id === verifiedSettlingPledgeId;
      if (bringItem.claimed_by_name && !isOwnSettlingPledgeClaim) {
        return NextResponse.json(
          {
            error: `Eish! "${bringItem.label}" was already claimed by ${bringItem.claimed_by_name}.`,
          },
          { status: 409 }
        );
      }
    }

    // Determine unitPriceZar
    let unitPriceZar = event.price_zar;
    let selectedTierLabel: string | null = null;

    if (event.mode === "tiered") {
      const foundTier = tierId
        ? (event.tiers || []).find((t) => t.id === tierId)
        : Array.isArray(event.tiers) && event.tiers.length > 0
        ? event.tiers[0]
        : null;

      if (!foundTier) {
        return NextResponse.json(
          { error: "Invalid tierId selected for this tiered event." },
          { status: 400 }
        );
      }
      if (foundTier.price_zar <= 0) {
        return NextResponse.json(
          {
            error:
              "Free (R0) tiers do not use payment gateway checkout. Please lock R0 spots via /api/rsvp.",
          },
          { status: 400 }
        );
      }
      if (
        typeof foundTier.max_spots === "number" &&
        foundTier.max_spots > 0
      ) {
        const tierSpotsLocked = rsvps
          .filter(
            (r) =>
              (r.status === "locked_paid" ||
                r.status === "cash_logged" ||
                r.status === "going_free") &&
              r.tier_label === foundTier.label
          )
          .reduce((sum, r) => sum + (r.spots_locked || 1), 0);
        if (tierSpotsLocked + normalizedSpotsCount > foundTier.max_spots) {
          const tierRem = Math.max(0, foundTier.max_spots - tierSpotsLocked);
          return NextResponse.json(
            {
              error: `Eish! Tier "${foundTier.label}" only has ${tierRem} spot(s) left!`,
            },
            { status: 409 }
          );
        }
      }
      unitPriceZar = foundTier.price_zar;
      selectedTierLabel = foundTier.label;
    } else if (event.mode === "pot") {
      const minPotZar = Math.max(50, event.min_pot_contribution_zar || 50);
      const minTotalForSpotsZar = minPotZar * normalizedSpotsCount;
      const requestedPotZar =
        customAmountZar !== undefined &&
        customAmountZar !== null &&
        String(customAmountZar).trim() !== ""
          ? Number(customAmountZar)
          : Math.max(event.price_zar, minTotalForSpotsZar);
      if (
        !Number.isFinite(requestedPotZar) ||
        requestedPotZar < minTotalForSpotsZar
      ) {
        return NextResponse.json(
          {
            error:
              normalizedSpotsCount > 1
                ? `Minimum contribution for ${normalizedSpotsCount} spots is R${minTotalForSpotsZar} (R${minPotZar} per spot).`
                : `Minimum contribution for this pot is R${minPotZar}.`,
          },
          { status: 400 }
        );
      }
      unitPriceZar = requestedPotZar;
    }

    if (!Number.isFinite(unitPriceZar) || unitPriceZar < 50) {
      return NextResponse.json(
        { error: "Minimum paid checkout amount is R50.00." },
        { status: 400 }
      );
    }

    const effectiveSpotsForSplit = event.mode === "pot" ? 1 : normalizedSpotsCount;
    const totalRequestedBaseZar = Number(
      (Math.round(unitPriceZar * effectiveSpotsForSplit * 100) / 100).toFixed(2)
    );
    const currentPoolRaisedZar = rsvps
      .filter((r) => r.status === "locked_paid" || r.status === "cash_logged")
      .reduce((sum, r) => sum + (r.amount_contributed_zar || 0), 0);

    // Legal Guardrail 3 (FICA & Anti-Fraud Velocity Cap: R5,000 single checkout / R25,000 unverified pool)
    const velocityCheck = validateVelocityCaps({
      totalBasePriceZar: totalRequestedBaseZar,
      currentPoolRaisedZar,
      trustTier: "tier_0_new",
    });
    if (!velocityCheck.valid) {
      return NextResponse.json(
        { error: velocityCheck.error },
        { status: 400 }
      );
    }

    // Anti-Rug-Pull Guard: If a pot or fixed event started as "auto" (<= R3,000) and contributions push it over R3,000, upgrade to Protected Post-Event Settlement ("manual")
    if (
      event.settlement_schedule === "auto" &&
      currentPoolRaisedZar + totalRequestedBaseZar > AUTO_SETTLEMENT_THRESHOLD_ZAR
    ) {
      event.settlement_schedule = "manual";
      await updateEvent(event.slug, { settlement_schedule: "manual" });
    }

    const sanitizedComment = sanitizeGuestComment(
      comment ? String(comment) : null
    );

    const split = calculateCheckoutSplit(unitPriceZar, effectiveSpotsForSplit);
    const emailResult = generateSyntheticEmail(buyerWhatsapp, buyerEmail);
    const finalEmail =
      typeof emailResult === "string" ? emailResult : emailResult.email;
    const isSynthetic =
      typeof emailResult === "string"
        ? !buyerEmail || !buyerEmail.trim()
        : emailResult.isSynthetic;

    const normalizedPhone = normalizeSaPhone(buyerWhatsapp);
    const reference = `PT_${Date.now()}_${crypto.randomBytes(6).toString("hex").toUpperCase()}`;

    const order = await createOrder({
      event_id: event.id,
      profile_id: event.profile_id,
      buyer_name: buyerName.trim().slice(0, 80),
      buyer_whatsapp: normalizedPhone,
      buyer_email: finalEmail,
      is_synthetic_email: isSynthetic,
      spots_count: normalizedSpotsCount,
      plus_one_names: Array.isArray(plusOneNames)
        ? plusOneNames.slice(0, 20).map((n) => String(n).trim().slice(0, 60)).filter(Boolean)
        : [],
      tier_id: tierId || null,
      tier_label: selectedTierLabel,
      base_price_cents: split.basePriceCents,
      platform_fee_cents: split.platformFeeCents,
      total_charged_cents: split.totalChargedCents,
      paystack_reference: reference,
      payment_channel: resolvedPaymentChannel,
      settled_to_host: false,
      cpa_s49_accepted: true,
      status: "pending",
    });

    const compName =
      typeof body.companyName === "string" && body.companyName.trim()
        ? body.companyName.trim().slice(0, 120)
        : null;
    const compVat =
      typeof body.companyVat === "string" && body.companyVat.trim()
        ? body.companyVat.trim().slice(0, 40)
        : null;

    const metadata = {
      event_id: event.id,
      slug: event.slug,
      order_id: order.id,
      buyer_name: buyerName.trim().slice(0, 80),
      buyer_whatsapp: normalizedPhone,
      company_name: compName,
      company_vat: compVat,
      spots_count: normalizedSpotsCount,
      plus_one_names: order.plus_one_names,
      tier_id: tierId || null,
      tier_label: selectedTierLabel,
      comment: sanitizedComment,
      badge_label: badgeLabel ? String(badgeLabel).slice(0, 80) : "🍻 Here for the Gees",
      claimed_item_id: claimedItemId || null,
      custom_answer: customAnswer ? String(customAnswer).slice(0, 280) : null,
      is_anonymous_on_wall: Boolean(isAnonymousOnWall),
      payment_channel: resolvedPaymentChannel,
      settling_rsvp_id: verifiedSettlingPledgeId,
      cpa_s49_accepted: true,
    };

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const compNameQuery = compName
      ? `&companyName=${encodeURIComponent(compName)}`
      : "";
    const compVatQuery = compVat
      ? `&companyVat=${encodeURIComponent(compVat)}`
      : "";
    const callback_url = `${appUrl}/e/${event.slug}/success?ref=${reference}${compNameQuery}${compVatQuery}`;

    const paystackPayload = {
      email: finalEmail,
      amount: split.totalChargedCents,
      currency: "ZAR",
      reference,
      callback_url,
      subaccount: event.paystack_subaccount_code,
      bearer: "account",
      transaction_charge: split.platformFeeCents,
      channels: ["card", "eft", "capitec_pay", "apple_pay"],
      metadata,
    };

    const redirectUrl = `/e/${event.slug}/success?ref=${reference}`;

    return NextResponse.json({
      mode: "pending_gateway_verification",
      authorization_url: redirectUrl,
      redirect_url: redirectUrl,
      reference,
      split,
      paystackPayload,
      order,
      rsvp: null,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: sanitizeErrorMessage(
          err,
          "Failed to initialize Paystack split checkout."
        ),
      },
      { status: 500 }
    );
  }
}
