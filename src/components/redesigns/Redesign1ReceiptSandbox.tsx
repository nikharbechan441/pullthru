"use client";

import React, { useState } from "react";
import Link from "next/link";
import { calculateCheckoutSplit, formatZar } from "@/lib/fees";
import { triggerHaptic } from "@/lib/haptics";
import { PullThruIconSvg } from "@/components/PullThruLogo";
import { SouthAfricaFlagSvg } from "@/components/Navbar";
import {
  ArrowRight,
  Plus,
  Minus,
  Zap,
  Check,
  Lock,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Users,
  Receipt,
} from "lucide-react";

interface SandboxTemplate {
  id: string;
  presetKey: string;
  tag: string;
  emoji: string;
  title: string;
  venue: string;
  when: string;
  host: string;
  bank: string;
  defaultPrice: number;
  defaultSpots: number;
  secretPin: string;
  bringList: string[];
  initialSquad: Array<{
    name: string;
    rail: "Capitec Pay" | "Apple Pay" | "Instant EFT";
    item: string;
    paid: boolean;
  }>;
}

const SANDBOX_TEMPLATES: SandboxTemplate[] = [
  {
    id: "fives",
    presetKey: "fives",
    tag: "FIXED SPLIT",
    emoji: "⚽",
    title: "Thursday Night 5-a-Side @ Fives Sandton",
    venue: "Pitch 3, Sandton",
    when: "Thu 19:00",
    host: "Tariq Davids",
    bank: "Capitec Direct Split",
    defaultPrice: 100,
    defaultSpots: 10,
    secretPin: "Booking #4419 • Pitch 3 Floodlights",
    bringList: ["⚽ Match Ball", "🦺 Neon Bibs", "🧊 6x Energades"],
    initialSquad: [
      { name: "Siya Kolisi-M", rail: "Capitec Pay", item: "⚽ Match Ball", paid: true },
      { name: "Marco van Wyk", rail: "Apple Pay", item: "🦺 Neon Bibs", paid: true },
      { name: "Tshepo Mokoena", rail: "Capitec Pay", item: "🧊 6x Energades", paid: true },
      { name: "Devon Naidoo", rail: "Instant EFT", item: "Spot Only", paid: true },
      { name: "Luka Botha", rail: "Apple Pay", item: "Spot Only", paid: true },
      { name: "Kagiso Sithole", rail: "Capitec Pay", item: "Spot Only", paid: true },
      { name: "Garth Hendricks", rail: "Capitec Pay", item: "Spot Only", paid: true },
    ],
  },
  {
    id: "padel",
    presetKey: "padel",
    tag: "COURT SPLIT",
    emoji: "🎾",
    title: "Saturday Morning Padel 4-Ball Split",
    venue: "Virgin Active Padel, Claremont",
    when: "Sat 09:00",
    host: "Willem Steenkamp",
    bank: "FNB Direct Split",
    defaultPrice: 150,
    defaultSpots: 4,
    secretPin: "Court 2 • Gate QR #8820",
    bringList: ["🎾 Fresh Wilson Balls", "🧊 Rehydrate Pack"],
    initialSquad: [
      { name: "Willem S (Host)", rail: "Capitec Pay", item: "🎾 Fresh Wilson Balls", paid: true },
      { name: "Candice v.d. Merwe", rail: "Apple Pay", item: "🧊 Rehydrate Pack", paid: true },
      { name: "Farouk Patel", rail: "Instant EFT", item: "Spot Only", paid: true },
    ],
  },
  {
    id: "braai",
    presetKey: "braai",
    tag: "MULTI-TIER",
    emoji: "🥩",
    title: "Bokke vs NZ Saturday Spitbraai",
    venue: "Riaan's Lapa, Centurion",
    when: "Sat 14:30",
    host: "Riaan van der Merwe",
    bank: "Standard Bank Split",
    defaultPrice: 220,
    defaultSpots: 16,
    secretPin: "Estate Code #9042 • Park on lawn",
    bringList: ["🔥 4x Sekelbos Wood", "🧊 6x Bags of Ice", "🥗 Potato Salad"],
    initialSquad: [
      { name: "Riaan & Ané (+1)", rail: "Capitec Pay", item: "🔥 4x Sekelbos Wood", paid: true },
      { name: "Sipho Dladla", rail: "Capitec Pay", item: "🧊 6x Bags of Ice", paid: true },
      { name: "Francois du Toit", rail: "Apple Pay", item: "🥗 Potato Salad", paid: true },
      { name: "Thabo Mbeki-K", rail: "Instant EFT", item: "Full Spitbraai", paid: true },
      { name: "Zintle Dlamini", rail: "Capitec Pay", item: "Full Spitbraai", paid: true },
    ],
  },
  {
    id: "pot",
    presetKey: "pot",
    tag: "DIGNITY POT",
    emoji: "🎁",
    title: "Zanele's Surprise Baby Shower & Pram Kitty",
    venue: "Secret Tea Garden, Morningside",
    when: "Sun 11:00",
    host: "Mbali Khumalo",
    bank: "Nedbank Direct Split",
    defaultPrice: 150,
    defaultSpots: 12,
    secretPin: "Pergola Table 4 • Amounts Hidden",
    bringList: ["🎂 Cupcake Platter", "🎈 Helium Arch"],
    initialSquad: [
      { name: "Mbali Khumalo", rail: "Capitec Pay", item: "🎂 Cupcake Platter", paid: true },
      { name: "Nomvula K", rail: "Capitec Pay", item: "🎈 Helium Arch", paid: true },
      { name: "Ané van der Walt", rail: "Apple Pay", item: "Gift Kitty", paid: true },
      { name: "Fatima Patel", rail: "Instant EFT", item: "Gift Kitty", paid: true },
    ],
  },
];

const EXTRA_SIMULATED_GUESTS = [
  { name: "Bongani Ndlovu", rail: "Capitec Pay" as const, item: "Locked in 8s ⚡" },
  { name: "Chloe Botha", rail: "Apple Pay" as const, item: "Locked in 6s ⚡" },
  { name: "Lindiwe Buthelezi", rail: "Capitec Pay" as const, item: "Locked in 9s ⚡" },
  { name: "Sarel v.d. Westhuizen", rail: "Instant EFT" as const, item: "Locked in 11s ⚡" },
  { name: "Zola Mokoena", rail: "Capitec Pay" as const, item: "Locked in 7s ⚡" },
  { name: "Kabelo Sithole", rail: "Apple Pay" as const, item: "Locked in 5s ⚡" },
];

export default function Redesign1ReceiptSandbox() {
  const [activeTemplateId, setActiveTemplateId] = useState<string>("fives");
  const activeTemplate =
    SANDBOX_TEMPLATES.find((t) => t.id === activeTemplateId) || SANDBOX_TEMPLATES[0];

  const [spotPriceZar, setSpotPriceZar] = useState<number>(activeTemplate.defaultPrice);
  const [maxSpots, setMaxSpots] = useState<number>(activeTemplate.defaultSpots);
  const [squad, setSquad] = useState(activeTemplate.initialSquad);
  const [bundleTwoSpots, setBundleTwoSpots] = useState<boolean>(false);
  const [justLockedName, setJustLockedName] = useState<string | null>(null);

  const handleSelectTemplate = (tpl: SandboxTemplate) => {
    triggerHaptic("selection");
    setActiveTemplateId(tpl.id);
    setSpotPriceZar(tpl.defaultPrice);
    setMaxSpots(tpl.defaultSpots);
    setSquad(tpl.initialSquad);
    setJustLockedName(null);
  };

  const handleAdjustPrice = (delta: number) => {
    triggerHaptic("light");
    setSpotPriceZar((prev) => Math.min(2000, Math.max(50, prev + delta)));
  };

  const handleAdjustSpots = (delta: number) => {
    triggerHaptic("light");
    setMaxSpots((prev) => Math.min(40, Math.max(squad.length, Math.max(2, prev + delta))));
  };

  const handleSimulateFriendPay = () => {
    if (squad.length >= maxSpots) return;
    triggerHaptic("success");
    const nextGuest =
      EXTRA_SIMULATED_GUESTS[squad.length % EXTRA_SIMULATED_GUESTS.length];
    setSquad((prev) => [...prev, { ...nextGuest, paid: true }]);
    setJustLockedName(nextGuest.name);
  };

  const handleResetSimulation = () => {
    triggerHaptic("light");
    setSquad(activeTemplate.initialSquad);
    setJustLockedName(null);
  };

  const split = calculateCheckoutSplit(spotPriceZar, bundleTwoSpots ? 2 : 1);
  const lockedCount = squad.length;
  const isSoldOut = lockedCount >= maxSpots;
  const hostCollectedSoFarZar = lockedCount * spotPriceZar;
  const hostFullTargetZar = maxSpots * spotPriceZar;
  const progressPct = Math.min(100, Math.round((lockedCount / maxSpots) * 100));

  return (
    <div className="min-h-screen bg-[#F5F1E8] text-[#111315] selection:bg-[#007749] selection:text-white">
      {/* =====================================================================
          STICKY TOP NEO-BRUTALIST LEDGER HUD BAR (8px Grid Aligned)
         ===================================================================== */}
      <header className="sticky top-0 z-40 border-b-2 border-[#111315] bg-[#F5F1E8]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <PullThruIconSvg size={36} />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-lg font-black tracking-tight text-[#111315]">
                    PULLTHRU
                  </span>
                  <SouthAfricaFlagSvg className="h-3.5 w-5 border border-[#111315]/20" />
                  <span className="hidden sm:inline-block rounded-none border border-[#111315] bg-[#FFB81C] px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#111315]">
                    LEDGER v2.6
                  </span>
                </div>
                <p className="text-[11px] font-medium text-[#475569] hidden sm:block">
                  Zero-Custody WhatsApp Event &amp; Kitty Splitter
                </p>
              </div>
            </Link>
          </div>

          {/* Live HUD Ticker in Top Bar */}
          <div className="hidden lg:flex items-center gap-4 border border-[#111315] bg-white px-4 py-1.5 shadow-[2px_2px_0px_#111315]">
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="h-2 w-2 rounded-full bg-[#007749] animate-pulse" />
              <span className="uppercase tracking-wider text-[#475569]">Host Fee:</span>
              <span className="font-mono-num font-black text-[#007749]">R0.00 (100% Payout)</span>
            </div>
            <span className="text-[#111315]/30">|</span>
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="uppercase tracking-wider text-[#475569]">Live Sandbox Pool:</span>
              <span className="font-mono-num font-black text-[#111315]">
                {formatZar(hostCollectedSoFarZar)} / {formatZar(hostFullTargetZar)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/create?preset=${activeTemplate.presetKey}`}
              onClick={() => triggerHaptic("medium")}
              className="inline-flex items-center gap-2 border-2 border-[#111315] bg-[#007749] px-4 py-2 text-xs sm:text-sm font-black uppercase tracking-wider text-white shadow-[3px_3px_0px_#111315] transition-transform duration-150 hover:bg-[#005F3A] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              <span>⚡ Publish Link (25s)</span>
              <ArrowRight className="h-4 w-4 stroke-[2.5]" />
            </Link>
          </div>
        </div>
      </header>

      {/* =====================================================================
          FIRST 100VH STAGE: ZERO-FRICTION INTERACTIVE SPLIT & RECEIPT SANDBOX
         ===================================================================== */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          {/* LEFT 7 COLUMNS: TACTILE VIBE CARTRIDGES + LIVEKITTY CONTROLS */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 border border-[#111315] bg-white px-3 py-1 text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0px_#111315]">
              <Receipt className="h-3.5 w-3.5 text-[#D94E28]" />
              <span>Interactive Split Sandbox • Test It Right Here</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-[56px] font-black tracking-tight leading-[1.02] text-[#111315]">
              No payment,{" "}
              <span className="underline decoration-[#D94E28] decoration-4 underline-offset-4">
                no name on the sheet.
              </span>
            </h1>

            <p className="max-w-xl text-base sm:text-lg font-medium text-[#334155] leading-relaxed">
              Stop chasing blurry EFT screenshots on Friday afternoon. Pick an event cartridge below, tweak the spot price, and tap{" "}
              <strong className="font-bold text-[#111315]">&ldquo;Simulate Friend Paying&rdquo;</strong> to watch how your squad locks in.
            </p>

            {/* STEP 1: TACTILE VIBE CARTRIDGE SELECTOR */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#475569]">
                  01 / SELECT EVENT CARTRIDGE
                </span>
                <span className="font-mono text-xs font-bold text-[#007749]">
                  Tap to switch live receipt →
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {SANDBOX_TEMPLATES.map((tpl) => {
                  const isSelected = tpl.id === activeTemplate.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleSelectTemplate(tpl)}
                      style={{
                        transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                      }}
                      className={`group flex flex-col items-start justify-between border-2 p-3 text-left transition-all duration-150 active:scale-[0.96] cursor-pointer ${
                        isSelected
                          ? "border-[#111315] bg-[#111315] text-white shadow-[4px_4px_0px_#007749]"
                          : "border-[#111315] bg-white text-[#111315] shadow-[3px_3px_0px_#111315] hover:bg-[#FAF8F5]"
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="text-2xl">{tpl.emoji}</span>
                        <span
                          className={`font-mono text-[10px] font-bold px-1.5 py-0.5 border ${
                            isSelected
                              ? "border-white/30 bg-white/10 text-[#FFB81C]"
                              : "border-[#111315]/20 bg-[#F5F1E8] text-[#111315]"
                          }`}
                        >
                          R{tpl.defaultPrice}
                        </span>
                      </div>
                      <div className="mt-2.5">
                        <p className="font-mono text-[10px] font-bold uppercase tracking-wider opacity-75">
                          {tpl.tag}
                        </p>
                        <p className="font-display text-xs sm:text-sm font-extrabold leading-tight mt-0.5">
                          {tpl.id === "fives"
                            ? "5-a-Side Pitch"
                            : tpl.id === "padel"
                            ? "Padel 4-Ball"
                            : tpl.id === "braai"
                            ? "Spitbraai"
                            : "Baby Shower"}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 2: PHYSICAL HARDWARE-STYLE +/- CONTROLS FOR SPOT PRICE & CAPACITY */}
            <div className="border-2 border-[#111315] bg-white p-5 shadow-[4px_4px_0px_#111315] space-y-5">
              <div className="flex items-center justify-between border-b border-[#111315]/15 pb-3">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#111315]">
                  02 / CONFIGURE KITTY MATH (ZERO HOST FEE)
                </span>
                <span className="border border-[#007749] bg-[#007749]/10 px-2 py-0.5 font-mono text-[11px] font-bold text-[#007749]">
                  100% TO YOUR BANK
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Control A: Spot Price */}
                <div className="border border-[#111315] bg-[#F5F1E8] p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold uppercase text-[#475569]">
                      Host Spot Price
                    </span>
                    <span className="font-mono-num text-2xl font-black text-[#007749]">
                      {formatZar(spotPriceZar)}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-4 gap-1.5">
                    {[
                      { label: "-R50", delta: -50 },
                      { label: "-R10", delta: -10 },
                      { label: "+R10", delta: 10 },
                      { label: "+R50", delta: 50 },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => handleAdjustPrice(btn.delta)}
                        className="border border-[#111315] bg-white py-1.5 font-mono-num text-xs font-extrabold text-[#111315] shadow-[2px_2px_0px_#111315] transition-transform active:scale-95 active:shadow-none hover:bg-[#FFB81C]/30 cursor-pointer"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Control B: Spot Capacity */}
                <div className="border border-[#111315] bg-[#F5F1E8] p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold uppercase text-[#475569]">
                      Max Squad Spots
                    </span>
                    <span className="font-mono-num text-2xl font-black text-[#111315]">
                      {maxSpots} spots
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-4 gap-1.5">
                    {[
                      { label: "-2", delta: -2 },
                      { label: "-1", delta: -1 },
                      { label: "+1", delta: 1 },
                      { label: "+4", delta: 4 },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => handleAdjustSpots(btn.delta)}
                        className="border border-[#111315] bg-white py-1.5 font-mono-num text-xs font-extrabold text-[#111315] shadow-[2px_2px_0px_#111315] transition-transform active:scale-95 active:shadow-none hover:bg-[#FFB81C]/30 cursor-pointer"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Split Ledger Strip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#111315]/15 pt-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic("selection");
                      setBundleTwoSpots(!bundleTwoSpots);
                    }}
                    className={`border px-3 py-1.5 font-mono text-xs font-bold transition-all cursor-pointer ${
                      bundleTwoSpots
                        ? "border-[#111315] bg-[#FFB81C] text-[#111315] shadow-[2px_2px_0px_#111315]"
                        : "border-[#111315] bg-[#F5F1E8] text-[#111315]"
                    }`}
                  >
                    {bundleTwoSpots ? "✓ +1 Couple Bundle (2 Spots)" : "Solo Guest (1 Spot)"}
                  </button>
                  <span className="text-xs font-medium text-[#475569]">
                    Guest pays{" "}
                    <strong className="font-mono-num font-bold text-[#111315]">
                      {formatZar(split.totalChargedZar)}
                    </strong>{" "}
                    ({formatZar(split.totalBasePriceZar)} to you + {formatZar(split.platformFeeZar)} clearing)
                  </span>
                </div>

                <div className="text-right">
                  <span className="font-mono text-[10px] font-bold uppercase text-[#475569] block">
                    FULL POT PAYOUT TO YOUR BANK
                  </span>
                  <span className="font-mono-num text-xl font-black text-[#007749]">
                    {formatZar(hostFullTargetZar)}
                  </span>
                </div>
              </div>
            </div>

            {/* STEP 3: SIMULATE FRIEND PAYING vs LAUNCH REAL LINK */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                disabled={isSoldOut}
                onClick={handleSimulateFriendPay}
                style={{
                  transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                }}
                className={`flex-1 flex items-center justify-center gap-2.5 border-2 border-[#111315] px-5 py-4 font-display text-sm sm:text-base font-black uppercase tracking-wide transition-all active:scale-[0.97] cursor-pointer ${
                  isSoldOut
                    ? "bg-[#E6E2D8] text-[#475569] cursor-not-allowed"
                    : "bg-[#FFB81C] text-[#111315] shadow-[4px_4px_0px_#111315] hover:bg-[#f2ab13]"
                }`}
              >
                <Zap className="h-5 w-5 fill-current" />
                <span>
                  {isSoldOut
                    ? `SQUAD FULL (${lockedCount}/${maxSpots} LOCKED)`
                    : `Simulate Friend Paying +${formatZar(spotPriceZar)} (${lockedCount}/${maxSpots})`}
                </span>
              </button>

              {squad.length > activeTemplate.initialSquad.length && (
                <button
                  type="button"
                  onClick={handleResetSimulation}
                  title="Reset simulated squad"
                  className="inline-flex items-center justify-center gap-1.5 border-2 border-[#111315] bg-white px-4 py-4 font-mono text-xs font-bold uppercase text-[#111315] shadow-[4px_4px_0px_#111315] active:scale-95 cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Reset</span>
                </button>
              )}

              <Link
                href={`/create?preset=${activeTemplate.presetKey}`}
                onClick={() => triggerHaptic("medium")}
                className="inline-flex items-center justify-center gap-2 border-2 border-[#111315] bg-[#007749] px-6 py-4 font-display text-sm sm:text-base font-black uppercase tracking-wide text-white shadow-[4px_4px_0px_#111315] transition-all hover:bg-[#005F3A] active:scale-[0.97]"
              >
                <span>Build My Link</span>
                <ArrowRight className="h-4 w-4 stroke-[2.5]" />
              </Link>
            </div>
          </div>

          {/* RIGHT 5 COLUMNS: PERFORATED THERMAL SPLIT RECEIPT & LIVE ROLL-CALL */}
          <div className="lg:col-span-5">
            <div className="relative border-2 border-[#111315] bg-white shadow-[8px_8px_0px_#111315]">
              {/* Top Perforated Zigzag Edge Effect */}
              <div
                aria-hidden="true"
                className="h-3 w-full bg-[#111315]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 8px 0px, #F5F1E8 5px, transparent 6px)",
                  backgroundSize: "16px 12px",
                }}
              />

              <div className="p-5 sm:p-6 space-y-4">
                {/* Receipt Header */}
                <div className="flex items-start justify-between border-b-2 border-dashed border-[#111315]/30 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="border border-[#111315] bg-[#111315] px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-[#FFB81C]">
                        {activeTemplate.tag}
                      </span>
                      <span className="font-mono text-xs font-bold text-[#475569]">
                        {activeTemplate.when}
                      </span>
                    </div>
                    <h2 className="font-display mt-2 text-xl font-black text-[#111315] leading-snug">
                      {activeTemplate.emoji} {activeTemplate.title}
                    </h2>
                    <p className="mt-0.5 font-mono text-xs text-[#475569]">
                      Host: <strong className="text-[#111315]">{activeTemplate.host}</strong> •{" "}
                      {activeTemplate.bank}
                    </p>
                  </div>
                </div>

                {/* Live Kitty Progress Meter */}
                <div className="border-2 border-[#111315] bg-[#F5F1E8] p-3.5">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="font-mono text-[10px] font-bold uppercase text-[#475569] block">
                        HOST BANK SETTLEMENT POT
                      </span>
                      <span className="font-mono-num text-2xl sm:text-3xl font-black text-[#007749]">
                        {formatZar(hostCollectedSoFarZar)}
                      </span>
                      <span className="font-mono-num text-xs font-bold text-[#475569] ml-1.5">
                        / {formatZar(hostFullTargetZar)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-mono-num text-sm font-black text-[#111315] block">
                        {lockedCount} / {maxSpots} LOCKED
                      </span>
                      <span className="font-mono text-[10px] font-bold uppercase text-[#D94E28]">
                        {maxSpots - lockedCount === 0
                          ? "🔥 100% SOLD OUT"
                          : `${maxSpots - lockedCount} SPOTS LEFT`}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 h-3 w-full border border-[#111315] bg-white overflow-hidden">
                    <div
                      className="h-full bg-[#007749] transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Toast when user simulates a friend paying */}
                {justLockedName && (
                  <div className="flex items-center justify-between border border-[#007749] bg-[#007749]/10 px-3 py-2 text-xs font-bold text-[#007749]">
                    <span>⚡ {justLockedName} locked in via Capitec Pay!</span>
                    <span className="font-mono-num">+{formatZar(spotPriceZar)}</span>
                  </div>
                )}

                {/* Squad Roll-Call Ledger Rows */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                      VERIFIED SQUAD SHEET ({lockedCount})
                    </span>
                    <span className="font-mono text-[11px] font-bold text-[#007749]">
                      SARB Split-at-Source ✓
                    </span>
                  </div>

                  <div className="max-h-60 overflow-y-auto divide-y divide-[#111315]/10 border border-[#111315]">
                    {squad.map((member, index) => (
                      <div
                        key={`${member.name}-${index}`}
                        className={`flex items-center justify-between px-3 py-2 text-xs ${
                          index === squad.length - 1 && justLockedName === member.name
                            ? "bg-[#FFB81C]/25 font-bold"
                            : "bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono-num text-[11px] font-black text-[#475569] w-5">
                            #{index + 1}
                          </span>
                          <div className="truncate">
                            <span className="font-bold text-[#111315]">{member.name}</span>
                            <span className="ml-1.5 text-[11px] text-[#475569]">
                              • {member.item}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono text-[10px] font-semibold text-[#475569] hidden sm:inline">
                            {member.rail}
                          </span>
                          <span className="border border-[#007749] bg-[#007749]/10 px-1.5 py-0.5 font-mono-num text-[11px] font-bold text-[#007749]">
                            {activeTemplate.id === "pot" ? "LOCKED" : formatZar(spotPriceZar)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Secret Gate Code Vault Preview */}
                <div className="flex items-center justify-between border border-dashed border-[#111315] bg-[#FAF8F5] px-3.5 py-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-[#007749] shrink-0" />
                    <span className="font-mono font-bold text-[#111315]">
                      Secret Pin (Unlocked after pay):
                    </span>
                  </div>
                  <span className="font-mono text-[11px] font-semibold text-[#007749] truncate ml-2">
                    {activeTemplate.secretPin}
                  </span>
                </div>

                {/* Receipt Footer Action */}
                <div className="pt-2 border-t-2 border-dashed border-[#111315]/30 flex items-center justify-between">
                  <Link
                    href={`/e/${
                      activeTemplate.id === "fives"
                        ? "thursday-fives-sandton"
                        : activeTemplate.id === "braai"
                        ? "bokke-test-spitbraai"
                        : "mrs-dlamini-baby-shower"
                    }`}
                    className="font-mono text-xs font-bold text-[#111315] underline hover:text-[#007749]"
                  >
                    Open Full Live Event Page →
                  </Link>
                  <span className="font-mono text-[10px] font-bold uppercase text-[#475569]">
                    RECEIPT #PT-{spotPriceZar}-{maxSpots}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================================
            SECOND STAGE: LIVE MZANSI EVENT CATALOG GRID (Strict CSS Grid)
           ===================================================================== */}
        <section className="mt-16 border-t-2 border-[#111315] pt-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#D94E28]">
                03 / LIVE MZANSI TEMPLATES &amp; PUBLIC WALLS
              </span>
              <h2 className="font-display mt-1 text-3xl font-black text-[#111315]">
                Built for how South Africa actually gathers.
              </h2>
            </div>
            <p className="font-mono text-xs font-bold text-[#475569]">
              12 SA BANKS • CAPITEC PAY • APPLE PAY • INSTANT EFT • SPOT-SWAP
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                mode: "FIXED SPLIT",
                title: "5-a-Side & Padel Courts",
                price: "R100 / player",
                desc: "Hard spot cap (e.g. 10/10). Includes 1-tap Spot-Swap if someone pulls a hamstring 2 hours before kickoff.",
                link: "/e/thursday-fives-sandton",
                cta: "Inspect 5-a-Side Wall →",
              },
              {
                mode: "MULTI-TIER",
                title: "Spitbraais & Team Lunches",
                price: "R220 / R140 / R0",
                desc: "Meat + Dop, Meat Only, or Kids Under 12 Mahala. Plus claimable Bring-'n-Bak items (ice, wood, salad).",
                link: "/e/bokke-test-spitbraai",
                cta: "Inspect Spitbraai Wall →",
              },
              {
                mode: "DIGNITY GIFT POT",
                title: "Baby Showers & Imali Yenduduzo",
                price: "Target R3,000",
                desc: "Everyone chips in what they can afford. Names show on the wall, individual Rand amounts stay private.",
                link: "/e/mrs-dlamini-baby-shower",
                cta: "Inspect Gift Pot →",
              },
              {
                mode: "PAYDAY 25TH STANDBY",
                title: "Month-End Payday Pledges",
                price: "25th / 15th / Mon",
                desc: "Broke mid-month? Friends can log a transparent Standby Pledge and settle in 1 tap on payday.",
                link: "/create",
                cta: "Create Event Link →",
              },
            ].map((card) => (
              <Link
                key={card.title}
                href={card.link}
                className="group flex flex-col justify-between border-2 border-[#111315] bg-white p-5 shadow-[4px_4px_0px_#111315] transition-transform hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="border border-[#111315] bg-[#F5F1E8] px-2 py-0.5 font-mono text-[10px] font-bold text-[#111315]">
                      {card.mode}
                    </span>
                    <span className="font-mono-num text-xs font-black text-[#007749]">
                      {card.price}
                    </span>
                  </div>
                  <h3 className="font-display mt-3 text-lg font-black text-[#111315] group-hover:text-[#007749]">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#475569]">{card.desc}</p>
                </div>
                <div className="mt-5 border-t border-[#111315]/15 pt-3 font-mono text-xs font-extrabold text-[#111315] group-hover:text-[#007749]">
                  {card.cta}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
