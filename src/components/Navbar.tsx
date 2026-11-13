"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  ArrowUpRight,
  ChevronDown,
  Crown,
  CheckCircle2,
  Sparkles,
  Share2,
  Star,
  Zap,
  ShieldCheck,
  Users,
  ArrowRight,
  Check,
} from "lucide-react";
import { PullThruIconSvg } from "@/components/PullThruLogo";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.pullthru.za";
const QUICK_TOUR_SEEN_KEY = "pullthru_quick_tour_seen_v1";

export const QUICK_TOUR_STEPS = [
  {
    step: 1,
    badge: "Step 1 of 3 • 25-Second Setup",
    title: "Pick a Vibe & Set Your Split (or 80% Flake Cushion)",
    description:
      "Choose a 1-tap preset (⚽ 5-a-Side, 🎾 Padel, 🥩 Spitbraai, or 🎁 Gift Pot). Set your spot price or turn on the 🛡️ 80% Flake Cushion so your venue booking is 100% covered even if 1 or 2 people bail.",
    highlights: [
      "1–100+ spots are 100% R0 Free (no paywalls)",
      "8-Second 3-input setup for 5-a-side, padel & braais",
      "Optional Bring-'n-Bak checklist for ice, wood & salads",
    ],
  },
  {
    step: 2,
    badge: "Step 2 of 3 • Direct to Your Bank",
    title: "Drop the Link in WhatsApp — Get Paid Upfront",
    description:
      "Share your PullThru link in the WhatsApp group. Friends lock in their spots in seconds via Direct PayShap or 1-Tap Capitec PayMe straight into your bank account with R0.00 guest fees.",
    highlights: [
      "100% instant payout straight to your SA bank account",
      "Built-in Proof-of-Payment (POP) SMS & slip verifier",
      "Secret Gate PIN & venue details unlock only after locking in",
    ],
  },
  {
    step: 3,
    badge: "Step 3 of 3 • Zero Admin at Kickoff",
    title: "Live Squad Wall, 1-Tap Spot-Swap & Shortfall Split",
    description:
      "Watch the ranked Squad Wall fill up in real time. If someone bails, they can 1-Tap Swap their spot to a sub—or if only 8 of 10 pitch up, use the Host Shortfall Recalculator to lock headcount and split the difference in 1 tap.",
    highlights: [
      "4-digit Gate Check-In PINs & offline-ready guest list",
      "1-Tap Lock Squad at 8/8 & copy WhatsApp top-up split",
      "Full POPIA privacy & Dignity Mode for gift pots",
    ],
  },
] as const;

const KNOWN_EVENT_TITLES: Record<string, string> = {
  "thursday-fives-sandton": "⚽ Thursday 5-a-Side @ Fives Sandton",
  "bokke-test-spitbraai": "🥩 Springboks vs All Blacks Spitbraai",
  "mrs-dlamini-baby-shower": "🎁 Zanele's Baby Shower & Pram Pot",
  "clifton-sunset-catamaran": "⛵ Chloe's 25th Sunset Catamaran",
  "seapoint-sunrise-run-club": "🏃 Sea Point Prom 5km Run Club",
};

function formatSlugToTitle(slug: string): string {
  if (KNOWN_EVENT_TITLES[slug]) {
    return KNOWN_EVENT_TITLES[slug];
  }
  const cleaned = slug.replace(/-[a-f0-9]{6}$/i, "").replace(/-/g, " ");
  return cleaned.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function SouthAfricaFlagSvg({ className = "h-4 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 90 60"
      className={`${className} rounded-[3px] shadow-xs ring-1 ring-black/10 shrink-0`}
      aria-label="South African Flag"
    >
      <rect width="90" height="30" fill="#E03C31" />
      <rect y="30" width="90" height="30" fill="#001489" />
      <polygon points="0,0 16,0 46,20 90,20 90,40 46,40 16,60 0,60" fill="#FFFFFF" />
      <polygon points="0,0 10,0 44,23 90,23 90,37 44,37 10,60 0,60 0,50 30,30 0,10" fill="#007749" />
      <polygon points="0,10 30,30 0,50" fill="#FFB81C" />
      <polygon points="0,15 22,30 0,45" fill="#000000" />
    </svg>
  );
}

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [myEventsOpen, setMyEventsOpen] = useState(false);
  const [showQuickTour, setShowQuickTour] = useState(false);
  const [quickTourStep, setQuickTourStep] = useState(0);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [hostedSlugs, setHostedSlugs] = useState<string[]>([]);
  const [guestSlugs, setGuestSlugs] = useState<string[]>([]);
  const [guestName, setGuestName] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleOpenQuickTour = useCallback(() => {
    setQuickTourStep(0);
    setShowQuickTour(true);
    setMobileMenuOpen(false);
    setMyEventsOpen(false);
  }, []);

  const handleCloseQuickTour = useCallback(() => {
    setShowQuickTour(false);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(QUICK_TOUR_SEEN_KEY, "true");
      } catch {
        // ignore
      }
    }
  }, []);

  const handleShareApp = useCallback(async () => {
    if (typeof window === "undefined") return;
    const shareTitle = "PullThru — WhatsApp Event RSVP & Kitty App for South Africa";
    const shareText =
      "🇿🇦 Stop chasing EFTs on WhatsApp! Use PullThru to create a 25-second event link for 5-a-side, Padel, Braais & Gift Pots — friends pay you 100% directly via PayShap or Capitec PayMe (R0 Guest Fee):";
    const shareUrl = "https://pullthru.co.za";

    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      }
    } catch {
      // User cancelled or Web Share API unavailable — fallback to clipboard + WhatsApp
    }

    const fullMsg = `${shareText}\n👉 ${shareUrl}\n📱 Google Play: ${PLAY_STORE_URL}`;
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(fullMsg);
        setCopiedShareLink(true);
        setTimeout(() => setCopiedShareLink(false), 3000);
        return;
      } catch {
        // fallback to WhatsApp
      }
    }
    window.open(
      `https://wa.me/?text=${encodeURIComponent(fullMsg)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }, []);

  const handleRateApp = useCallback(() => {
    if (typeof window === "undefined") return;
    const isAndroid = /android/i.test(navigator.userAgent || "");
    if (isAndroid) {
      window.location.href = "market://details?id=com.pullthru.za";
      setTimeout(() => {
        window.open(PLAY_STORE_URL, "_blank", "noopener,noreferrer");
      }, 450);
    } else {
      window.open(PLAY_STORE_URL, "_blank", "noopener,noreferrer");
    }
  }, []);

  const removeSavedEvent = useCallback((slugToRemove: string) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(`pullthru_host_${slugToRemove}`);
      localStorage.removeItem(`pullthru_ref_${slugToRemove}`);
      localStorage.removeItem(`pullthru_rsvpid_${slugToRemove}`);
      const rawUnlocked = localStorage.getItem("pullthru_unlocked_events");
      if (rawUnlocked) {
        const parsed = JSON.parse(rawUnlocked);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((s) => String(s).trim() !== slugToRemove);
          localStorage.setItem("pullthru_unlocked_events", JSON.stringify(filtered));
        }
      }
      setHostedSlugs((prev) => prev.filter((s) => s !== slugToRemove));
      setGuestSlugs((prev) => prev.filter((s) => s !== slugToRemove));
    } catch {
      // ignore
    }
  }, []);

  const clearAllSavedEvents = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const IGNORED_HOST_KEYS = new Set([
        "pullthru_host_profile_v1",
        "pullthru_host_token",
      ]);
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          key.startsWith("pullthru_host_") &&
          !IGNORED_HOST_KEYS.has(key)
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      localStorage.removeItem("pullthru_unlocked_events");
      setHostedSlugs([]);
      setGuestSlugs([]);
    } catch {
      // ignore
    }
  }, []);

  const scanSavedEvents = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const IGNORED_HOST_KEYS = new Set([
        "pullthru_host_profile_v1",
        "pullthru_host_token",
      ]);
      const foundHostSlugs: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          key.startsWith("pullthru_host_") &&
          !IGNORED_HOST_KEYS.has(key)
        ) {
          const slug = key.replace("pullthru_host_", "").trim();
          // Auto-clean legacy test slugs created during preset testing
          if (slug.startsWith("saturday-champions-cup-spitbraai-kuier-")) {
            localStorage.removeItem(key);
            continue;
          }
          if (slug && !foundHostSlugs.includes(slug)) {
            foundHostSlugs.push(slug);
          }
        }
      }
      setHostedSlugs(foundHostSlugs);

      const rawUnlocked = localStorage.getItem("pullthru_unlocked_events");
      if (rawUnlocked) {
        const parsed = JSON.parse(rawUnlocked);
        if (Array.isArray(parsed)) {
          const uniqueGuests = parsed
            .map((s) => String(s).trim())
            .filter(
              (s) =>
                Boolean(s) &&
                !foundHostSlugs.includes(s) &&
                !s.startsWith("saturday-champions-cup-spitbraai-kuier-")
            );
          setGuestSlugs(Array.from(new Set(uniqueGuests)));
        }
      } else {
        setGuestSlugs([]);
      }

      const rawProfile = localStorage.getItem("pullthru_guest_profile");
      if (rawProfile) {
        const parsedProfile = JSON.parse(rawProfile);
        if (parsedProfile?.buyerName) {
          setGuestName(String(parsedProfile.buyerName));
        }
      }
    } catch {
      // Ignore storage access errors in private browsing
    }
  }, []);

  useEffect(() => {
    scanSavedEvents();
    window.addEventListener("focus", scanSavedEvents);
    window.addEventListener("storage", scanSavedEvents);
    const onOpenTour = () => handleOpenQuickTour();
    window.addEventListener("pullthru:open-quick-tour", onOpenTour);
    return () => {
      window.removeEventListener("focus", scanSavedEvents);
      window.removeEventListener("storage", scanSavedEvents);
      window.removeEventListener("pullthru:open-quick-tour", onOpenTour);
    };
  }, [scanSavedEvents, handleOpenQuickTour]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMyEventsOpen(false);
      }
    }
    if (myEventsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [myEventsOpen]);

  const totalSavedCount = hostedSlugs.length + guestSlugs.length;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E6E2D8] bg-[#FAF8F5]/90 backdrop-blur-md print:hidden">
      {/* Subtle 3px 6-Colour South African Flag Accent Line */}
      <div
        className="h-[3px] w-full"
        style={{
          background:
            "linear-gradient(to right, #E03C31 0% 20%, #FFFFFF 20% 25%, #007749 25% 65%, #FFB81C 65% 75%, #0F172A 75% 80%, #001489 80% 100%)",
        }}
      />

      <div className="mx-auto flex max-w-7xl items-center justify-between px-3.5 py-2.5 sm:px-8 sm:py-3">
        {/* Clean Editorial Brand Mark */}
        <Link href="/" className="group flex items-center gap-2 sm:gap-2.5 focus:outline-none shrink-0">
          <div className="shrink-0 transition-transform duration-200 group-hover:scale-105">
            <PullThruIconSvg size={32} />
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="font-display text-lg sm:text-xl font-black tracking-tight text-[#0F172A]">
              PullThru
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[#E6E2D8] bg-white px-2 py-0.5 text-[11px] font-semibold text-[#475569]">
              <SouthAfricaFlagSvg className="h-3 w-4.5" />
              <span>.co.za</span>
            </span>
          </div>
        </Link>

        {/* Minimal Desktop Navigation (Flux / Relume Pattern) */}
        <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-[#475569]">
          <button
            type="button"
            onClick={handleOpenQuickTour}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#007749]/30 bg-white px-3 py-1 text-xs font-bold text-[#007749] shadow-2xs hover:bg-[#007749]/10 transition cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>15s Quick Tour</span>
          </button>
          <Link href="/#how-it-works" className="transition-colors hover:text-[#0F172A]">
            How It Works
          </Link>
          <Link href="/#live-events" className="transition-colors hover:text-[#0F172A]">
            Live Squads
          </Link>
          <Link href="/#calculator" className="transition-colors hover:text-[#0F172A]">
            Pricing &amp; Payouts
          </Link>
          <Link
            href="/for-venues"
            className="inline-flex items-center gap-1 rounded-full border border-[#E6E2D8] bg-white px-2.5 py-1 text-xs font-bold text-[#0F172A] hover:border-[#007749] hover:text-[#007749] transition-colors"
          >
            <span>🏟️ For Venues</span>
          </Link>
          <Link href="/help" className="transition-colors hover:text-[#007749] font-semibold">
            🛡️ Buyer Protection &amp; Help
          </Link>
          <button
            type="button"
            onClick={handleShareApp}
            className="inline-flex items-center gap-1 rounded-full bg-[#FAF8F5] border border-[#E6E2D8] px-2.5 py-1 text-xs font-semibold text-[#0F172A] hover:bg-[#F3F0EA] transition cursor-pointer"
            title="Share PullThru with your squad"
          >
            <Share2 className="h-3 w-3 text-[#007749]" />
            <span>{copiedShareLink ? "Copied!" : "Share"}</span>
          </button>
        </nav>

        {/* Returning-Host "My Events" Recovery + Single High-Contrast CTA */}
        <div className="flex items-center gap-2.5">
          <div className="relative" ref={dropdownRef}>
            {hostedSlugs.length === 1 && guestSlugs.length === 0 ? (
              <div className="inline-flex items-center rounded-full border border-[#007749]/30 bg-white shadow-2xs">
                <Link
                  href={`/e/${hostedSlugs[0]}`}
                  className="inline-flex items-center gap-1.5 rounded-l-full pl-3 pr-2 py-1.5 text-xs font-semibold text-[#0F172A] hover:bg-[#FAF8F5] transition-colors"
                  title="Jump straight to your hosted event"
                >
                  <span>👑 My Events (1)</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    scanSavedEvents();
                    setMyEventsOpen((prev) => !prev);
                  }}
                  aria-label="Open My Events menu"
                  aria-expanded={myEventsOpen}
                  className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-r-full border-l border-[#E6E2D8] px-2.5 py-1.5 text-[#475569] hover:bg-[#FAF8F5] hover:text-[#0F172A] transition-colors"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  scanSavedEvents();
                  setMyEventsOpen((prev) => !prev);
                }}
                aria-expanded={myEventsOpen}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                  totalSavedCount > 0
                    ? "border-[#007749]/35 bg-white text-[#0F172A] shadow-2xs hover:bg-[#FAF8F5]"
                    : "border-[#E6E2D8] bg-white/80 text-[#475569] hover:border-[#0F172A]/20 hover:bg-white hover:text-[#0F172A]"
                }`}
              >
                <span>
                  👑 My Events{totalSavedCount > 0 ? ` (${totalSavedCount})` : ""}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${
                    myEventsOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            )}

            {/* Returning-Host & Guest Recovery Popover */}
            {myEventsOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-[#E6E2D8] bg-white p-3.5 shadow-xl z-50">
                <div className="flex items-center justify-between border-b border-[#E6E2D8] pb-2.5 mb-2.5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#007749] flex items-center gap-1">
                      <Crown className="h-3.5 w-3.5" />
                      <span>Your Saved Events</span>
                    </p>
                    <p className="text-[11px] text-[#475569] mt-0.5">
                      {guestName
                        ? `Welcome back, ${guestName}`
                        : "1-click access without digging through WhatsApp"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMyEventsOpen(false)}
                    aria-label="Close saved events menu"
                    className="rounded-lg p-2 text-[#475569] hover:bg-[#FAF8F5] hover:text-[#0F172A] min-h-[40px] min-w-[40px] flex items-center justify-center transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {hostedSlugs.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between px-1 mb-1.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#475569]">
                        👑 Hosted by You ({hostedSlugs.length})
                      </p>
                      <button
                        type="button"
                        onClick={clearAllSavedEvents}
                        className="text-[10px] font-bold text-[#E03C31] hover:underline"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {hostedSlugs.map((slug) => (
                        <div
                          key={slug}
                          className="flex items-center justify-between gap-1.5 rounded-xl border border-[#007749]/25 bg-[#007749]/5 px-2.5 py-1.5 text-xs font-semibold text-[#0F172A] hover:bg-[#007749]/10 transition-colors"
                        >
                          <Link
                            href={`/e/${slug}`}
                            onClick={() => setMyEventsOpen(false)}
                            className="flex flex-1 items-center justify-between min-w-0"
                          >
                            <span className="truncate pr-2">{formatSlugToTitle(slug)}</span>
                            <span className="shrink-0 rounded-full bg-[#007749] px-2 py-0.5 text-[10px] font-bold text-white">
                              Host Wall →
                            </span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeSavedEvent(slug)}
                            aria-label={`Remove ${formatSlugToTitle(slug)} from saved list`}
                            className="shrink-0 rounded-md p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center text-[#475569] hover:bg-black/5 hover:text-[#E03C31] transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {guestSlugs.length > 0 && (
                  <div className="mb-3">
                    <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-[#475569] mb-1.5">
                      🎟️ Your Locked RSVPs ({guestSlugs.length})
                    </p>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {guestSlugs.map((slug) => (
                        <div
                          key={slug}
                          className="flex items-center justify-between gap-1.5 rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-2.5 py-1.5 text-xs font-semibold text-[#0F172A] hover:bg-[#F3F0EA] transition-colors"
                        >
                          <Link
                            href={`/e/${slug}`}
                            onClick={() => setMyEventsOpen(false)}
                            className="flex flex-1 items-center justify-between min-w-0"
                          >
                            <span className="truncate pr-2">{formatSlugToTitle(slug)}</span>
                            <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-[#007749]">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Open</span>
                            </span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeSavedEvent(slug)}
                            aria-label={`Remove ${formatSlugToTitle(slug)} from saved list`}
                            className="shrink-0 rounded-md p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center text-[#475569] hover:bg-black/5 hover:text-[#E03C31] transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {totalSavedCount === 0 && (
                  <div className="rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] p-3 mb-3">
                    <p className="text-xs font-semibold text-[#0F172A]">
                      No hosted events on this device yet
                    </p>
                    <p className="mt-1 text-[11px] text-[#475569] leading-relaxed">
                      When you create an event or lock in a spot, it&apos;s saved here so you can jump back in anytime without searching WhatsApp.
                    </p>
                    <Link
                      href="/e/thursday-fives-sandton"
                      onClick={() => setMyEventsOpen(false)}
                      className="mt-2.5 flex items-center justify-between rounded-lg border border-[#007749]/30 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#007749] hover:bg-[#007749]/5 transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Try Live Demo: 5-a-Side Sandton</span>
                      </span>
                      <span>→</span>
                    </Link>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E6E2D8]">
                  <Link
                    href="/e/thursday-fives-sandton"
                    onClick={() => setMyEventsOpen(false)}
                    className="text-[11px] font-semibold text-[#475569] hover:text-[#0F172A] transition-colors"
                  >
                    ⚽ Demo Event Wall
                  </Link>
                  <Link
                    href="/create"
                    onClick={() => setMyEventsOpen(false)}
                    className="inline-flex items-center gap-1 rounded-full bg-[#007749] px-3 py-1 text-[11px] font-semibold text-white hover:bg-[#005F3A] transition-colors"
                  >
                    <span>+ New Event Link</span>
                  </Link>
                </div>

                {/* Quick Tour, Share App & Rate App Utility Row */}
                <div className="mt-2.5 grid grid-cols-3 gap-1.5 border-t border-[#E6E2D8] pt-2.5">
                  <button
                    type="button"
                    onClick={handleOpenQuickTour}
                    className="flex flex-col items-center justify-center gap-0.5 rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] py-1.5 px-1 text-[10px] font-bold text-[#0F172A] hover:border-[#007749]/40 hover:bg-white transition cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#007749]" />
                    <span>15s Tour</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleShareApp}
                    className="flex flex-col items-center justify-center gap-0.5 rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] py-1.5 px-1 text-[10px] font-bold text-[#0F172A] hover:border-[#007749]/40 hover:bg-white transition cursor-pointer"
                  >
                    <Share2 className="h-3.5 w-3.5 text-[#007749]" />
                    <span>{copiedShareLink ? "Copied!" : "Share App"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRateApp}
                    className="flex flex-col items-center justify-center gap-0.5 rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] py-1.5 px-1 text-[10px] font-bold text-[#0F172A] hover:border-[#FFB81C] hover:bg-white transition cursor-pointer"
                  >
                    <Star className="h-3.5 w-3.5 text-[#FFB81C] fill-[#FFB81C]" />
                    <span>Rate App</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <Link
            href="/create"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[#007749] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition-all hover:bg-[#005F3A] active:scale-[0.99]"
          >
            <span>Create Event Link</span>
            <ArrowUpRight className="h-4 w-4 stroke-[2.2]" />
          </Link>

          <button
            type="button"
            onClick={() => {
              scanSavedEvents();
              setMobileMenuOpen((prev) => !prev);
            }}
            aria-label="Toggle Menu"
            aria-expanded={mobileMenuOpen}
            className="inline-flex lg:hidden items-center justify-center min-h-[44px] min-w-[44px] rounded-xl border border-[#E6E2D8] bg-white p-2.5 text-[#0F172A] hover:bg-[#F3F0EA] transition-colors"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Clean Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-[#E6E2D8] bg-white px-5 py-6 lg:hidden">
          <nav className="flex flex-col space-y-3 text-base font-medium text-[#0F172A]">
            {/* Mobile Returning-Host & Guest Recovery Section */}
            <div className="rounded-2xl border border-[#E6E2D8] bg-[#FAF8F5] p-3.5 mb-1">
              <p className="text-xs font-bold uppercase tracking-wider text-[#007749] mb-2">
                👑 My Events ({totalSavedCount})
              </p>
              {hostedSlugs.length > 0 || guestSlugs.length > 0 ? (
                <div className="space-y-1.5">
                  {hostedSlugs.map((slug) => (
                    <Link
                      key={`host-${slug}`}
                      href={`/e/${slug}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between rounded-xl bg-white border border-[#007749]/25 px-3 py-2 text-xs font-semibold text-[#0F172A]"
                    >
                      <span className="truncate pr-2">👑 {formatSlugToTitle(slug)}</span>
                      <span className="text-[#007749] shrink-0">Host Wall →</span>
                    </Link>
                  ))}
                  {guestSlugs.map((slug) => (
                    <Link
                      key={`guest-${slug}`}
                      href={`/e/${slug}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between rounded-xl bg-white border border-[#E6E2D8] px-3 py-2 text-xs font-semibold text-[#0F172A]"
                    >
                      <span className="truncate pr-2">🎟️ {formatSlugToTitle(slug)}</span>
                      <span className="text-[#007749] shrink-0">Locked RSVP →</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  href="/e/thursday-fives-sandton"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between rounded-xl bg-white border border-[#E6E2D8] px-3 py-2 text-xs font-semibold text-[#007749]"
                >
                  <span>⚽ Demo: Thursday 5-a-Side Sandton</span>
                  <span>Open →</span>
                </Link>
              )}
            </div>

            <button
              type="button"
              onClick={handleOpenQuickTour}
              className="flex items-center justify-between rounded-xl border border-[#007749]/30 bg-[#007749]/5 px-3 py-2.5 text-left text-sm font-bold text-[#007749]"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span>✨ 15-Second Interactive Walkthrough</span>
              </span>
              <span>Start →</span>
            </button>

            <Link
              href="/#live-events"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-2 py-1.5 hover:bg-[#FAF8F5]"
            >
              Live Examples
            </Link>
            <Link
              href="/#modes"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-2 py-1.5 hover:bg-[#FAF8F5]"
            >
              How It Works
            </Link>
            <Link
              href="/#calculator"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-2 py-1.5 hover:bg-[#FAF8F5]"
            >
              Pricing &amp; Payouts
            </Link>
            <Link
              href="/for-venues"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-2 py-1.5 font-semibold text-[#0F172A] hover:bg-[#FAF8F5]"
            >
              🏟️ For Venues, Clubs &amp; Group Bookings
            </Link>
            <Link
              href="/help"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-2 py-1.5 font-semibold text-[#007749] hover:bg-[#FAF8F5]"
            >
              🛡️ Buyer Protection, Refunds &amp; Help
            </Link>
            <Link
              href="/terms"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-2 py-1.5 hover:bg-[#FAF8F5]"
            >
              SARB &amp; Legal
            </Link>

            {/* Share App & Rate App Mobile Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleShareApp}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] py-2.5 px-3 text-xs font-bold text-[#0F172A] hover:bg-[#F3F0EA]"
              >
                <Share2 className="h-3.5 w-3.5 text-[#007749]" />
                <span>{copiedShareLink ? "✅ Link Copied!" : "📲 Share PullThru"}</span>
              </button>
              <button
                type="button"
                onClick={handleRateApp}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] py-2.5 px-3 text-xs font-bold text-[#0F172A] hover:bg-[#F3F0EA]"
              >
                <Star className="h-3.5 w-3.5 text-[#FFB81C] fill-[#FFB81C]" />
                <span>⭐ Rate App</span>
              </button>
            </div>

            <Link
              href="/create"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-2 flex items-center justify-center gap-2 rounded-full bg-[#007749] py-3 text-center text-sm font-semibold text-white"
            >
              <span>Create Event Link (25s)</span>
            </Link>
          </nav>
        </div>
      )}

      {/* 15-Second Interactive Quick Tour Walkthrough Modal */}
      {showQuickTour && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-tour-title"
        >
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[#E6E2D8] bg-white shadow-2xl">
            {/* Top SA Flag Accent Bar */}
            <div
              className="h-1.5 w-full"
              style={{
                background:
                  "linear-gradient(to right, #E03C31 0% 20%, #FFFFFF 20% 25%, #007749 25% 65%, #FFB81C 65% 75%, #0F172A 75% 80%, #001489 80% 100%)",
              }}
            />

            <div className="p-6 sm:p-7">
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#007749]/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#007749]">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{QUICK_TOUR_STEPS[quickTourStep].badge}</span>
                </span>
                <button
                  type="button"
                  onClick={handleCloseQuickTour}
                  aria-label="Close Quick Tour"
                  className="inline-flex items-center gap-1 rounded-full border border-[#E6E2D8] bg-[#FAF8F5] px-3 py-1 text-xs font-semibold text-[#475569] hover:bg-[#F3F0EA] hover:text-[#0F172A] transition cursor-pointer"
                >
                  <span>Skip Tour</span>
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Step Switcher Pills */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                {QUICK_TOUR_STEPS.map((s, idx) => (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => setQuickTourStep(idx)}
                    className={`rounded-xl py-2 px-2.5 text-left border transition cursor-pointer ${
                      quickTourStep === idx
                        ? "border-[#007749] bg-[#007749]/10 text-[#0F172A]"
                        : "border-[#E6E2D8] bg-[#FAF8F5] text-[#475569] hover:bg-white"
                    }`}
                  >
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#007749]">
                      Step {s.step}
                    </p>
                    <p className="text-xs font-bold truncate mt-0.5">
                      {s.step === 1
                        ? "Pick Vibe & Split"
                        : s.step === 2
                        ? "Direct PayShap"
                        : "Live Squad Wall"}
                    </p>
                  </button>
                ))}
              </div>

              <h3
                id="quick-tour-title"
                className="font-display text-xl sm:text-2xl font-black tracking-tight text-[#0F172A]"
              >
                {QUICK_TOUR_STEPS[quickTourStep].title}
              </h3>

              <p className="mt-2.5 text-sm leading-relaxed text-[#475569]">
                {QUICK_TOUR_STEPS[quickTourStep].description}
              </p>

              <div className="mt-4 rounded-2xl border border-[#E6E2D8] bg-[#FAF8F5] p-4 space-y-2">
                {QUICK_TOUR_STEPS[quickTourStep].highlights.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm font-semibold text-[#0F172A]">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#007749] text-white">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {/* Navigation & Action Footer */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#E6E2D8]">
                <div className="flex items-center gap-1.5">
                  {QUICK_TOUR_STEPS.map((s, idx) => (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => setQuickTourStep(idx)}
                      aria-label={`Go to step ${s.step}`}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        quickTourStep === idx ? "w-6 bg-[#007749]" : "w-2 bg-[#CBD5E1]"
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {quickTourStep > 0 && (
                    <button
                      type="button"
                      onClick={() => setQuickTourStep((prev) => Math.max(0, prev - 1))}
                      className="rounded-full border border-[#E6E2D8] bg-white px-4 py-2 text-xs font-bold text-[#0F172A] hover:bg-[#FAF8F5] transition cursor-pointer"
                    >
                      ← Back
                    </button>
                  )}

                  {quickTourStep < QUICK_TOUR_STEPS.length - 1 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setQuickTourStep((prev) => Math.min(QUICK_TOUR_STEPS.length - 1, prev + 1))
                      }
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#0F172A] px-5 py-2.5 text-xs font-extrabold text-white hover:bg-slate-800 transition cursor-pointer"
                    >
                      <span>Next Step</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Link
                        href="/e/thursday-fives-sandton"
                        onClick={handleCloseQuickTour}
                        className="rounded-full border border-[#007749]/30 bg-[#007749]/10 px-3.5 py-2.5 text-xs font-bold text-[#007749] hover:bg-[#007749]/20 transition"
                      >
                        ⚽ Try Live Demo
                      </Link>
                      <Link
                        href="/create"
                        onClick={handleCloseQuickTour}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#007749] px-5 py-2.5 text-xs font-extrabold text-white hover:bg-[#005F3A] transition shadow-sm"
                      >
                        <span>Create Event (25s)</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
