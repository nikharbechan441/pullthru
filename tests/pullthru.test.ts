process.env.IS_PULLTHRU_TEST = "true";
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server.js";
import {
  GET as getEventsApi,
  POST as postEventsApi,
  PATCH as patchEventsApi,
} from "../src/app/api/events/route";
import {
  POST as postRsvpApi,
  PATCH as patchRsvpApi,
} from "../src/app/api/rsvp/route";
import {
  POST as postSubaccountApi,
} from "../src/app/api/paystack/subaccount/route";
import {
  POST as postPaystackInitApi,
} from "../src/app/api/paystack/initialize/route";
import {
  POST as postPaystackWebhookApi,
} from "../src/app/api/paystack/webhook/route";
import {
  POST as postWhatsAppApi,
} from "../src/app/api/whatsapp/route";
import { generateMetadata as generateEventMetadata } from "../src/app/e/[slug]/layout";
import {
  parseWhatsAppCommand,
} from "../src/lib/whatsapp";
import {
  calculateCheckoutSplit,
  generateSyntheticEmail,
  normalizeSaPhone,
  formatZar,
} from "../src/lib/fees";
import {
  validateEventCompliance,
  validateSaBankAccount,
  determineSettlementSchedule,
  validateVelocityCaps,
} from "../src/lib/compliance";
import { BringItem } from "../src/types/database";
import {
  listEvents,
  getEventBySlug,
  createEvent,
  updateEvent,
  createOrder,
  getOrderByReference,
  markOrderPaidAndCreateRsvp,
  createDirectRsvp,
  swapRsvpSpot,
  toggleCheckInRsvp,
} from "../src/lib/store";

const DATA_FILE_PATH = path.join(process.cwd(), ".pullthru-data.json");

// Ensure offline local-store fallback works in test environments even if getSupabase is referenced globally
if (typeof (globalThis as Record<string, unknown>).getSupabase !== "function") {
  (globalThis as Record<string, unknown>).getSupabase = () => null;
}

after(() => {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      fs.unlinkSync(DATA_FILE_PATH);
    }
  } catch {
    // Ignore cleanup error
  }
});

describe("PullThru Checkout Split & Fee Engine (src/lib/fees.ts)", () => {
  it("supports Free RSVP (0 ZAR -> 0 cents across all fields)", () => {
    const split = calculateCheckoutSplit(0, 1);
    assert.equal(split.basePriceCents, 0);
    assert.equal(split.platformFeeCents, 0);
    assert.equal(split.totalChargedCents, 0);
    assert.equal(split.netMarginCapitecCents, 0);
    assert.equal(split.netMarginCardCents, 0);
  });

  it("rejects paid amounts below R15 minimum (e.g., R10 throws error) while supporting R15–R49 low-ticket splits", () => {
    assert.throws(
      () => calculateCheckoutSplit(10, 1),
      /Minimum paid contribution or kitty spot is R15\.00/
    );
    const lowTicketSplit = calculateCheckoutSplit(20, 1);
    assert.equal(lowTicketSplit.basePriceCents, 2000);
    assert.equal(lowTicketSplit.platformFeeCents, 300);
    assert.equal(lowTicketSplit.totalChargedCents, 2300);
  });

  it("calculates R50 minimum kitty split with positive net margin on both Capitec Pay and Card", () => {
    const split = calculateCheckoutSplit(50, 1);
    assert.equal(split.basePriceCents, 5000);
    assert.equal(split.platformFeeCents, 450);
    assert.equal(split.totalChargedCents, 5450);
    assert.ok(
      split.netMarginCapitecCents > 0,
      `Expected positive Capitec net margin, got ${split.netMarginCapitecCents}`
    );
    assert.ok(
      split.netMarginCardCents > 0,
      `Expected positive Card net margin, got ${split.netMarginCardCents}`
    );
  });

  it("calculates R150 standard braai spot accurately", () => {
    const split = calculateCheckoutSplit(150, 1);
    assert.equal(split.basePriceCents, 15000);
    assert.equal(split.platformFeeCents, 950);
    assert.equal(split.totalChargedCents, 15950);
    assert.equal(split.totalChargedZar, 159.5);
    assert.ok(split.netMarginCapitecCents > 0);
    assert.ok(split.netMarginCardCents > 0);
  });

  it("calculates Multi-spot bundle (R150 x 2 spots) with higher per-transaction efficiency", () => {
    const single = calculateCheckoutSplit(150, 1);
    const bundle = calculateCheckoutSplit(150, 2);

    assert.equal(bundle.spotsCount, 2);
    assert.equal(bundle.basePriceCents, 30000);
    assert.equal(bundle.platformFeeCents, 1700);
    assert.equal(bundle.totalChargedCents, 31700);
    assert.ok(
      bundle.netMarginCardCents > single.netMarginCardCents,
      "Multi-spot bundle should yield higher net card margin because Paystack R1.15 flat fee is charged once"
    );
  });

  it("applies reduced 4% + R2.00 rate for high-ticket trips (R1000) and maintains positive margin", () => {
    const split = calculateCheckoutSplit(1000, 1);
    assert.equal(split.basePriceCents, 100000);
    assert.equal(split.platformFeeCents, 4200); // 4% of 100000 (4000) + 200 = 4200 cents (R42.00)
    assert.equal(split.totalChargedCents, 104200);
    assert.match(split.feeFormulaLabel, /4\.0% \+ R2\.00/);
    assert.ok(split.netMarginCapitecCents > 0);
    assert.ok(split.netMarginCardCents > 0);
  });

  it("verifies exact R400 / R401 / R5,000 boundaries and fractional cent precision (R66.67 x 3)", () => {
    const at400 = calculateCheckoutSplit(400, 1);
    assert.equal(at400.platformFeeCents, 2200); // 5% of 40000 + 200 = R22.00

    const at401 = calculateCheckoutSplit(401, 1);
    assert.equal(at401.platformFeeCents, 1804); // 4% of 40100 + 200 = R18.04

    const at5000 = calculateCheckoutSplit(5000, 1);
    assert.equal(at5000.basePriceCents, 500000);
    assert.equal(at5000.platformFeeCents, 20200); // R202.00
    assert.ok(at5000.netMarginCardCents > 0, "R5,000 max checkout must yield positive card margin");

    const fractionalSplit = calculateCheckoutSplit(66.67, 3);
    assert.equal(fractionalSplit.basePriceCents, 20001); // R200.01 exact, not rounded prematurely to R201
  });
});

describe("POPIA Section 18 Synthetic Email & Phone Normalization (src/lib/fees.ts)", () => {
  it('converts "082 123 4567" into wa_27821234567@rsvp.pullthru.co.za with isSynthetic: true', () => {
    const result = generateSyntheticEmail("082 123 4567");
    assert.equal(result.email, "wa_27821234567@rsvp.pullthru.co.za");
    assert.equal(result.isSynthetic, true);
  });

  it("preserves real email when provided with isSynthetic: false", () => {
    const result = generateSyntheticEmail("082 123 4567", "Thabo.Mbeki@example.co.za ");
    assert.equal(result.email, "thabo.mbeki@example.co.za");
    assert.equal(result.isSynthetic, false);
  });

  it("normalizes SA phone numbers and formats ZAR amounts cleanly", () => {
    assert.equal(normalizeSaPhone("+27 83 987 6543"), "27839876543");
    assert.equal(formatZar(150), "R150");
    assert.equal(formatZar(159.5), "R159.50");
  });
});

describe("Statutory Compliance, Bank Validation & Settlement Velocity Shield (src/lib/compliance.ts)", () => {
  it("blocks prohibited gambling and unlicensed funeral/insurance schemes", () => {
    const blockedTitles = [
      "FPL Season Buy-In",
      "SuperBru Cash Pool",
      "Raffle",
      "Monthly Burial Society",
    ];

    for (const title of blockedTitles) {
      const check = validateEventCompliance(title);
      assert.equal(
        check.compliant,
        false,
        `Expected "${title}" to be blocked by statutory compliance filter`
      );
      assert.ok(check.reason && check.reason.length > 0);
    }
  });

  it("allows lawful SA social gatherings, 5-a-side sports, and one-off condolence gifts", () => {
    const allowedTitles = [
      "Saturday Spitbraai",
      "Thursday 5-a-Side Soccer",
      "One-off Condolence Gift for Mama Mabaso",
    ];

    for (const title of allowedTitles) {
      const check = validateEventCompliance(title);
      assert.equal(
        check.compliant,
        true,
        `Expected "${title}" to be allowed by statutory compliance filter`
      );
    }
  });

  it("validates Capitec and FNB account numbers and rejects invalid lengths or repeating zeros", () => {
    // Valid Capitec (470010) 10-digit account
    const validCapitec = validateSaBankAccount("470010", "1492837465");
    assert.equal(validCapitec.valid, true);
    assert.equal(validCapitec.last4, "7465");

    // Valid FNB (250655) 11-digit account
    const validFnb = validateSaBankAccount("250655", "62819203948");
    assert.equal(validFnb.valid, true);
    assert.equal(validFnb.last4, "3948");

    // Rejects invalid short length
    const tooShort = validateSaBankAccount("470010", "12345");
    assert.equal(tooShort.valid, false);

    // Rejects repeating digits 0000000000
    const allZeros = validateSaBankAccount("470010", "0000000000");
    assert.equal(allZeros.valid, false);
  });

  it("assigns auto settlement to pools <= R3,000 and manual to tier_0_new pools > R3,000", () => {
    const smallPool = determineSettlementSchedule({
      mode: "fixed",
      priceZar: 150,
      maxSpots: 15, // R2,250 <= R3,000
      trustTier: "tier_0_new",
    });
    assert.equal(smallPool.schedule, "auto");
    assert.equal(smallPool.estimatedPoolZar, 2250);

    const largeNewHostPool = determineSettlementSchedule({
      mode: "fixed",
      priceZar: 250,
      maxSpots: 20, // R5,000 > R3,000
      trustTier: "tier_0_new",
    });
    assert.equal(largeNewHostPool.schedule, "manual");
    assert.equal(largeNewHostPool.estimatedPoolZar, 5000);

    const largeTrustedHostPool = determineSettlementSchedule({
      mode: "fixed",
      priceZar: 250,
      maxSpots: 20,
      trustTier: "tier_1_trusted",
    });
    assert.equal(largeTrustedHostPool.schedule, "auto");
  });

  it("enforces FICA & stolen-card velocity caps (R5,000 single checkout & R25,000 unverified pool)", () => {
    assert.throws(
      () => calculateCheckoutSplit(6000, 1),
      /Maximum single checkout contribution is R5,000\.00/
    );

    const overSingleCap = validateVelocityCaps({
      totalBasePriceZar: 5500,
      trustTier: "tier_0_new",
    });
    assert.equal(overSingleCap.valid, false);

    const overPoolCap = validateVelocityCaps({
      totalBasePriceZar: 2000,
      currentPoolRaisedZar: 24000,
      trustTier: "tier_0_new",
    });
    assert.equal(overPoolCap.valid, false);

    const validCaps = validateVelocityCaps({
      totalBasePriceZar: 450,
      currentPoolRaisedZar: 2000,
      trustTier: "tier_0_new",
    });
    assert.equal(validCaps.valid, true);
  });
});

describe("PullThru Data Store & Event Lifecycle Integration Suite (src/lib/store.ts)", () => {
  before(() => {
    try {
      if (fs.existsSync(DATA_FILE_PATH)) {
        fs.unlinkSync(DATA_FILE_PATH);
      }
    } catch {
      // ignore
    }
  });

  after(() => {
    try {
      if (fs.existsSync(DATA_FILE_PATH)) {
        fs.unlinkSync(DATA_FILE_PATH);
      }
    } catch {
      // ignore
    }
  });

  it("lists all 5 seeded Mzansi events and resolves event details & RSVPs by slug", async () => {
    const events = await listEvents();
    assert.ok(events.length >= 5, `Expected at least 5 seeded events, got ${events.length}`);

    const slugs = events.map((e) => e.slug);
    assert.ok(slugs.includes("thursday-fives-sandton"));
    assert.ok(slugs.includes("bokke-test-spitbraai"));
    assert.ok(slugs.includes("mrs-dlamini-baby-shower"));
    assert.ok(slugs.includes("clifton-sunset-catamaran"));
    assert.ok(slugs.includes("seapoint-sunrise-run-club"));

    const fives = await getEventBySlug("thursday-fives-sandton");
    assert.ok(fives, "Expected thursday-fives-sandton to resolve");
    assert.equal(fives.event.host_name, "Tariq Davids");
    assert.equal(fives.rsvps.length, 7);
  });

  it("creates a new event with cryptographic host_secret_token and updates event properties cleanly", async () => {
    const created = await createEvent({
      title: "Sunday Padkos & Padel Tournament",
      host_name: "Sipho Dlamini",
      host_phone: "+27829998877",
      mode: "fixed",
      price_zar: 120,
      max_spots: 12,
      bring_items: [
        {
          id: "padel-balls-1",
          label: "🎾 2x Cans New Padel Balls",
          claimed_by_name: null,
          claimed_rsvp_id: null,
        },
      ],
    });

    assert.ok(created.id.startsWith("evt-"));
    assert.ok(created.slug.startsWith("sunday-padkos-padel-tournament-"));
    assert.ok(
      created.host_secret_token && created.host_secret_token.startsWith("host-secret-"),
      "Expected generated host_secret_token"
    );
    assert.equal(created.price_zar, 120);
    assert.equal(created.pro_fee_split_mode, "squad_100");
    assert.equal(created.bake_pro_boost_into_price, true);

    const updated = await updateEvent(created.slug, {
      location_name: "Africa Padel Claremont, Court 2",
      max_spots: 16,
      pro_fee_split_mode: "split_50_50",
    });
    assert.ok(updated);
    assert.equal(updated.id, created.id);
    assert.equal(updated.location_name, "Africa Padel Claremont, Court 2");
    assert.equal(updated.max_spots, 16);
    assert.equal(updated.pro_fee_split_mode, "split_50_50");
  });

  it("handles 3-way Pro Fee Split options (squad_100, split_50_50, host_100) accurately", async () => {
    const hostAbsorbEvent = await createEvent({
      title: "Executive Golf Day",
      host_name: "Devan Naidoo",
      host_phone: "+27821112233",
      mode: "fixed",
      price_zar: 500,
      max_spots: 16,
      pro_fee_split_mode: "host_100",
    });
    assert.equal(hostAbsorbEvent.pro_fee_split_mode, "host_100");
    assert.equal(hostAbsorbEvent.bake_pro_boost_into_price, false);

    const splitEvent = await createEvent({
      title: "Squad Braai 50/50",
      host_name: "Riaan Van Der Merwe",
      host_phone: "+27823334455",
      mode: "tiered",
      price_zar: 220,
      max_spots: 20,
      pro_fee_split_mode: "split_50_50",
    });
    assert.equal(splitEvent.pro_fee_split_mode, "split_50_50");
    assert.equal(splitEvent.bake_pro_boost_into_price, true);
  });

  it("executes paid checkout lifecycle (createOrder -> markOrderPaidAndCreateRsvp) and claims Bring-'n-Bak item", async () => {
    const reference = `PT_TEST_REF_${Date.now()}`;
    const order = await createOrder({
      event_id: "evt-1",
      profile_id: "prof-tariq",
      buyer_name: "Kagiso Rabada",
      buyer_whatsapp: "27824445566",
      buyer_email: "wa_27824445566@rsvp.pullthru.co.za",
      is_synthetic_email: true,
      spots_count: 1,
      plus_one_names: [],
      tier_id: null,
      tier_label: null,
      base_price_cents: 10000,
      platform_fee_cents: 700,
      total_charged_cents: 10700,
      paystack_reference: reference,
      payment_channel: "capitec_pay",
      settled_to_host: false,
      cpa_s49_accepted: true,
      status: "pending",
    });

    const fetchedOrder = await getOrderByReference(reference);
    assert.ok(fetchedOrder);
    assert.equal(fetchedOrder.id, order.id);
    assert.equal(fetchedOrder.status, "pending");

    // Claim unclaimed item b3 ("🧊 10x Energades / Water") on evt-1
    const paidResult = await markOrderPaidAndCreateRsvp(reference, {
      comment: "Bringing ice-cold Energades for half-time!",
      claimed_item_id: "b3",
      payment_channel: "capitec_pay",
    });

    assert.ok(paidResult);
    assert.equal(paidResult.order.status, "paid");
    assert.equal(paidResult.order.settled_to_host, true);
    assert.equal(paidResult.rsvp.guest_name, "Kagiso Rabada");
    assert.equal(paidResult.rsvp.status, "locked_paid");
    assert.equal(paidResult.rsvp.claimed_item_id, "b3");
    assert.equal(paidResult.rsvp.claimed_item_label, "🧊 10x Energades / Water");

    const claimedItem = paidResult.event.bring_items.find((b) => b.id === "b3");
    assert.ok(claimedItem);
    assert.equal(claimedItem.claimed_by_name, "Kagiso Rabada");
  });

  it("enforces webhook/callback idempotency so calling markOrderPaidAndCreateRsvp twice never duplicates RSVPs", async () => {
    const reference = `PT_IDEMPOTENT_REF_${Date.now()}`;
    await createOrder({
      event_id: "evt-1",
      profile_id: "prof-tariq",
      buyer_name: "Lungi Ngidi",
      buyer_whatsapp: "27831119988",
      buyer_email: "wa_27831119988@rsvp.pullthru.co.za",
      is_synthetic_email: true,
      spots_count: 1,
      plus_one_names: [],
      tier_id: null,
      tier_label: null,
      base_price_cents: 10000,
      platform_fee_cents: 700,
      total_charged_cents: 10700,
      paystack_reference: reference,
      payment_channel: "apple_pay",
      settled_to_host: false,
      cpa_s49_accepted: true,
      status: "pending",
    });

    const firstCall = await markOrderPaidAndCreateRsvp(reference, {
      comment: "First webhook arrival",
    });
    assert.ok(firstCall);

    const beforeDuplicateCheck = await getEventBySlug("thursday-fives-sandton");
    assert.ok(beforeDuplicateCheck);
    const countAfterFirst = beforeDuplicateCheck.rsvps.length;

    // Second call with identical reference (simulating concurrent Paystack webhook + browser redirect)
    const secondCall = await markOrderPaidAndCreateRsvp(reference, {
      comment: "Second duplicate callback",
    });
    assert.ok(secondCall);
    assert.equal(secondCall.rsvp.id, firstCall.rsvp.id, "Must return the exact same RSVP record");

    const afterDuplicateCheck = await getEventBySlug("thursday-fives-sandton");
    assert.ok(afterDuplicateCheck);
    assert.equal(
      afterDuplicateCheck.rsvps.length,
      countAfterFirst,
      "Must not create a duplicate RSVP in the store"
    );
  });

  it("enforces cryptographic Spot-Swap Security (swapRsvpSpot): rejects invalid tokens and logs audit trail on valid swap", async () => {
    // Attempt hijack with public RSVP id or wrong swap_token -> must return null
    const rejectedSwap = await swapRsvpSpot({
      slug: "thursday-fives-sandton",
      swapToken: "rsvp-1-invalid-forged-token",
      newGuestName: "Attacker",
    });
    assert.equal(rejectedSwap, null);

    // Valid cryptographic swap using Siya K's swap-fives-siya token
    const validSwap = await swapRsvpSpot({
      slug: "thursday-fives-sandton",
      swapToken: "swap-fives-siya",
      newGuestName: "Temba Bavuma",
      newComment: "Subbing in for Siya tonight!",
    });
    assert.ok(validSwap);
    assert.equal(validSwap.guest_name, "Temba Bavuma");
    assert.match(validSwap.comment || "", /\(🔄 Swapped from Siya K\)/);

    // Verify Siya K's claimed Bring-'n-Bak item (b1) transferred to Temba Bavuma
    const updatedFives = await getEventBySlug("thursday-fives-sandton");
    assert.ok(updatedFives);
    const ballItem = updatedFives.event.bring_items.find((b) => b.id === "b1");
    assert.equal(ballItem?.claimed_by_name, "Temba Bavuma");

    // Verify swap_token rotation: Siya K's old token ("swap-fives-siya") is now invalidated
    const replayAttempt = await swapRsvpSpot({
      slug: "thursday-fives-sandton",
      swapToken: "swap-fives-siya",
      newGuestName: "Replay Hijacker",
    });
    assert.equal(replayAttempt, null, "Old swap_token must be invalidated after spot transfer");
  });

  it("toggles Host QR/gate check-in status (toggleCheckInRsvp) and supports direct RSVPs (createDirectRsvp)", async () => {
    // Toggle check-in on rsvp-3 (Tshepo M, initially checked_in: false)
    const toggledOn = await toggleCheckInRsvp("thursday-fives-sandton", "rsvp-3");
    assert.ok(toggledOn);
    assert.equal(toggledOn.checked_in, true);

    const toggledOff = await toggleCheckInRsvp("thursday-fives-sandton", "rsvp-3");
    assert.ok(toggledOff);
    assert.equal(toggledOff.checked_in, false);

    // Create a direct Free RSVP on seapoint-sunrise-run-club (evt-5)
    const direct = await createDirectRsvp({
      order_id: null,
      event_id: "evt-5",
      guest_name: "Cheslin Kolbe",
      plus_one_names: [],
      spots_locked: 1,
      tier_label: null,
      amount_contributed_zar: 0,
      status: "going_free",
      payment_channel: "capitec_pay",
      badge_label: "⚡ Sub-20min 5km",
      comment: "Bringing a bag of sweet naartjies for the finish!",
      claimed_item_id: "rc2",
      claimed_item_label: null,
      custom_answer: "Yes, flat white!",
      is_anonymous_on_wall: false,
    });
    assert.ok(direct.rsvp.id.startsWith("rsvp-"));
    assert.equal(direct.rsvp.claimed_item_label, "🍊 Bag of Naartjies for Finish");
  });

  describe("API Security, Host Authorization & Token Stripping Engine", () => {
    it("GET /api/events strips host_secret_token, swap_token, and masks secret_location_pin from unauthenticated requests", async () => {
      const publicReq = new NextRequest(
        "http://localhost:3000/api/events?slug=thursday-fives-sandton"
      );
      const res = await getEventsApi(publicReq);
      assert.equal(res.status, 200);

      const data = await res.json();
      assert.ok(data.event);
      assert.equal(
        data.event.host_secret_token,
        undefined,
        "Public response must NEVER leak host_secret_token"
      );
      assert.equal(
        data.event.secret_location_pin,
        null,
        "Public response must hide secret_location_pin from unauthenticated visitors"
      );

      // Verify all RSVPs have swap_token stripped
      assert.ok(data.rsvps.length > 0);
      for (const rsvp of data.rsvps) {
        assert.equal(
          rsvp.swap_token,
          undefined,
          "Public social wall must NEVER leak swap_token"
        );
      }

      // Authorized host request with x-host-token reveals secret_location_pin
      const hostReq = new NextRequest(
        "http://localhost:3000/api/events?slug=thursday-fives-sandton",
        {
          headers: { "x-host-token": "host-secret-tariq-fives" },
        }
      );
      const hostRes = await getEventsApi(hostReq);
      assert.equal(hostRes.status, 200);
      const hostData = await hostRes.json();
      assert.ok(
        hostData.event.secret_location_pin !== null,
        "Host must see secret_location_pin when passing valid host token"
      );
    });

    it("PATCH /api/events strictly enforces host_secret_token verification (rejects unauthorized calls with 403)", async () => {
      // 1. Missing host token -> 403
      const unauthReq = new NextRequest("http://localhost:3000/api/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: "thursday-fives-sandton",
          action: "postpone_date",
          event_date: "2026-11-15T18:00:00Z",
        }),
      });
      const unauthRes = await patchEventsApi(unauthReq);
      assert.equal(unauthRes.status, 403);
      const unauthData = await unauthRes.json();
      assert.match(unauthData.error, /Unauthorized: Valid host secret token required/);

      // 2. Wrong host token -> 403
      const forgedReq = new NextRequest("http://localhost:3000/api/events", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-host-token": "host_forged_random_token_123",
        },
        body: JSON.stringify({
          slug: "thursday-fives-sandton",
          action: "postpone_date",
          event_date: "2026-11-15T18:00:00Z",
        }),
      });
      const forgedRes = await patchEventsApi(forgedReq);
      assert.equal(forgedRes.status, 403);

      // 3. Valid host token -> 200
      const validReq = new NextRequest("http://localhost:3000/api/events", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-host-token": "host-secret-tariq-fives",
        },
        body: JSON.stringify({
          slug: "thursday-fives-sandton",
          action: "postpone_date",
          event_date: "Friday, 30 Oct • 19:00 SAST",
        }),
      });
      const validRes = await patchEventsApi(validReq);
      assert.equal(validRes.status, 200);
      const validData = await validRes.json();
      assert.equal(validData.event.event_date, "Friday, 30 Oct • 19:00 SAST");
    });

    it("POST /api/rsvp (status: cash_logged) requires host authorization (rejects spoofed cash RSVPs with 403)", async () => {
      // 1. Missing host token -> 403
      const unauthReq = new NextRequest("http://localhost:3000/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: "bokke-test-spitbraai",
          guest_name: "Sneaky Free Rider",
          status: "cash_logged",
          spots_locked: 1,
          amount_contributed_zar: 220,
        }),
      });
      const unauthRes = await postRsvpApi(unauthReq);
      assert.equal(unauthRes.status, 403);
      const unauthData = await unauthRes.json();
      assert.match(unauthData.error, /Unauthorized: Only the host with a valid secret token/);

      // 2. Valid host token -> 201 Created
      const validReq = new NextRequest("http://localhost:3000/api/rsvp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-host-token": "host-secret-riaan-braai",
        },
        body: JSON.stringify({
          slug: "bokke-test-spitbraai",
          guest_name: "Kagiso Rabada",
          status: "cash_logged",
          spots_locked: 1,
          amount_contributed_zar: 220,
          badge_label: "🔥 Braai Legend",
        }),
      });
      const validRes = await postRsvpApi(validReq);
      assert.equal(validRes.status, 201);
      const validData = await validRes.json();
      assert.equal(validData.rsvp.guest_name, "Kagiso Rabada");
      assert.equal(validData.rsvp.status, "cash_logged");
      assert.equal(validData.rsvp.payment_channel, "cash_manual");
    });

    it("PATCH /api/rsvp (action: toggle_checkin) requires host authorization", async () => {
      // 1. Missing host token -> 403
      const unauthReq = new NextRequest("http://localhost:3000/api/rsvp", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: "thursday-fives-sandton",
          action: "toggle_checkin",
          rsvpId: "rsvp-1",
        }),
      });
      const unauthRes = await patchRsvpApi(unauthReq);
      assert.equal(unauthRes.status, 403);

      // 2. Valid host token -> 200 OK
      const validReq = new NextRequest("http://localhost:3000/api/rsvp", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-host-token": "host-secret-tariq-fives",
        },
        body: JSON.stringify({
          slug: "thursday-fives-sandton",
          action: "toggle_checkin",
          rsvpId: "rsvp-1",
        }),
      });
      const validRes = await patchRsvpApi(validReq);
      assert.equal(validRes.status, 200);
      const validData = await validRes.json();
      assert.equal(typeof validData.rsvp.checked_in, "boolean");
    });

    it("POST /api/paystack/subaccount prevents bank account hijack when event has locked paid contributions", async () => {
      // Attempt to link a new bank account to thursday-fives-sandton (which already has paid RSVPs)
      const req = new NextRequest(
        "http://localhost:3000/api/paystack/subaccount",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-host-token": "host-secret-tariq-fives",
          },
          body: JSON.stringify({
            slug: "thursday-fives-sandton",
            hostName: "Tariq Davids",
            bankCode: "679000",
            accountNumber: "1234567890",
          }),
        }
      );
      const res = await postSubaccountApi(req);
      assert.equal(res.status, 403);
      const data = await res.json();
      assert.match(data.error, /Anti-Hijack Lock/);
    });

    it("POST /api/paystack/initialize strictly enforces CPA Section 49 disclosure consent", async () => {
      // Checkout without CPA s49 consent -> 400 Bad Request
      const unconsentedReq = new NextRequest(
        "http://localhost:3000/api/paystack/initialize",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: "thursday-fives-sandton",
            buyerName: "Lungi Ngidi",
            buyerWhatsapp: "+27821234567",
            spotsCount: 1,
            cpaS49Accepted: false,
          }),
        }
      );
      const unconsentedRes = await postPaystackInitApi(unconsentedReq);
      assert.equal(unconsentedRes.status, 400);
      const data = await unconsentedRes.json();
      assert.match(data.error, /CPA Section 49/);
    });

    it("prevents unpaid (pending) or cross-event order references from unlocking secret_location_pin", async () => {
      const unpaidRef = `PT_UNPAID_PIN_TEST_${Date.now()}`;
      await createOrder({
        event_id: "evt-1",
        profile_id: "prof-tariq",
        buyer_name: "Unpaid Snooper",
        buyer_whatsapp: "27820001111",
        buyer_email: "wa_27820001111@rsvp.pullthru.co.za",
        is_synthetic_email: true,
        spots_count: 1,
        plus_one_names: [],
        tier_id: null,
        tier_label: null,
        base_price_cents: 10000,
        platform_fee_cents: 700,
        total_charged_cents: 10700,
        paystack_reference: unpaidRef,
        payment_channel: "capitec_pay",
        settled_to_host: false,
        cpa_s49_accepted: true,
        status: "pending",
      });

      const snooperReq = new NextRequest(
        `http://localhost:3000/api/events?slug=thursday-fives-sandton&ref=${unpaidRef}`
      );
      const snooperRes = await getEventsApi(snooperReq);
      const snooperData = await snooperRes.json();
      assert.equal(
        snooperData.event.secret_location_pin,
        null,
        "Unpaid pending order ref must NEVER unlock secret_location_pin"
      );

      // Mark order paid on evt-1, then try to use it on evt-2 (bokke-test-spitbraai)
      await markOrderPaidAndCreateRsvp(unpaidRef, { payment_channel: "capitec_pay" });
      const crossEventReq = new NextRequest(
        `http://localhost:3000/api/events?slug=bokke-test-spitbraai&ref=${unpaidRef}`
      );
      const crossEventRes = await getEventsApi(crossEventReq);
      const crossEventData = await crossEventRes.json();
      assert.equal(
        crossEventData.event.secret_location_pin,
        null,
        "Paid ref from Event A must NEVER unlock secret_location_pin on Event B"
      );
    });

    it("blocks free-RSVP bypass on paid tiers and zeroes spoofed amount_contributed_zar on unpaid statuses", async () => {
      // 1. Omitting tier_label on a tiered event -> 400
      const omitTierReq = new NextRequest("http://localhost:3000/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: "bokke-test-spitbraai",
          guest_name: "Free Loader",
          status: "going_free",
          spots_locked: 1,
        }),
      });
      const omitTierRes = await postRsvpApi(omitTierReq);
      assert.equal(omitTierRes.status, 400);

      // 2. Spoofing amount_contributed_zar on payday_promise -> forced to 0
      const promiseReq = new NextRequest("http://localhost:3000/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: "mrs-dlamini-baby-shower",
          guest_name: "Pledge Guest",
          status: "payday_promise",
          spots_locked: 1,
          amount_contributed_zar: 999999,
        }),
      });
      const promiseRes = await postRsvpApi(promiseReq);
      assert.equal(promiseRes.status, 201);
      const promiseData = await promiseRes.json();
      assert.equal(
        promiseData.rsvp.amount_contributed_zar,
        0,
        "Unpaid payday_promise must record 0 contributed ZAR until settled"
      );
    });

    it("POST /api/paystack/webhook enforces HMAC-SHA512 signature verification and marks valid orders paid", async () => {
      const prevSecret = process.env.PAYSTACK_SECRET_KEY;
      const testSecret = "sk_test_pullthru_webhook_hmac_key_999";
      process.env.PAYSTACK_SECRET_KEY = testSecret;

      try {
        const webhookRef = `PT_WEBHOOK_HMAC_${Date.now()}`;
        await createOrder({
          event_id: "evt-3",
          profile_id: "prof-mbali",
          buyer_name: "Siya Kolisi",
          buyer_whatsapp: "27825550199",
          buyer_email: "wa_27825550199@rsvp.pullthru.co.za",
          is_synthetic_email: true,
          spots_count: 1,
          plus_one_names: [],
          tier_id: null,
          tier_label: null,
          base_price_cents: 20000,
          platform_fee_cents: 1200,
          total_charged_cents: 21200,
          paystack_reference: webhookRef,
          payment_channel: "capitec_pay",
          settled_to_host: false,
          cpa_s49_accepted: true,
          status: "pending",
        });

        const payloadString = JSON.stringify({
          event: "charge.success",
          data: {
            reference: webhookRef,
            channel: "eft",
            metadata: {
              comment: "Congrats on the baby shower!",
              badge_label: "🍼 Baby Shower Blessing",
            },
          },
        });

        // 1. Missing signature -> 401
        const noSigReq = new NextRequest("http://localhost:3000/api/paystack/webhook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payloadString,
        });
        const noSigRes = await postPaystackWebhookApi(noSigReq);
        assert.equal(noSigRes.status, 401);

        // 2. Forged signature -> 401
        const badSigReq = new NextRequest("http://localhost:3000/api/paystack/webhook", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-paystack-signature": "deadbeef1234567890",
          },
          body: payloadString,
        });
        const badSigRes = await postPaystackWebhookApi(badSigReq);
        assert.equal(badSigRes.status, 401);

        // 3. Valid HMAC-SHA512 signature -> 200 OK & order marked paid
        const validSignature = crypto
          .createHmac("sha512", testSecret)
          .update(payloadString)
          .digest("hex");

        const validSigReq = new NextRequest("http://localhost:3000/api/paystack/webhook", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-paystack-signature": validSignature,
          },
          body: payloadString,
        });
        const validSigRes = await postPaystackWebhookApi(validSigReq);
        assert.equal(validSigRes.status, 200);
        const validSigData = await validSigRes.json();
        assert.equal(validSigData.received, true);
        assert.equal(validSigData.status, "settled_and_locked");
        assert.ok(validSigData.rsvp_id);
      } finally {
        if (prevSecret === undefined) {
          delete process.env.PAYSTACK_SECRET_KEY;
        } else {
          process.env.PAYSTACK_SECRET_KEY = prevSecret;
        }
      }
    });

    it("POST /api/rsvp strips host_secret_token, masks secret_location_pin on payday_promise, and rejects invalid status", async () => {
      // 1. Rejects invalid status "locked_paid" on direct /api/rsvp route -> 400
      const spoofPaidReq = new NextRequest("http://localhost:3000/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: "thursday-fives-sandton",
          guest_name: "Spoof Paid Guest",
          status: "locked_paid",
          spots_locked: 1,
        }),
      });
      const spoofPaidRes = await postRsvpApi(spoofPaidReq);
      assert.equal(spoofPaidRes.status, 400);

      // 2. Payday promise response never leaks host_secret_token or secret_location_pin
      const pledgeReq = new NextRequest("http://localhost:3000/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: "bokke-test-spitbraai",
          guest_name: "Mandla (Payday 25th Promise)",
          status: "payday_promise",
          tier_id: "t1",
          spots_locked: 1,
        }),
      });
      const pledgeRes = await postRsvpApi(pledgeReq);
      assert.equal(pledgeRes.status, 201);
      const pledgeData = await pledgeRes.json();
      assert.equal(
        pledgeData.event.host_secret_token,
        undefined,
        "POST /api/rsvp must NEVER leak host_secret_token in updatedEvent"
      );
      assert.equal(
        pledgeData.event.secret_location_pin,
        null,
        "Unpaid payday_promise must NEVER unlock secret_location_pin in POST /api/rsvp response"
      );
    });

    it("Upgrades a Payday 25th Promise in-place via settlingRsvpId, preserving rsvp.id, plus_one_names, and updating bring_items", async () => {
      // 1. Create a payday_promise RSVP with +1s and a claimed bring item on mrs-dlamini-baby-shower
      const createPledge = await createDirectRsvp({
        order_id: null,
        event_id: "evt-3",
        guest_name: "Bongani N (Payday 25th Promise)",
        plus_one_names: ["Lerato N"],
        spots_locked: 2,
        tier_label: null,
        amount_contributed_zar: 0,
        status: "payday_promise",
        payment_channel: "capitec_pay",
        badge_label: "🗓️ Payday Pledge (Standby)",
        comment: "Pledged for the 25th!",
        claimed_item_id: "bs3",
        claimed_item_label: null,
        custom_answer: "No nuts please",
        is_anonymous_on_wall: false,
      });

      const pledgeId = createPledge.rsvp.id;
      const oldSwapToken = createPledge.rsvp.swap_token;

      // 2. Reject invalid settlingRsvpId (e.g., already locked_paid rsvp-p1) in /api/paystack/initialize -> 400
      const invalidSettleReq = new NextRequest(
        "http://localhost:3000/api/paystack/initialize",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: "mrs-dlamini-baby-shower",
            buyerName: "Attacker",
            buyerWhatsapp: "0821234567",
            customAmountZar: 150,
            cpaS49Accepted: true,
            settlingRsvpId: "rsvp-p1",
          }),
        }
      );
      const invalidSettleRes = await postPaystackInitApi(invalidSettleReq);
      assert.equal(invalidSettleRes.status, 400);

      // 3. Valid settlement via /api/paystack/initialize with settlingRsvpId = pledgeId
      const validSettleReq = new NextRequest(
        "http://localhost:3000/api/paystack/initialize",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: "mrs-dlamini-baby-shower",
            buyerName: "Bongani N",
            buyerWhatsapp: "0821234567",
            customAmountZar: 250,
            spotsCount: 2,
            claimedItemId: "bs3",
            cpaS49Accepted: true,
            settlingRsvpId: pledgeId,
          }),
        }
      );
      const validSettleRes = await postPaystackInitApi(validSettleReq);
      assert.equal(validSettleRes.status, 200);
      const validSettleData = await validSettleRes.json();
      assert.equal(validSettleData.order.status, "pending");
      assert.equal(validSettleData.rsvp, null);

      const settledWebhookResult = await markOrderPaidAndCreateRsvp(
        validSettleData.reference,
        validSettleData.paystackPayload.metadata
      );
      assert.ok(settledWebhookResult);
      assert.equal(
        settledWebhookResult.rsvp.id,
        pledgeId,
        "Settled Payday Promise must upgrade the existing RSVP in-place (preserving rsvp.id)"
      );
      assert.equal(settledWebhookResult.rsvp.status, "locked_paid");
      assert.equal(settledWebhookResult.rsvp.guest_name, "Bongani N (+1: Lerato N)");
      assert.deepEqual(settledWebhookResult.rsvp.plus_one_names, ["Lerato N"]);
      assert.notEqual(
        settledWebhookResult.rsvp.swap_token,
        oldSwapToken,
        "Settled Payday Promise must rotate swap_token"
      );

      // Verify bring_item claimed_by_name updated to clean buyer name "Bongani N"
      const updatedShower = await getEventBySlug("mrs-dlamini-baby-shower");
      assert.ok(updatedShower);
      const claimedRose = updatedShower.event.bring_items.find(
        (b) => b.id === "bs3"
      );
      assert.equal(claimedRose?.claimed_by_name, "Bongani N");
    });

    it("Enforces POPIA wall masking on GET /api/events (hide_amounts_on_wall, is_anonymous_on_wall, custom_answer, and bring_items)", async () => {
      // Create an anonymous RSVP claiming item sb4 on bokke-test-spitbraai and another on mrs-dlamini-baby-shower (which has hide_amounts_on_wall = true)
      await createDirectRsvp({
        order_id: null,
        event_id: "evt-2",
        guest_name: "Secret Donor",
        plus_one_names: ["Secret Partner"],
        spots_locked: 1,
        tier_label: "🥩 Full Lamb Spitbraai + Cooler Box Dop",
        amount_contributed_zar: 220,
        status: "cash_logged",
        payment_channel: "cash_manual",
        badge_label: "🔥 Braai Legend",
        comment: "Secret speaker sponsor!",
        claimed_item_id: "sb4",
        claimed_item_label: null,
        custom_answer: "Private Host Allergy Note",
        is_anonymous_on_wall: true,
      });

      const pubReq = new NextRequest(
        "http://localhost:3000/api/events?slug=mrs-dlamini-baby-shower"
      );
      const pubRes = await getEventsApi(pubReq);
      assert.equal(pubRes.status, 200);
      const pubData = await pubRes.json();

      // 1. Every RSVP on a hide_amounts_on_wall event has amount_contributed_zar masked to 0 for public callers
      for (const r of pubData.rsvps) {
        assert.equal(
          r.amount_contributed_zar,
          0,
          "hide_amounts_on_wall must mask individual amount_contributed_zar to 0 on public GET"
        );
        assert.equal(
          r.custom_answer,
          null,
          "custom_answer must be masked to null for public GET callers"
        );
      }

      // 2. Anonymous RSVP guest_name and bring_item claimed_by_name are masked to "🔒 Anonymous Legend"
      const braaiPubReq = new NextRequest(
        "http://localhost:3000/api/events?slug=bokke-test-spitbraai"
      );
      const braaiPubRes = await getEventsApi(braaiPubReq);
      const braaiPubData = await braaiPubRes.json();
      const anonRsvps = braaiPubData.rsvps.filter(
        (r: { is_anonymous_on_wall: boolean }) => r.is_anonymous_on_wall
      );
      assert.ok(anonRsvps.length >= 1);
      for (const ar of anonRsvps) {
        assert.equal(ar.guest_name, "🔒 Anonymous Legend");
        assert.deepEqual(ar.plus_one_names, []);
      }

      const itemSb4 = braaiPubData.event.bring_items.find(
        (b: { id: string }) => b.id === "sb4"
      );
      assert.equal(
        itemSb4?.claimed_by_name,
        "🔒 Anonymous Legend",
        "bring_items claimed by an anonymous RSVP must mask claimed_by_name on public GET"
      );
    });

    it("Enforces per-tier max_spots capacity (409 Conflict), POST /api/events validation, and underscore/zero-width compliance blocklist", async () => {
      // 1. Underscore and zero-width char evasion blocked by compliance filter
      const underscoreEvasion = validateEventCompliance("saturday_raffle_2026");
      assert.equal(underscoreEvasion.compliant, false);
      const zwspEvasion = validateEventCompliance("F\u200BPL Season Buy-In");
      assert.equal(zwspEvasion.compliant, false);

      // 2. POST /api/events creates a tiered event with per-tier max_spots: 1
      const createEvtReq = new NextRequest("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Cape Town Padel Mixer",
          mode: "tiered",
          max_spots: 10,
          tiers: [
            { id: "t-vip", label: "VIP Court Pass", price_zar: 150, max_spots: 1 },
            { id: "t-social", label: "Social Spectator", price_zar: 0, max_spots: 1 },
          ],
          host_name: "Lukhanyo M",
          host_phone: "0821234567",
          host_bank_code: "470010",
          account_number: "1648291045",
          mandate_accepted: true,
        }),
      });
      const createEvtRes = await postEventsApi(createEvtReq);
      assert.equal(createEvtRes.status, 201);
      const createdEvtData = await createEvtRes.json();
      const mixerSlug = createdEvtData.event.slug;

      // 3. First Social Spectator (max_spots: 1) succeeds (201)
      const spec1Req = new NextRequest("http://localhost:3000/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: mixerSlug,
          guest_name: "Spectator One",
          status: "going_free",
          tier_id: "t-social",
          spots_locked: 1,
        }),
      });
      const spec1Res = await postRsvpApi(spec1Req);
      assert.equal(spec1Res.status, 201);

      // 4. Second Social Spectator exceeds tier max_spots: 1 -> 409 Conflict
      const spec2Req = new NextRequest("http://localhost:3000/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: mixerSlug,
          guest_name: "Spectator Two",
          status: "going_free",
          tier_id: "t-social",
          spots_locked: 1,
        }),
      });
      const spec2Res = await postRsvpApi(spec2Req);
      assert.equal(spec2Res.status, 409);
      const spec2Data = await spec2Res.json();
      assert.match(spec2Data.error, /Tier "Social Spectator" only has 0 spot/);
    });

    it("rejects parameter pollution on GET /api/events (synthetic FREE_RSVP_ ref cannot unlock PIN or leak swapToken)", async () => {
      // Create a free event with a secret PIN
      const createReq = new NextRequest("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Secret Pin Protection Meet",
          mode: "free",
          secret_location_pin: "GATE_PIN_TOP_SECRET_4829",
          host_name: "Thabo Host",
          host_phone: "0829998877",
        }),
      });
      const createRes = await postEventsApi(createReq);
      assert.equal(createRes.status, 201);
      const createData = await createRes.json();
      const slug = createData.event.slug;

      // Legitimate guest RSVPs
      const rsvpReq = new NextRequest("http://localhost:3000/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          guest_name: "Honest Guest",
          status: "going_free",
          spots_locked: 1,
        }),
      });
      const rsvpRes = await postRsvpApi(rsvpReq);
      assert.equal(rsvpRes.status, 201);
      const rsvpData = await rsvpRes.json();
      const legitimateRsvpId = rsvpData.rsvp.id;
      const genuineSwapToken = rsvpData.rsvp.swap_token;

      // 1. Snooper attempts parameter pollution: ?rsvpId=legitimateRsvpId&ref=FREE_RSVP_legitimateRsvpId
      const attackReq = new NextRequest(
        `http://localhost:3000/api/events?slug=${slug}&rsvpId=${legitimateRsvpId}&ref=FREE_RSVP_${legitimateRsvpId}`
      );
      const attackRes = await getEventsApi(attackReq);
      assert.equal(attackRes.status, 200);
      const attackData = await attackRes.json();

      // PIN must remain locked
      assert.equal(
        attackData.event.secret_location_pin,
        null,
        "Parameter pollution must NOT unlock secret location pin"
      );

      // swap_token must NOT be leaked in the rsvps array
      const attackedRsvp = attackData.rsvps.find((r: { id: string }) => r.id === legitimateRsvpId);
      assert.equal(
        attackedRsvp.swap_token,
        undefined,
        "swap_token must NEVER be returned to unverified third party"
      );

      // 2. Legitimate owner with genuine swapToken CAN see the PIN and their own swap_token
      const ownerReq = new NextRequest(
        `http://localhost:3000/api/events?slug=${slug}&swapToken=${genuineSwapToken}`
      );
      const ownerRes = await getEventsApi(ownerReq);
      assert.equal(ownerRes.status, 200);
      const ownerData = await ownerRes.json();
      assert.equal(
        ownerData.event.secret_location_pin,
        "GATE_PIN_TOP_SECRET_4829",
        "Legitimate holder of swapToken must unlock secret location pin"
      );
      const ownerRsvp = ownerData.rsvps.find((r: { id: string }) => r.id === legitimateRsvpId);
      assert.equal(
        ownerRsvp.swap_token,
        genuineSwapToken,
        "Verified owner holding swapToken receives swap_token confirmation"
      );
    });

    it("POST /api/events strictly enforces mandate_accepted !== true rejection on paid events", async () => {
      // 1. Omitted mandate_accepted on paid event -> 400
      const omitReq = new NextRequest("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Omitted Mandate Paid Event",
          mode: "fixed",
          price_zar: 100,
          max_spots: 10,
          host_name: "Mandate Tester",
          host_phone: "0821234567",
          host_bank_code: "470010",
          account_number: "1648291045",
          // mandate_accepted is intentionally omitted
        }),
      });
      const omitRes = await postEventsApi(omitReq);
      assert.equal(omitRes.status, 400);
      const omitData = await omitRes.json();
      assert.match(omitData.error, /Mandate acceptance is required/);

      // 2. Explicit false mandate_accepted -> 400
      const falseReq = new NextRequest("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "False Mandate Paid Event",
          mode: "fixed",
          price_zar: 100,
          max_spots: 10,
          host_name: "Mandate Tester",
          host_phone: "0821234567",
          host_bank_code: "470010",
          account_number: "1648291045",
          mandate_accepted: false,
        }),
      });
      const falseRes = await postEventsApi(falseReq);
      assert.equal(falseRes.status, 400);
    });

    it("determineSettlementSchedule forces manual post-event settlement for uncapped paid events", () => {
      // Capped event <= R3,000 -> "auto"
      const cappedAuto = determineSettlementSchedule({
        mode: "fixed",
        priceZar: 100,
        maxSpots: 10, // R1,000 total pool
      });
      assert.equal(cappedAuto.schedule, "auto");

      // Uncapped paid event (maxSpots: null) -> MUST be "manual"
      const uncappedManual = determineSettlementSchedule({
        mode: "fixed",
        priceZar: 100,
        maxSpots: null,
      });
      assert.equal(
        uncappedManual.schedule,
        "manual",
        "Uncapped paid event must require post-event manual settlement"
      );
      assert.match(uncappedManual.explanation, /Uncapped guest limit/);
    });

    it("POST /api/paystack/webhook rejects currency tampering (non-ZAR), underpaid amounts, and handles unknown refs", async () => {
      const secretKey = "sk_test_pullthru_webhook_hmac_key_999";
      process.env.PAYSTACK_SECRET_KEY = secretKey;
      try {
        const testRef = `PT_FRAUD_VECTORS_${Date.now()}`;
        await createOrder({
          event_id: "evt-1",
          profile_id: "prof-tariq",
          buyer_name: "Tamper Tester",
          buyer_whatsapp: "27821112233",
          buyer_email: "wa_27821112233@rsvp.pullthru.co.za",
          is_synthetic_email: true,
          spots_count: 1,
          plus_one_names: [],
          tier_id: null,
          tier_label: null,
          base_price_cents: 10000,
          platform_fee_cents: 700,
          total_charged_cents: 10700,
          paystack_reference: testRef,
          payment_channel: "capitec_pay",
          settled_to_host: false,
          cpa_s49_accepted: true,
          status: "pending",
        });

        // 1. Foreign currency tampering (USD) -> 400
        const foreignPayload = JSON.stringify({
          event: "charge.success",
          data: { reference: testRef, currency: "USD", amount: 10700, status: "success" },
        });
        const foreignSig = crypto.createHmac("sha512", secretKey).update(foreignPayload).digest("hex");
        const foreignReq = new NextRequest("http://localhost:3000/api/paystack/webhook", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-paystack-signature": foreignSig },
          body: foreignPayload,
        });
        const foreignRes = await postPaystackWebhookApi(foreignReq);
        assert.equal(foreignRes.status, 400);
        const foreignData = await foreignRes.json();
        assert.match(foreignData.error, /Webhook currency mismatch/);

        // 2. Underpaid amount tampering (500 cents instead of 10700 cents) -> 400
        const underpaidPayload = JSON.stringify({
          event: "charge.success",
          data: { reference: testRef, currency: "ZAR", amount: 500, status: "success" },
        });
        const underpaidSig = crypto.createHmac("sha512", secretKey).update(underpaidPayload).digest("hex");
        const underpaidReq = new NextRequest("http://localhost:3000/api/paystack/webhook", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-paystack-signature": underpaidSig },
          body: underpaidPayload,
        });
        const underpaidRes = await postPaystackWebhookApi(underpaidReq);
        assert.equal(underpaidRes.status, 400);
        const underpaidData = await underpaidRes.json();
        assert.match(underpaidData.error, /Webhook amount mismatch/);

        // 3. Unknown order reference -> 200 with order_not_found
        const unknownPayload = JSON.stringify({
          event: "charge.success",
          data: { reference: "PT_NON_EXISTENT_REF_9999", currency: "ZAR", amount: 10000, status: "success" },
        });
        const unknownSig = crypto.createHmac("sha512", secretKey).update(unknownPayload).digest("hex");
        const unknownReq = new NextRequest("http://localhost:3000/api/paystack/webhook", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-paystack-signature": unknownSig },
          body: unknownPayload,
        });
        const unknownRes = await postPaystackWebhookApi(unknownReq);
        assert.equal(unknownRes.status, 200);
        const unknownData = await unknownRes.json();
        assert.equal(unknownData.status, "order_not_found");
      } finally {
        delete process.env.PAYSTACK_SECRET_KEY;
      }
    });

    it("validateSaBankAccount rejects sequential dummy accounts and accepts Standard Bank, Absa, and formatted input", () => {
      // Sequential dummy accounts rejected
      assert.equal(validateSaBankAccount("470010", "1234567890").valid, false);
      assert.equal(validateSaBankAccount("250655", "9876543210").valid, false);
      assert.equal(validateSaBankAccount("470010", "0123456789").valid, false);

      // Repeating digits rejected
      assert.equal(validateSaBankAccount("470010", "1111111111").valid, false);

      // Valid Standard Bank (051001) & Absa (632005)
      assert.equal(validateSaBankAccount("051001", "0012398471").valid, true);
      assert.equal(validateSaBankAccount("632005", "4092837465").valid, true);

      // Formatted account number with spaces and dashes stripped cleanly
      const formattedCheck = validateSaBankAccount("470010", "164-829 1045");
      assert.equal(formattedCheck.valid, true);
      assert.equal(formattedCheck.last4, "1045");
    });

    it("swapRsvpSpot releases claimed Bring-'n-Bak item when unclaimItem is true", async () => {
      // Create a fresh event with an unclaimed bring item
      const createEvt = await createEvent({
        profile_id: "prof-tariq",
        host_name: "Braai Host",
        host_phone: "+27821112222",
        slug: `unclaim-test-${Date.now()}`,
        mode: "free",
        title: "Bring and Braai Unclaim Test",
        bring_items: [{ id: "bi-unclaim-1", label: "6x Bags of Party Ice" }],
      });

      // Guest RSVPs and claims the item
      const created = await createDirectRsvp({
        order_id: null,
        event_id: createEvt.id,
        guest_name: "Ice Bringer",
        spots_locked: 1,
        plus_one_names: [],
        amount_contributed_zar: 0,
        tier_label: null,
        status: "going_free",
        payment_channel: "capitec_pay",
        badge_label: "🧊 Ice Carrier",
        comment: "Got the ice!",
        claimed_item_id: "bi-unclaim-1",
        claimed_item_label: "6x Bags of Party Ice",
        custom_answer: null,
        is_anonymous_on_wall: false,
      });

      assert.ok(created.rsvp.swap_token);
      assert.equal(created.rsvp.claimed_item_id, "bi-unclaim-1");

      // Swap the spot with unclaimItem: true -> item is released back to the event pool
      const swapResult = await swapRsvpSpot({
        slug: createEvt.slug,
        swapToken: created.rsvp.swap_token,
        newGuestName: "Replacement Guest",
        unclaimItem: true,
      });
      assert.ok(swapResult);
      assert.equal(swapResult.claimed_item_id, null);
      assert.equal(swapResult.claimed_item_label, null);

      // Verify the item is now unclaimed on the event
      const eventAfterSwap = await getEventBySlug(createEvt.slug);
      const unclaimedItem = eventAfterSwap?.event.bring_items.find((b: BringItem) => b.id === "bi-unclaim-1");
      assert.equal(unclaimedItem?.claimed_by_name, null);
    });

    it("records payday_preauthorized flag and sets guaranteed badge on Payday Pre-Auth RSVP", async () => {
      const evt = await createEvent({
        profile_id: "prof-tariq",
        host_name: "Payday Host",
        host_phone: "+27821112222",
        slug: `payday-preauth-test-${Date.now()}`,
        mode: "fixed",
        price_zar: 250,
        title: "Payday Pre-Auth Test",
        allow_payday_promise: true,
      });

      const req = new NextRequest("http://localhost:3000/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: evt.slug,
          guest_name: "Preauth Player",
          spots_locked: 1,
          status: "payday_promise",
          payday_preauthorized: true,
        }),
      });

      const res = await postRsvpApi(req);
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.rsvp.payday_preauthorized, true);
      assert.equal(data.rsvp.badge_label, "🔒 Payday Pre-Authorized");
      assert.equal(data.rsvp.status, "payday_promise");
    });

    it("creates event with venue escrow deposit and facility bank details", async () => {
      const slug = `venue-escrow-test-${Date.now()}`;
      const req = new NextRequest("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host_name: "Escrow Host",
          host_phone: "0821234567",
          title: "Sandton Padel Tournament",
          mode: "fixed",
          price_zar: 350,
          category_vibe: "🎾 Padel",
          description: "Padel tourney with direct facility escrow",
          event_date: "2026-11-20T10:00:00.000Z",
          mandate_accepted: true,
          venue_name: "Sandton Action Arena",
          venue_deposit_zar: 1500,
          venue_bank_name: "First National Bank (FNB)",
          venue_account_number_last4: "4321",
        }),
      });

      const res = await postEventsApi(req);
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.event.venue_name, "Sandton Action Arena");
      assert.equal(data.event.venue_deposit_zar, 1500);
      assert.equal(data.event.venue_bank_name, "First National Bank (FNB)");
      assert.equal(data.event.venue_account_number_last4, "4321");
    });

    it("parses WhatsApp 1-line command and creates live event with WhatsApp reply", async () => {
      // Test command parser
      const parsed = parseWhatsAppCommand("/pullthru 5aside R100 12spots");
      assert.ok(parsed);
      assert.equal(parsed.price_zar, 100);
      assert.equal(parsed.max_spots, 12);
      assert.equal(parsed.category_vibe, "⚽ 5-a-Side Soccer");

      // Test WhatsApp API route
      const req = new NextRequest("http://localhost:3000/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "/pullthru padel R250 8spots",
          from: "+27829998888",
          name: "Coach Kagiso",
        }),
      });

      const res = await postWhatsAppApi(req);
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.event.price_zar, 250);
      assert.equal(data.event.max_spots, 8);
      assert.ok(data.whatsapp_reply.includes("PullThru Event Ready in 1s!"));
      assert.ok(data.whatsapp_reply.includes(data.guest_url));
    });

    it("generates dynamic WhatsApp OpenGraph metadata with PNG raster preview and provisions link_bank cleanly", async () => {
      const meta = await generateEventMetadata({
        params: Promise.resolve({ slug: "thursday-fives-sandton" }),
      });
      assert.ok(String(meta.title).includes("Thursday Night 5-a-Side"));
      assert.ok(String(meta.openGraph?.title).includes("Spots Locked"));
      assert.ok(String(meta.openGraph?.title).includes("R100"));
      const ogImages = meta.openGraph?.images as Array<{ url: string; type?: string }>;
      assert.ok(Array.isArray(ogImages) && ogImages.length > 0);
      assert.equal(ogImages[0].url, "/feature-graphic.png");
      assert.equal(ogImages[0].type, "image/png");

      // Test PATCH /api/events link_bank on a newly created unpaid event
      const created = await createEvent({
        title: "Bank Link Test Match",
        host_name: "Coach Benni",
        host_phone: "+27821239876",
        mode: "fixed",
        price_zar: 100,
        max_spots: 10,
      });

      const linkReq = new NextRequest("http://localhost:3000/api/events", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-host-token": created.host_secret_token!,
        },
        body: JSON.stringify({
          slug: created.slug,
          action: "link_bank",
          bank_code: "470010",
          account_number: "1648291045",
        }),
      });
      const linkRes = await patchEventsApi(linkReq);
      assert.equal(linkRes.status, 200);
      const linkData = await linkRes.json();
      assert.ok(linkData.paystack_subaccount_code);
      assert.match(linkData.host_bank_name, /Capitec/);
    });

    it("enforces Customer Protection Suite: blocks standalone R0 tier gate-pin leaks, unpaid pledge swaps, double-dip refunds, and supports pass recovery & crowd-freeze", async () => {
      // 1. Standalone R0 tier ("🧒 Laaities / Kids Under 12 (Mahala)") on paid tiered event must NOT unlock secret_location_pin
      const r0Req = new NextRequest("http://localhost:3000/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: "bokke-test-spitbraai",
          guest_name: "Gate Crasher",
          tier_label: "🧒 Laaities / Kids Under 12 (Mahala)",
          status: "going_free",
          spots_locked: 1,
        }),
      });
      const r0Res = await postRsvpApi(r0Req);
      assert.equal(r0Res.status, 201);
      const r0Data = await r0Res.json();
      assert.equal(
        r0Data.event.secret_location_pin,
        null,
        "Standalone R0 tier on a paid tiered event must not leak estate gate code"
      );

      // 2. Unpaid payday_promise RSVP must NOT be swappable via swapRsvpSpot
      const pledgeRes = await createDirectRsvp({
        order_id: null,
        event_id: "evt-1",
        guest_name: "Unpaid Pledger",
        spots_locked: 1,
        plus_one_names: [],
        amount_contributed_zar: 0,
        tier_label: null,
        status: "payday_promise",
        payment_channel: "capitec_pay",
        badge_label: "🗓️ Payday Pledge (Standby)",
        comment: "Will pay on the 25th",
        claimed_item_id: null,
        claimed_item_label: null,
        custom_answer: null,
        is_anonymous_on_wall: false,
      });
      const illegalSwap = await swapRsvpSpot({
        slug: "thursday-fives-sandton",
        swapToken: pledgeRes.rsvp.swap_token,
        newGuestName: "Unsuspecting Buyer",
      });
      assert.equal(
        illegalSwap,
        null,
        "Unpaid payday_promise standby pledge must never be swappable/resellable"
      );

      // 3. POST /api/events automatically assigns settlement_schedule: "manual" when max_spots * price_zar > R3,000
      const createManualReq = new NextRequest("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host_name: "Manual Escrow Host",
          host_phone: "+27821113333",
          title: "Escrow Hold Test Event",
          mode: "fixed",
          price_zar: 500,
          max_spots: 20, // 20 * R500 = R10,000 > R3,000 -> auto-assigned "manual"
          category_vibe: "🥩 Braai & Potjie",
          event_date: "Saturday, 14 Nov • 14:00 SAST",
          location_name: "Centurion Lapa",
          mandate_accepted: true,
        }),
      });
      const createManualRes = await postEventsApi(createManualReq);
      assert.equal(createManualRes.status, 201);
      const createManualData = await createManualRes.json();
      const manualEvt = createManualData.event;
      assert.equal(
        manualEvt.settlement_schedule,
        "manual",
        "POST /api/events must auto-assign manual settlement when pool > R3,000"
      );

      const paidRef = `PT_SWAP_REFUND_GUARD_${Date.now()}`;
      await createOrder({
        event_id: manualEvt.id,
        profile_id: manualEvt.profile_id,
        buyer_name: "Original Paid Player",
        buyer_whatsapp: "27827778888",
        buyer_email: "wa_27827778888@rsvp.pullthru.co.za",
        is_synthetic_email: true,
        spots_count: 1,
        plus_one_names: [],
        tier_id: null,
        tier_label: null,
        base_price_cents: 50000,
        platform_fee_cents: 2200,
        total_charged_cents: 52200,
        paystack_reference: paidRef,
        payment_channel: "capitec_pay",
        settled_to_host: false,
        cpa_s49_accepted: true,
        status: "pending",
      });
      const paidMarked = await markOrderPaidAndCreateRsvp(paidRef, {
        payment_channel: "capitec_pay",
      });
      assert.ok(paidMarked);
      assert.equal(
        paidMarked.order.settled_to_host,
        false,
        "Manual escrow events must keep settled_to_host=false until actual post-event payout"
      );

      // Self-serve pass recovery by WhatsApp number unlocks pass & gate_pin but masks secret swap_token & phone PII
      const recoverReq = new NextRequest("http://localhost:3000/api/rsvp", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "recover_pass",
          slug: manualEvt.slug,
          whatsappNumber: "082 777 8888",
        }),
      });
      const recoverRes = await patchRsvpApi(recoverReq);
      assert.equal(recoverRes.status, 200);
      const recoverData = await recoverRes.json();
      assert.equal(recoverData.rsvp.id, paidMarked.rsvp.id);
      assert.equal(
        recoverData.rsvp.swap_token,
        "",
        "recover_pass must never leak swap_token to phone-only lookups"
      );
      assert.ok(recoverData.rsvp.gate_pin);
      assert.equal(recoverData.order.buyer_whatsapp, "***8888");

      // Bare ref without swapToken must be rejected on guest-initiated refund (H10)
      const bareRefRefundReq = new NextRequest("http://localhost:3000/api/rsvp", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request_refund",
          slug: manualEvt.slug,
          ref: paidRef,
          reason: "Attacker with bare ref trying to refund",
        }),
      });
      const bareRefRefundRes = await patchRsvpApi(bareRefRefundReq);
      assert.equal(bareRefRefundRes.status, 403);

      // Now swap the spot to a friend
      const swappedRsvp = await swapRsvpSpot({
        slug: manualEvt.slug,
        swapToken: paidMarked.rsvp.swap_token,
        newGuestName: "Replacement Friend",
      });
      assert.ok(swappedRsvp);
      assert.ok(swappedRsvp.swapped_at);

      // Attempt double-dip refund after swapping -> 400 Bad Request
      const doubleDipReq = new NextRequest("http://localhost:3000/api/rsvp", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request_refund",
          slug: manualEvt.slug,
          rsvpId: swappedRsvp.id,
          swapToken: swappedRsvp.swap_token,
          reason: "Trying to get refund after already selling my spot",
        }),
      });
      const doubleDipRes = await patchRsvpApi(doubleDipReq);
      assert.equal(doubleDipRes.status, 400);
      const doubleDipData = await doubleDipRes.json();
      assert.match(doubleDipData.error, /Double-Dip Protection/);

      // 4. Test Sybil-resistant crowd-freeze (report_dispute across 2 verified paid orders >= 25% of pool)
      const paidRef2 = `PT_DISPUTE_2_${Date.now()}`;
      await createOrder({
        event_id: manualEvt.id,
        profile_id: manualEvt.profile_id,
        buyer_name: "Paid Player 2",
        buyer_whatsapp: "27829990002",
        buyer_email: "wa_27829990002@rsvp.pullthru.co.za",
        is_synthetic_email: true,
        spots_count: 1,
        plus_one_names: [],
        tier_id: null,
        tier_label: null,
        base_price_cents: 50000,
        platform_fee_cents: 2200,
        total_charged_cents: 52200,
        paystack_reference: paidRef2,
        payment_channel: "capitec_pay",
        settled_to_host: false,
        cpa_s49_accepted: true,
        status: "pending",
      });
      const paid2 = await markOrderPaidAndCreateRsvp(paidRef2, {
        payment_channel: "capitec_pay",
      });

      const paidRef3 = `PT_DISPUTE_3_${Date.now()}`;
      await createOrder({
        event_id: manualEvt.id,
        profile_id: manualEvt.profile_id,
        buyer_name: "Paid Player 3",
        buyer_whatsapp: "27829990003",
        buyer_email: "wa_27829990003@rsvp.pullthru.co.za",
        is_synthetic_email: true,
        spots_count: 1,
        plus_one_names: [],
        tier_id: null,
        tier_label: null,
        base_price_cents: 50000,
        platform_fee_cents: 2200,
        total_charged_cents: 52200,
        paystack_reference: paidRef3,
        payment_channel: "capitec_pay",
        settled_to_host: false,
        cpa_s49_accepted: true,
        status: "pending",
      });
      const paid3 = await markOrderPaidAndCreateRsvp(paidRef3, {
        payment_channel: "capitec_pay",
      });

      // Dispute 1 alone does not freeze the pool
      const disp1Res = await patchRsvpApi(
        new NextRequest("http://localhost:3000/api/rsvp", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "report_dispute",
            slug: manualEvt.slug,
            swapToken: paid2!.rsvp.swap_token,
            reason: "Host not at venue",
          }),
        })
      );
      assert.equal(disp1Res.status, 200);
      const disp1Data = await disp1Res.json();
      assert.equal(disp1Data.payout_frozen, false);

      // Dispute 2 (2 paid orders = R1,000 / R1,500 = 66.7% >= 25% of pool) freezes the host payout!
      const disp2Res = await patchRsvpApi(
        new NextRequest("http://localhost:3000/api/rsvp", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "report_dispute",
            slug: manualEvt.slug,
            swapToken: paid3!.rsvp.swap_token,
            reason: "Turf locked, host unreachable",
          }),
        })
      );
      assert.equal(disp2Res.status, 200);
      const disp2Data = await disp2Res.json();
      assert.equal(disp2Data.payout_frozen, true);
    });

    it("verifies Direct PayShap / Capitec PayMe POP slips (verify_direct_pop) and blocks duplicate SHA-256 POP hashes (409 Conflict)", async () => {
      const popEvt = await createEvent({
        title: "Saturday Rugby Braai Direct PayShap",
        mode: "fixed",
        price_zar: 152,
        max_spots: 12,
        host_phone: "0825551234",
        secret_location_pin: "Estate Gate #9921",
        capitec_payme_url: "https://payme.capitecbank.co.za/sipho",
        bake_pro_boost_into_price: true,
        is_pro_boosted: true,
      });

      const uniquePopHash = `pop_file_sha256_${Date.now()}_abcdef123456`;

      // 1. Valid Direct POP submission locks spot & unlocks secret gate pin
      const popRes1 = await postRsvpApi(
        new NextRequest("http://localhost:3000/api/rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "verify_direct_pop",
            slug: popEvt.slug,
            guest_name: "Thabo Mokoena",
            spots_locked: 1,
            amount_contributed_zar: 152,
            pop_hash: uniquePopHash,
            pop_rail_badge: "capitec_payme",
          }),
        })
      );
      assert.equal(popRes1.status, 201);
      const popData1 = await popRes1.json();
      assert.equal(popData1.rsvp.status, "locked_paid");
      assert.equal(popData1.rsvp.pop_hash, uniquePopHash);
      assert.equal(popData1.rsvp.pop_rail_badge, "capitec_payme");
      assert.equal(popData1.event.secret_location_pin, "Estate Gate #9921");

      // 2. Duplicate POP hash submission by a chancer is blocked with 409 Conflict
      const popRes2 = await postRsvpApi(
        new NextRequest("http://localhost:3000/api/rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "verify_direct_pop",
            slug: popEvt.slug,
            guest_name: "Chancer Guest",
            spots_locked: 1,
            amount_contributed_zar: 152,
            pop_hash: uniquePopHash,
            pop_rail_badge: "instant_payshap",
          }),
        })
      );
      assert.equal(popRes2.status, 409);
      const popData2 = await popRes2.json();
      assert.match(popData2.error, /Chancer Alert/i);

      // 3. Demo POP slip is blocked on real user-created events (400 Bad Request)
      const demoPopAttempt = await postRsvpApi(
        new NextRequest("http://localhost:3000/api/rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "verify_direct_pop",
            slug: popEvt.slug,
            guest_name: "Demo Troll",
            spots_locked: 1,
            amount_contributed_zar: 152,
            pop_hash: `demo_pop_${Date.now()}`,
            pop_rail_badge: "instant_payshap",
          }),
        })
      );
      assert.equal(demoPopAttempt.status, 400);

      // 4. Nonsense Bank SMS ("hello12345") is rejected with 400 Bad Request
      const fakeSmsAttempt = await postRsvpApi(
        new NextRequest("http://localhost:3000/api/rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "verify_direct_pop",
            slug: popEvt.slug,
            guest_name: "SMS Troll",
            spots_locked: 1,
            amount_contributed_zar: 152,
            pop_hash: `pop_sms_${Date.now()}_fake`,
            pop_sms_text: "hello world 12345",
            pop_rail_badge: "instant_payshap",
          }),
        })
      );
      assert.equal(fakeSmsAttempt.status, 400);

      // 4b. Airtime purchase SMS is rejected as fraudulent (400 Bad Request)
      const airtimeAttempt = await postRsvpApi(
        new NextRequest("http://localhost:3000/api/rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "verify_direct_pop",
            slug: popEvt.slug,
            guest_name: "Airtime Troll",
            spots_locked: 1,
            amount_contributed_zar: 152,
            pop_hash: `pop_sms_${Date.now()}_airtime`,
            pop_sms_text: "Airtime purchase of R50.00 successful on 28/10. Avail R120.00.",
            pop_rail_badge: "instant_payshap",
          }),
        })
      );
      assert.equal(airtimeAttempt.status, 400);
      const airtimeJson = await airtimeAttempt.json();
      assert.match(airtimeJson.error, /airtime or mobile data/i);

      // 4c. ATM Cash withdrawal SMS is rejected as fraudulent (400 Bad Request)
      const atmAttempt = await postRsvpApi(
        new NextRequest("http://localhost:3000/api/rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "verify_direct_pop",
            slug: popEvt.slug,
            guest_name: "ATM Troll",
            spots_locked: 1,
            amount_contributed_zar: 152,
            pop_hash: `pop_sms_${Date.now()}_atm`,
            pop_sms_text: "Capitec: Cash withdrawal of R500.00 at Sandton City ATM. Avail R1,200.00.",
            pop_rail_badge: "capitec_payme",
          }),
        })
      );
      assert.equal(atmAttempt.status, 400);
      const atmJson = await atmAttempt.json();
      assert.match(atmJson.error, /cash or atm withdrawal/i);

      // 4d. Retail in-store card swipe SMS (Checkers) is rejected as fraudulent (400 Bad Request)
      const swipeAttempt = await postRsvpApi(
        new NextRequest("http://localhost:3000/api/rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "verify_direct_pop",
            slug: popEvt.slug,
            guest_name: "Checkers Troll",
            spots_locked: 1,
            amount_contributed_zar: 152,
            pop_hash: `pop_sms_${Date.now()}_swipe`,
            pop_sms_text: "FNB :-) R349.50 paid to Checkers Sandton. Avail Bal R1,200.00.",
            pop_rail_badge: "standard_eft",
          }),
        })
      );
      assert.equal(swipeAttempt.status, 400);
      const swipeJson = await swipeAttempt.json();
      assert.match(swipeJson.error, /retail store card swipe/i);

      // 4e. Underpaid SMS (R20 paid for R152 spot) is rejected with underpayment error (400 Bad Request)
      const underpaidAttempt = await postRsvpApi(
        new NextRequest("http://localhost:3000/api/rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "verify_direct_pop",
            slug: popEvt.slug,
            guest_name: "Underpaid Guest",
            spots_locked: 1,
            amount_contributed_zar: 152,
            pop_hash: `pop_sms_${Date.now()}_underpaid`,
            pop_sms_text: "Capitec: R20.00 paid to Tariq from savings. Ref PT-UNDER",
            pop_rail_badge: "capitec_payme",
          }),
        })
      );
      assert.equal(underpaidAttempt.status, 400);
      const underpaidJson = await underpaidAttempt.json();
      assert.match(underpaidJson.error, /underpaid amount/i);

      // 4f. Corrupted/empty uploaded file (< 1KB) is rejected (400 Bad Request)
      const corruptedFileAttempt = await postRsvpApi(
        new NextRequest("http://localhost:3000/api/rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "verify_direct_pop",
            slug: popEvt.slug,
            guest_name: "Empty File Troll",
            spots_locked: 1,
            amount_contributed_zar: 152,
            pop_hash: `pop_file_${Date.now()}_empty`,
            pop_file_name: "empty_slip.png",
            pop_file_size: 256,
            pop_rail_badge: "standard_eft",
          }),
        })
      );
      assert.equal(corruptedFileAttempt.status, 400);
      const emptyFileJson = await corruptedFileAttempt.json();
      assert.match(emptyFileJson.error, /empty or corrupted/i);

      // 4g. Authentic Standard Bank SMS is parsed, verified and accepted (201 Created)
      const stdBankAttempt = await postRsvpApi(
        new NextRequest("http://localhost:3000/api/rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "verify_direct_pop",
            slug: popEvt.slug,
            guest_name: "Stanbic Guest",
            spots_locked: 1,
            amount_contributed_zar: 152,
            pop_hash: `pop_sms_${Date.now()}_std`,
            pop_sms_text: "Standard Bank: Your payment of R152.00 to Tariq was successful. Ref: PT-STANBIC. Avail Bal: R3,410.00.",
            pop_rail_badge: "standard_eft",
          }),
        })
      );
      assert.equal(stdBankAttempt.status, 201);
      const stdBankJson = await stdBankAttempt.json();
      assert.equal(stdBankJson.rsvp.status, "locked_paid");
      assert.equal(stdBankJson.rsvp.amount_contributed_zar, 152);

      // 5. Direct P2P POP guest cannot trigger an Escrow Freeze (report_dispute -> 400)
      const escrowTrollAttempt = await patchRsvpApi(
        new NextRequest("http://localhost:3000/api/rsvp", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "report_dispute",
            slug: popEvt.slug,
            swapToken: popData1.rsvp.swap_token,
            reason: "Troll trying to freeze Direct P2P event",
          }),
        })
      );
      assert.equal(escrowTrollAttempt.status, 400);

      // 6. Host CAN remove a Direct POP entry if the money never landed in their bank account
      const removeFakePopRes = await patchRsvpApi(
        new NextRequest("http://localhost:3000/api/rsvp", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-host-token": popEvt.host_secret_token,
          },
          body: JSON.stringify({
            action: "moderate_rsvp",
            slug: popEvt.slug,
            rsvpId: popData1.rsvp.id,
            moderationAction: "remove_unpaid",
          }),
        })
      );
      assert.equal(removeFakePopRes.status, 200);

      // 7. Host can unlock R29 Pro Event Boost / R79/mo Club Pass via PATCH /api/events (action: unlock_pro_boost)
      const unlockProRes = await patchEventsApi(
        new NextRequest("http://localhost:3000/api/events", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-host-token": popEvt.host_secret_token,
          },
          body: JSON.stringify({
            slug: popEvt.slug,
            action: "unlock_pro_boost",
            pro_boost_reference: "PRO-BRAAI-PAID-R29",
          }),
        })
      );
      assert.equal(unlockProRes.status, 200);
      const unlockProData = await unlockProRes.json();
      assert.equal(unlockProData.is_pro_boosted, true);
      assert.equal(unlockProData.pro_boost_reference, "PRO-BRAAI-PAID-R29");

      // 8. Standard EFT RSVP can be marked cleared by Host (moderationAction: "verify_pop") & Direct P2P refund message is accurate
      const eftPopRes = await postRsvpApi(
        new NextRequest("http://localhost:3000/api/rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "verify_direct_pop",
            slug: popEvt.slug,
            guest_name: "Sipho Standard EFT",
            spots_locked: 1,
            amount_contributed_zar: 152,
            pop_hash: `pop_sms_sha256_${Date.now()}_eft_test_998877`,
            pop_sms_text: "Absa: R152.00 paid to 0821234567 Ref PT-SIPHOSTANDAR",
            pop_rail_badge: "standard_eft",
          }),
        })
      );
      assert.equal(eftPopRes.status, 201);
      const eftPopData = await eftPopRes.json();
      assert.equal(eftPopData.rsvp.pop_rail_badge, "standard_eft");

      const verifyEftRes = await patchRsvpApi(
        new NextRequest("http://localhost:3000/api/rsvp", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-host-token": popEvt.host_secret_token,
          },
          body: JSON.stringify({
            action: "moderate_rsvp",
            slug: popEvt.slug,
            rsvpId: eftPopData.rsvp.id,
            moderationAction: "verify_pop",
          }),
        })
      );
      assert.equal(verifyEftRes.status, 200);
      const verifyEftData = await verifyEftRes.json();
      assert.equal(verifyEftData.rsvp.pop_rail_badge, "instant_payshap");

      const directRefundRes = await patchRsvpApi(
        new NextRequest("http://localhost:3000/api/rsvp", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "request_refund",
            slug: popEvt.slug,
            rsvpId: eftPopData.rsvp.id,
            swapToken: eftPopData.rsvp.swap_token,
            reason: "Can't make the Saturday braai",
          }),
        })
      );
      assert.equal(directRefundRes.status, 200);
      const directRefundData = await directRefundRes.json();
      assert.match(directRefundData.message, /PayShap \/ EFT/i);

      // 9. Blocks underpayment tampering on verify_direct_pop (e.g. R50 for a R152 spot)
      const underpayRes = await postRsvpApi(
        new NextRequest("http://localhost:3000/api/rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "verify_direct_pop",
            slug: popEvt.slug,
            guest_name: "Underpayer",
            spots_locked: 1,
            amount_contributed_zar: 50,
            pop_hash: `pop_file_sha256_${Date.now()}_underpay`,
            pop_rail_badge: "instant_payshap",
          }),
        })
      );
      assert.equal(underpayRes.status, 400);

      // 10. Blocks pop_sms_ without pop_sms_text
      const emptySmsRes = await postRsvpApi(
        new NextRequest("http://localhost:3000/api/rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "verify_direct_pop",
            slug: popEvt.slug,
            guest_name: "Empty SMS Bypass",
            spots_locked: 1,
            amount_contributed_zar: 152,
            pop_hash: `pop_sms_${Date.now()}_empty`,
            pop_rail_badge: "instant_payshap",
          }),
        })
      );
      assert.equal(emptySmsRes.status, 400);

      // 11. Upgrades Payday 25th Promise in-place via verify_direct_pop and supports recover_pass for Direct PayShap guests
      const pledgeEvt = await createEvent({
        title: "Payday Direct POP Upgrade Test",
        mode: "fixed",
        price_zar: 100,
        max_spots: 10,
        allow_payday_promise: true,
        secret_location_pin: "Gate #7788",
      });
      const pledgeRes = await postRsvpApi(
        new NextRequest("http://localhost:3000/api/rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: pledgeEvt.slug,
            guest_name: "Mandla Payday",
            spots_locked: 1,
            status: "payday_promise",
            guest_whatsapp: "0827776655",
          }),
        })
      );
      assert.equal(pledgeRes.status, 201);
      const pledgeData = await pledgeRes.json();

      const settleDirectRes = await postRsvpApi(
        new NextRequest("http://localhost:3000/api/rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "verify_direct_pop",
            slug: pledgeEvt.slug,
            guest_name: "Mandla Payday",
            spots_locked: 1,
            amount_contributed_zar: 100,
            pop_hash: `pop_file_sha256_${Date.now()}_mandla_settle`,
            pop_rail_badge: "instant_payshap",
            guest_whatsapp: "0827776655",
            settling_rsvp_id: pledgeData.rsvp.id,
          }),
        })
      );
      assert.equal(settleDirectRes.status, 201);
      const settleDirectData = await settleDirectRes.json();
      assert.equal(settleDirectData.rsvp.id, pledgeData.rsvp.id);
      assert.equal(settleDirectData.rsvp.status, "locked_paid");

      const recoverDirectRes = await patchRsvpApi(
        new NextRequest("http://localhost:3000/api/rsvp", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "recover_pass",
            slug: pledgeEvt.slug,
            whatsappNumber: "082 777 6655",
            guestName: "Mandla",
          }),
        })
      );
      assert.equal(recoverDirectRes.status, 200);
      const recoverDirectData = await recoverDirectRes.json();
      assert.equal(recoverDirectData.rsvp.id, pledgeData.rsvp.id);
      assert.equal(recoverDirectData.secret_location_pin, "Gate #7788");
      assert.ok(recoverDirectData.recovered_swap_token, "2FA phone+name recovery returns recovered_swap_token");
      assert.match(recoverDirectData.passUrl, /swapToken=/);

      // 12. Global Cross-Event POP Hash Deduplication & pop_file_ prefix acceptance
      const secondEvt = await createEvent({
        title: "Second Event Cross-Event POP Test",
        mode: "fixed",
        price_zar: 100,
        max_spots: 10,
      });
      const sharedPopFileHash = `pop_file_${Date.now()}_cross_event_sha256_slip`;
      const firstUploadRes = await postRsvpApi(
        new NextRequest("http://localhost:3000/api/rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "verify_direct_pop",
            slug: pledgeEvt.slug,
            guest_name: "Kabelo Real Upload",
            spots_locked: 1,
            amount_contributed_zar: 100,
            pop_hash: sharedPopFileHash,
            pop_rail_badge: "instant_payshap",
          }),
        })
      );
      assert.equal(firstUploadRes.status, 201);

      const crossEventReplayRes = await postRsvpApi(
        new NextRequest("http://localhost:3000/api/rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "verify_direct_pop",
            slug: secondEvt.slug,
            guest_name: "Chancer Cross-Event Replay",
            spots_locked: 1,
            amount_contributed_zar: 100,
            pop_hash: sharedPopFileHash,
            pop_rail_badge: "instant_payshap",
          }),
        })
      );
      assert.equal(crossEventReplayRes.status, 409);

      // 13. Host Admin Self-Service Token Recovery (2FA: Host Phone + Last 4 Bank Digits or Gate Code)
      const recoverHostFail = await patchEventsApi(
        new NextRequest("http://localhost:3000/api/events", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: popEvt.slug,
            action: "recover_host_token",
            host_phone: "0821234567",
            secret_check: "0000",
          }),
        })
      );
      assert.equal(recoverHostFail.status, 403);

      const recoverHostOk = await patchEventsApi(
        new NextRequest("http://localhost:3000/api/events", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: popEvt.slug,
            action: "recover_host_token",
            host_phone: popEvt.host_phone,
            secret_check: "9921",
          }),
        })
      );
      assert.equal(recoverHostOk.status, 200);
      const recoverHostData = await recoverHostOk.json();
      assert.equal(recoverHostData.host_secret_token, popEvt.host_secret_token);

      // 14. Host 1-Click Clear Unpaid Payday Standby Pledges (expire_payday_pledges)
      await postRsvpApi(
        new NextRequest("http://localhost:3000/api/rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: pledgeEvt.slug,
            guest_name: "Unpaid Payday Standby 1",
            spots_locked: 1,
            status: "payday_promise",
          }),
        })
      );
      const expirePledgesRes = await patchEventsApi(
        new NextRequest("http://localhost:3000/api/events", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-host-token": pledgeEvt.host_secret_token,
          },
          body: JSON.stringify({
            slug: pledgeEvt.slug,
            action: "expire_payday_pledges",
          }),
        })
      );
      assert.equal(expirePledgesRes.status, 200);
      const expirePledgesData = await expirePledgesRes.json();
      assert.equal(expirePledgesData.removed_count, 1);

      // 15. Golf 4-Ball / Weekend Away High-Ticket Direct PayShap (R6,400 > R5,000 card cap, <= R25,000 PayShap cap)
      const golfEvt = await createEvent({
        title: "Golf Day 4-Ball High Ticket",
        mode: "fixed",
        price_zar: 6400,
        max_spots: 8,
      });
      const golfPopRes = await postRsvpApi(
        new NextRequest("http://localhost:3000/api/rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "verify_direct_pop",
            slug: golfEvt.slug,
            guest_name: "Fourball Captain",
            spots_locked: 1,
            amount_contributed_zar: 6400,
            pop_hash: `pop_file_sha256_${Date.now()}_golf_6400`,
            pop_rail_badge: "instant_payshap",
          }),
        })
      );
      assert.equal(golfPopRes.status, 201);

      // 16. Cash on Arrival End-to-End Suite: Reserve spot, reject when disabled, and 1-tap host verification
      const cashEvt = await createEvent({
        title: "Cape Town Beach Braai",
        mode: "fixed",
        price_zar: 150,
        max_spots: 20,
        allow_cash_on_arrival: true,
      });
      assert.equal(cashEvt.allow_cash_on_arrival, true);

      // Guest reserves cash spot
      const cashRsvpRes = await postRsvpApi(
        new NextRequest("http://localhost:3000/api/rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "reserve_cash_on_arrival",
            slug: cashEvt.slug,
            guest_name: "Lindiwe Khumalo",
            spots_locked: 1,
            comment: "Bringing exact cash R150!",
          }),
        })
      );
      assert.equal(cashRsvpRes.status, 201);
      const cashRsvpData = await cashRsvpRes.json();
      assert.equal(cashRsvpData.rsvp.status, "cash_logged");
      assert.equal(cashRsvpData.rsvp.amount_contributed_zar, 150);
      assert.equal(cashRsvpData.rsvp.payment_channel, "cash_manual");
      assert.equal(cashRsvpData.rsvp.pop_reference_note, "💵 Cash on Arrival (Pending Host Confirmation)");

      // Disabled cash check
      const noCashEvt = await createEvent({
        title: "VIP Lounge - Card Only",
        mode: "fixed",
        price_zar: 200,
        max_spots: 5,
        allow_cash_on_arrival: false,
      });
      const noCashRes = await postRsvpApi(
        new NextRequest("http://localhost:3000/api/rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "reserve_cash_on_arrival",
            slug: noCashEvt.slug,
            guest_name: "Cash Seeker",
            spots_locked: 1,
          }),
        })
      );
      assert.equal(noCashRes.status, 400);

      // Host 1-Tap Cash Confirmation
      const hostVerifyRes = await patchRsvpApi(
        new NextRequest("http://localhost:3000/api/rsvp", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-host-token": cashEvt.host_secret_token!,
          },
          body: JSON.stringify({
            action: "moderate_rsvp",
            slug: cashEvt.slug,
            host_token: cashEvt.host_secret_token,
            rsvpId: cashRsvpData.rsvp.id,
            moderationAction: "verify_cash",
          }),
        })
      );
      assert.equal(hostVerifyRes.status, 200);
      const hostVerifyData = await hostVerifyRes.json();
      assert.equal(hostVerifyData.rsvp.status, "cash_logged");
      assert.equal(hostVerifyData.rsvp.checked_in, true);
      assert.equal(hostVerifyData.rsvp.pop_reference_note, "💵 Cash Received & Verified by Host");
    });
  });
});
