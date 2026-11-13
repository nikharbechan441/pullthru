"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Ticket,
  Flame,
  Calendar,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Crown,
  Users,
  CheckCircle2,
  ChevronRight,
  Smartphone,
  Search,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptics";
import { formatZar } from "@/lib/fees";
import { EventItem, EventMode } from "@/types/database";
import { SouthAfricaFlagSvg } from "@/components/Navbar";
import { PullThruIconSvg } from "@/components/PullThruLogo";

interface MobileHomeFeedProps {
  events: Array<{
    slug: string;
    mode: EventMode;
    modeLabel: string;
    category: string;
    title: string;
    hostName: string;
    eventDate: string;
    locationName: string;
    priceZar: number;
    spotsLocked: number;
    maxSpots: number | null;
    targetPotZar?: number | null;
    raisedZar?: number;
  }>;
}

export default function MobileHomeFeed({ events }: MobileHomeFeedProps) {
  const [userName, setUserName] = useState<string | null>(null);
  const [savedPassSlug, setSavedPassSlug] = useState<string | null>(null);
  const [savedPassRef, setSavedPassRef] = useState<string | null>(null);
  const [savedPassRsvpId, setSavedPassRsvpId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const rawProfile = localStorage.getItem("pullthru_guest_profile");
      if (rawProfile) {
        const parsed = JSON.parse(rawProfile);
        if (parsed.buyerName) {
          setUserName(parsed.buyerName.split(" ")[0]);
        }
      }

      // Check for saved passes
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("pullthru_ref_")) {
          const s = key.replace("pullthru_ref_", "");
          const ref = localStorage.getItem(key);
          const rsvpId = localStorage.getItem(`pullthru_rsvpid_${s}`);
          if (ref && rsvpId) {
            setSavedPassSlug(s);
            setSavedPassRef(ref);
            setSavedPassRsvpId(rsvpId);
            break;
          }
        }
      }
    } catch {
      // storage access safe
    }
  }, []);

  const filteredEvents = selectedCategory === "all"
    ? events
    : events.filter(e => {
        if (selectedCategory === "sports") return e.category.includes("5-a-Side") || e.category.includes("Run");
        if (selectedCategory === "braai") return e.category.includes("Spitbraai") || e.category.includes("Braai");
        if (selectedCategory === "pot") return e.mode === "pot";
        return true;
      });

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-24 text-[#0F172A] px-4 pt-3.5">
      {/* 1. APP TOP NAVIGATION BAR */}
      <header className="flex items-center justify-between pb-3.5 border-b border-[#E6E2D8]">
        <div className="flex items-center gap-2.5">
          <div className="shrink-0">
            <PullThruIconSvg size={38} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display text-base font-black tracking-tight text-[#0F172A]">
                PullThru
              </span>
              <SouthAfricaFlagSvg className="h-3 w-4.5" />
            </div>
            <p className="text-[11px] font-semibold text-[#64748B]">
              Howzit, {userName || "there"} 👋
            </p>
          </div>
        </div>

        <Link
          href="/create"
          onClick={() => triggerHaptic("medium")}
          className="tap-tactile inline-flex items-center gap-1.5 rounded-full bg-[#007749] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#005F3A]"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>+ New Event</span>
        </Link>
      </header>

      {/* 2. ACTIVE TICKET NOTIFICATION PILL (IF USER HAS ONE) */}
      {savedPassSlug && savedPassRef && savedPassRsvpId && (
        <div className="mt-3.5 animate-in fade-in slide-in-from-top-2">
          <Link
            href={`/e/${savedPassSlug}/success?ref=${savedPassRef}&rsvpId=${savedPassRsvpId}`}
            onClick={() => triggerHaptic("selection")}
            className="tap-tactile flex items-center justify-between rounded-2xl border border-[#007749]/30 bg-[#007749]/10 p-3.5 shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#007749] text-white">
                <Ticket className="h-4.5 w-4.5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#007749]">
                  Your Ticket is Ready
                </span>
                <p className="text-xs font-extrabold text-[#0F172A]">
                  Tap to view Gate Code &amp; QR Pass →
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-[#007749]" />
          </Link>
        </div>
      )}

      {/* 3. WELCOME HERO: "WHERE TO START" (CLEAN, HUMAN & CONVERSATIONAL) */}
      <div className="mt-4 rounded-3xl border border-[#E6E2D8] bg-white p-5 shadow-xs">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#007749]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#007749]">
          <Sparkles className="h-3 w-3" />
          <span>See who&apos;s actually pulling through</span>
        </span>

        <h2 className="font-display mt-2 text-xl font-black text-[#0F172A] leading-snug">
          Get the crew together without the payment drama.
        </h2>
        <p className="mt-1.5 text-xs text-[#64748B] leading-relaxed">
          Drop a link in WhatsApp. Friends lock in their spot via Direct PayShap, Capitec PayMe (R0 Guest Fee), or Cash on Arrival. 100% of the cash lands straight in your bank.
        </p>

        {/* 2 Primary Action Paths */}
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <Link
            href="/create"
            onClick={() => triggerHaptic("medium")}
            className="tap-tactile flex flex-col items-center justify-center rounded-2xl bg-gradient-to-tr from-[#007749] to-[#00A362] p-3 text-white shadow-xs text-center group"
          >
            <Plus className="h-5 w-5 stroke-[2.5] mb-1 group-hover:scale-110 transition" />
            <span className="text-xs font-black">Start an Event</span>
            <span className="text-[10px] text-white/80">Ready in seconds</span>
          </Link>

          <Link
            href="/e/thursday-fives-sandton"
            onClick={() => triggerHaptic("selection")}
            className="tap-tactile flex flex-col items-center justify-center rounded-2xl border border-[#E6E2D8] bg-[#FAF8F5] p-3 text-[#0F172A] shadow-xs text-center hover:border-[#007749]/30 transition"
          >
            <Flame className="h-5 w-5 stroke-[2] text-[#007749] mb-1" />
            <span className="text-xs font-black">Browse Live Events</span>
            <span className="text-[10px] text-[#64748B]">See how it works</span>
          </Link>
        </div>
      </div>

      {/* 4. QUICK VIBE PRESETS */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display text-xs font-black uppercase tracking-wider text-[#64748B]">
            What are you planning?
          </h3>
          <span className="text-[10px] font-bold text-[#007749]">1-Tap Pre-fill</span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <Link
            href="/create?preset=fives"
            onClick={() => triggerHaptic("selection")}
            className="tap-tactile flex flex-col items-center justify-center rounded-2xl border border-[#E6E2D8] bg-white p-2.5 text-center shadow-xs hover:border-[#007749] transition"
          >
            <span className="text-xl">⚽</span>
            <span className="mt-1 text-[10px] font-extrabold text-[#0F172A]">5-a-Side</span>
          </Link>

          <Link
            href="/create?preset=braai"
            onClick={() => triggerHaptic("selection")}
            className="tap-tactile flex flex-col items-center justify-center rounded-2xl border border-[#E6E2D8] bg-white p-2.5 text-center shadow-xs hover:border-[#007749] transition"
          >
            <span className="text-xl">🥩</span>
            <span className="mt-1 text-[10px] font-extrabold text-[#0F172A]">Braai</span>
          </Link>

          <Link
            href="/create?preset=pot"
            onClick={() => triggerHaptic("selection")}
            className="tap-tactile flex flex-col items-center justify-center rounded-2xl border border-[#E6E2D8] bg-white p-2.5 text-center shadow-xs hover:border-[#007749] transition"
          >
            <span className="text-xl">🎁</span>
            <span className="mt-1 text-[10px] font-extrabold text-[#0F172A]">Gift Pot</span>
          </Link>

          <Link
            href="/create?preset=padel"
            onClick={() => triggerHaptic("selection")}
            className="tap-tactile flex flex-col items-center justify-center rounded-2xl border border-[#E6E2D8] bg-white p-2.5 text-center shadow-xs hover:border-[#007749] transition"
          >
            <span className="text-xl">🎾</span>
            <span className="mt-1 text-[10px] font-extrabold text-[#0F172A]">Padel</span>
          </Link>
        </div>

        {/* Zero-Shortfall Host Payout Proof Banner */}
        <div className="mt-3 flex items-center justify-between rounded-2xl border border-[#007749]/25 bg-[#007749]/[0.06] px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#007749] shrink-0" />
            <p className="text-[11px] font-semibold text-[#0F172A]">
              <strong className="text-[#007749]">R0 Guest Fees &amp; Free for 1–6 Spots:</strong> Ask for R150, get R150 in your bank.
            </p>
          </div>
          <Link
            href="/create"
            className="text-[11px] font-extrabold text-[#007749] shrink-0 ml-2 underline"
          >
            Try it →
          </Link>
        </div>

        {/* Free Braai Meat, Ice & Kitty Calculator Lead Magnet */}
        <Link
          href="/braai-calculator"
          onClick={() => triggerHaptic("selection")}
          className="tap-tactile mt-2.5 flex items-center justify-between rounded-2xl border border-[#E6E2D8] bg-white px-3.5 py-2.5 shadow-2xs hover:border-[#007749] transition"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-base">🥩</span>
            <div>
              <p className="text-[11px] font-extrabold text-[#0F172A]">
                Free SA Braai Meat &amp; Ice Calculator
              </p>
              <p className="text-[10px] font-medium text-[#64748B]">
                Work out exact wors, chops &amp; ice per head → 1-tap Kitty link
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-[#007749] shrink-0" />
        </Link>
      </div>

      {/* 5. 3-STEP WORKFLOW GUIDE (CLEAR, HUMAN & GROUNDED) */}
      <div id="how-it-works" className="mt-5 rounded-3xl border border-[#E6E2D8] bg-[#F3F0EA]/70 p-4 scroll-mt-16">
        <h3 className="font-display text-xs font-black uppercase tracking-wider text-[#0F172A] mb-3 flex items-center gap-1.5">
          <span>How It Works</span>
        </h3>

        <div className="space-y-2.5">
          <div className="flex items-start gap-3 bg-white p-3 rounded-2xl border border-[#E6E2D8]/60 shadow-2xs">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#007749] text-white text-[10px] font-black">
              1
            </span>
            <div className="text-xs">
              <strong className="text-[#0F172A]">Make a link:</strong>
              <p className="text-[#64748B] text-[11px] mt-0.5">Pick a name, spot price, and where to send the cash.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-white p-3 rounded-2xl border border-[#E6E2D8]/60 shadow-2xs">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#007749] text-white text-[10px] font-black">
              2
            </span>
            <div className="text-xs">
              <strong className="text-[#0F172A]">Send it in WhatsApp:</strong>
              <p className="text-[#64748B] text-[11px] mt-0.5">Friends pay you directly via PayShap, Capitec PayMe, or Cash. No app install needed.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-white p-3 rounded-2xl border border-[#E6E2D8]/60 shadow-2xs">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#007749] text-white text-[10px] font-black">
              3
            </span>
            <div className="text-xs">
              <strong className="text-[#0F172A]">Show up &amp; enjoy:</strong>
              <p className="text-[#64748B] text-[11px] mt-0.5">Paid spots are locked in real time. Zero chasing, zero excuses.</p>
            </div>
          </div>
        </div>

        {/* 3-Tier Pure SaaS Pricing Summary Strip for Mobile Visitors */}
        <div id="calculator" className="mt-3 rounded-2xl border border-[#007749]/25 bg-white p-3 shadow-2xs scroll-mt-16">
          <p className="text-[10px] font-black uppercase tracking-wider text-[#007749] mb-2">
            🇿🇦 Pure SaaS Pricing (R0 Guest Fee Forever)
          </p>
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="rounded-xl bg-[#FAF8F5] border border-[#E6E2D8] p-2">
              <p className="font-mono-num text-xs font-black text-[#007749]">R0 Free</p>
              <p className="text-[11px] font-bold text-[#0F172A] mt-0.5">1–6 Spots</p>
              <p className="text-[10px] text-[#64748B]">Padel &amp; Chillas</p>
            </div>
            <div className="rounded-xl bg-[#007749]/[0.06] border border-[#007749]/30 p-2">
              <p className="font-mono-num text-xs font-black text-[#0F172A]">R29 Boost</p>
              <p className="text-[11px] font-bold text-[#007749] mt-0.5">7+ Spots</p>
              <p className="text-[10px] text-[#64748B]">Or bake +R2/spot</p>
            </div>
            <div className="rounded-xl bg-[#0F172A] text-white p-2">
              <p className="font-mono-num text-xs font-black text-[#FFB81C]">R79/mo</p>
              <p className="text-[11px] font-bold text-white mt-0.5">Club Pass</p>
              <p className="text-[10px] text-slate-300">Unlimited Pro</p>
            </div>
          </div>
        </div>
      </div>

      {/* 6. LIVE SQUADS SECTION (WITH FILTER PILLS) */}
      <div id="live-events" className="mt-6 scroll-mt-16">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-display text-sm font-black text-[#0F172A]">
              Live Interactive Demos
            </h3>
            <p className="text-[11px] text-[#64748B]">Tap any demo to see RSVPs and payments in action</p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => {
              triggerHaptic("selection");
              setSelectedCategory("all");
            }}
            className={`tap-tactile rounded-full px-3 py-1 text-xs font-bold shrink-0 transition ${
              selectedCategory === "all"
                ? "bg-[#007749] text-white shadow-2xs"
                : "border border-[#E6E2D8] bg-white text-[#64748B]"
            }`}
          >
            All ({events.length})
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic("selection");
              setSelectedCategory("sports");
            }}
            className={`tap-tactile rounded-full px-3 py-1 text-xs font-bold shrink-0 transition ${
              selectedCategory === "sports"
                ? "bg-[#007749] text-white shadow-2xs"
                : "border border-[#E6E2D8] bg-white text-[#64748B]"
            }`}
          >
            ⚽ 5-a-Side &amp; Run
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic("selection");
              setSelectedCategory("braai");
            }}
            className={`tap-tactile rounded-full px-3 py-1 text-xs font-bold shrink-0 transition ${
              selectedCategory === "braai"
                ? "bg-[#007749] text-white shadow-2xs"
                : "border border-[#E6E2D8] bg-white text-[#64748B]"
            }`}
          >
            🥩 Spitbraai
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic("selection");
              setSelectedCategory("pot");
            }}
            className={`tap-tactile rounded-full px-3 py-1 text-xs font-bold shrink-0 transition ${
              selectedCategory === "pot"
                ? "bg-[#007749] text-white shadow-2xs"
                : "border border-[#E6E2D8] bg-white text-[#64748B]"
            }`}
          >
            🎁 Gift Pot
          </button>
        </div>

        {/* Event Cards List */}
        <div className="mt-2 space-y-3">
          {filteredEvents.map((ev) => {
            const isFull = ev.maxSpots !== null && ev.spotsLocked >= ev.maxSpots;
            const spotsLeft =
              ev.maxSpots !== null ? Math.max(0, ev.maxSpots - ev.spotsLocked) : null;
            const pct =
              ev.maxSpots !== null
                ? Math.min(100, Math.round((ev.spotsLocked / ev.maxSpots) * 100))
                : 100;

            return (
              <Link
                key={ev.slug}
                href={`/e/${ev.slug}`}
                onClick={() => triggerHaptic("selection")}
                className="tap-tactile animate-fade-in-up block rounded-2xl border border-[#E6E2D8] bg-white p-3.5 shadow-xs transition-all duration-200 hover:border-[#007749] hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#0F172A] bg-[#FAF8F5] border border-[#E6E2D8] px-2 py-0.5 rounded-md">
                    {ev.category}
                  </span>
                  <span className="font-mono-num text-xs font-black text-[#007749]">
                    {ev.mode === "free"
                      ? "FREE"
                      : ev.mode === "pot"
                      ? `From ${formatZar(ev.priceZar)}`
                      : formatZar(ev.priceZar)}
                  </span>
                </div>

                <h4 className="font-display mt-1.5 text-xs font-black text-[#0F172A] leading-snug">
                  {ev.title}
                </h4>

                <div className="mt-1 flex items-center justify-between text-[10px] text-[#64748B]">
                  <span>{ev.eventDate}</span>
                  <span className="text-[#007749] font-bold">
                    {ev.maxSpots ? `${ev.spotsLocked}/${ev.maxSpots} spots` : `${ev.spotsLocked} going`}
                  </span>
                </div>

                <div className="mt-1.5 h-1 w-full rounded-full bg-[#EFECE6] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#007749]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 7. TRUST FOOTER NOTE */}
      <div className="mt-6 mb-4 text-center">
        <p className="text-[10px] text-[#64748B] flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-[#007749]" />
          <span>Pure SaaS Event Tracker • Direct PayShap &amp; Capitec PayMe (R0 Guest Fee)</span>
        </p>
      </div>
    </div>
  );
}
