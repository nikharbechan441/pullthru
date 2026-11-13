// Comprehensive Turnout Shortfall & Flake Protection Scenario Test Suite
// Run: npx tsx --test tests/shortfall.test.ts
process.env.IS_PULLTHRU_TEST = "true";
import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server.js";
import {
  calculateFlakeCushionPricing,
  calculateTurnoutShortfallSplit,
  formatShortfallTopUpWhatsAppMessage,
  ShortfallRsvpInput,
} from "../src/lib/fees";
import { GET as getEventsApi, PATCH as patchEventsApi } from "../src/app/api/events/route";
import { POST as postRsvpApi } from "../src/app/api/rsvp/route";
import { createEvent, createDirectRsvp, getEventBySlug } from "../src/lib/store";
import { clearRateLimitStore } from "../src/lib/security";

const DATA_FILE_PATH = path.join(process.cwd(), ".pullthru-data.json");
if (typeof (globalThis as Record<string, unknown>).getSupabase !== "function") {
  (globalThis as Record<string, unknown>).getSupabase = () => null;
}

after(() => {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) fs.unlinkSync(DATA_FILE_PATH);
  } catch {
    /* ignore */
  }
});

const jsonReq = (url: string, method: string, body: unknown, headers: Record<string, string> = {}) =>
  new NextRequest(url, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

describe("PullThru Turnout Shortfall & Flake Protection System (16 Scenarios)", () => {
  it("Scenario 1: Classic 8/10 5-a-Side Pitch Shortfall (R1,000 target, 8 pay R100 = R800 -> R200 shortfall -> +R25/spot)", () => {
    const rsvps: ShortfallRsvpInput[] = Array.from({ length: 8 }, (_, idx) => ({
      id: `rsvp-${idx + 1}`,
      guest_name: `Player ${idx + 1}`,
      status: "locked_paid",
      refund_status: "none",
      amount_contributed_zar: 100,
      spots_locked: 1,
    }));

    const res = calculateTurnoutShortfallSplit({
      targetPoolZar: 1000,
      maxSpots: 10,
      baseSpotPriceZar: 100,
      rsvps,
    });

    assert.equal(res.status, "shortfall_active");
    assert.equal(res.isTargetMet, false);
    assert.equal(res.confirmedSpotsCount, 8);
    assert.equal(res.contributingSpotsCount, 8);
    assert.equal(res.unfilledSpots, 2);
    assert.equal(res.effectiveRaisedZar, 800);
    assert.equal(res.shortfallZar, 200);
    assert.equal(res.exactTopUpPerSpotZar, 25);
    assert.equal(res.topUpPerSpotZar, 25);
    assert.equal(res.newSpotPriceZar, 125);
    assert.equal(res.totalRecoveredAfterTopUpZar, 1000);
    assert.equal(res.guestShares.length, 8);
    assert.ok(res.guestShares.every((g) => g.topUpOwedZar === 25 && g.newTotalContributionZar === 125));
  });

  it("Scenario 2: Multi-Spot (+1) Bookings Scale Proportionally (7 guests lock 8 spots total -> 2-spot guest owes +R50, 1-spot guests owe +R25)", () => {
    const rsvps: ShortfallRsvpInput[] = [
      {
        id: "rsvp-captain",
        guest_name: "Sipho (+1 Thabo)",
        status: "locked_paid",
        amount_contributed_zar: 200,
        spots_locked: 2,
      },
      ...Array.from({ length: 6 }, (_, idx) => ({
        id: `rsvp-single-${idx + 1}`,
        guest_name: `Player ${idx + 2}`,
        status: "locked_paid",
        amount_contributed_zar: 100,
        spots_locked: 1,
      })),
    ];

    const res = calculateTurnoutShortfallSplit({
      targetPoolZar: 1000,
      maxSpots: 10,
      baseSpotPriceZar: 100,
      rsvps,
    });

    assert.equal(res.confirmedRsvpCount, 7);
    assert.equal(res.confirmedSpotsCount, 8);
    assert.equal(res.unfilledSpots, 2);
    assert.equal(res.effectiveRaisedZar, 800);
    assert.equal(res.shortfallZar, 200);
    assert.equal(res.topUpPerSpotZar, 25);

    const captainShare = res.guestShares.find((g) => g.rsvpId === "rsvp-captain");
    assert.ok(captainShare);
    assert.equal(captainShare.spotsLocked, 2);
    assert.equal(captainShare.topUpOwedZar, 50);
    assert.equal(captainShare.newTotalContributionZar, 250);

    const singleShares = res.guestShares.filter((g) => g.rsvpId !== "rsvp-captain");
    assert.equal(singleShares.length, 6);
    assert.ok(singleShares.every((g) => g.topUpOwedZar === 25 && g.newTotalContributionZar === 125));
  });

  it("Scenario 3: Unchecked Cash-on-Arrival Toggle (6 paid via PayShap + 2 Cash at Gate vs 2 Cash No-Shows)", () => {
    const rsvps: ShortfallRsvpInput[] = [
      ...Array.from({ length: 6 }, (_, idx) => ({
        id: `paid-${idx + 1}`,
        guest_name: `Paid Player ${idx + 1}`,
        status: "locked_paid",
        amount_contributed_zar: 100,
        spots_locked: 1,
        checked_in: true,
      })),
      {
        id: "cash-1",
        guest_name: "Cash Guy 1",
        status: "cash_logged",
        amount_contributed_zar: 100,
        spots_locked: 1,
        checked_in: false,
      },
      {
        id: "cash-2",
        guest_name: "Cash Guy 2",
        status: "cash_logged",
        amount_contributed_zar: 100,
        spots_locked: 1,
        checked_in: false,
      },
    ];

    // Case 3A: Host counts unchecked Cash-on-Arrival as coming (default: true)
    const withCash = calculateTurnoutShortfallSplit({
      targetPoolZar: 1000,
      maxSpots: 10,
      baseSpotPriceZar: 100,
      rsvps,
      includeUncheckedCash: true,
    });
    assert.equal(withCash.verifiedRaisedZar, 600);
    assert.equal(withCash.pendingCashZar, 200);
    assert.equal(withCash.effectiveRaisedZar, 800);
    assert.equal(withCash.confirmedSpotsCount, 8);
    assert.equal(withCash.shortfallZar, 200);
    assert.equal(withCash.topUpPerSpotZar, 25);

    // Case 3B: The 2 unchecked Cash guys ghosted at kickoff (includeUncheckedCash: false)
    const withoutCash = calculateTurnoutShortfallSplit({
      targetPoolZar: 1000,
      maxSpots: 10,
      baseSpotPriceZar: 100,
      rsvps,
      includeUncheckedCash: false,
    });
    assert.equal(withoutCash.verifiedRaisedZar, 600);
    assert.equal(withoutCash.pendingCashZar, 200);
    assert.equal(withoutCash.effectiveRaisedZar, 600);
    assert.equal(withoutCash.confirmedSpotsCount, 6);
    assert.equal(withoutCash.unfilledSpots, 4);
    assert.equal(withoutCash.shortfallZar, 400);
    // R400 / 6 players = R66.67 exact -> rounds up to R67/spot so host is never short!
    assert.equal(withoutCash.exactTopUpPerSpotZar, 66.67);
    assert.equal(withoutCash.topUpPerSpotZar, 67);
    assert.equal(withoutCash.totalRecoveredAfterTopUpZar, 600 + 67 * 6); // R1,002
    assert.equal(withoutCash.roundingSurplusZar, 2);
  });

  it("Scenario 4: Checked-In Cash Guest Counts as Verified Even When Unchecked Cash is Excluded", () => {
    const rsvps: ShortfallRsvpInput[] = [
      ...Array.from({ length: 6 }, (_, idx) => ({
        id: `paid-${idx + 1}`,
        guest_name: `Paid ${idx + 1}`,
        status: "locked_paid",
        amount_contributed_zar: 100,
        spots_locked: 1,
      })),
      {
        id: "cash-arrived",
        guest_name: "Cash Arrived & Handed Notes",
        status: "cash_logged",
        amount_contributed_zar: 100,
        spots_locked: 1,
        checked_in: true, // Host tapped Check-In at the gate!
      },
      {
        id: "cash-ghost",
        guest_name: "Cash Ghost",
        status: "cash_logged",
        amount_contributed_zar: 100,
        spots_locked: 1,
        checked_in: false,
      },
    ];

    const res = calculateTurnoutShortfallSplit({
      targetPoolZar: 1000,
      maxSpots: 10,
      baseSpotPriceZar: 100,
      rsvps,
      includeUncheckedCash: false,
    });

    assert.equal(res.verifiedRaisedZar, 700);
    assert.equal(res.pendingCashZar, 100);
    assert.equal(res.effectiveRaisedZar, 700);
    assert.equal(res.confirmedSpotsCount, 7);
    assert.equal(res.shortfallZar, 300);
    // R300 / 7 = R42.86 -> ceil R43
    assert.equal(res.exactTopUpPerSpotZar, 42.86);
    assert.equal(res.topUpPerSpotZar, 43);
  });

  it("Scenario 5: Odd Division Ceiling Guarantee (7 of 10 show up on R1,000 pitch -> R300 / 7 = R43/spot, never leaving host short)", () => {
    const rsvps: ShortfallRsvpInput[] = Array.from({ length: 7 }, (_, idx) => ({
      id: `p-${idx + 1}`,
      guest_name: `Player ${idx + 1}`,
      status: "locked_paid",
      amount_contributed_zar: 100,
      spots_locked: 1,
    }));

    const res = calculateTurnoutShortfallSplit({
      targetPoolZar: 1000,
      maxSpots: 10,
      baseSpotPriceZar: 100,
      rsvps,
    });

    assert.equal(res.shortfallZar, 300);
    assert.equal(res.exactTopUpPerSpotZar, 42.86);
    assert.equal(res.topUpPerSpotZar, 43);
    assert.ok(res.totalRecoveredAfterTopUpZar >= res.targetPoolZar);
    assert.equal(res.totalRecoveredAfterTopUpZar, 1001);
    assert.equal(res.roundingSurplusZar, 1);
  });

  it("Scenario 6: Pre-Event Flake Cushion Enabled on /create (R1,000 pitch, 10 max spots -> R125/spot) -> When only 8 show up, Shortfall is R0!", () => {
    const cushion = calculateFlakeCushionPricing({
      totalTargetZar: 1000,
      maxSpots: 10,
      safeTurnoutRatio: 0.8,
    });

    assert.equal(cushion.safeTurnoutSpots, 8);
    assert.equal(cushion.bufferSpotsCount, 2);
    assert.equal(cushion.standardSpotZar, 100);
    assert.equal(cushion.cushionedSpotZar, 125);
    assert.equal(cushion.extraPerSpotZar, 25);
    assert.equal(cushion.guaranteedAtSafeTurnoutZar, 1000);
    assert.equal(cushion.surplusIfFullZar, 250);

    // Now simulate only 8 of 10 showing up and paying the cushioned R125/spot
    const rsvps: ShortfallRsvpInput[] = Array.from({ length: 8 }, (_, idx) => ({
      id: `c-${idx + 1}`,
      guest_name: `Cushioned Player ${idx + 1}`,
      status: "locked_paid",
      amount_contributed_zar: cushion.cushionedSpotZar,
      spots_locked: 1,
    }));

    const shortfallCheck = calculateTurnoutShortfallSplit({
      targetPoolZar: 1000,
      maxSpots: 10,
      baseSpotPriceZar: cushion.cushionedSpotZar,
      rsvps,
    });

    assert.equal(shortfallCheck.effectiveRaisedZar, 1000);
    assert.equal(shortfallCheck.shortfallZar, 0);
    assert.equal(shortfallCheck.topUpPerSpotZar, 0);
    assert.equal(shortfallCheck.isTargetMet, true);
    assert.equal(shortfallCheck.status, "target_met");
  });

  it("Scenario 7: Pre-Event Flake Cushion Enabled (R125/spot) and All 10/10 Show Up -> R0 Shortfall + R250 Drinks/Ice Surplus Kitty!", () => {
    const rsvps: ShortfallRsvpInput[] = Array.from({ length: 10 }, (_, idx) => ({
      id: `full-${idx + 1}`,
      guest_name: `Player ${idx + 1}`,
      status: "locked_paid",
      amount_contributed_zar: 125,
      spots_locked: 1,
    }));

    const res = calculateTurnoutShortfallSplit({
      targetPoolZar: 1000,
      maxSpots: 10,
      baseSpotPriceZar: 125,
      rsvps,
    });

    assert.equal(res.isTargetMet, true);
    assert.equal(res.status, "target_met");
    assert.equal(res.shortfallZar, 0);
    assert.equal(res.surplusZar, 250);
    assert.equal(res.unfilledSpots, 0);
    assert.equal(res.topUpPerSpotZar, 0);
  });

  it("Scenario 8: Multi-Tier Event with R0 Free Kids Spots + Paid Adult Spots (Kids are never charged a shortfall top-up)", () => {
    const rsvps: ShortfallRsvpInput[] = [
      // 6 Paid Adults at R200 each = R1,200
      ...Array.from({ length: 6 }, (_, idx) => ({
        id: `adult-${idx + 1}`,
        guest_name: `Adult ${idx + 1}`,
        status: "locked_paid",
        amount_contributed_zar: 200,
        spots_locked: 1,
      })),
      // 2 Free Kids (Under 12 Mahala tier, R0)
      {
        id: "kid-1",
        guest_name: "Junior 1 (Under 12)",
        status: "going_free",
        amount_contributed_zar: 0,
        spots_locked: 1,
      },
      {
        id: "kid-2",
        guest_name: "Junior 2 (Under 12)",
        status: "going_free",
        amount_contributed_zar: 0,
        spots_locked: 1,
      },
    ];

    // Target Braai Meat & Venue Cost = R1,500 (shortfall = R300)
    const res = calculateTurnoutShortfallSplit({
      targetPoolZar: 1500,
      maxSpots: 10,
      baseSpotPriceZar: 200,
      rsvps,
    });

    assert.equal(res.confirmedSpotsCount, 8); // 6 adults + 2 kids
    assert.equal(res.contributingSpotsCount, 6); // Only the 6 paid adults split the R300 shortfall
    assert.equal(res.freeSpotsCount, 2);
    assert.equal(res.shortfallZar, 300);
    assert.equal(res.topUpPerSpotZar, 50); // R300 / 6 adults = +R50 per adult

    const kidShares = res.guestShares.filter((g) => g.rsvpId.startsWith("kid-"));
    assert.equal(kidShares.length, 2);
    assert.ok(kidShares.every((k) => k.topUpOwedZar === 0 && k.newTotalContributionZar === 0));

    const adultShares = res.guestShares.filter((g) => g.rsvpId.startsWith("adult-"));
    assert.equal(adultShares.length, 6);
    assert.ok(adultShares.every((a) => a.topUpOwedZar === 50 && a.newTotalContributionZar === 250));
  });

  it("Scenario 9: Refunded Guests & Unpaid Payday Promises are Strictly Excluded from Raised Funds & Headcount", () => {
    const rsvps: ShortfallRsvpInput[] = [
      ...Array.from({ length: 8 }, (_, idx) => ({
        id: `valid-${idx + 1}`,
        guest_name: `Valid Player ${idx + 1}`,
        status: "locked_paid",
        refund_status: "none",
        amount_contributed_zar: 100,
        spots_locked: 1,
      })),
      {
        id: "refunded-guy",
        guest_name: "Bailed & Refunded",
        status: "locked_paid",
        refund_status: "refunded",
        amount_contributed_zar: 100,
        spots_locked: 1,
      },
      {
        id: "standby-guy",
        guest_name: "Payday 25th Promise",
        status: "payday_promise",
        refund_status: "none",
        amount_contributed_zar: 0,
        spots_locked: 1,
      },
    ];

    const res = calculateTurnoutShortfallSplit({
      targetPoolZar: 1000,
      maxSpots: 10,
      baseSpotPriceZar: 100,
      rsvps,
    });

    assert.equal(res.confirmedSpotsCount, 8);
    assert.equal(res.standbyPledgesCount, 1);
    assert.equal(res.effectiveRaisedZar, 800);
    assert.equal(res.shortfallZar, 200);
    assert.equal(res.topUpPerSpotZar, 25);
  });

  it("Scenario 10: Open Gift / Braai Pot Mode with Variable Contributions (Target R2,000, 8 friends gave R1,600 -> R400 shortfall -> +R50 each)", () => {
    const amounts = [300, 250, 200, 200, 200, 150, 150, 150]; // sum = R1,600
    const rsvps: ShortfallRsvpInput[] = amounts.map((amt, idx) => ({
      id: `pot-${idx + 1}`,
      guest_name: `Contributor ${idx + 1}`,
      status: "locked_paid",
      amount_contributed_zar: amt,
      spots_locked: 1,
    }));

    const res = calculateTurnoutShortfallSplit({
      targetPoolZar: 2000,
      maxSpots: null,
      rsvps,
    });

    assert.equal(res.effectiveRaisedZar, 1600);
    assert.equal(res.shortfallZar, 400);
    assert.equal(res.confirmedSpotsCount, 8);
    assert.equal(res.topUpPerSpotZar, 50);
    assert.equal(res.guestShares[0].alreadyPaidZar, 300);
    assert.equal(res.guestShares[0].topUpOwedZar, 50);
    assert.equal(res.guestShares[0].newTotalContributionZar, 350);
  });

  it("Scenario 11: Zero Confirmed Guests Guard (0/10 paid -> no division by zero, no NaN/Infinity)", () => {
    const res = calculateTurnoutShortfallSplit({
      targetPoolZar: 1000,
      maxSpots: 10,
      baseSpotPriceZar: 100,
      rsvps: [
        {
          id: "standby-1",
          guest_name: "Standby Only",
          status: "payday_promise",
          amount_contributed_zar: 0,
          spots_locked: 1,
        },
      ],
    });

    assert.equal(res.status, "no_confirmed_guests");
    assert.equal(res.confirmedSpotsCount, 0);
    assert.equal(res.shortfallZar, 1000);
    assert.equal(res.topUpPerSpotZar, 0);
    assert.equal(res.exactTopUpPerSpotZar, 0);
    assert.ok(Number.isFinite(res.topUpPerSpotZar));
    assert.ok(Number.isFinite(res.exactTopUpPerSpotZar));
  });

  it("Scenario 12: Padel 4-Ball Where 3 of 4 Show Up (R600 Court Target, 3 paid R150 = R450 -> +R50/player top-up)", () => {
    const rsvps: ShortfallRsvpInput[] = Array.from({ length: 3 }, (_, idx) => ({
      id: `padel-${idx + 1}`,
      guest_name: `Padel Player ${idx + 1}`,
      status: "locked_paid",
      amount_contributed_zar: 150,
      spots_locked: 1,
    }));

    const res = calculateTurnoutShortfallSplit({
      targetPoolZar: 600,
      maxSpots: 4,
      baseSpotPriceZar: 150,
      rsvps,
    });

    assert.equal(res.shortfallZar, 150);
    assert.equal(res.unfilledSpots, 1);
    assert.equal(res.topUpPerSpotZar, 50);
    assert.equal(res.newSpotPriceZar, 200);
  });

  it("Scenario 13: WhatsApp Shortfall Top-Up Message Formatter Includes Squad Breakdown, Multi-Spot Scaling & Host Payment Rails", () => {
    const rsvps: ShortfallRsvpInput[] = [
      {
        id: "r1",
        guest_name: "Tariq",
        status: "locked_paid",
        amount_contributed_zar: 200,
        spots_locked: 2,
      },
      {
        id: "r2",
        guest_name: "Lunga",
        status: "locked_paid",
        amount_contributed_zar: 100,
        spots_locked: 1,
      },
    ];

    const splitResult = calculateTurnoutShortfallSplit({
      targetPoolZar: 450,
      maxSpots: 4,
      baseSpotPriceZar: 100,
      rsvps,
    });

    const waMsg = formatShortfallTopUpWhatsAppMessage({
      eventTitle: "Thursday 5-a-Side Sandton",
      eventDate: "Thu 19:00",
      locationName: "Fives Futbol Sandton",
      eventUrl: "https://pullthru.co.za/e/thursday-fives",
      hostName: "Tariq Davids",
      payshapId: "0825550194",
      bankName: "Capitec",
      accountNumber: "1648291045",
      capitecPaymeUrl: "https://payme.capitecbank.co.za/tariq",
      splitResult,
    });

    assert.ok(waMsg.includes("3 of 4 spots"));
    assert.ok(waMsg.includes("R450"));
    assert.ok(waMsg.includes("R300"));
    assert.ok(waMsg.includes("+R50 / spot"));
    assert.ok(waMsg.includes("Tariq (×2 spots) — paid R200 → *+R100 top-up*"));
    assert.ok(waMsg.includes("Lunga — paid R100 → *+R50 top-up*"));
    assert.ok(waMsg.includes("0825550194"));
    assert.ok(waMsg.includes("1648291045"));
  });

  it("Scenario 14: End-to-End API Integration — Host Locks Headcount at 8/8 & Expires Unpaid Standby Pledges so Event Becomes SOLD OUT", async () => {
    clearRateLimitStore();
    const ev = await createEvent({
      title: "Sandton 10-Man Turf",
      mode: "fixed",
      price_zar: 100,
      max_spots: 10,
      venue_deposit_zar: 1000,
      allow_payday_promise: true,
      allow_cash_on_arrival: true,
    } as never);

    // Add 8 paid players
    for (let i = 1; i <= 8; i++) {
      await createDirectRsvp({
        event_id: ev.id,
        guest_name: `Squad Member ${i}`,
        guest_whatsapp: `082000000${i}`,
        status: "locked_paid",
        payment_channel: "capitec_pay",
        amount_contributed_zar: 100,
        spots_locked: 1,
        plus_one_names: [],
        claimed_item_id: null,
        claimed_item_label: null,
        tier_label: null,
        badge_label: "First In",
        comment: "",
        custom_answer: null,
        is_anonymous_on_wall: false,
        order_id: `ord_${i}`,
      });
    }

    // Add 2 flaky Payday Standby Pledges
    for (let j = 1; j <= 2; j++) {
      await createDirectRsvp({
        event_id: ev.id,
        guest_name: `Flaky Standby ${j} (Payday 25th Promise)`,
        guest_whatsapp: `083000000${j}`,
        status: "payday_promise",
        payment_channel: "capitec_pay",
        amount_contributed_zar: 0,
        spots_locked: 1,
        plus_one_names: [],
        claimed_item_id: null,
        claimed_item_label: null,
        tier_label: null,
        badge_label: "Payday Promise",
        comment: "",
        custom_answer: null,
        is_anonymous_on_wall: false,
        order_id: null,
      });
    }

    // Step 1: Host expires the 2 unpaid standby pledges
    const expireRes = await patchEventsApi(
      jsonReq("http://localhost:3000/api/events", "PATCH", {
        slug: ev.slug,
        host_token: ev.host_secret_token,
        action: "expire_payday_pledges",
      })
    );
    assert.equal(expireRes.status, 200);

    // Step 2: Host locks max_spots at 8 (matching the 8 confirmed spots)
    const lockRes = await patchEventsApi(
      jsonReq("http://localhost:3000/api/events", "PATCH", {
        slug: ev.slug,
        host_token: ev.host_secret_token,
        action: "edit_details",
        max_spots: 8,
      })
    );
    assert.equal(lockRes.status, 200);
    const lockData = await lockRes.json();
    assert.equal(lockData.event.max_spots, 8);

    // Step 3: Verify via GET /api/events that max_spots is 8, standby pledges are gone, and venue_deposit_zar is still R1,000
    const getRes = await getEventsApi(
      new NextRequest(`http://localhost:3000/api/events?slug=${ev.slug}`)
    );
    const getData = await getRes.json();
    assert.equal(getData.event.max_spots, 8);
    assert.equal(getData.event.venue_deposit_zar, 1000);
    assert.equal(getData.rsvps.length, 8);

    // Step 4: Verify that a 9th person trying to reserve a spot now gets rejected as SOLD OUT (409)
    const lateRsvpRes = await postRsvpApi(
      jsonReq("http://localhost:3000/api/rsvp", "POST", {
        action: "reserve_cash_on_arrival",
        slug: ev.slug,
        guest_name: "Too Late Guy",
        spots_locked: 1,
      })
    );
    assert.equal(lateRsvpRes.status, 409);
  });

  it("Scenario 15: Safety Guard — API Rejects Lowering max_spots Below Already-Locked Headcount (e.g. 8 locked, host tries max_spots: 6 -> 400)", async () => {
    clearRateLimitStore();
    const ev = await createEvent({
      title: "Guard Test Pitch",
      mode: "fixed",
      price_zar: 100,
      max_spots: 10,
    } as never);

    for (let i = 1; i <= 8; i++) {
      await createDirectRsvp({
        event_id: ev.id,
        guest_name: `Locked ${i}`,
        guest_whatsapp: `082111000${i}`,
        status: "locked_paid",
        payment_channel: "capitec_pay",
        amount_contributed_zar: 100,
        spots_locked: 1,
        plus_one_names: [],
        claimed_item_id: null,
        claimed_item_label: null,
        tier_label: null,
        badge_label: "Locked",
        comment: "",
        custom_answer: null,
        is_anonymous_on_wall: false,
        order_id: `ord_g_${i}`,
      });
    }

    // Attempt to set max_spots to 6 when 8 are already paid & locked
    const badRes = await patchEventsApi(
      jsonReq("http://localhost:3000/api/events", "PATCH", {
        slug: ev.slug,
        host_token: ev.host_secret_token,
        action: "edit_details",
        max_spots: 6,
      })
    );
    assert.equal(badRes.status, 400);
    const badData = await badRes.json();
    assert.ok(String(badData.error).includes("8"));

    // Confirm max_spots remained 10
    const check = await getEventBySlug(ev.slug);
    assert.equal(check?.event.max_spots, 10);
  });

  it("Scenario 16: Baked Pro Boost (+R3/spot on 10-player event) vs Original R1,000 Pitch Target Calculation", () => {
    // Host set R100 base + R3 baked Pro Boost = R103/spot, with venue_deposit_zar = R1,000
    // 8 players pay R103 = R824 total in bank
    const rsvps: ShortfallRsvpInput[] = Array.from({ length: 8 }, (_, idx) => ({
      id: `pro-${idx + 1}`,
      guest_name: `Pro Squad ${idx + 1}`,
      status: "locked_paid",
      amount_contributed_zar: 103,
      spots_locked: 1,
    }));

    const res = calculateTurnoutShortfallSplit({
      targetPoolZar: 1000,
      maxSpots: 10,
      baseSpotPriceZar: 103,
      rsvps,
    });

    assert.equal(res.effectiveRaisedZar, 824);
    assert.equal(res.shortfallZar, 176);
    assert.equal(res.exactTopUpPerSpotZar, 22);
    assert.equal(res.topUpPerSpotZar, 22);
    assert.equal(res.totalRecoveredAfterTopUpZar, 1000);
  });
});
