"use client";

import React, { useState } from "react";
import Link from "next/link";
import { calculateCheckoutSplit, formatZar } from "@/lib/fees";
import { triggerHaptic } from "@/lib/haptics";
import { PullThruIconSvg } from "@/components/PullThruLogo";
import { SouthAfricaFlagSvg } from "@/components/Navbar";
import {
  ArrowRight,
  CheckCheck,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Zap,
  Users,
  Calendar,
  MapPin,
} from "lucide-react";

export default function Redesign3WhatsAppEditorial() {
  const [chatMode, setChatMode] = useState<"with_pullthru" | "manual_eft">("with_pullthru");
  const [simulatedPaidCount, setSimulatedPaidCount] = useState<number>(8);
  const [spotPriceZar, setSpotPriceZar] = useState<number>(150);
  const maxSpots = 10;

  const split = calculateCheckoutSplit(spotPriceZar, 1);
  const hostBankBalanceZar = simulatedPaidCount * spotPriceZar;
  const hostTargetZar = maxSpots * spotPriceZar;

  const handleTapWhatsAppCard = () => {
    triggerHaptic("success");
    if (chatMode === "manual_eft") {
      setChatMode("with_pullthru");
      return;
    }
    setSimulatedPaidCount((prev) => (prev < maxSpots ? prev + 1 : 7));
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#181512] selection:bg-[#0B6E4F] selection:text-white">
      {/* =====================================================================
          SWISS EDITORIAL HAIRLINE GRID HEADER
         ===================================================================== */}
      <header className="sticky top-0 z-40 border-b border-[#D8D0C2] bg-[#FAF7F2]/95 backdrop-blur-md">
        <div className="mx-auto grid max-w-7xl grid-cols-12 items-center px-4 sm:px-8">
          <div className="col-span-6 sm:col-span-4 flex items-center gap-3 py-3.5 border-r border-[#D8D0C2] pr-4">
            <Link href="/" className="flex items-center gap-2.5">
              <PullThruIconSvg size={34} />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-base font-black tracking-tight text-[#181512]">
                    PullThru
                  </span>
                  <SouthAfricaFlagSvg className="h-3 w-4.5" />
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#6B6356]">
                  Cape &bull; Jozi &bull; Durban
                </p>
              </div>
            </Link>
          </div>

          <div className="hidden sm:flex sm:col-span-5 items-center justify-between px-6 py-3.5 border-r border-[#D8D0C2] text-xs">
            <span className="font-medium text-[#6B6356]">Host Bank Settlement:</span>
            <span className="font-mono-num font-extrabold text-[#0B6E4F]">
              100% Direct (R0.00 Shortfall)
            </span>
          </div>

          <div className="col-span-6 sm:col-span-3 flex items-center justify-end py-2.5 pl-4">
            <Link
              href="/create"
              onClick={() => triggerHaptic("medium")}
              className="inline-flex items-center gap-2 rounded-full bg-[#0B6E4F] px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-[#08543C] active:scale-95"
            >
              <span>Start an Event</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* =====================================================================
          FIRST 100VH STAGE: SWISS EDITORIAL + INTERACTIVE WHATSAPP THREAD
         ===================================================================== */}
      <main className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 border-x border-b border-[#D8D0C2]">
          {/* LEFT 7 COLUMNS: EDITORIAL MANIFESTO & QUICK STARTERS */}
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 border-b lg:border-b-0 lg:border-r border-[#D8D0C2] flex flex-col justify-between space-y-8">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#0B6E4F]/30 bg-[#0B6E4F]/10 px-3.5 py-1 text-xs font-bold text-[#0B6E4F]">
                <span>🇿🇦 See who&apos;s actually pulling through</span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-[54px] font-black tracking-tight leading-[1.05] text-[#181512]">
                Stop playing unpaid debt collector in your group chat.
              </h1>

              <p className="max-w-xl text-base sm:text-lg text-[#575045] leading-relaxed">
                Toggle the live WhatsApp thread on the right to see the difference. One 25-second link replaces 40 messages of{" "}
                <em className="font-semibold text-[#181512]">
                  &ldquo;Send bank details&rdquo;
                </em>{" "}
                and settles 100% of your target straight to your SA bank account.
              </p>

              {/* Interactive Spot Price Selector */}
              <div className="rounded-2xl border border-[#D8D0C2] bg-white p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#6B6356]">
                    Test Live Payout Math (Select Spot Price):
                  </span>
                  <span className="font-mono-num text-sm font-extrabold text-[#0B6E4F]">
                    Host keeps 100% ({formatZar(spotPriceZar)}/spot)
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[80, 100, 150, 250].map((price) => (
                    <button
                      key={price}
                      type="button"
                      onClick={() => {
                        triggerHaptic("selection");
                        setSpotPriceZar(price);
                      }}
                      className={`rounded-xl border py-2.5 font-mono-num text-xs sm:text-sm font-extrabold transition-all active:scale-95 cursor-pointer ${
                        spotPriceZar === price
                          ? "border-[#0B6E4F] bg-[#0B6E4F] text-white"
                          : "border-[#D8D0C2] bg-[#FAF7F2] text-[#181512] hover:border-[#0B6E4F]"
                      }`}
                    >
                      R{price} / spot
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#EAE3D5] text-xs text-[#575045]">
                  <span>
                    Guest pays{" "}
                    <strong className="font-mono-num text-[#181512]">
                      {formatZar(split.totalChargedZar)}
                    </strong>{" "}
                    via Capitec Pay / Apple Pay
                  </span>
                  <span className="font-mono-num font-bold text-[#0B6E4F]">
                    10 Spots = {formatZar(hostTargetZar)} in your bank
                  </span>
                </div>
              </div>
            </div>

            {/* 1-Tap Vibe Starters Grid */}
            <div className="space-y-3 pt-4 border-t border-[#D8D0C2]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#6B6356]">
                  Pick What You&apos;re Planning (25-Sec Pre-fill):
                </span>
                <Link
                  href="/create"
                  className="text-xs font-bold text-[#0B6E4F] hover:underline"
                >
                  Or start blank →
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { emoji: "⚽", label: "5-a-Side", sub: "10 Spots • R100", href: "/create?preset=fives" },
                  { emoji: "🎾", label: "Padel Court", sub: "4 Spots • R150", href: "/create?preset=padel" },
                  { emoji: "🥩", label: "Spitbraai", sub: "Multi-Tier + Ice", href: "/create?preset=braai" },
                  { emoji: "🎁", label: "Gift Kitty", sub: "Amounts Hidden", href: "/create?preset=pot" },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => triggerHaptic("light")}
                    className="group rounded-2xl border border-[#D8D0C2] bg-white p-3.5 transition-all hover:border-[#0B6E4F] hover:-translate-y-0.5"
                  >
                    <span className="text-xl">{item.emoji}</span>
                    <p className="font-display mt-1.5 text-xs sm:text-sm font-extrabold text-[#181512] group-hover:text-[#0B6E4F]">
                      {item.label}
                    </p>
                    <p className="font-mono text-[10px] text-[#6B6356] mt-0.5">{item.sub}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT 5 COLUMNS: INTERACTIVE WHATSAPP GROUP THREAD SIMULATOR */}
          <div className="lg:col-span-5 bg-[#EAE3D5]/50 p-5 sm:p-7 flex flex-col justify-between space-y-4">
            {/* Before / After Mode Switcher */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#6B6356]">
                  INTERACTIVE WHATSAPP GROUP SIMULATOR
                </span>
                <span className="font-mono text-[10px] font-bold text-[#0B6E4F]">
                  Tap to compare
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-[#D8D0C2] bg-white p-1.5">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("selection");
                    setChatMode("with_pullthru");
                  }}
                  className={`rounded-xl py-2 px-3 text-xs font-extrabold transition-all cursor-pointer ${
                    chatMode === "with_pullthru"
                      ? "bg-[#0B6E4F] text-white shadow-xs"
                      : "text-[#575045] hover:text-[#181512]"
                  }`}
                >
                  ⚡ With PullThru Link
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("selection");
                    setChatMode("manual_eft");
                  }}
                  className={`rounded-xl py-2 px-3 text-xs font-extrabold transition-all cursor-pointer ${
                    chatMode === "manual_eft"
                      ? "bg-rose-700 text-white shadow-xs"
                      : "text-[#575045] hover:text-[#181512]"
                  }`}
                >
                  🤦‍♂️ Manual EFT Chaos
                </button>
              </div>
            </div>

            {/* Simulated WhatsApp Container */}
            <div className="rounded-3xl border border-[#D8D0C2] bg-[#EFEAE2] overflow-hidden shadow-md">
              {/* WhatsApp Top Bar */}
              <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-white/15 flex items-center justify-center text-sm font-bold">
                    ⚽
                  </div>
                  <div>
                    <p className="text-xs font-extrabold leading-tight">
                      Thursday Squad &amp; Braai 🇿🇦
                    </p>
                    <p className="text-[10px] text-white/75">
                      Tariq, Siya, Marco, Tshepo + 18 others
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-white/15 px-2.5 py-0.5 font-mono-num text-[10px] font-bold">
                  {chatMode === "with_pullthru"
                    ? `${simulatedPaidCount}/${maxSpots} Paid`
                    : "4/10 Paid"}
                </span>
              </div>

              {/* Chat Messages Area */}
              <div className="p-4 space-y-3 min-h-[340px] flex flex-col justify-between">
                {chatMode === "with_pullthru" ? (
                  <>
                    {/* Host Message with Rich PullThru OG Preview Card */}
                    <div className="bg-[#D9FDD3] rounded-2xl rounded-tl-sm p-3 border border-black/5 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-bold text-[#0B6E4F]">
                        <span>Tariq (Host)</span>
                        <span>14:02</span>
                      </div>

                      {/* Interactive Rich Preview Card inside WhatsApp */}
                      <div className="rounded-xl border border-[#0B6E4F]/25 bg-white p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="rounded bg-[#0B6E4F]/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#0B6E4F]">
                            PULLTHRU.CO.ZA
                          </span>
                          <span className="font-mono-num text-xs font-black text-[#0B6E4F]">
                            {formatZar(spotPriceZar)} / spot
                          </span>
                        </div>
                        <p className="font-display text-xs sm:text-sm font-extrabold text-[#181512]">
                          Thursday Night Squad • {simulatedPaidCount}/{maxSpots} Spots Locked
                        </p>
                        <div className="h-2 w-full rounded-full bg-[#FAF7F2] overflow-hidden border border-[#D8D0C2]">
                          <div
                            className="h-full bg-[#0B6E4F] transition-all duration-300"
                            style={{ width: `${(simulatedPaidCount / maxSpots) * 100}%` }}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={handleTapWhatsAppCard}
                          className="w-full rounded-lg bg-[#0B6E4F] py-2 text-xs font-bold text-white transition-transform active:scale-95 hover:bg-[#08543C] cursor-pointer"
                        >
                          {simulatedPaidCount < maxSpots
                            ? `⚡ Tap to Simulate Locking Spot #${simulatedPaidCount + 1} (${formatZar(spotPriceZar)})`
                            : "🔥 10/10 FULL! Tap to Reset Demo"}
                        </button>
                      </div>

                      <p className="text-xs text-[#181512]">
                        First 10 paid play. Tap above to lock in with Capitec Pay or Apple Pay ⚡
                      </p>
                    </div>

                    {/* Instant Confirmations */}
                    <div className="space-y-1.5">
                      <div className="bg-white rounded-xl px-3 py-2 text-xs border border-black/5 flex items-center justify-between">
                        <span>
                          <strong>Siya K</strong> locked in Spot #1 + ⚽ Match Ball
                        </span>
                        <CheckCheck className="h-3.5 w-3.5 text-[#0B6E4F]" />
                      </div>
                      <div className="bg-white rounded-xl px-3 py-2 text-xs border border-black/5 flex items-center justify-between">
                        <span>
                          <strong>Marco V</strong> locked in Spot #2 via Apple Pay
                        </span>
                        <CheckCheck className="h-3.5 w-3.5 text-[#0B6E4F]" />
                      </div>
                    </div>
                  </>
                ) : (
                  /* MANUAL EFT CHAOS THREAD */
                  <div className="space-y-2.5 text-xs">
                    <div className="bg-white rounded-xl p-2.5 border border-black/5">
                      <span className="font-bold text-rose-800 block text-[10px]">Bra Jabu</span>
                      Bro please send your account number again? My banking app is buffering 😭
                    </div>
                    <div className="bg-white rounded-xl p-2.5 border border-black/5">
                      <span className="font-bold text-amber-800 block text-[10px]">Kabelo</span>
                      Put me down! I&apos;ll EFT you on Friday after work I promise 🤞
                    </div>
                    <div className="bg-white rounded-xl p-2.5 border border-black/5">
                      <span className="font-bold text-purple-800 block text-[10px]">Devon</span>
                      Sorry boys pulled my calf, can someone take my spot or EFT me back?
                    </div>
                    <div className="bg-rose-100 border border-rose-300 rounded-xl p-3 text-rose-950 font-semibold">
                      ⚠️ Result at Kickoff: Only 6 paid, 3 ghosted, Host is{" "}
                      <strong className="font-mono-num">{formatZar(spotPriceZar * 4)}</strong> out of pocket at reception.
                    </div>
                  </div>
                )}

                {/* Bottom Live Host Bank Ledger Counter */}
                <div className="rounded-2xl border border-[#D8D0C2] bg-white p-3 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-[10px] font-bold uppercase text-[#6B6356] block">
                      {chatMode === "with_pullthru"
                        ? "HOST BANK SETTLEMENT (CAPITEC/FNB)"
                        : "MANUAL EFT SHORTFALL"}
                    </span>
                    <span
                      className={`font-mono-num text-lg font-black ${
                        chatMode === "with_pullthru" ? "text-[#0B6E4F]" : "text-rose-700"
                      }`}
                    >
                      {chatMode === "with_pullthru"
                        ? `${formatZar(hostBankBalanceZar)} / ${formatZar(hostTargetZar)}`
                        : `-${formatZar(spotPriceZar * 4)} Out of Pocket`}
                    </span>
                  </div>

                  <Link
                    href="/create"
                    className="rounded-full bg-[#181512] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#0B6E4F] transition"
                  >
                    Create Link →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
