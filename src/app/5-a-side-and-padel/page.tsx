"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import TastefulAdSlot from "@/components/TastefulAdSlot";
import {
  CheckCircle2,
  ArrowRight,
  Zap,
  ShieldCheck,
  Users,
  Calculator,
  Sparkles,
} from "lucide-react";

const COURT_PRESETS = [
  {
    label: "⚽ 5-a-Side Pitch (10 Players)",
    title: "Thursday Night 5-a-Side Soccer",
    courtTotalZar: 1000,
    players: 10,
  },
  {
    label: "🎾 Padel Peak Court (4 Players)",
    title: "Evening Padel 4-Ball Match",
    courtTotalZar: 600,
    players: 4,
  },
  {
    label: "🎾 Padel Americano (12 Players • 3 Courts)",
    title: "Weekend Padel Americano Social",
    courtTotalZar: 1800,
    players: 12,
  },
  {
    label: "⚽ 7-a-Side League (14 Players)",
    title: "Weeknight 7-a-Side Match",
    courtTotalZar: 1400,
    players: 14,
  },
];

const aeoJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "PullThru 5-a-Side & Padel Court Splitter",
      applicationCategory: "SportsApplication, FinanceApplication",
      operatingSystem: "Web, Android, iOS",
      url: "https://pullthru.co.za/5-a-side-and-padel",
      inLanguage: "en-ZA",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "ZAR",
        description:
          "100% Free forever for Padel 4-balls & 5-a-Side squads (up to 30+ spots) and R0.00 guest fees via Direct PayShap or Capitec PayMe.",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How do I split a 5-a-side soccer or Padel court booking on WhatsApp in South Africa?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Create a 15-second match link on PullThru.co.za with your court price and player cap (4 for Padel or 10 for 5-a-side). Paste the link in your WhatsApp group so players lock in their spot via PayShap, Capitec PayMe, or card before kickoff.",
          },
        },
        {
          "@type": "Question",
          name: "What happens if a 5-a-side or Padel player pulls out at the last minute?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "PullThru includes a 1-Tap WhatsApp Spot-Swap link on every player's pass so they can transfer their paid spot to a replacement sub, plus an 80% Flake Cushion option that protects the captain if 1 or 2 players bail.",
          },
        },
      ],
    },
  ],
};

export default function FiveASideAndPadelPage() {
  const [matchTitle, setMatchTitle] = useState("");
  const [courtTotalZar, setCourtTotalZar] = useState(1000);
  const [players, setPlayers] = useState(10);
  const [flakeCushion, setFlakeCushion] = useState(false);

  const safePlayers = Math.max(2, players || 10);
  const safeCourtTotal = Math.max(100, courtTotalZar || 600);
  const guaranteedPlayers = flakeCushion
    ? Math.max(2, Math.floor(safePlayers * 0.8))
    : safePlayers;
  const perPlayerZar = Math.max(
    15,
    Math.ceil(safeCourtTotal / guaranteedPlayers / 5) * 5
  );

  const resolvedMatchTitle =
    matchTitle.trim() ||
    (safePlayers <= 4 ? "Padel 4-Ball" : "Thursday Night 5-a-Side");
  const presetKey =
    resolvedMatchTitle.toLowerCase().includes("padel") || safePlayers <= 4
      ? "padel"
      : "fives";
  const createHref = `/create?preset=${presetKey}&title=${encodeURIComponent(
    resolvedMatchTitle
  )}&price=${perPlayerZar}&spots=${safePlayers}`;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#0F172A]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aeoJsonLd) }}
      />
      <Navbar />

      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <section className="rounded-3xl border border-[#E6E2D8] bg-white p-6 sm:p-10 shadow-xs">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#007749]/25 bg-[#007749]/10 px-3.5 py-1 text-xs font-extrabold text-[#007749]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>100% Free Forever for Padel 4-Balls &amp; 5-a-Side Squads (Up to 30+ Spots) • R0 Guest Fees</span>
          </div>

          <h1 className="font-display mt-4 text-3xl sm:text-5xl font-black tracking-tight text-[#0F172A] leading-[1.1]">
            Stop Paying Out of Your Own Pocket for Empty 5-a-Side Pitches &amp; Padel Courts.
          </h1>

          {/* Answer-First 40-Word Summary for AI Citation */}
          <p className="mt-4 max-w-3xl text-base sm:text-lg text-[#475569] leading-relaxed">
            PullThru is South Africa&apos;s 15-second WhatsApp match roster and court fee splitter for weekly 5-a-side soccer captains and Padel 4-balls. Players lock in their spot via Direct PayShap, Capitec PayMe, Apple Pay, or card with R0 guest fees—enforcing one rule: <strong className="text-[#0F172A]">&ldquo;No Pay, No Name on the Squad Wall.&rdquo;</strong>
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href={createHref}
              className="inline-flex items-center gap-2 rounded-full bg-[#007749] px-7 py-3.5 text-sm font-extrabold text-white shadow-md hover:bg-[#005F3A] transition"
            >
              <Zap className="h-4 w-4 text-[#FFB81C]" />
              <span>Create Match Link ({perPlayerZar ? `R${perPlayerZar}/player` : "15s"})</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/e/thursday-fives-sandton"
              className="inline-flex items-center gap-2 rounded-full border border-[#E6E2D8] bg-[#FAF8F5] px-6 py-3.5 text-sm font-bold text-[#0F172A] hover:bg-white transition"
            >
              <span>Try Live 5-a-Side Sandton Demo →</span>
            </Link>
          </div>
        </section>

        {/* Interactive Court Split & Flake Cushion Calculator */}
        <section className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 rounded-3xl border border-[#E6E2D8] bg-white p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#007749]">
              <Calculator className="h-4 w-4" />
              <span>Interactive Court &amp; Flake Cushion Calculator</span>
            </div>
            <h2 className="font-display mt-2 text-xl sm:text-2xl font-extrabold text-[#0F172A]">
              How Much Should Each Player Pay for Your Court?
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#475569]">
              Pick a preset (Fives Futbol, Padel 4-Ball, or Padel Americano) or enter your exact court fee below.
            </p>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {COURT_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setMatchTitle(p.title);
                    setCourtTotalZar(p.courtTotalZar);
                    setPlayers(p.players);
                  }}
                  className="rounded-full border border-[#E6E2D8] bg-[#FAF8F5] px-3 py-1.5 text-xs font-bold text-[#0F172A] hover:border-[#007749] hover:bg-white transition cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="match-title-input"
                  className="block text-xs font-extrabold uppercase tracking-wider text-[#475569] mb-1"
                >
                  Match / Squad Name
                </label>
                <input
                  id="match-title-input"
                  type="text"
                  value={matchTitle}
                  onChange={(e) => setMatchTitle(e.target.value)}
                  placeholder="e.g. Thursday Night 5-a-Side / Tuesday Padel"
                  className="w-full rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-4 py-2.5 text-sm font-bold text-[#0F172A] focus:border-[#007749] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="court-total-zar"
                    className="block text-xs font-extrabold uppercase tracking-wider text-[#475569] mb-1"
                  >
                    Total Court / Pitch Fee (ZAR)
                  </label>
                  <input
                    id="court-total-zar"
                    type="number"
                    min={100}
                    step={50}
                    value={courtTotalZar}
                    onChange={(e) => setCourtTotalZar(Number(e.target.value) || 0)}
                    className="w-full rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-4 py-2.5 font-mono-num text-sm font-bold text-[#0F172A] focus:border-[#007749] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="court-players"
                    className="block text-xs font-extrabold uppercase tracking-wider text-[#475569] mb-1"
                  >
                    Total Players (Headcount Cap)
                  </label>
                  <input
                    id="court-players"
                    type="number"
                    min={2}
                    max={100}
                    value={players}
                    onChange={(e) => setPlayers(Number(e.target.value) || 2)}
                    className="w-full rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-4 py-2.5 font-mono-num text-sm font-bold text-[#0F172A] focus:border-[#007749] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[#E6E2D8] bg-[#FAF8F5] p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs sm:text-sm font-extrabold text-[#0F172A]">
                  🛡️ Enable 80% Flake Cushion ({guaranteedPlayers} of {safePlayers} players cover 100% of court)
                </p>
                <p className="text-[11px] text-[#475569]">
                  Protects the captain so even if {safePlayers - guaranteedPlayers} players bail, the R{safeCourtTotal} court fee is still 100% covered. Any extra goes to post-match beers or balls!
                </p>
              </div>
              <input
                type="checkbox"
                checked={flakeCushion}
                onChange={(e) => setFlakeCushion(e.target.checked)}
                className="h-5 w-5 accent-[#007749] cursor-pointer shrink-0"
                aria-label="Enable 80% Flake Cushion"
              />
            </div>
          </div>

          <div className="lg:col-span-5 rounded-3xl border border-[#007749]/35 bg-white p-6 sm:p-8 shadow-sm">
            <span className="inline-flex rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-extrabold text-[#007749]">
              Recommended Per-Player Split
            </span>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display font-mono-num text-4xl sm:text-5xl font-black text-[#0F172A]">
                R{perPlayerZar}
              </span>
              <span className="text-sm font-bold text-[#475569]">/ player</span>
            </div>

            <div className="mt-4 space-y-2 rounded-2xl border border-[#E6E2D8] bg-[#FAF8F5] p-4 text-xs">
              <div className="flex justify-between">
                <span className="text-[#475569]">Court Booking Target:</span>
                <span className="font-mono-num font-bold text-[#0F172A]">R{safeCourtTotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#475569]">If all {safePlayers} spots fill:</span>
                <span className="font-mono-num font-bold text-[#007749]">
                  R{perPlayerZar * safePlayers} collected
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#475569]">PullThru Tier:</span>
                <span className="font-bold text-[#007749]">
                  100% Free Squad Tier (Up to 30+ spots • R0 Fee)
                </span>
              </div>
            </div>

            <Link
              href={createHref}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#007749] px-6 py-3.5 text-sm font-extrabold text-white shadow-sm hover:bg-[#005F3A] transition"
            >
              <Zap className="h-4 w-4 text-[#FFB81C]" />
              <span>Launch This Match Link on WhatsApp →</span>
            </Link>
          </div>
        </section>

        {/* Answer-First FAQ Section for AI Citation */}
        <section className="mt-8 rounded-3xl border border-[#E6E2D8] bg-white p-6 sm:p-8 shadow-xs space-y-5">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-extrabold text-[#0F172A]">
              How do I split a 5-a-side soccer or Padel court booking on WhatsApp in South Africa?
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-[#475569] leading-relaxed">
              Create a 15-second match link on PullThru.co.za with your court price and player cap (4 for Padel or 10 for 5-a-side). Paste the link into your WhatsApp group so players lock in their spot via PayShap, Capitec PayMe, or card before kickoff—with 100% of funds settling straight to your South African bank account.
            </p>
          </div>

          <div className="border-t border-[#E6E2D8] pt-5">
            <h2 className="font-display text-lg sm:text-xl font-extrabold text-[#0F172A]">
              What happens if a 5-a-side or Padel player pulls out at the last minute?
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-[#475569] leading-relaxed">
              Every confirmed player receives a 1-Tap WhatsApp Spot-Swap link on their digital pass so they can transfer their locked spot to a replacement sub in seconds without the captain doing manual refunds. Plus, the built-in Team Bib Generator splits your 10 confirmed players into two balanced 5-a-side teams (Dark vs Neon Bibs) in 1 tap.
            </p>
          </div>
        </section>

        {/* Tasteful AdSense / Sports Captain Partner Slot */}
        <div className="mt-8">
          <TastefulAdSlot
            slotId="8842109402"
            variant="light"
            context="sport"
          />
        </div>

        {/* Popular South African Group Tools & Guides Interlinking Hub */}
        <nav
          aria-label="Popular South African Group Tools and Guides"
          className="mt-6 rounded-3xl border border-[#E6E2D8] bg-white p-5 sm:p-6 shadow-2xs"
        >
          <p className="text-xs font-extrabold uppercase tracking-wider text-[#007749] mb-3">
            Popular South African Group Tools &amp; Guides
          </p>
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <Link
              href="/braai-calculator"
              className="rounded-full border border-[#E6E2D8] bg-[#FAF8F5] px-3.5 py-1.5 text-[#0F172A] hover:border-[#007749] transition"
            >
              🥩 Free SA Braai Meat &amp; Kitty Calculator
            </Link>
            <Link
              href="/partiful-south-africa"
              className="rounded-full border border-[#E6E2D8] bg-[#FAF8F5] px-3.5 py-1.5 text-[#0F172A] hover:border-[#007749] transition"
            >
              🎉 Partiful &amp; Luma Alternative SA
            </Link>
            <Link
              href="/quicket-alternative"
              className="rounded-full border border-[#E6E2D8] bg-[#FAF8F5] px-3.5 py-1.5 text-[#0F172A] hover:border-[#007749] transition"
            >
              🎟️ Zero-Fee Quicket Alternative
            </Link>
            <Link
              href="/group-gift-pot"
              className="rounded-full border border-[#E6E2D8] bg-[#FAF8F5] px-3.5 py-1.5 text-[#0F172A] hover:border-[#007749] transition"
            >
              🎁 Baby Shower &amp; Teacher Gift Pot
            </Link>
            <Link
              href="/for-venues"
              className="rounded-full border border-[#E6E2D8] bg-[#FAF8F5] px-3.5 py-1.5 text-[#0F172A] hover:border-[#007749] transition"
            >
              🏟️ For Venues &amp; Clubs Quote Generator
            </Link>
          </div>
        </nav>
      </main>
    </div>
  );
}
