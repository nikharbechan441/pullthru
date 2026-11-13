// Security regression suite. Each test asserts the SECURE behaviour:
// a failing test means the weakness is real. NOT part of `npm test`.
// Run: npx tsx --test tests/security.test.ts
process.env.IS_PULLTHRU_TEST = "true";
import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server.js";
import { GET as getEventsApi, PATCH as patchEventsApi } from "../src/app/api/events/route";
import { POST as postRsvpApi, PATCH as patchRsvpApi } from "../src/app/api/rsvp/route";
import { POST as postPaystackInitApi } from "../src/app/api/paystack/initialize/route";
import { POST as postYocoWebhookApi } from "../src/app/api/yoco/webhook/route";
import { POST as postYocoCheckoutApi } from "../src/app/api/yoco/checkout/route";
import { createEvent, getEventBySlug } from "../src/lib/store";
import { clearRateLimitStore, sanitizeErrorMessage } from "../src/lib/security";

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

const PIN = "SECRET-GATE-7781";
const json = (url: string, method: string, body: unknown, headers: Record<string, string> = {}) =>
  new NextRequest(url, {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
const rsvpPost = (b: unknown) => postRsvpApi(json("http://localhost:3000/api/rsvp", "POST", b));
const rsvpPatch = (b: unknown) => patchRsvpApi(json("http://localhost:3000/api/rsvp", "PATCH", b));
const eventsPatch = (b: unknown) => patchEventsApi(json("http://localhost:3000/api/events", "PATCH", b));
const eventsGet = (qs: string) => getEventsApi(new NextRequest(`http://localhost:3000/api/events${qs}`));
const log = (label: string, v: unknown) => console.log(`[evidence] ${label}:`, JSON.stringify(v));

async function mkEvent(extra: Record<string, unknown> = {}) {
  const e = await createEvent({
    title: `Sec Test ${Math.random().toString(36).slice(2, 8)}`,
    mode: "fixed",
    price_zar: 150,
    max_spots: 20,
    secret_location_pin: PIN,
    capitec_payme_url: "https://payme.capitecbank.co.za/sec",
    ...extra,
  } as never);
  return e as unknown as { slug: string; host_secret_token: string; max_spots: number };
}
const countSpots = async (slug: string) => {
  const d = await getEventBySlug(slug);
  return (d?.rsvps || [])
    .filter((r) => !["cancelled", "refunded", "removed"].includes(String(r.status)))
    .reduce((s, r) => s + (Number(r.spots_locked) || 1), 0);
};

describe("PullThru security regression", () => {
  it("1. paystack/initialize must not create locked_paid RSVP without real payment", async () => {
    const e = await mkEvent({ paystack_subaccount_code: "ACCT_sectest" });
    const res = await postPaystackInitApi(
      json("http://localhost:3000/api/paystack/initialize", "POST", {
        slug: e.slug, buyerName: "Free Rider", buyerWhatsapp: "0821234567", spotsCount: 1, cpaS49Accepted: true,
      })
    );
    const d = await res.json();
    log("1", { status: res.status, mode: d.mode, rsvpStatus: d.rsvp?.status, orderStatus: d.order?.status });
    assert.notEqual(d.rsvp?.status, "locked_paid");
  });

  it("2. verify_direct_pop with fake hash + no file must not lock or reveal PIN", async () => {
    const e = await mkEvent();
    const res = await rsvpPost({
      action: "verify_direct_pop", slug: e.slug, guest_name: "Fake Pop", spots_locked: 1,
      amount_contributed_zar: 150, pop_hash: "pop_file_aaaaaaaa", pop_rail_badge: "capitec_payme",
    });
    const d = await res.json();
    log("2", { status: res.status, rsvpStatus: d.rsvp?.status, pin: d.event?.secret_location_pin, error: d.error });
    assert.notEqual(d.rsvp?.status, "locked_paid");
    assert.ok(!JSON.stringify(d).includes(PIN), "secret_location_pin leaked");
  });

  it("3. reserve_cash_on_arrival must not reveal PIN (response or follow-up GET)", async () => {
    const e = await mkEvent();
    const res = await rsvpPost({ action: "reserve_cash_on_arrival", slug: e.slug, guest_name: "Cash Guy", spots_locked: 1 });
    const d = await res.json();
    const swap = d.rsvp?.swap_token || "";
    const g = await eventsGet(`?slug=${e.slug}&swapToken=${encodeURIComponent(swap)}`);
    const gt = await g.text();
    log("3", { status: res.status, rsvpStatus: d.rsvp?.status, pin: d.event?.secret_location_pin, getStatus: g.status, getLeaks: gt.includes(PIN) });
    assert.ok(!JSON.stringify(d).includes(PIN), "PIN in POST response");
    assert.ok(!gt.includes(PIN), "PIN in follow-up GET");
  });

  it("4. looping reserve_cash_on_arrival x5 (20 spots) must be limited", async () => {
    const e = await mkEvent({ max_spots: 100 });
    const statuses: number[] = [];
    for (let i = 0; i < 5; i++) {
      const r = await rsvpPost({ action: "reserve_cash_on_arrival", slug: e.slug, guest_name: `Hoarder ${i}`, spots_locked: 20 });
      statuses.push(r.status);
    }
    const total = await countSpots(e.slug);
    log("4", { statuses, totalSpots: total, max: 100 });
    assert.ok(total < 100, `unpaid cash reservations filled ${total}/100 spots`);
  });

  it("5. recover_pass with junk number + public name must not leak credentials", async () => {
    const e = await mkEvent();
    const c = await rsvpPost({ action: "verify_direct_pop", slug: e.slug, guest_name: "Public Victim", spots_locked: 1,
      amount_contributed_zar: 150, pop_hash: `pop_file_${Date.now()}_victim`, pop_rail_badge: "capitec_payme" }); // victim has no WhatsApp on file
    log("5-setup", { status: c.status });
    const res = await rsvpPatch({ action: "recover_pass", slug: e.slug, buyerWhatsapp: "000000000", guestName: "Public Victim" });
    const d = await res.json();
    const leakedSwap = d.rsvp?.swap_token || d.recovered_swap_token || d.swap_token || (String(d.pass_url || d.redirect_url || "").match(/swapToken=([^&]+)/) || [])[1];
    log("5", { status: res.status, keys: Object.keys(d), swap: leakedSwap, gate: d.rsvp?.gate_pin, pin: JSON.stringify(d).includes(PIN), error: d.error });
    assert.ok(!leakedSwap && !/swapToken=/.test(JSON.stringify(d)), "swap_token leaked");
    assert.ok(!d.rsvp?.gate_pin, "gate_pin leaked");
    assert.ok(!JSON.stringify(d).includes(PIN), "PIN leaked");
  });

  it("6. yoco webhook with no signature and no secret must be rejected", async () => {
    const saved = process.env.YOCO_WEBHOOK_SECRET;
    delete process.env.YOCO_WEBHOOK_SECRET;
    try {
      const res = await postYocoWebhookApi(json("http://localhost:3000/api/yoco/webhook", "POST", {
        type: "payment.succeeded", payload: { id: "p_1", status: "succeeded", metadata: { checkoutId: "ch_x", reference: "PT_FAKE" } },
      }));
      const t = await res.text();
      log("6", { status: res.status, body: t.slice(0, 200) });
      assert.ok(res.status >= 400, `accepted with ${res.status}`);
    } finally {
      if (saved !== undefined) process.env.YOCO_WEBHOOK_SECRET = saved;
    }
  });

  it("7. seed host token must be rejected in production", async () => {
    const env = process.env as Record<string, string | undefined>;
    const saved = env.NODE_ENV;
    env.NODE_ENV = "production";
    try {
      const res = await eventsPatch({ slug: "thursday-fives-sandton", action: "unlock_pro_boost",
        host_token: "host-secret-tariq-fives", reference: "SEEDTOKENTEST123" });
      const d = await res.json();
      log("7", { nodeEnvNow: process.env.NODE_ENV, status: res.status, error: d.error });
      assert.ok(res.status === 401 || res.status === 403 || res.status === 404, `seed token accepted (${res.status})`);
    } finally {
      env.NODE_ENV = saved;
    }
  });

  it("8. unlock_pro_boost with reference 'abcdef' must not set is_pro_boosted", async () => {
    const e = await mkEvent();
    const res = await eventsPatch({ slug: e.slug, action: "unlock_pro_boost", host_token: e.host_secret_token, reference: "abcdef" });
    const d = await res.json();
    const after = await getEventBySlug(e.slug);
    log("8", { status: res.status, is_pro_boosted: after?.event.is_pro_boosted, error: d.error });
    assert.notEqual(after?.event.is_pro_boosted, true);
  });

  it("9. 30 concurrent cash reservations on max_spots 5 must create at most 5 spots", async () => {
    const e = await mkEvent({ max_spots: 5 });
    const results = await Promise.all(
      Array.from({ length: 30 }, (_, i) =>
        rsvpPost({ action: "reserve_cash_on_arrival", slug: e.slug, guest_name: `Racer ${i}`, spots_locked: 1 }).then((r) => r.status)
      )
    );
    const total = await countSpots(e.slug);
    const tally = results.reduce<Record<number, number>>((a, s) => ((a[s] = (a[s] || 0) + 1), a), {});
    log("9", { statusTally: tally, totalSpots: total });
    assert.ok(total <= 5, `overbooked: ${total}/5`);
  });

  it("10. unauthenticated GET /api/events must not leak secrets", async () => {
    const e = await mkEvent();
    const v = await rsvpPost({ action: "verify_direct_pop", slug: e.slug, guest_name: "Other Guest", spots_locked: 1,
      amount_contributed_zar: 150, pop_hash: `pop_file_${Date.now()}_other`, pop_rail_badge: "capitec_payme", guest_whatsapp: "0835551234" });
    const vd = await v.json();
    const secrets: Record<string, string> = {
      swap_token: vd.rsvp?.swap_token, gate_pin: vd.rsvp?.gate_pin, host_secret_token: e.host_secret_token,
      secret_location_pin: PIN, guest_whatsapp: "835551234", seed_host_token: "host-secret-tariq-fives",
    };
    const list = await (await eventsGet("")).text();
    const one = await (await eventsGet(`?slug=${e.slug}`)).text();
    const seed = await (await eventsGet(`?slug=thursday-fives-sandton`)).text();
    const leaks: string[] = [];
    for (const [k, val] of Object.entries(secrets)) {
      if (!val) continue;
      if (list.includes(val)) leaks.push(`list:${k}`);
      if (one.includes(val)) leaks.push(`slug:${k}`);
      if (seed.includes(val)) leaks.push(`seed:${k}`);
    }
    for (const key of ["swap_token", "host_secret_token", "guest_whatsapp"]) {
      const re = new RegExp(`"${key}":"[^"*]{4,}"`);
      if (re.test(list)) leaks.push(`list:nonempty ${key}`);
      if (re.test(one)) leaks.push(`slug:nonempty ${key}`);
      if (re.test(seed)) leaks.push(`seed:nonempty ${key}`);
    }
    log("10", { leaks });
    assert.deepEqual(leaks, []);
  });

  it("11. client badge_label 'PayShap POP Verified' on payday_promise must not be stored as-is", async () => {
    const e = await mkEvent({ allow_payday_promise: true });
    const badge = "⚡ PayShap POP Verified";
    const res = await rsvpPost({ slug: e.slug, guest_name: "Badge Spoofer", spots_locked: 1, status: "payday_promise", badge_label: badge });
    const d = await res.json();
    log("11", { status: res.status, stored: d.rsvp?.badge_label, rsvpStatus: d.rsvp?.status, error: d.error });
    assert.notEqual(d.rsvp?.badge_label, badge);
  });

  it("12. rate limiter must return 429 Too Many Requests when recover_pass is brute-forced", async () => {
    clearRateLimitStore();
    const e = await mkEvent();
    const statuses: number[] = [];
    for (let i = 0; i < 8; i++) {
      const res = await patchRsvpApi(
        json(
          "http://localhost:3000/api/rsvp",
          "PATCH",
          { action: "recover_pass", slug: e.slug, buyerWhatsapp: `082000000${i}` },
          { "x-test-client-ip": "198.51.100.77", "x-enforce-rate-limit": "true" }
        )
      );
      statuses.push(res.status);
    }
    log("12", { statuses });
    assert.ok(statuses.includes(429), `expected 429 rate-limit status, got ${statuses.join(",")}`);
    clearRateLimitStore();
  });

  it("13. cross-origin POST/PATCH from untrusted external Origin must be blocked with 403 CSRF guard", async () => {
    const e = await mkEvent();
    const res = await postRsvpApi(
      json(
        "http://localhost:3000/api/rsvp",
        "POST",
        { slug: e.slug, guest_name: "CSRF Attacker", spots_locked: 1 },
        { Origin: "https://evil-phishing-site.example.com" }
      )
    );
    const d = await res.json();
    log("13", { status: res.status, error: d.error });
    assert.equal(res.status, 403);
  });

  it("14. yoco/checkout on pot mode must reject underpaid customAmountZar below min_pot_contribution_zar", async () => {
    const e = await mkEvent({
      mode: "pot",
      price_zar: 150,
      min_pot_contribution_zar: 120,
    });
    const res = await postYocoCheckoutApi(
      json("http://localhost:3000/api/yoco/checkout", "POST", {
        type: "rsvp",
        slug: e.slug,
        buyerName: "Underpayer",
        buyerWhatsapp: "0821234567",
        spotsCount: 2,
        customAmountZar: 50,
      })
    );
    const d = await res.json();
    log("14", { status: res.status, error: d.error });
    assert.equal(res.status, 400);
  });

  it("15. sanitizeErrorMessage must scrub internal Postgres/Supabase schema cache leaks", () => {
    const leaked = new Error(
      "Could not find the 'allow_cash_on_arrival' column of 'events' in the schema cache"
    );
    const safe = sanitizeErrorMessage(leaked, "Failed to create event.");
    log("15", { safe });
    assert.equal(safe, "Failed to create event.");
    assert.ok(!safe.includes("schema cache"));
  });
});
