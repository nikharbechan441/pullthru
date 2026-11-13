"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  Clock,
  Users,
  Zap,
} from "lucide-react";

const VENUE_PRESETS = [
  {
    label: "⚽ 5-a-Side / Padel Club",
    name: "Fives Futbol / Padel Court",
    price: 110,
    spots: 10,
  },
  {
    label: "🎬 Private Cinema / Screening",
    name: "Private Cinema Screening & Pizza",
    price: 150,
    spots: 24,
  },
  {
    label: "🥾 Hiking / Adventure Club",
    name: "Weekend Trail Hike & Permit Split",
    price: 65,
    spots: 20,
  },
  {
    label: "🏆 Social Tournament / Quiz Bash",
    name: "Team Tournament Entry Table",
    price: 180,
    spots: 10,
  },
  {
    label: "🏎️ Go-Karting / Paintball",
    name: "Grand Prix Karting",
    price: 380,
    spots: 12,
  },
  {
    label: "💆‍♀️ Day Spa / Bridal Pamper",
    name: "Group Spa Morning",
    price: 650,
    spots: 10,
  },
  {
    label: "👨‍🍳 Cooking Class / Wine Tour",
    name: "Group Culinary & Tasting Session",
    price: 550,
    spots: 14,
  },
  {
    label: "⛺ Group Glamping / Safari Lodge",
    name: "Weekend Group Getaway",
    price: 1200,
    spots: 10,
  },
];

export default function ForVenuesPage() {
  const [venueName, setVenueName] = useState("");
  const [defaultPrice, setDefaultPrice] = useState(250);
  const [defaultSpots, setDefaultSpots] = useState(10);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  const cleanVenue = venueName.trim() || "Your Venue";
  const prefilledUrl = `https://pullthru.co.za/create?venue=${encodeURIComponent(
    cleanVenue
  )}&price=${Math.max(15, defaultPrice || 100)}&spots=${Math.max(
    2,
    defaultSpots || 10
  )}`;

  const htmlBadgeSnippet = `<!-- PullThru Group Deposit Split Helper for ${cleanVenue} -->
<div style="margin:16px 0;padding:14px 18px;border:1px solid #007749;border-radius:12px;background:#FAF8F5;font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:#0F172A;">
  <strong>Splitting your ${cleanVenue} booking with a group?</strong> Collect everyone's R${Math.max(
    15,
    defaultPrice || 100
  )} share on WhatsApp in 15 seconds via PayShap, Capitec PayMe, or card using <a href="${prefilledUrl}" target="_blank" rel="noopener" style="color:#007749;font-weight:700;text-decoration:underline;">PullThru South Africa (Free WhatsApp Group Kitty Link)</a>.
</div>`;

  const handleCopyEmbed = async () => {
    try {
      await navigator.clipboard.writeText(htmlBadgeSnippet);
      setCopiedEmbed(true);
      setTimeout(() => setCopiedEmbed(false), 2500);
    } catch {
      // ignore
    }
  };

  const quoteSnippetText = `💡 Splitting this booking with your group? Instead of chasing everyone on WhatsApp for EFTs, use this free 15-second link to collect R${Math.max(
    15,
    defaultPrice || 100
  )} per person from your ${Math.max(
    2,
    defaultSpots || 10
  )} guests via PayShap, Capitec Pay, or card so you can confirm your deposit on time:\n${prefilledUrl}`;

  const handleCopySnippet = async () => {
    try {
      await navigator.clipboard.writeText(quoteSnippetText);
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(prefilledUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FAF8F5] text-[#0F172A]">
      <Navbar />

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        {/* Hero */}
        <section className="rounded-3xl border border-[#E6E2D8] bg-white p-6 sm:p-10 shadow-xs">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#007749]/25 bg-[#007749]/10 px-3.5 py-1 text-xs font-extrabold text-[#007749]">
            <Building2 className="h-3.5 w-3.5" />
            <span>For South African Venues, Clubs, Spas, Tours &amp; Lodges</span>
          </div>

          <h1 className="font-display mt-4 text-3xl sm:text-5xl font-black tracking-tight text-[#0F172A] leading-[1.1]">
            Stop Losing Provisional Group Bookings While the Organiser Chases Friends on WhatsApp.
          </h1>

          <p className="mt-4 max-w-3xl text-base sm:text-lg text-[#475569] leading-relaxed">
            When a customer enquires for 10 to 20 people—whether it&apos;s a birthday table, bachelor karting race, bridal shower spa morning, cooking class, or 5-a-side league—they hesitate to pay your full deposit out of their own pocket while waiting days for their friends to EFT them back.{" "}
            <strong className="text-[#0F172A]">
              PullThru helps your customer collect their group&apos;s money on WhatsApp in one afternoon, so they pay your single lump-sum invoice on time.
            </strong>
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-[#E6E2D8] bg-[#FAF8F5] p-4">
              <div className="flex items-center gap-2 text-sm font-extrabold text-[#007749]">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>R0 Cost to Your Venue</span>
              </div>
              <p className="mt-1 text-xs text-[#475569] leading-relaxed">
                Zero commission deducted from your rates. Any small R1–R2 split fee is covered by the guests chipping in.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E6E2D8] bg-[#FAF8F5] p-4">
              <div className="flex items-center gap-2 text-sm font-extrabold text-[#007749]">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>You Still Get 1 Lump-Sum Payment</span>
              </div>
              <p className="mt-1 text-xs text-[#475569] leading-relaxed">
                Your accounts desk never reconciles 15 separate EFTs. The group organiser collects from their friends into their own bank account and pays your invoice once.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E6E2D8] bg-[#FAF8F5] p-4">
              <div className="flex items-center gap-2 text-sm font-extrabold text-[#007749]">
                <Clock className="h-4 w-4 shrink-0" />
                <span>Zero POS or IT Integration</span>
              </div>
              <p className="mt-1 text-xs text-[#475569] leading-relaxed">
                Nothing to install. Just paste a 2-line helper link into your standard group quote email or WhatsApp reply.
              </p>
            </div>
          </div>
        </section>

        {/* Interactive Quote Snippet Generator */}
        <section className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 min-w-0 rounded-3xl border border-[#E6E2D8] bg-white p-6 sm:p-8 shadow-xs">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FFB81C]/20 border border-[#FFB81C]/40 px-3 py-1 text-xs font-extrabold text-[#0F172A]">
              <Sparkles className="h-3.5 w-3.5 text-[#007749]" />
              <span>10-Second Bookings Desk Tool</span>
            </div>
            <h2 className="font-display mt-3 text-xl sm:text-2xl font-extrabold text-[#0F172A]">
              Generate Your Custom Venue Quote Snippet
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#475569]">
              Pick your venue type or type your business name below. Your bookings team can paste the generated PS into any group quote email or WhatsApp message.
            </p>

            {/* Quick Presets */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {VENUE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setVenueName(preset.name);
                    setDefaultPrice(preset.price);
                    setDefaultSpots(preset.spots);
                  }}
                  className="rounded-full border border-[#E6E2D8] bg-[#FAF8F5] px-3 py-1.5 text-xs font-bold text-[#0F172A] hover:border-[#007749] hover:bg-white transition cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="venue-name-input"
                  className="block text-xs font-extrabold uppercase tracking-wider text-[#475569] mb-1"
                >
                  Your Venue or Business Name
                </label>
                <input
                  id="venue-name-input"
                  type="text"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="e.g. Life Day Spa / Fives Futbol / Stir Crazy Cooking"
                  className="w-full rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-4 py-2.5 text-sm font-bold text-[#0F172A] focus:border-[#007749] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="venue-price-input"
                    className="block text-xs font-extrabold uppercase tracking-wider text-[#475569] mb-1"
                  >
                    Per-Person Share (ZAR)
                  </label>
                  <input
                    id="venue-price-input"
                    type="number"
                    min={15}
                    value={defaultPrice}
                    onChange={(e) => setDefaultPrice(Number(e.target.value) || 0)}
                    className="w-full rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-4 py-2.5 font-mono-num text-sm font-bold text-[#0F172A] focus:border-[#007749] focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="venue-spots-input"
                    className="block text-xs font-extrabold uppercase tracking-wider text-[#475569] mb-1"
                  >
                    Typical Group Size
                  </label>
                  <input
                    id="venue-spots-input"
                    type="number"
                    min={2}
                    max={200}
                    value={defaultSpots}
                    onChange={(e) => setDefaultSpots(Number(e.target.value) || 2)}
                    className="w-full rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-4 py-2.5 font-mono-num text-sm font-bold text-[#0F172A] focus:border-[#007749] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Copyable Quote PS & Live Preview */}
          <div className="lg:col-span-6 min-w-0 rounded-3xl border border-[#007749]/30 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#007749]">
                Ready-to-Paste Quote PS (Email or WhatsApp)
              </span>
              <span className="font-mono-num rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-[#007749]">
                Total Group Value: R
                {(Math.max(15, defaultPrice || 100) * Math.max(2, defaultSpots || 10)).toLocaleString(
                  "en-ZA"
                )}
              </span>
            </div>

            <div className="mt-3 rounded-2xl border border-[#E6E2D8] bg-[#FAF8F5] p-4 text-xs sm:text-sm text-[#0F172A] leading-relaxed whitespace-pre-wrap break-all sm:break-words font-medium">
              {quoteSnippetText}
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleCopySnippet}
                className="flex items-center justify-center gap-2 rounded-full bg-[#007749] px-5 py-3 text-xs sm:text-sm font-extrabold text-white shadow-xs hover:bg-[#005F3A] transition cursor-pointer"
              >
                {copiedSnippet ? (
                  <>
                    <Check className="h-4 w-4 text-[#FFB81C]" />
                    <span>Copied Quote Snippet!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copy Quote PS for Bookings Desk</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-2 rounded-full border border-[#E6E2D8] bg-white px-5 py-3 text-xs sm:text-sm font-bold text-[#0F172A] hover:border-[#007749] transition cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-4 w-4 text-[#007749]" />
                    <span>Copied Pre-Filled Link!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-[#007749]" />
                    <span>Copy Pre-Filled Link Only</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-[#E6E2D8] flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-[#475569]">
                Want to see what your customer sees when they tap the link?
              </span>
              <Link
                href={`/create?venue=${encodeURIComponent(
                  cleanVenue
                )}&price=${Math.max(15, defaultPrice || 100)}&spots=${Math.max(
                  2,
                  defaultSpots || 10
                )}`}
                className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#007749] hover:underline"
              >
                <span>Open Pre-Filled Organiser View</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* How Venues Use PullThru in 3 Steps */}
        <section className="mt-8 rounded-3xl border border-[#E6E2D8] bg-white p-6 sm:p-8 shadow-xs">
          <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#0F172A]">
            Why 90+ South African Activity, Hospitality &amp; Sports Venues Share PullThru With Group Enquiries
          </h2>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-2xl border border-[#E6E2D8] bg-[#FAF8F5] p-5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#007749] text-white font-black text-xs">
                1
              </span>
              <h3 className="font-display mt-3 text-base font-extrabold text-[#0F172A]">
                Customer Enquires for a Group of 10–20
              </h3>
              <p className="mt-1.5 text-xs text-[#475569] leading-relaxed">
                Your bookings desk sends your normal quote or provisional invoice, and includes your 1-line PullThru helper link at the bottom.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E6E2D8] bg-[#FAF8F5] p-5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#007749] text-white font-black text-xs">
                2
              </span>
              <h3 className="font-display mt-3 text-base font-extrabold text-[#0F172A]">
                Organiser Collects on WhatsApp in Hours
              </h3>
              <p className="mt-1.5 text-xs text-[#475569] leading-relaxed">
                The organiser drops their PullThru link into their WhatsApp group. Every friend locks in their spot and pays via PayShap, Capitec PayMe, Apple Pay, or card.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E6E2D8] bg-[#FAF8F5] p-5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#007749] text-white font-black text-xs">
                3
              </span>
              <h3 className="font-display mt-3 text-base font-extrabold text-[#0F172A]">
                Your Deposit is Paid in Full Before Deadline
              </h3>
              <p className="mt-1.5 text-xs text-[#475569] leading-relaxed">
                With all guest shares collected upfront, the organiser settles your single venue deposit on time—eliminating last-minute drop-offs and empty slots.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#007749]/25 bg-[#007749]/[0.05] p-4 sm:p-5">
            <div>
              <p className="text-sm font-extrabold text-[#0F172A]">
                Need a custom branded link or have a question for your bookings team?
              </p>
              <p className="text-xs text-[#475569]">
                Email Nikhar directly at{" "}
                <a
                  href="mailto:support@pullthru.co.za"
                  className="font-bold text-[#007749] underline"
                >
                  support@pullthru.co.za
                </a>{" "}
                and we will set up a custom preset for your venue for free.
              </p>
            </div>
            <Link
              href="/e/thursday-fives-sandton"
              className="inline-flex items-center gap-2 rounded-full bg-[#0F172A] px-5 py-2.5 text-xs font-extrabold text-white hover:bg-slate-800 transition"
            >
              <Users className="h-3.5 w-3.5 text-[#FFB81C]" />
              <span>View Live Demo Group Wall →</span>
            </Link>
          </div>
        </section>

        {/* Website Group Bookings Page Badge & HTML Embed Generator */}
        <section className="mt-8 rounded-3xl border border-[#E6E2D8] bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#007749]">
                🔗 For Your Website&apos;s &ldquo;Group Bookings / FAQ&rdquo; Page
              </span>
              <h2 className="font-display mt-1 text-lg sm:text-xl font-extrabold text-[#0F172A]">
                Add a 1-Click Group Split Helper Box to Your Website
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-[#475569]">
                Paste this lightweight HTML callout on your Group Bookings, Birthday Packages, or FAQ page so organisers can split deposits before they even email your desk.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyEmbed}
              className="inline-flex items-center gap-2 rounded-full bg-[#007749] px-5 py-2.5 text-xs font-extrabold text-white hover:bg-[#005F3A] transition cursor-pointer"
            >
              {copiedEmbed ? (
                <>
                  <Check className="h-4 w-4 text-[#FFB81C]" />
                  <span>Copied Website HTML Snippet!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy Website HTML Badge</span>
                </>
              )}
            </button>
          </div>
          <pre className="mt-4 overflow-x-auto rounded-2xl border border-[#E6E2D8] bg-[#FAF8F5] p-4 font-mono text-[11px] text-[#0F172A]">
            {htmlBadgeSnippet}
          </pre>
        </section>
      </main>
    </div>
  );
}
