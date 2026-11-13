"use client";

import React, { useState } from "react";
import Link from "next/link";
import { calculateCheckoutSplit, formatZar } from "@/lib/fees";
import { triggerHaptic } from "@/lib/haptics";
import { PullThruIconSvg } from "@/components/PullThruLogo";
import { SouthAfricaFlagSvg } from "@/components/Navbar";
import {
  ArrowRight,
  Zap,
  Trophy,
  Flame,
  Repeat,
  Lock,
  CheckCircle2,
  Terminal,
  ShieldCheck,
  Users,
} from "lucide-react";

interface FloodlightPreset {
  id: string;
  cmd: string;
  vibeBadge: string;
  title: string;
  venue: string;
  kickoff: string;
  priceZar: number;
  spotsCap: number;
  spotsLocked: number;
  podium: [
    { rank: "#1 GOLD", name: string; time: string; rail: string },
    { rank: "#2 SILVER", name: string; time: string; rail: string },
    { rank: "#3 BRONZE", name: string; time: string; rail: string }
  ];
  bringItems: Array<{ id: string; label: string; claimedBy: string | null }>;
}

const FLOODLIGHT_PRESETS: FloodlightPreset[] = [
  {
    id: "fives",
    cmd: "/pullthru fives R100 10spots",
    vibeBadge: "⚽ 5-A-SIDE FLOODLIGHT",
    title: "Thursday Night 5-a-Side @ Fives Sandton",
    venue: "Pitch 3 • Sandton City Rooftop",
    kickoff: "THU 19:00 SHARP",
    priceZar: 100,
    spotsCap: 10,
    spotsLocked: 9,
    podium: [
      { rank: "#1 GOLD", name: "Siya K", time: "Locked in 11s", rail: "Capitec Pay" },
      { rank: "#2 SILVER", name: "Marco V", time: "Locked in 19s", rail: "Apple Pay" },
      { rank: "#3 BRONZE", name: "Tshepo M", time: "Locked in 28s", rail: "Capitec Pay" },
    ],
    bringItems: [
      { id: "b1", label: "⚽ Match Ball (Size 5)", claimedBy: "Siya K" },
      { id: "b2", label: "🦺 Neon Mashie Bibs", claimedBy: "Marco V" },
      { id: "b3", label: "🧊 6x Ice Cold Energades", claimedBy: null },
      { id: "b4", label: "🧤 Spare Keeper Gloves", claimedBy: null },
    ],
  },
  {
    id: "padel",
    cmd: "/pullthru padel R150 4spots",
    vibeBadge: "🎾 PADEL AMERICANO",
    title: "Friday Floodlight Padel 4-Ball",
    venue: "Court 1 • Africa Padel V&A Waterfront",
    kickoff: "FRI 18:00 SHARP",
    priceZar: 150,
    spotsCap: 4,
    spotsLocked: 3,
    podium: [
      { rank: "#1 GOLD", name: "Willem B", time: "Locked in 8s", rail: "Apple Pay" },
      { rank: "#2 SILVER", name: "Candice M", time: "Locked in 14s", rail: "Capitec Pay" },
      { rank: "#3 BRONZE", name: "Farouk P", time: "Locked in 22s", rail: "Instant EFT" },
    ],
    bringItems: [
      { id: "p1", label: "🎾 Fresh Pressurized Balls", claimedBy: "Willem B" },
      { id: "p2", label: "🧊 Rehydrate & Towels", claimedBy: null },
    ],
  },
  {
    id: "braai",
    cmd: "/pullthru braai R220 16spots",
    vibeBadge: "🥩 TEST MATCH SPITBRAAI",
    title: "Bokke vs NZ Saturday Spitbraai & Big Screen",
    venue: "Riaan's Lapa • Centurion",
    kickoff: "SAT 14:30 KICKOFF",
    priceZar: 220,
    spotsCap: 16,
    spotsLocked: 14,
    podium: [
      { rank: "#1 GOLD", name: "Riaan v.d.M", time: "Locked in 9s", rail: "FNB EFT" },
      { rank: "#2 SILVER", name: "Sipho D", time: "Locked in 15s", rail: "Capitec Pay" },
      { rank: "#3 BRONZE", name: "Francois d.T", time: "Locked in 24s", rail: "Apple Pay" },
    ],
    bringItems: [
      { id: "s1", label: "🔥 4x Bags Sekelbos Wood", claimedBy: "Riaan v.d.M" },
      { id: "s2", label: "🧊 6x Bags Party Ice", claimedBy: "Sipho D" },
      { id: "s3", label: "🥗 Grandma's Potato Salad", claimedBy: null },
      { id: "s4", label: "🧄 4x Garlic Roosterkoek", claimedBy: null },
    ],
  },
];

export default function Redesign2FloodlightScoreboard() {
  const [activeId, setActiveId] = useState<string>("fives");
  const activePreset =
    FLOODLIGHT_PRESETS.find((p) => p.id === activeId) || FLOODLIGHT_PRESETS[0];

  const [bringState, setBringState] = useState(activePreset.bringItems);
  const [swappedPlayer, setSwappedPlayer] = useState<boolean>(false);
  const [lockedSpots, setLockedSpots] = useState<number>(activePreset.spotsLocked);

  const handleSwitchPreset = (p: FloodlightPreset) => {
    triggerHaptic("selection");
    setActiveId(p.id);
    setBringState(p.bringItems);
    setSwappedPlayer(false);
    setLockedSpots(p.spotsLocked);
  };

  const handleToggleBringItem = (id: string) => {
    triggerHaptic("light");
    setBringState((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, claimedBy: item.claimedBy ? null : "You (Claimed ⚡)" }
          : item
      )
    );
  };

  const handleSimulateSpotSwap = () => {
    triggerHaptic("success");
    setSwappedPlayer((prev) => !prev);
  };

  const handleLockLastSpot = () => {
    triggerHaptic("success");
    setLockedSpots((prev) => (prev < activePreset.spotsCap ? prev + 1 : prev - 1));
  };

  const split = calculateCheckoutSplit(activePreset.priceZar, 1);
  const hostBankTotal = lockedSpots * activePreset.priceZar;
  const hostTargetTotal = activePreset.spotsCap * activePreset.priceZar;
  const pct = Math.min(100, Math.round((lockedSpots / activePreset.spotsCap) * 100));

  return (
    <div className="min-h-screen bg-[#090F0C] text-[#F4F7F5] selection:bg-[#00D67F] selection:text-[#090F0C]">
      {/* =====================================================================
          FLOODLIGHT MATCHDAY LIVE TICKER BAR
         ===================================================================== */}
      <div className="border-b border-white/10 bg-[#050807] px-4 py-2 text-[11px] font-mono">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[#00D67F]">
            <span className="h-2 w-2 rounded-full bg-[#00D67F] animate-ping" />
            <span className="font-bold uppercase tracking-widest">LIVE MZANSI SQUAD WIRE:</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-white/75">
            <span>⚽ Fives Sandton: <strong className="text-white font-mono-num">9/10 Locked</strong></span>
            <span className="hidden sm:inline text-white/20">•</span>
            <span className="hidden sm:inline">🎾 Virgin Active Padel: <strong className="text-[#FFB81C] font-mono-num">4/4 FULL</strong></span>
            <span className="hidden md:inline text-white/20">•</span>
            <span className="hidden md:inline">🥩 Centurion Spitbraai: <strong className="text-[#00D67F] font-mono-num">R3,080 Settled</strong></span>
          </div>
        </div>
      </div>

      {/* =====================================================================
          STICKY STADIUM HEADER
         ===================================================================== */}
      <header className="sticky top-0 z-40 border-b border-white/15 bg-[#090F0C]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <PullThruIconSvg size={36} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-lg font-black tracking-tight text-white">
                  PULLTHRU
                </span>
                <SouthAfricaFlagSvg className="h-3.5 w-5" />
                <span className="rounded border border-[#00D67F]/40 bg-[#00D67F]/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#00D67F]">
                  FLOODLIGHT CLUB
                </span>
              </div>
              <p className="text-[11px] text-white/60 hidden sm:block">
                See who&apos;s actually pulling through • 100% Direct SA Bank Split
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/e/thursday-fives-sandton"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-bold text-white hover:bg-white/10 transition"
            >
              <span>Inspect Live Match</span>
            </Link>
            <Link
              href={`/create?preset=${activePreset.id}`}
              onClick={() => triggerHaptic("medium")}
              className="inline-flex items-center gap-2 rounded-lg bg-[#00D67F] px-4 py-2.5 text-xs sm:text-sm font-black uppercase tracking-wider text-[#090F0C] transition-transform active:scale-95 hover:bg-[#00eb8b]"
            >
              <span>⚡ Drop Squad Link</span>
              <ArrowRight className="h-4 w-4 stroke-[2.5]" />
            </Link>
          </div>
        </div>
      </header>

      {/* =====================================================================
          FIRST 100VH STAGE: MATCHDAY SCOREBOARD + WHATSAPP COMMAND CONSOLE
         ===================================================================== */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT 6 COLUMNS: FLOODLIGHT HERO & 1-LINE WHATSAPP COMMAND BAR */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-md border border-[#FFB81C]/40 bg-[#FFB81C]/10 px-3 py-1 font-mono text-xs font-bold text-[#FFB81C]">
              <Trophy className="h-3.5 w-3.5" />
              <span>GEEN KANSVATTERS • FIRST PAID PLAY</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-[54px] font-black tracking-tight leading-[1.03] text-white">
              Lock the squad{" "}
              <span className="text-[#00D67F]">before kickoff.</span>
            </h1>

            <p className="text-base sm:text-lg text-white/70 leading-relaxed">
              Every captain knows the Friday 4PM panic when 3 guys bail and you&apos;re stuck paying the venue out of your own pocket. Drop a PullThru link: players tap once with{" "}
              <strong className="text-white">Capitec Pay or Apple Pay</strong>, and 100% of the turf fee lands in your bank.
            </p>

            {/* INTERACTIVE WHATSAPP 1-LINE COMMAND CONSOLE */}
            <div className="rounded-2xl border border-white/15 bg-[#111A15] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#00D67F]">
                  <Terminal className="h-4 w-4" />
                  <span>TAP A MATCHDAY COMMAND TO LOAD SCOREBOARD:</span>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-white/50">
                  Instant Pre-fill
                </span>
              </div>

              <div className="space-y-2">
                {FLOODLIGHT_PRESETS.map((p) => {
                  const isCurrent = p.id === activePreset.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSwitchPreset(p)}
                      className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 text-left font-mono text-xs sm:text-sm transition-all active:scale-[0.98] cursor-pointer ${
                        isCurrent
                          ? "border-[#00D67F] bg-[#00D67F]/15 text-white shadow-[0_0_20px_rgba(0,214,127,0.15)]"
                          : "border-white/10 bg-[#090F0C] text-white/70 hover:border-white/30 hover:text-white"
                      }`}
                    >
                      <span className="font-bold truncate">{p.cmd}</span>
                      <span
                        className={`ml-2 shrink-0 rounded px-2 py-0.5 text-[10px] font-black uppercase ${
                          isCurrent
                            ? "bg-[#00D67F] text-[#090F0C]"
                            : "bg-white/10 text-white/70"
                        }`}
                      >
                        {isCurrent ? "ACTIVE BOARD" : "LOAD →"}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-white/10 text-center">
                <div className="rounded-xl border border-white/10 bg-[#090F0C] p-3">
                  <p className="font-mono-num text-lg font-black text-[#00D67F]">
                    {formatZar(activePreset.priceZar)}
                  </p>
                  <p className="font-mono text-[10px] uppercase text-white/60">
                    To Host Per Spot
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#090F0C] p-3">
                  <p className="font-mono-num text-lg font-black text-white">
                    {formatZar(split.totalChargedZar)}
                  </p>
                  <p className="font-mono text-[10px] uppercase text-white/60">
                    Player Checkout
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#090F0C] p-3">
                  <p className="font-mono-num text-lg font-black text-[#FFB81C]">
                    {formatZar(hostTargetTotal)}
                  </p>
                  <p className="font-mono text-[10px] uppercase text-white/60">
                    Guaranteed Pot
                  </p>
                </div>
              </div>
            </div>

            {/* PRIMARY CTA BAR */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href={`/create?preset=${activePreset.id}`}
                onClick={() => triggerHaptic("medium")}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#00D67F] px-6 py-4 font-display text-base font-black uppercase tracking-wide text-[#090F0C] transition-transform active:scale-95 hover:bg-[#00eb8b]"
              >
                <span>⚡ Launch This {activePreset.id.toUpperCase()} Link (25s)</span>
                <ArrowRight className="h-5 w-5 stroke-[2.5]" />
              </Link>

              <button
                type="button"
                onClick={handleLockLastSpot}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#FFB81C]/50 bg-[#FFB81C]/15 px-5 py-4 font-mono text-xs font-extrabold uppercase text-[#FFB81C] transition-transform active:scale-95 cursor-pointer"
              >
                <Zap className="h-4 w-4" />
                <span>
                  {lockedSpots < activePreset.spotsCap
                    ? `Test Locking Final Spot (${lockedSpots}/${activePreset.spotsCap})`
                    : "Reset Final Spot"}
                </span>
              </button>
            </div>
          </div>

          {/* RIGHT 6 COLUMNS: INTERACTIVE STADIUM SCOREBOARD & PODIUM */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl border border-white/20 bg-[#111A15] p-5 sm:p-6 shadow-2xl space-y-5">
              {/* Top Scoreboard Header */}
              <div className="flex items-start justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="inline-block rounded bg-[#00D67F]/15 border border-[#00D67F]/40 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-[#00D67F]">
                    {activePreset.vibeBadge}
                  </span>
                  <h2 className="font-display mt-2 text-xl sm:text-2xl font-black text-white">
                    {activePreset.title}
                  </h2>
                  <p className="mt-0.5 font-mono text-xs text-white/60">
                    📍 {activePreset.venue} • ⏱️ {activePreset.kickoff}
                  </p>
                </div>

                <div className="text-right rounded-xl border border-white/15 bg-[#090F0C] px-3.5 py-2">
                  <span className="font-mono text-[10px] uppercase text-white/50 block">
                    SPOTS LOCKED
                  </span>
                  <span className="font-mono-num text-2xl font-black text-[#00D67F]">
                    {lockedSpots}/{activePreset.spotsCap}
                  </span>
                </div>
              </div>

              {/* Floodlight Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-white/75">
                    HOST PAYOUT LOCKED:{" "}
                    <strong className="font-mono-num text-[#00D67F]">
                      {formatZar(hostBankTotal)}
                    </strong>{" "}
                    / {formatZar(hostTargetTotal)}
                  </span>
                  <span className="font-bold text-[#FFB81C]">
                    {lockedSpots >= activePreset.spotsCap
                      ? "🔒 PITCH 100% LOCKED"
                      : `⚡ ${activePreset.spotsCap - lockedSpots} SPOT OPEN`}
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-[#090F0C] border border-white/15 overflow-hidden">
                  <div
                    className="h-full bg-[#00D67F] transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Podium Top 3 Fastest Payers */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-white/60">
                    🏆 FASTEST LOCK-IN PODIUM
                  </span>
                  <button
                    type="button"
                    onClick={handleSimulateSpotSwap}
                    className="inline-flex items-center gap-1 rounded border border-[#FFB81C]/40 bg-[#FFB81C]/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#FFB81C] hover:bg-[#FFB81C]/20 cursor-pointer"
                  >
                    <Repeat className="h-3 w-3" />
                    <span>
                      {swappedPlayer ? "Spot Swapped to Sub ✓" : "Test 1-Tap Spot-Swap"}
                    </span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {activePreset.podium.map((p, idx) => {
                    const isSwappedSlot = idx === 2 && swappedPlayer;
                    return (
                      <div
                        key={p.rank}
                        className={`rounded-xl border p-3 transition-all ${
                          idx === 0
                            ? "border-[#FFB81C]/50 bg-[#FFB81C]/10"
                            : isSwappedSlot
                            ? "border-[#00D67F] bg-[#00D67F]/15"
                            : "border-white/10 bg-[#090F0C]"
                        }`}
                      >
                        <span
                          className={`font-mono text-[10px] font-black uppercase ${
                            idx === 0 ? "text-[#FFB81C]" : "text-white/60"
                          }`}
                        >
                          {isSwappedSlot ? "🔄 SUBBED IN (R0)" : p.rank}
                        </span>
                        <p className="font-display mt-1 text-sm font-black text-white truncate">
                          {isSwappedSlot ? "Luka B (Sub for Tshepo)" : p.name}
                        </p>
                        <p className="mt-0.5 font-mono text-[10px] text-[#00D67F]">
                          {isSwappedSlot ? "Instant WhatsApp Swap" : `${p.time} • ${p.rail}`}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Interactive Bring-'n-Bak Kit Checklist */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-white/60">
                    🎒 INTERACTIVE BRING-&apos;N-BAK CHECKLIST (TAP TO CLAIM)
                  </span>
                  <span className="font-mono text-[10px] text-[#00D67F]">
                    Zero Duplicate Ice
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {bringState.map((item) => {
                    const claimed = Boolean(item.claimedBy);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleToggleBringItem(item.id)}
                        className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-xs transition-all active:scale-95 cursor-pointer ${
                          claimed
                            ? "border-[#00D67F]/40 bg-[#00D67F]/10 text-white"
                            : "border-white/10 bg-[#090F0C] text-white/80 hover:border-white/30"
                        }`}
                      >
                        <span className="font-bold truncate">{item.label}</span>
                        <span
                          className={`ml-2 shrink-0 rounded px-2 py-0.5 font-mono text-[10px] font-bold ${
                            claimed
                              ? "bg-[#00D67F] text-[#090F0C]"
                              : "border border-white/20 text-white/70"
                          }`}
                        >
                          {item.claimedBy || "+ Claim"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Secret Gate Code Bar */}
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#090F0C] px-4 py-3 text-xs">
                <div className="flex items-center gap-2 text-white/80">
                  <Lock className="h-4 w-4 text-[#FFB81C]" />
                  <span>Venue Pin &amp; Court Booking Code:</span>
                </div>
                <span className="font-mono font-bold text-[#00D67F]">
                  {lockedSpots >= activePreset.spotsCap
                    ? "UNLOCKED: #4419 (Court 3)"
                    : "Unlocks on RSVP Pass"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
