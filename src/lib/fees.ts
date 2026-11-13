import { CheckoutSplitResult } from "@/types/database";

/**
 * PullThru Audited Checkout & Paystack Subaccount Split Engine
 *
 * - Minimum paid kitty / contribution is R15.00 (Free RSVP = R0.00 is always supported).
 * - Host receives 100% of `basePriceCents` directly via Paystack Subaccount (`bearer: "account"`).
 * - Platform retains `platformFeeCents` (`transaction_charge`) which covers Paystack processing + VAT
 *   and yields positive net margin across Capitec Pay (2.30% incl. VAT) and Card (3.335% + R1.15 incl. VAT).
 */
export function calculateCheckoutSplit(
  unitBasePriceZar: number,
  spotsCount: number = 1,
  maxBasePriceZar: number = 5000
): CheckoutSplitResult {
  if (!Number.isFinite(unitBasePriceZar) || unitBasePriceZar < 0) {
    throw new Error("Base price must be a non-negative number");
  }

  if (!Number.isFinite(spotsCount) || spotsCount < 1 || spotsCount > 20) {
    throw new Error("Spots count must be a finite number between 1 and 20");
  }

  const cleanSpots = Math.round(spotsCount);
  const basePriceCents = Math.round(unitBasePriceZar * cleanSpots * 100);
  const totalBasePriceZar = Number((basePriceCents / 100).toFixed(2));

  // Free RSVP mode (R0.00)
  if (basePriceCents === 0) {
    return {
      unitBasePriceZar: 0,
      spotsCount: cleanSpots,
      totalBasePriceZar: 0,
      basePriceCents: 0,
      platformFeeCents: 0,
      platformFeeZar: 0,
      totalChargedCents: 0,
      totalChargedZar: 0,
      feeFormulaLabel: "Free RSVP (R0.00)",
      estimatedPaystackCapitecFeeCents: 0,
      estimatedPaystackCardFeeCents: 0,
      netMarginCapitecCents: 0,
      netMarginCardCents: 0,
    };
  }

  if (basePriceCents > 0 && basePriceCents < 1500) {
    throw new Error("Minimum paid contribution or kitty spot is R15.00");
  }

  const maxCapCents = Math.round(maxBasePriceZar * 100);
  if (basePriceCents > maxCapCents) {
    throw new Error(
      `Maximum single checkout contribution is R${maxBasePriceZar.toLocaleString("en-US")}.00 (FICA & Anti-Fraud Velocity Cap)`
    );
  }

  let platformFeeCents: number;
  let feeFormulaLabel: string;

  if (basePriceCents <= 40000) {
    platformFeeCents = Math.round(basePriceCents * 0.05) + 200;
    feeFormulaLabel = "5% + R2.00 Instant RSVP & Clearing Fee";
  } else {
    platformFeeCents = Math.round(basePriceCents * 0.04) + 200;
    feeFormulaLabel = "4.0% + R2.00 Reduced Trip Rate";
  }

  const totalChargedCents = basePriceCents + platformFeeCents;
  const platformFeeZar = Number((platformFeeCents / 100).toFixed(2));
  const totalChargedZar = Number((totalChargedCents / 100).toFixed(2));

  // Paystack SA processing costs inclusive of 15% VAT:
  // Capitec Pay / Instant EFT: 2.0% + 15% VAT = 2.30%
  // Local Cards / Apple Pay: (2.9% + R1.00) * 1.15 = 3.335% + R1.15 (115 cents)
  const estimatedPaystackCapitecFeeCents = Math.round(totalChargedCents * 0.023);
  const estimatedPaystackCardFeeCents = Math.round(totalChargedCents * 0.03335) + 115;

  const netMarginCapitecCents = platformFeeCents - estimatedPaystackCapitecFeeCents;
  const netMarginCardCents = platformFeeCents - estimatedPaystackCardFeeCents;

  return {
    unitBasePriceZar,
    spotsCount: cleanSpots,
    totalBasePriceZar,
    basePriceCents,
    platformFeeCents,
    platformFeeZar,
    totalChargedCents,
    totalChargedZar,
    feeFormulaLabel,
    estimatedPaystackCapitecFeeCents,
    estimatedPaystackCardFeeCents,
    netMarginCapitecCents,
    netMarginCardCents,
  };
}

/**
 * Normalizes a South African mobile number (e.g. "082 123 4567", "+27821234567",
 * "0027821234567", or "+27 (0)82 123 4567") into standard international digits
 * without '+' ("27821234567") for `wa.me/` links and synthetic emails.
 */
export function normalizeSaPhone(phone: string): string {
  let digits = (phone || "").replace(/\D/g, "");
  if (!digits) {
    return "";
  }

  // Strip leading 00 international dial prefix (e.g., "0027821234567" -> "27821234567")
  if (digits.startsWith("00")) {
    digits = digits.replace(/^00+/, "");
    if (!digits) {
      return "";
    }
  }

  // Handle "+27 (0)82 123 4567" -> "270821234567" by stripping the trunk '0' after '27'
  if (digits.startsWith("270") && digits.length >= 12) {
    digits = `27${digits.slice(3)}`;
  }

  if (digits.startsWith("0") && digits.length === 10) {
    return `27${digits.slice(1)}`;
  }
  if (digits.startsWith("27") && digits.length >= 11) {
    return digits.slice(0, 11);
  }
  if (digits.length === 9) {
    return `27${digits}`;
  }
  return digits.startsWith("27") ? digits : `27${digits.replace(/^0+/, "")}`;
}

/**
 * POPIA Section 10 Data Minimization Helper:
 * Paystack requires an `email` field to initialize a transaction, but asking South African
 * WhatsApp guests for an email kills checkout conversion. If the guest does not provide an email,
 * we deterministically generate a synthetic routable address tied to their normalized WhatsApp number.
 */
export function generateSyntheticEmail(
  whatsappPhone: string,
  optionalRealEmail?: string | null
): { email: string; isSynthetic: boolean } {
  const trimmed = optionalRealEmail?.trim().toLowerCase() ?? "";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (trimmed && emailRegex.test(trimmed)) {
    return {
      email: trimmed,
      isSynthetic: false,
    };
  }

  const normalizedPhone = normalizeSaPhone(whatsappPhone) || "guest";
  return {
    email: `wa_${normalizedPhone}@rsvp.pullthru.co.za`,
    isSynthetic: true,
  };
}

/**
 * Formats an amount in ZAR cleanly and deterministically (e.g., R150, R1,500, R159.50, or -R100).
 */
export function formatZar(amountZar: number): string {
  if (!Number.isFinite(amountZar)) return "R0";
  const isNegative = amountZar < -0.0005;
  const absAmount = Math.abs(amountZar);
  const sign = isNegative ? "-" : "";
  const isWhole = Math.abs(absAmount - Math.round(absAmount)) < 0.001;
  if (isWhole) {
    const formattedInt = Math.round(absAmount)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `${sign}R${formattedInt}`;
  }
  const [intPart, decPart] = absAmount.toFixed(2).split(".");
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}R${formattedInt}.${decPart}`;
}

export interface FlakeCushionPricingResult {
  totalTargetZar: number;
  maxSpots: number;
  safeTurnoutSpots: number;
  bufferSpotsCount: number;
  standardSpotZar: number;
  cushionedSpotZar: number;
  extraPerSpotZar: number;
  guaranteedAtSafeTurnoutZar: number;
  totalIfFullAtCushionedZar: number;
  surplusIfFullZar: number;
}

/**
 * Calculates pre-event "Flake Cushion" pricing so that if a host creates a 10-player
 * group (e.g. R1,000 pitch) and only 80% (8 players) pay & show up, the pitch cost is
 * still 100% covered (R125 x 8 = R1,000). If all 10 show up, the +R250 surplus goes
 * toward post-match drinks, ice, or next week's game!
 */
export function calculateFlakeCushionPricing(params: {
  totalTargetZar: number;
  maxSpots: number;
  safeTurnoutRatio?: number;
}): FlakeCushionPricingResult {
  const safeTarget = Math.max(0, Math.round((Number(params.totalTargetZar) || 0) * 100) / 100);
  const safeMaxSpots = Math.max(1, Math.round(Number(params.maxSpots) || 1));
  const ratio =
    params.safeTurnoutRatio !== undefined &&
    params.safeTurnoutRatio > 0 &&
    params.safeTurnoutRatio < 1
      ? params.safeTurnoutRatio
      : 0.8;

  // Ensure at least 1 buffer spot when maxSpots >= 4, while keeping safeTurnoutSpots >= 1
  const rawSafeSpots = Math.floor(safeMaxSpots * ratio);
  const safeTurnoutSpots =
    safeMaxSpots >= 4
      ? Math.max(1, Math.min(safeMaxSpots - 1, rawSafeSpots))
      : Math.max(1, rawSafeSpots);
  const bufferSpotsCount = Math.max(0, safeMaxSpots - safeTurnoutSpots);

  const standardSpotZar = safeTarget > 0 ? Math.ceil(safeTarget / safeMaxSpots) : 0;
  const cushionedSpotZar = safeTarget > 0 ? Math.ceil(safeTarget / safeTurnoutSpots) : 0;
  const extraPerSpotZar = Math.max(0, cushionedSpotZar - standardSpotZar);
  const guaranteedAtSafeTurnoutZar = cushionedSpotZar * safeTurnoutSpots;
  const totalIfFullAtCushionedZar = cushionedSpotZar * safeMaxSpots;
  const surplusIfFullZar = Math.max(0, totalIfFullAtCushionedZar - safeTarget);

  return {
    totalTargetZar: safeTarget,
    maxSpots: safeMaxSpots,
    safeTurnoutSpots,
    bufferSpotsCount,
    standardSpotZar,
    cushionedSpotZar,
    extraPerSpotZar,
    guaranteedAtSafeTurnoutZar,
    totalIfFullAtCushionedZar,
    surplusIfFullZar,
  };
}

export interface ShortfallRsvpInput {
  id: string;
  guest_name: string;
  status: "locked_paid" | "going_free" | "cash_logged" | "payday_promise" | string;
  refund_status?: "none" | "disputed" | "refunded" | string;
  amount_contributed_zar?: number;
  spots_locked?: number;
  checked_in?: boolean;
}

export interface GuestTopUpShare {
  rsvpId: string;
  guestName: string;
  spotsLocked: number;
  alreadyPaidZar: number;
  topUpOwedZar: number;
  exactTopUpOwedZar: number;
  newTotalContributionZar: number;
  status: string;
}

export interface TurnoutShortfallSplitResult {
  targetPoolZar: number;
  verifiedRaisedZar: number;
  pendingCashZar: number;
  effectiveRaisedZar: number;
  shortfallZar: number;
  surplusZar: number;
  maxSpots: number | null;
  confirmedRsvpCount: number;
  confirmedSpotsCount: number;
  contributingSpotsCount: number;
  freeSpotsCount: number;
  unfilledSpots: number;
  standbyPledgesCount: number;
  exactTopUpPerSpotZar: number;
  topUpPerSpotZar: number;
  newSpotPriceZar: number;
  totalRecoveredAfterTopUpZar: number;
  roundingSurplusZar: number;
  isTargetMet: boolean;
  status: "target_met" | "shortfall_active" | "no_confirmed_guests";
  guestShares: GuestTopUpShare[];
}

/**
 * Calculates the exact turnout shortfall and per-spot / per-guest top-up split when fewer
 * people pay and show up than originally planned (e.g., 8 out of 10 pay for a R1,000 pitch).
 *
 * Key guarantees:
 * - Refunds (`refund_status === "refunded"`) and unpaid standby pledges (`status === "payday_promise"`)
 *   are excluded from confirmed funds & headcount.
 * - Host can choose whether `cash_logged` (Cash on Arrival) reservations that haven't checked in yet
 *   count as showing up (`includeUncheckedCash = true`, default) or flaked (`includeUncheckedCash = false`).
 * - Free spots (`going_free` or `amount_contributed_zar === 0` on tiered events, e.g. R0 kids tickets)
 *   are excluded from paying top-up shares unless ALL confirmed spots are R0.
 * - Multi-spot bookings (`spots_locked > 1`) scale proportionally (e.g. a guest who locked 2 spots
 *   covers 2x the per-spot top-up).
 * - `topUpPerSpotZar` rounds UP to the nearest whole Rand (`Math.ceil`) so the host is never left
 *   short by fractional cents at the pitch or braai.
 */
export function calculateTurnoutShortfallSplit(params: {
  targetPoolZar: number;
  maxSpots: number | null;
  baseSpotPriceZar?: number;
  rsvps: ShortfallRsvpInput[];
  includeUncheckedCash?: boolean;
}): TurnoutShortfallSplitResult {
  const targetPoolZar = Math.max(
    0,
    Math.round((Number(params.targetPoolZar) || 0) * 100) / 100
  );
  const maxSpots =
    params.maxSpots !== null &&
    params.maxSpots !== undefined &&
    Number(params.maxSpots) > 0
      ? Math.round(Number(params.maxSpots))
      : null;
  const includeUncheckedCash = params.includeUncheckedCash !== false;

  const standbyPledgesCount = (params.rsvps || []).filter(
    (r) => r.refund_status !== "refunded" && r.status === "payday_promise"
  ).length;

  // Filter active confirmed RSVPs
  const activeRsvps = (params.rsvps || []).filter((r) => {
    if (r.refund_status === "refunded") return false;
    if (r.status === "locked_paid" || r.status === "going_free") return true;
    if (r.status === "cash_logged") {
      return includeUncheckedCash || Boolean(r.checked_in);
    }
    return false;
  });

  // Track verified vs pending cash across all non-refunded RSVPs
  let verifiedRaisedZar = 0;
  let pendingCashZar = 0;

  for (const r of params.rsvps || []) {
    if (r.refund_status === "refunded") continue;
    const amt = Math.max(0, Number(r.amount_contributed_zar) || 0);
    if (r.status === "locked_paid" || (r.status === "cash_logged" && r.checked_in)) {
      verifiedRaisedZar += amt;
    } else if (r.status === "cash_logged" && !r.checked_in) {
      pendingCashZar += amt;
    }
  }

  verifiedRaisedZar = Math.round(verifiedRaisedZar * 100) / 100;
  pendingCashZar = Math.round(pendingCashZar * 100) / 100;

  const effectiveRaisedZar = includeUncheckedCash
    ? Math.round((verifiedRaisedZar + pendingCashZar) * 100) / 100
    : verifiedRaisedZar;

  const confirmedRsvpCount = activeRsvps.length;
  const confirmedSpotsCount = activeRsvps.reduce(
    (sum, r) => sum + Math.max(1, Math.round(Number(r.spots_locked) || 1)),
    0
  );

  // Separate paid contributing spots from R0 free spots (e.g. Kids Under 12 Free tier)
  const paidActiveRsvps = activeRsvps.filter(
    (r) => r.status !== "going_free" && (Number(r.amount_contributed_zar) || 0) > 0
  );
  const paidSpotsCount = paidActiveRsvps.reduce(
    (sum, r) => sum + Math.max(1, Math.round(Number(r.spots_locked) || 1)),
    0
  );
  const freeSpotsCount = Math.max(0, confirmedSpotsCount - paidSpotsCount);

  // If there are paid spots, only paid spots split the shortfall; otherwise fall back to all confirmed spots
  const contributingSpotsCount = paidSpotsCount > 0 ? paidSpotsCount : confirmedSpotsCount;

  const unfilledSpots =
    maxSpots !== null ? Math.max(0, maxSpots - confirmedSpotsCount) : 0;

  const rawShortfall = targetPoolZar - effectiveRaisedZar;
  const shortfallZar =
    rawShortfall > 0.005 ? Math.round(rawShortfall * 100) / 100 : 0;
  const surplusZar =
    rawShortfall < -0.005 ? Math.round(Math.abs(rawShortfall) * 100) / 100 : 0;

  const isTargetMet = shortfallZar === 0;

  if (confirmedSpotsCount === 0 || contributingSpotsCount === 0) {
    return {
      targetPoolZar,
      verifiedRaisedZar,
      pendingCashZar,
      effectiveRaisedZar,
      shortfallZar,
      surplusZar,
      maxSpots,
      confirmedRsvpCount: 0,
      confirmedSpotsCount: 0,
      contributingSpotsCount: 0,
      freeSpotsCount: 0,
      unfilledSpots,
      standbyPledgesCount,
      exactTopUpPerSpotZar: 0,
      topUpPerSpotZar: 0,
      newSpotPriceZar: Math.max(0, Number(params.baseSpotPriceZar) || 0),
      totalRecoveredAfterTopUpZar: effectiveRaisedZar,
      roundingSurplusZar: 0,
      isTargetMet,
      status: isTargetMet ? "target_met" : "no_confirmed_guests",
      guestShares: [],
    };
  }

  const exactTopUpPerSpotZar =
    shortfallZar > 0
      ? Math.round((shortfallZar / contributingSpotsCount) * 100) / 100
      : 0;
  // Round up to whole Rand so host is never short at the venue
  const topUpPerSpotZar =
    shortfallZar > 0 ? Math.ceil(shortfallZar / contributingSpotsCount) : 0;

  const inferredBaseSpotZar =
    params.baseSpotPriceZar !== undefined && Number(params.baseSpotPriceZar) > 0
      ? Number(params.baseSpotPriceZar)
      : Math.round((effectiveRaisedZar / contributingSpotsCount) * 100) / 100;

  const newSpotPriceZar = Math.round((inferredBaseSpotZar + topUpPerSpotZar) * 100) / 100;

  const totalTopUpCollectedZar = topUpPerSpotZar * contributingSpotsCount;
  const totalRecoveredAfterTopUpZar =
    Math.round((effectiveRaisedZar + totalTopUpCollectedZar) * 100) / 100;
  const roundingSurplusZar =
    shortfallZar > 0
      ? Math.max(0, Math.round((totalTopUpCollectedZar - shortfallZar) * 100) / 100)
      : 0;

  const guestShares: GuestTopUpShare[] = activeRsvps.map((r) => {
    const spots = Math.max(1, Math.round(Number(r.spots_locked) || 1));
    const alreadyPaid = Math.max(0, Number(r.amount_contributed_zar) || 0);
    const isContributing =
      paidSpotsCount > 0
        ? r.status !== "going_free" && alreadyPaid > 0
        : true;
    const guestTopUp = isContributing ? topUpPerSpotZar * spots : 0;
    const guestExactTopUp = isContributing
      ? Math.round(exactTopUpPerSpotZar * spots * 100) / 100
      : 0;

    return {
      rsvpId: r.id,
      guestName: r.guest_name,
      spotsLocked: spots,
      alreadyPaidZar: alreadyPaid,
      topUpOwedZar: guestTopUp,
      exactTopUpOwedZar: guestExactTopUp,
      newTotalContributionZar: Math.round((alreadyPaid + guestTopUp) * 100) / 100,
      status: r.status,
    };
  });

  return {
    targetPoolZar,
    verifiedRaisedZar,
    pendingCashZar,
    effectiveRaisedZar,
    shortfallZar,
    surplusZar,
    maxSpots,
    confirmedRsvpCount,
    confirmedSpotsCount,
    contributingSpotsCount,
    freeSpotsCount,
    unfilledSpots,
    standbyPledgesCount,
    exactTopUpPerSpotZar,
    topUpPerSpotZar,
    newSpotPriceZar,
    totalRecoveredAfterTopUpZar,
    roundingSurplusZar,
    isTargetMet,
    status: isTargetMet ? "target_met" : "shortfall_active",
    guestShares,
  };
}

/**
 * Formats a clear, transparent WhatsApp group message for the confirmed squad when turnout
 * is lower than the original cap (e.g., 8/10 players show up) and the remaining players
 * need to top up their share so the host isn't out of pocket.
 */
export function formatShortfallTopUpWhatsAppMessage(params: {
  eventTitle: string;
  eventDate: string;
  locationName: string;
  eventUrl: string;
  hostName?: string;
  payshapId?: string;
  bankName?: string;
  accountNumber?: string;
  capitecPaymeUrl?: string;
  splitResult: TurnoutShortfallSplitResult;
}): string {
  const { splitResult } = params;
  const lines: string[] = [];

  lines.push(`⚖️ *SQUAD HEADCOUNT & SPLIT UPDATE: ${params.eventTitle.toUpperCase()}*`);
  lines.push(`🗓️ ${params.eventDate} • 📍 ${params.locationName}`);
  lines.push(``);

  if (splitResult.maxSpots) {
    lines.push(
      `Only *${splitResult.confirmedSpotsCount} of ${splitResult.maxSpots} spots* locked in (${splitResult.unfilledSpots} unfilled), so we've locked the squad at *${splitResult.confirmedSpotsCount}/${splitResult.confirmedSpotsCount}*:`
    );
  } else {
    lines.push(
      `We have *${splitResult.confirmedSpotsCount} confirmed spots* locked in for the booking:`
    );
  }

  lines.push(
    `• 🎯 Venue / Pitch Target: *${formatZar(splitResult.targetPoolZar)}*`
  );
  lines.push(
    `• 💰 Collected So Far (${splitResult.confirmedSpotsCount} spots): *${formatZar(splitResult.effectiveRaisedZar)}*`
  );
  lines.push(
    `• ⚠️ Booking Shortfall: *${formatZar(splitResult.shortfallZar)}*`
  );
  lines.push(
    `• 🤝 Fair Top-Up Split (${splitResult.contributingSpotsCount} spots): *+${formatZar(splitResult.topUpPerSpotZar)} / spot*`
  );

  if (splitResult.guestShares.length > 0) {
    lines.push(``);
    lines.push(`📋 *Updated Squad Top-Up List:*`);
    splitResult.guestShares.forEach((g, idx) => {
      const spotTag = g.spotsLocked > 1 ? ` (×${g.spotsLocked} spots)` : "";
      if (g.topUpOwedZar > 0) {
        lines.push(
          `${idx + 1}. ${g.guestName}${spotTag} — paid ${formatZar(g.alreadyPaidZar)} → *+${formatZar(g.topUpOwedZar)} top-up*`
        );
      } else {
        lines.push(`${idx + 1}. ${g.guestName}${spotTag} — Free spot (R0)`);
      }
    });
  }

  lines.push(``);
  if (params.payshapId) {
    lines.push(
      `⚡ *PayShap Top-Up to ${params.hostName || "Host"}:* ${params.payshapId}${
        params.bankName ? ` (${params.bankName})` : ""
      }`
    );
  }
  if (params.accountNumber && params.bankName) {
    lines.push(`🏦 *EFT Account:* ${params.bankName} • Acc ${params.accountNumber}`);
  }
  if (params.capitecPaymeUrl) {
    lines.push(`📲 *Capitec PayMe:* ${params.capitecPaymeUrl}`);
  }

  lines.push(`👉 Live Wall: ${params.eventUrl}`);
  return lines.join("\n");
}

