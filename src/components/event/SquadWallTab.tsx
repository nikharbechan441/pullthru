"use client";

import React, { useState } from "react";
import { Flame, Users, ArrowRight } from "lucide-react";
import { EventItem, GuestRsvp } from "@/types/database";
import { triggerHaptic } from "@/lib/haptics";

interface SquadWallTabProps {
  event: EventItem;
  rsvps: GuestRsvp[];
  hostMode: boolean;
  onOpenCheckout: (spotNumber?: number) => void;
  onToggleCheckIn?: (rsvpId: string) => void;
  onSettlePaydayPromise?: (rsvp: GuestRsvp) => void;
  onModerateRsvp?: (
    rsvpId: string,
    action: "hide_comment" | "remove_unpaid" | "verify_pop" | "verify_cash"
  ) => void;
  onExpirePaydayPledges?: () => void;
}

export default function SquadWallTab({
  event,
  rsvps,
  hostMode,
  onOpenCheckout,
  onToggleCheckIn,
  onSettlePaydayPromise,
  onModerateRsvp,
  onExpirePaydayPledges,
}: SquadWallTabProps) {
  const [hostSearchQuery, setHostSearchQuery] = useState("");
  const [hostCheckInFilter, setHostCheckInFilter] = useState<"all" | "unchecked" | "checked">("all");

  const confirmed = rsvps.filter(
    (r) =>
      r.refund_status !== "refunded" &&
      (r.status === "locked_paid" ||
        r.status === "going_free" ||
        r.status === "cash_logged")
  );
  const paydayPledges = rsvps.filter((r) => r.status === "payday_promise");
  const lockedCount = confirmed.reduce(
    (sum, r) => sum + (r.spots_locked || 1),
    0
  );
  const isSoldOut =
    event.max_spots !== null &&
    event.max_spots !== undefined &&
    lockedCount >= event.max_spots;
  const spotsLeft =
    event.max_spots !== null && event.max_spots !== undefined
      ? Math.max(0, event.max_spots - lockedCount)
      : null;
  const capacityPct =
    event.max_spots !== null && event.max_spots !== undefined
      ? Math.min(100, Math.round((lockedCount / event.max_spots) * 100))
      : 100;

  // Chronological sort: earlier created_at = earlier rank
  const chronological = [...confirmed].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const normQuery = hostSearchQuery.trim().toLowerCase();
  const isFiltering = hostMode && (normQuery.length > 0 || hostCheckInFilter !== "all");

  const filteredChronological = isFiltering
    ? chronological.filter((r) => {
        if (hostCheckInFilter === "unchecked" && r.checked_in) return false;
        if (hostCheckInFilter === "checked" && !r.checked_in) return false;
        if (!normQuery) return true;
        const nameMatch = r.guest_name.toLowerCase().includes(normQuery);
        const pinMatch = r.gate_pin ? String(r.gate_pin).includes(normQuery.replace(/^#/, "")) : false;
        const plusOneMatch = Array.isArray(r.plus_one_names)
          ? r.plus_one_names.some((p) => p.toLowerCase().includes(normQuery))
          : false;
        return nameMatch || pinMatch || plusOneMatch;
      })
    : chronological;

  const top3 = isFiltering ? [] : chronological.slice(0, 3);
  const rest = isFiltering ? filteredChronological : chronological.slice(3);

  return (
    <div className="space-y-4">
      {/* Live Capacity Scarcity Card */}
      <div className="rounded-2xl border border-[#E6E2D8] bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-4.5 w-4.5 text-[#007749]" />
            <span className="font-display text-sm font-black text-[#0F172A]">
              {event.max_spots
                ? `${lockedCount} / ${event.max_spots} Spots Locked`
                : `${lockedCount} spots locked in`}
            </span>
          </div>
          <span className="font-mono-num rounded-full bg-[#007749]/10 px-2.5 py-0.5 text-xs font-black text-[#007749]">
            {event.max_spots ? `${capacityPct}% Full` : "Open RSVP"}
          </span>
        </div>
        <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-[#EFECE6]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#007749] to-teal-500 transition-all duration-500"
            style={{ width: `${capacityPct}%` }}
          />
        </div>
      </div>

      {/* Host Gate Search & Filter Bar */}
      {hostMode && chronological.length > 0 && (
        <div className="rounded-2xl border border-[#0F172A]/15 bg-[#0F172A]/5 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={hostSearchQuery}
              onChange={(e) => setHostSearchQuery(e.target.value)}
              placeholder="🔍 Search guest name, +1, or 4-digit Gate PIN #..."
              className="w-full rounded-xl border border-[#E6E2D8] bg-white px-3 py-2 text-xs font-bold text-[#0F172A] placeholder:text-[#64748B]"
            />
            {hostSearchQuery && (
              <button
                type="button"
                onClick={() => setHostSearchQuery("")}
                className="rounded-lg bg-slate-200 px-2.5 py-2 text-[11px] font-bold text-[#0F172A]"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setHostCheckInFilter("all")}
              className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${
                hostCheckInFilter === "all"
                  ? "bg-[#0F172A] text-white"
                  : "bg-white text-[#475569] border border-[#E6E2D8]"
              }`}
            >
              All ({chronological.length})
            </button>
            <button
              type="button"
              onClick={() => setHostCheckInFilter("unchecked")}
              className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${
                hostCheckInFilter === "unchecked"
                  ? "bg-amber-600 text-white"
                  : "bg-white text-[#475569] border border-[#E6E2D8]"
              }`}
            >
              ⏳ Not Checked In ({chronological.filter((r) => !r.checked_in).length})
            </button>
            <button
              type="button"
              onClick={() => setHostCheckInFilter("checked")}
              className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${
                hostCheckInFilter === "checked"
                  ? "bg-[#007749] text-white"
                  : "bg-white text-[#475569] border border-[#E6E2D8]"
              }`}
            >
              ✅ Checked In ({chronological.filter((r) => r.checked_in).length})
            </button>
          </div>
        </div>
      )}

      {/* Podium Top 3 Rankings */}
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {top3.map((rsvp, idx) => {
            const medals = ["🥇 #1 First In", "⚡ #2 Second", "🔥 #3 Podium"];
            const bgGradients = [
              "from-amber-100/80 to-amber-50 border-amber-300",
              "from-slate-100 to-slate-50 border-slate-300",
              "from-orange-100/80 to-orange-50 border-orange-300",
            ];
            return (
              <div
                key={rsvp.id}
                className={`relative flex flex-col items-center rounded-2xl border p-3 text-center bg-gradient-to-b ${bgGradients[idx]} shadow-xs`}
              >
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0F172A]">
                  {medals[idx]}
                </span>
                <div className="my-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-[#007749] text-xs font-black text-white shadow-xs">
                  {rsvp.is_anonymous_on_wall
                    ? "🔒"
                    : rsvp.guest_name.slice(0, 2).toUpperCase()}
                </div>
                <p className="w-full truncate text-xs font-extrabold text-[#0F172A]">
                  {rsvp.is_anonymous_on_wall ? "Anonymous" : rsvp.guest_name}
                  {rsvp.spots_locked && rsvp.spots_locked > 1
                    ? ` (×${rsvp.spots_locked})`
                    : ""}
                </p>
                {rsvp.plus_one_names && rsvp.plus_one_names.length > 0 && (
                  <p className="w-full truncate text-[9px] font-bold text-[#475569]">
                    +1: {rsvp.plus_one_names.join(", ")}
                  </p>
                )}
                <span className="mt-1 line-clamp-1 rounded-md bg-white/80 px-1.5 py-0.5 text-[9px] font-bold text-[#007749]">
                  {rsvp.badge_label || "Legend"}
                </span>
                {rsvp.status === "cash_logged" && (
                  <span className="mt-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[8.5px] font-black text-amber-800 border border-amber-300">
                    {rsvp.badge_label === "📲 PayShap Sent" || rsvp.payment_channel === "payshap"
                      ? rsvp.checked_in
                        ? "✅ PayShap Paid"
                        : "📲 PayShap Sent"
                      : rsvp.checked_in
                      ? "💵 Cash Paid"
                      : "⏳ Cash at Gate"}
                  </span>
                )}
                {rsvp.status === "going_free" && (
                  <span className="mt-0.5 rounded-full bg-sky-100 px-1.5 py-0.5 text-[8.5px] font-black text-sky-800 border border-sky-300">
                    🎟️ Free Spot
                  </span>
                )}
                {rsvp.status === "locked_paid" && (
                  <span className="mt-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[8.5px] font-black text-[#007749] border border-[#007749]/30">
                    ✓ Paid {rsvp.amount_contributed_zar ? `R${rsvp.amount_contributed_zar}` : ""}
                  </span>
                )}
                {hostMode && rsvp.gate_pin && (
                  <span className="mt-1 rounded bg-[#0F172A] px-1.5 py-0.5 font-mono-num text-[9px] font-bold text-amber-300">
                    PIN #{rsvp.gate_pin}
                  </span>
                )}
                {hostMode && onToggleCheckIn && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic("light");
                      onToggleCheckIn(rsvp.id);
                    }}
                    className={`tap-tactile mt-1.5 w-full rounded-full px-2 py-1 text-[10px] font-bold ${
                      rsvp.checked_in
                        ? "bg-[#007749] text-white"
                        : "border border-[#0F172A]/20 bg-white text-[#0F172A]"
                    }`}
                  >
                    {rsvp.checked_in ? "✓ Checked In" : "Check In"}
                  </button>
                )}
                {hostMode && onModerateRsvp && (
                  <div className="mt-1 flex flex-wrap justify-center gap-1">
                    {rsvp.status === "cash_logged" && !rsvp.checked_in && (
                      <button
                        type="button"
                        onClick={() => onModerateRsvp(rsvp.id, "verify_cash")}
                        className="rounded-full bg-[#007749] px-1.5 py-0.5 text-[9px] font-bold text-white"
                      >
                        {rsvp.badge_label === "📲 PayShap Sent"
                          ? "✅ Mark PayShap Paid"
                          : "💵 Mark Cash Paid"}
                      </button>
                    )}
                    {rsvp.pop_rail_badge === "standard_eft" && (
                      <button
                        type="button"
                        onClick={() => onModerateRsvp(rsvp.id, "verify_pop")}
                        className="rounded-full bg-[#007749] px-1.5 py-0.5 text-[9px] font-bold text-white"
                      >
                        ✅ EFT OK
                      </button>
                    )}
                    {(!rsvp.order_id || Boolean(rsvp.pop_hash)) && (
                      <button
                        type="button"
                        onClick={() => onModerateRsvp(rsvp.id, "remove_unpaid")}
                        className="rounded-full border border-red-200 bg-red-50 px-1.5 py-0.5 text-[9px] font-bold text-red-700"
                      >
                        🗑️ Remove
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Live Wall Feed (Remaining RSVPs) */}
      <div className="space-y-2">
        <h4 className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#64748B]">
          <Users className="h-3.5 w-3.5" />
          <span>Who&apos;s Pulling Through ({chronological.length})</span>
        </h4>

        {rest.map((rsvp, idx) => (
          <div
            key={rsvp.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#E6E2D8] bg-white p-3 shadow-xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="font-mono-num text-xs font-black text-[#64748B]">
                #{isFiltering ? chronological.findIndex((c) => c.id === rsvp.id) + 1 : idx + 4}
              </span>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#007749]/10 text-xs font-bold text-[#007749]">
                {rsvp.is_anonymous_on_wall
                  ? "🔒"
                  : rsvp.guest_name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-black text-[#0F172A]">
                  {rsvp.is_anonymous_on_wall ? "🔒 Anonymous Legend" : rsvp.guest_name}
                  {rsvp.spots_locked && rsvp.spots_locked > 1 ? ` (×${rsvp.spots_locked} spots)` : ""}
                  {rsvp.plus_one_names && rsvp.plus_one_names.length > 0 ? ` (+1: ${rsvp.plus_one_names.join(", ")})` : ""}
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-[#64748B]">
                    {rsvp.badge_label}
                  </span>
                  {rsvp.status === "cash_logged" && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-black text-amber-800 border border-amber-300">
                      {rsvp.badge_label === "📲 PayShap Sent" || rsvp.payment_channel === "payshap"
                        ? rsvp.checked_in
                          ? "✅ PayShap Paid"
                          : "📲 PayShap Sent"
                        : rsvp.checked_in
                        ? "💵 Cash Paid"
                        : "⏳ Cash at Gate"}
                    </span>
                  )}
                  {rsvp.status === "going_free" && (
                    <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[9px] font-black text-sky-800 border border-sky-200">
                      🎟️ Free Spot
                    </span>
                  )}
                  {rsvp.status === "locked_paid" && (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-black text-[#007749] border border-[#007749]/20">
                      ✓ Paid {rsvp.amount_contributed_zar ? `(R${rsvp.amount_contributed_zar})` : ""}
                    </span>
                  )}
                  {rsvp.pop_rail_badge && (
                    <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-[#007749] border border-[#007749]/20">
                      {rsvp.pop_rail_badge === "capitec_payme"
                        ? "📲 Capitec PayMe"
                        : rsvp.pop_rail_badge === "standard_eft"
                        ? "🏦 Standard EFT"
                        : "⚡ PayShap"}
                    </span>
                  )}
                  {rsvp.claimed_item_label && (
                    <span className="text-[10px] font-bold text-[#007749]">
                      • {rsvp.claimed_item_label}
                    </span>
                  )}
                </div>
                {hostMode && rsvp.pop_reference_note && (
                  <p className="mt-0.5 truncate font-mono text-[10px] font-semibold text-[#007749]">
                    📄 POP: {rsvp.pop_reference_note}
                  </p>
                )}
                {rsvp.comment && !rsvp.comment.includes("[Comment hidden") && (
                  <p className="mt-0.5 truncate text-[10px] italic text-[#475569]">
                    &ldquo;{rsvp.comment}&rdquo;
                  </p>
                )}
              </div>
            </div>

            {hostMode && (
              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                {rsvp.gate_pin && (
                  <span className="rounded bg-[#0F172A] px-1.5 py-0.5 font-mono-num text-[9px] font-bold text-amber-300">
                    PIN #{rsvp.gate_pin}
                  </span>
                )}
                {onModerateRsvp && rsvp.status === "cash_logged" && !rsvp.checked_in && (
                  <button
                    type="button"
                    onClick={() => onModerateRsvp(rsvp.id, "verify_cash")}
                    className="rounded-full bg-[#007749] px-2 py-1 text-[10px] font-bold text-white"
                  >
                    {rsvp.badge_label === "📲 PayShap Sent"
                      ? "✅ Mark PayShap Paid"
                      : "💵 Mark Cash Paid"}
                  </button>
                )}
                {onModerateRsvp && rsvp.pop_rail_badge === "standard_eft" && (
                  <button
                    type="button"
                    onClick={() => onModerateRsvp(rsvp.id, "verify_pop")}
                    className="rounded-full bg-[#007749] px-2 py-1 text-[10px] font-bold text-white"
                  >
                    ✅ EFT Cleared
                  </button>
                )}
                {onModerateRsvp && (!rsvp.order_id || Boolean(rsvp.pop_hash)) && (
                  <button
                    type="button"
                    onClick={() => onModerateRsvp(rsvp.id, "remove_unpaid")}
                    title="Remove if payment not received in bank"
                    className="rounded-full border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-bold text-red-700"
                  >
                    🗑️ Not in Bank
                  </button>
                )}
                {onModerateRsvp && rsvp.comment && !rsvp.comment.includes("[Comment hidden") && (
                  <button
                    type="button"
                    onClick={() => onModerateRsvp(rsvp.id, "hide_comment")}
                    title="Hide comment"
                    className="rounded-full border border-[#E6E2D8] px-2 py-1 text-[10px] font-bold text-[#64748B] hover:bg-slate-100"
                  >
                    🛡️ Hide
                  </button>
                )}
                {onToggleCheckIn && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic("light");
                      onToggleCheckIn(rsvp.id);
                    }}
                    className={`tap-tactile rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      rsvp.checked_in
                        ? "bg-[#007749] text-white"
                        : "border border-[#E6E2D8] text-[#475569]"
                    }`}
                  >
                    {rsvp.checked_in ? "✓ In" : "Check In"}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Payday 25th Standby Pledges Section (Unpaid) */}
        {paydayPledges.length > 0 && (
          <div className="mt-4 space-y-2 rounded-2xl border border-amber-300/80 bg-amber-50/60 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-900">
                🗓️ Payday 25th Standby Pledges ({paydayPledges.length})
              </span>
              <div className="flex items-center gap-1.5">
                {hostMode && onExpirePaydayPledges && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic("medium");
                      onExpirePaydayPledges();
                    }}
                    className="rounded-full border border-red-300 bg-red-50 px-2.5 py-0.5 text-[10px] font-extrabold text-red-700 hover:bg-red-100"
                  >
                    🧹 Clear All Unpaid ({paydayPledges.length})
                  </button>
                )}
                <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[9px] font-extrabold text-amber-950">
                  ⏳ UNPAID — NO GATE ENTRY YET
                </span>
              </div>
            </div>
            {paydayPledges.map((pledge) => (
              <div
                key={pledge.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-white p-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-extrabold text-[#0F172A]">
                    {pledge.is_anonymous_on_wall ? "🔒 Anonymous Pledge" : pledge.guest_name}
                  </p>
                  <p className="text-[10px] font-semibold text-amber-800">
                    {isSoldOut
                      ? "⚠️ Event Sold Out to Instant Payers — Ask Host if a spot opens"
                      : "⏳ Standby Pledge • Tap to settle & lock your spot"}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {!isSoldOut && onSettlePaydayPromise && (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic("medium");
                        onSettlePaydayPromise(pledge);
                      }}
                      className="tap-tactile rounded-full bg-amber-600 px-3 py-1.5 text-[11px] font-black text-white shadow-xs hover:bg-amber-700"
                    >
                      💳 Settle Pledge Now
                    </button>
                  )}
                  {hostMode && onModerateRsvp && (
                    <button
                      type="button"
                      onClick={() => onModerateRsvp(pledge.id, "remove_unpaid")}
                      className="rounded-full border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-bold text-red-700"
                    >
                      🗑️ Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Interactive Open Spot Placeholder */}
        {spotsLeft !== null && spotsLeft > 0 && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic("medium");
              onOpenCheckout(1);
            }}
            className="flex w-full items-center justify-between rounded-2xl border border-dashed border-[#007749]/60 bg-emerald-50/40 p-3 text-left transition active:scale-98"
          >
            <span className="text-xs font-bold text-[#007749]">
              🔥 Spot #{lockedCount + 1} open — Tap to claim
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#007749] px-2.5 py-1 text-[10px] font-extrabold text-white">
              Claim Spot <ArrowRight className="h-3 w-3" />
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
