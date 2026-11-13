import { NextRequest, NextResponse } from "next/server";
import { createYocoCheckout } from "@/lib/yoco";
import { getEventBySlug, createOrder, markOrderPaidAndCreateRsvp } from "@/lib/store";
import { calculateCheckoutSplit, generateSyntheticEmail, normalizeSaPhone } from "@/lib/fees";
import { EventTier } from "@/types/database";
import {
  enforceRateLimit,
  enforceSameOrigin,
  sanitizeErrorMessage,
} from "@/lib/security";

const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://pullthru.co.za";

export async function POST(req: NextRequest) {
  try {
    const originErr = enforceSameOrigin(req);
    if (originErr) return originErr;

    const rateErr = enforceRateLimit(req, "yoco:checkout", 20, 60_000);
    if (rateErr) return rateErr;

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload." },
        { status: 400 }
      );
    }

    const {
      type = "rsvp", // "rsvp" or "host_pass"
      slug,
      tierId, // for host pass: "r29", "r79", "r790", "r249"
      buyerName,
      buyerWhatsapp,
      buyerEmail,
      spotsCount = 1,
      plusOneNames = [],
      comment,
      claimedItemId,
      customAnswer,
      isAnonymousOnWall = false,
      badgeLabel,
      settlingRsvpId,
    } = body;

    if (!slug) {
      return NextResponse.json(
        { error: "Event slug is required." },
        { status: 400 }
      );
    }

    const eventResult = await getEventBySlug(slug);
    if (!eventResult || !eventResult.event) {
      return NextResponse.json(
        { error: "Event not found." },
        { status: 404 }
      );
    }

    const event = eventResult.event;

    if (event.is_cancelled || !event.is_active) {
      return NextResponse.json(
        { error: "This event has been cancelled or closed by the host." },
        { status: 400 }
      );
    }

    if (event.payout_frozen && type !== "host_pass") {
      return NextResponse.json(
        {
          error:
            "Buyer Protection Freeze Active: New checkouts are paused on this event while a guest dispute is under review.",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------------------
    // CASE 1: Host Pass / Pro Boost Upgrade
    // ------------------------------------------------------------------------
    if (type === "host_pass") {
      let amountCents = 2900; // default R29
      let passLabel = "R29 Pro Event Boost";

      if (tierId === "r79") {
        amountCents = 7900;
        passLabel = "R79/mo Organiser Club Pass";
      } else if (tierId === "r790") {
        amountCents = 79000;
        passLabel = "R790/yr Annual Organiser Club Pass";
      } else if (tierId === "r249") {
        amountCents = 24900;
        passLabel = "R249 Tournament & Brand Pass";
      }

      const checkout = await createYocoCheckout({
        amountCents,
        currency: "ZAR",
        cancelUrl: `${APP_BASE_URL}/e/${slug}`,
        successUrl: `${APP_BASE_URL}/e/${slug}?pass_unlocked=${tierId || "r29"}&yoco_success=true`,
        failureUrl: `${APP_BASE_URL}/e/${slug}?pass_error=payment_cancelled`,
        metadata: {
          type: "host_pass",
          slug,
          tierId: tierId || "r29",
          passLabel,
        },
      });

      return NextResponse.json({
        success: true,
        redirectUrl: checkout.redirectUrl,
        checkoutId: checkout.id,
        isMock: checkout.isMock,
      });
    }

    // ------------------------------------------------------------------------
    // CASE 2: Guest Spot RSVP Checkout
    // ------------------------------------------------------------------------
    if (!buyerName || !buyerName.trim()) {
      return NextResponse.json(
        { error: "Your name is required." },
        { status: 400 }
      );
    }

    const cleanSpots = Math.max(1, Math.min(20, Math.round(Number(spotsCount) || 1)));

    // Capacity check before creating checkout
    const currentLockedSpots = (eventResult.rsvps || [])
      .filter(
        (r) =>
          r.refund_status !== "refunded" &&
          (r.status === "locked_paid" ||
            r.status === "cash_logged" ||
            r.status === "going_free")
      )
      .reduce((sum, r) => sum + (r.spots_locked || 1), 0);

    if (event.max_spots !== null && currentLockedSpots + cleanSpots > event.max_spots) {
      const remaining = Math.max(0, event.max_spots - currentLockedSpots);
      return NextResponse.json(
        { error: `Eish! Those spots were just taken. Only ${remaining} spot(s) left!` },
        { status: 409 }
      );
    }

    let unitPriceZar = event.price_zar || 0;
    let selectedTierLabel: string | null = null;

    if (event.mode === "tiered") {
      const tier = Array.isArray(event.tiers)
        ? event.tiers.find((t: EventTier) => t.id === tierId || t.label === tierId)
        : undefined;
      if (!tier) {
        return NextResponse.json(
          { error: "Please select a valid ticket tier for this event." },
          { status: 400 }
        );
      }
      if (typeof tier.max_spots === "number" && tier.max_spots > 0) {
        const tierLocked = (eventResult.rsvps || [])
          .filter(
            (r) =>
              r.refund_status !== "refunded" &&
              (r.status === "locked_paid" ||
                r.status === "cash_logged" ||
                r.status === "going_free") &&
              r.tier_label === tier.label
          )
          .reduce((sum, r) => sum + (r.spots_locked || 1), 0);
        if (tierLocked + cleanSpots > tier.max_spots) {
          const tierRem = Math.max(0, tier.max_spots - tierLocked);
          return NextResponse.json(
            { error: `Eish! Tier "${tier.label}" only has ${tierRem} spot(s) left!` },
            { status: 409 }
          );
        }
      }
      unitPriceZar = tier.price_zar;
      selectedTierLabel = tier.label;
    } else if (event.mode === "pot") {
      const minPotZar = Math.max(15, event.min_pot_contribution_zar || 15);
      const minTotalForSpotsZar = minPotZar * cleanSpots;
      const requestedPotZar =
        body.customAmountZar !== undefined &&
        body.customAmountZar !== null &&
        String(body.customAmountZar).trim() !== ""
          ? Number(body.customAmountZar)
          : Math.max(event.price_zar || 15, minTotalForSpotsZar);
      if (
        !Number.isFinite(requestedPotZar) ||
        requestedPotZar < minTotalForSpotsZar
      ) {
        return NextResponse.json(
          {
            error:
              cleanSpots > 1
                ? `Minimum contribution for ${cleanSpots} spots is R${minTotalForSpotsZar} (R${minPotZar} per spot).`
                : `Minimum contribution for this pot is R${minPotZar}.`,
          },
          { status: 400 }
        );
      }
      unitPriceZar = requestedPotZar;
    }

    if (unitPriceZar <= 0) {
      return NextResponse.json(
        { error: "Free spots do not require a gateway checkout." },
        { status: 400 }
      );
    }

    const effectiveSpotsForSplit = event.mode === "pot" ? 1 : cleanSpots;
    const split = calculateCheckoutSplit(unitPriceZar, effectiveSpotsForSplit, 25000);

    const normalizedPhone = buyerWhatsapp ? normalizeSaPhone(buyerWhatsapp) : "";
    if (!normalizedPhone || normalizedPhone.length < 9) {
      return NextResponse.json(
        { error: "Please enter a valid South African WhatsApp number to receive your pass." },
        { status: 400 }
      );
    }
    const synthetic = generateSyntheticEmail(normalizedPhone);
    const finalEmail = buyerEmail && buyerEmail.trim() ? buyerEmail.trim() : synthetic.email;

    // Create an order reference
    const orderRef = `YOCO_PT_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Create order record in database
    await createOrder({
      event_id: event.id,
      profile_id: event.profile_id,
      buyer_name: buyerName.trim().slice(0, 80),
      buyer_whatsapp: normalizedPhone,
      buyer_email: finalEmail,
      is_synthetic_email: !buyerEmail || !buyerEmail.trim(),
      spots_count: cleanSpots,
      plus_one_names: Array.isArray(plusOneNames)
        ? plusOneNames.slice(0, 20).map((n) => String(n).trim().slice(0, 60)).filter(Boolean)
        : [],
      tier_id: tierId || null,
      tier_label: selectedTierLabel,
      base_price_cents: split.basePriceCents,
      platform_fee_cents: split.platformFeeCents,
      total_charged_cents: split.totalChargedCents,
      paystack_reference: orderRef,
      payment_channel: "card",
      settled_to_host: false,
      cpa_s49_accepted: true,
      status: "pending",
    });

    const checkout = await createYocoCheckout({
      amountCents: split.totalChargedCents,
      currency: "ZAR",
      cancelUrl: `${APP_BASE_URL}/e/${slug}`,
      successUrl: `${APP_BASE_URL}/e/${slug}/success?ref=${orderRef}&yoco_success=true`,
      failureUrl: `${APP_BASE_URL}/e/${slug}?checkout_error=payment_failed`,
      metadata: {
        type: "guest_rsvp",
        slug,
        orderRef,
        buyerName: buyerName.trim(),
        spotsCount: cleanSpots,
        eventTitle: event.title,
      },
    });

    // When Yoco is in mock/instant mode (no external hosted checkout redirect), immediately mark the order paid and create the Squad Wall RSVP
    let createdRsvpId: string | null = null;
    let createdSwapToken: string | null = null;
    if (checkout.isMock) {
      const paidRes = await markOrderPaidAndCreateRsvp(orderRef, {
        comment: comment ? String(comment).trim().slice(0, 280) : undefined,
        badge_label: badgeLabel ? String(badgeLabel).trim().slice(0, 80) : undefined,
        claimed_item_id: claimedItemId ? String(claimedItemId).trim() : null,
        custom_answer: customAnswer ? String(customAnswer).trim().slice(0, 280) : null,
        is_anonymous_on_wall: Boolean(isAnonymousOnWall),
        payment_channel: "card",
        settling_rsvp_id: settlingRsvpId ? String(settlingRsvpId).trim() : null,
      });
      if (paidRes?.rsvp) {
        createdRsvpId = paidRes.rsvp.id;
        createdSwapToken = paidRes.rsvp.swap_token || null;
      }
    }

    const finalRedirectUrl =
      checkout.isMock && createdRsvpId
        ? `${checkout.redirectUrl}&rsvpId=${encodeURIComponent(createdRsvpId)}${
            createdSwapToken ? `&swapToken=${encodeURIComponent(createdSwapToken)}` : ""
          }`
        : checkout.redirectUrl;

    return NextResponse.json({
      success: true,
      redirectUrl: finalRedirectUrl,
      checkoutId: checkout.id,
      orderRef,
      rsvpId: createdRsvpId,
      swapToken: createdSwapToken,
      isMock: checkout.isMock,
    });
  } catch (err) {
    return NextResponse.json(
      { error: sanitizeErrorMessage(err, "Checkout error.") },
      { status: 500 }
    );
  }
}
