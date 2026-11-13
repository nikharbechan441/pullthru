"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Navbar, { SouthAfricaFlagSvg } from "@/components/Navbar";
import { PullThruIconSvg } from "@/components/PullThruLogo";
import { triggerHaptic } from "@/lib/haptics";
import { calculateCheckoutSplit, formatZar } from "@/lib/fees";
import { EventItem, EventMode } from "@/types/database";
import {
  ArrowRight,
  Trophy,
  Utensils,
  Gift,
  ClipboardCheck,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Calendar,
  MapPin,
  Users,
  Sparkles,
  Smartphone,
} from "lucide-react";

interface ShowcaseEventCard {
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
}

const FALLBACK_EVENTS: ShowcaseEventCard[] = [
  {
    slug: "thursday-fives-sandton",
    mode: "fixed",
    modeLabel: "Fixed Split",
    category: "⚽ 5-a-Side",
    title: "Thursday Night 5-a-Side @ Fives Sandton",
    hostName: "Tariq Davids",
    eventDate: "Thu, 29 Oct • 19:00",
    locationName: "Fives Futbol Sandton, Pitch 3",
    priceZar: 100,
    spotsLocked: 8,
    maxSpots: 10,
  },
  {
    slug: "bokke-test-spitbraai",
    mode: "tiered",
    modeLabel: "Multi-Tier",
    category: "🥩 Spitbraai",
    title: "Bokke vs NZ Saturday Spitbraai",
    hostName: "Riaan van der Merwe",
    eventDate: "Sat, 31 Oct • 14:30",
    locationName: "Riaan's Lapa, Centurion",
    priceZar: 220,
    spotsLocked: 7,
    maxSpots: 20,
  },
  {
    slug: "mrs-dlamini-baby-shower",
    mode: "pot",
    modeLabel: "Gift Pot",
    category: "🎁 Baby Shower Kitty",
    title: "Zanele's Surprise Baby Shower & Pram Pot",
    hostName: "Mbali Khumalo",
    eventDate: "Sun, 1 Nov • 11:00",
    locationName: "The Secret Tea Garden, Morningside",
    priceZar: 150,
    spotsLocked: 6,
    maxSpots: null,
    targetPotZar: 3000,
    raisedZar: 2150,
  },
  {
    slug: "clifton-sunset-catamaran",
    mode: "fixed",
    modeLabel: "Fixed Split",
    category: "⛵ Sunset Charter",
    title: "Chloe's 25th Mirage Sunset Catamaran",
    hostName: "Chloe Botha",
    eventDate: "Sat, 7 Nov • 16:30",
    locationName: "V&A Waterfront Pierhead → Clifton 4th",
    priceZar: 250,
    spotsLocked: 13,
    maxSpots: 16,
  },
  {
    slug: "seapoint-sunrise-run-club",
    mode: "free",
    modeLabel: "Free RSVP",
    category: "🏃 Run Club",
    title: "Saturday 5km Sea Point Prom Run + Brekkie",
    hostName: "Sbu & Chloe",
    eventDate: "Sat, 24 Oct • 07:00",
    locationName: "Sea Point Pavilion Clock",
    priceZar: 0,
    spotsLocked: 4,
    maxSpots: 30,
  },
];

function formatEventDateShort(raw: string): string {
  if (!raw) return "This Weekend • SAST";
  return raw.replace(/\s*SAST$/i, "").trim();
}

function getModeLabel(mode: EventMode): string {
  switch (mode) {
    case "fixed":
      return "Fixed Split";
    case "tiered":
      return "Multi-Tier";
    case "pot":
      return "Gift Pot";
    case "free":
      return "Free RSVP";
  }
}

interface HeroVibePreview {
  id: "fives" | "braai" | "pot" | "padel" | "run";
  pillLabel: string;
  ctaLabel: string;
  presetHref: string;
  liveHref: string;
  modeBadge: string;
  whenWhere: string;
  title: string;
  hostSubtitle: string;
  priceBadge: string;
  lockedCount: number;
  maxCount: number;
  isPot?: boolean;
  raisedZar?: number;
  targetZar?: number;
  squadRows: Array<{
    num: string;
    initials: string;
    name: string;
    tag: string;
    isFirst?: boolean;
  }>;
  bringRows: Array<{
    id: string;
    label: string;
    claimedBy: string | null;
  }>;
  secretPinText: string;
}

const HERO_VIBE_PREVIEWS: Record<HeroVibePreview["id"], HeroVibePreview> = {
  fives: {
    id: "fives",
    pillLabel: "⚽ 5-a-Side Soccer",
    ctaLabel: "⚡ Start a 5-a-Side Link",
    presetHref: "/create?preset=fives",
    liveHref: "/e/thursday-fives-sandton",
    modeBadge: "⚽ Fixed Split",
    whenWhere: "Thu, 19:00 • Sandton",
    title: "Thursday 5-a-Side @ Fives Sandton",
    hostSubtitle: "Hosted by Tariq Davids • Direct PayShap / Capitec PayMe",
    priceBadge: "R100 / player",
    lockedCount: 8,
    maxCount: 10,
    squadRows: [
      { num: "#1", initials: "SK", name: "Siya K", tag: "⚽ Match Ball", isFirst: true },
      { num: "#2", initials: "MV", name: "Marco V (+1: Luca)", tag: "🦺 Bibs" },
      { num: "#3", initials: "TM", name: "Tshepo M", tag: "Capitec PayMe ✅" },
    ],
    bringRows: [
      { id: "f-b1", label: "⚽ Size 5 Match Ball", claimedBy: "Siya K" },
      { id: "f-b2", label: "🦺 Neon Mashie Bibs", claimedBy: "Marco V" },
      { id: "f-b3", label: "🧊 6x Ice Cold Energades", claimedBy: null },
    ],
    secretPinText: "Pitch 3 Floodlights • Booking #4829 (Ask for Tariq)",
  },
  braai: {
    id: "braai",
    pillLabel: "🥩 Spitbraai",
    ctaLabel: "⚡ Start a Spitbraai Link",
    presetHref: "/create?preset=braai",
    liveHref: "/e/bokke-test-spitbraai",
    modeBadge: "🥩 Multi-Tier",
    whenWhere: "Sat, 14:30 • Centurion",
    title: "Bokke vs NZ Saturday Spitbraai",
    hostSubtitle: "Hosted by Riaan v.d. Merwe • Direct FNB PayShap",
    priceBadge: "R220 / Full Braai",
    lockedCount: 14,
    maxCount: 16,
    squadRows: [
      { num: "#1", initials: "RV", name: "Riaan & Ané (+1)", tag: "🔥 Sekelbos", isFirst: true },
      { num: "#2", initials: "SD", name: "Sipho Dladla", tag: "🧊 6x Ice" },
      { num: "#3", initials: "FD", name: "Francois d.T", tag: "🥗 Potato Salad" },
    ],
    bringRows: [
      { id: "b-b1", label: "🔥 4x Bags Sekelbos Wood", claimedBy: "Riaan V" },
      { id: "b-b2", label: "🧊 6x Bags Party Ice", claimedBy: "Sipho D" },
      { id: "b-b3", label: "🧄 4x Garlic Roosterkoek", claimedBy: null },
    ],
    secretPinText: "Estate Gate Code #9042 • Park on the lawn verge",
  },
  pot: {
    id: "pot",
    pillLabel: "🎁 Gift Pot / Baby Shower",
    ctaLabel: "⚡ Start a Gift Pot Link",
    presetHref: "/create?preset=pot",
    liveHref: "/e/mrs-dlamini-baby-shower",
    modeBadge: "🎁 Dignity Gift Pot",
    whenWhere: "Sun, 11:00 • Morningside",
    title: "Zanele's Surprise Baby Shower & Pram Pot",
    hostSubtitle: "Hosted by Mbali Khumalo • Individual Rand Amounts Hidden",
    priceBadge: "🔒 Amounts Hidden",
    lockedCount: 9,
    maxCount: 12,
    isPot: true,
    raisedZar: 2450,
    targetZar: 3000,
    squadRows: [
      { num: "#1", initials: "MK", name: "Mbali Khumalo", tag: "🎂 Cupcakes", isFirst: true },
      { num: "#2", initials: "NK", name: "Nomvula K", tag: "🎈 Balloons" },
      { num: "#3", initials: "AV", name: "Ané van der Walt", tag: "PayShap POP ✅" },
    ],
    bringRows: [
      { id: "p-b1", label: "🎂 24x Vanilla Cupcake Platter", claimedBy: "Mbali K" },
      { id: "p-b2", label: "🎈 Pastel Helium Balloon Arch", claimedBy: "Nomvula K" },
      { id: "p-b3", label: "🧃 Sparkling Grape & Ice Tub", claimedBy: null },
    ],
    secretPinText: "Secret Tea Garden • Pergola Table 4 (Arrive 10:30 for surprise!)",
  },
  padel: {
    id: "padel",
    pillLabel: "🎾 Padel Court",
    ctaLabel: "⚡ Start a Padel Link",
    presetHref: "/create?preset=padel",
    liveHref: "/e/thursday-fives-sandton",
    modeBadge: "🎾 Court Split",
    whenWhere: "Sat, 09:00 • Claremont",
    title: "Saturday Morning Padel 4-Ball Split",
    hostSubtitle: "Hosted by Willem Steenkamp • Virgin Active Padel",
    priceBadge: "R150 / player",
    lockedCount: 3,
    maxCount: 4,
    squadRows: [
      { num: "#1", initials: "WS", name: "Willem S", tag: "🎾 Fresh Balls", isFirst: true },
      { num: "#2", initials: "CM", name: "Candice v.d.M", tag: "PayShap POP ✅" },
      { num: "#3", initials: "FP", name: "Farouk Patel", tag: "Capitec PayMe ✅" },
    ],
    bringRows: [
      { id: "d-b1", label: "🎾 Fresh Can of Wilson Balls", claimedBy: "Willem S" },
      { id: "d-b2", label: "🧊 4x Ice Cold Rehydrates", claimedBy: null },
      { id: "d-b3", label: "🏸 Spare Overgrips", claimedBy: null },
    ],
    secretPinText: "Glass Court 2 • QR Gate Code #8820 at Reception",
  },
  run: {
    id: "run",
    pillLabel: "🏃 Free Run Club",
    ctaLabel: "⚡ Start a Free RSVP Link",
    presetHref: "/create?preset=run",
    liveHref: "/e/seapoint-sunrise-run-club",
    modeBadge: "🏃 Free RSVP",
    whenWhere: "Sat, 07:00 • Sea Point",
    title: "Saturday 5km Sea Point Prom Run + Brekkie",
    hostSubtitle: "Hosted by Sbu & Chloe • R0.00 Mahala Headcount",
    priceBadge: "R0.00 Free",
    lockedCount: 24,
    maxCount: 30,
    squadRows: [
      { num: "#1", initials: "SC", name: "Sbu & Chloe", tag: "📸 Film Cam", isFirst: true },
      { num: "#2", initials: "LB", name: "Lindiwe B", tag: "🍊 Naartjies" },
      { num: "#3", initials: "GH", name: "Garth Hendricks", tag: "5:15/km Pace" },
    ],
    bringRows: [
      { id: "r-b1", label: "📸 35mm Disposable Camera", claimedBy: "Sbu & Chloe" },
      { id: "r-b2", label: "🍊 Bag of Sweet Naartjies", claimedBy: "Lindiwe B" },
      { id: "r-b3", label: "🔊 Pocket Bluetooth Speaker", claimedBy: null },
    ],
    secretPinText: "Meet at Sea Point Pavilion Clock • Coffee table booked for 07:45",
  },
};

export default function HomePage() {
  const [events, setEvents] = useState<ShowcaseEventCard[]>(FALLBACK_EVENTS);
  const [activeModeFilter, setActiveModeFilter] = useState<"all" | EventMode>("all");
  const [spotPriceZar, setSpotPriceZar] = useState<number>(150);
  const [guestCount, setGuestCount] = useState<number>(12);
  const [spotsPerBooking, setSpotsPerBooking] = useState<1 | 2>(1);

  // Interactive Hero Card State (Option 1 + Option 2 + Panel 5 Improvements)
  const [heroVibeId, setHeroVibeId] = useState<HeroVibePreview["id"]>("fives");
  const [heroCardTab, setHeroCardTab] = useState<"squad" | "bring" | "pin">("squad");
  const [heroTestLocked, setHeroTestLocked] = useState<boolean>(false);
  const [heroClaimedItem, setHeroClaimedItem] = useState<boolean>(false);

  const activeHeroVibe = HERO_VIBE_PREVIEWS[heroVibeId];
  const effectiveHeroLocked = heroTestLocked
    ? Math.min(activeHeroVibe.maxCount, activeHeroVibe.lockedCount + 1)
    : activeHeroVibe.lockedCount;
  const effectiveHeroRaisedZar =
    activeHeroVibe.isPot && activeHeroVibe.raisedZar
      ? heroTestLocked
        ? activeHeroVibe.raisedZar + 250
        : activeHeroVibe.raisedZar
      : 0;
  const effectiveHeroPct = activeHeroVibe.isPot && activeHeroVibe.targetZar
    ? Math.min(100, Math.round((effectiveHeroRaisedZar / activeHeroVibe.targetZar) * 100))
    : Math.min(100, Math.round((effectiveHeroLocked / activeHeroVibe.maxCount) * 100));

  useEffect(() => {
    let active = true;
    async function fetchLiveEvents() {
      try {
        const res = await fetch("/api/events", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const rawList: Array<
          EventItem & {
            spots_locked?: number;
            spots_taken?: number;
            total_raised_zar?: number;
          }
        > = Array.isArray(data)
          ? data
          : Array.isArray(data?.events)
          ? data.events
          : [];

        if (!active || rawList.length === 0) return;

        const mapped: ShowcaseEventCard[] = rawList.map((ev) => {
          const fallback = FALLBACK_EVENTS.find((f) => f.slug === ev.slug);
          const locked =
            typeof ev.spots_locked === "number"
              ? ev.spots_locked
              : typeof ev.spots_taken === "number"
              ? ev.spots_taken
              : fallback?.spotsLocked ?? 8;

          return {
            slug: ev.slug,
            mode: ev.mode,
            modeLabel: fallback?.modeLabel || getModeLabel(ev.mode),
            category: ev.category_vibe || fallback?.category || "🇿🇦 Mzansi Event",
            title: ev.title,
            hostName: ev.host_name || fallback?.hostName || "Verified Host",
            eventDate: formatEventDateShort(ev.event_date || fallback?.eventDate || "This Weekend"),
            locationName: ev.location_name || fallback?.locationName || "Johannesburg / Cape Town",
            priceZar: ev.price_zar,
            spotsLocked: locked,
            maxSpots: ev.max_spots,
            targetPotZar: ev.target_pot_zar ?? fallback?.targetPotZar,
            raisedZar:
              typeof ev.total_raised_zar === "number"
                ? ev.total_raised_zar
                : fallback?.raisedZar,
          };
        });

        setEvents(mapped);
      } catch {
        // Keep seeded fallback events
      }
    }

    fetchLiveEvents();
    return () => {
      active = false;
    };
  }, []);

  const filteredEvents =
    activeModeFilter === "all"
      ? events
      : events.filter((ev) => ev.mode === activeModeFilter);

  const middlemanFeePerGuestZar = Math.round(spotPriceZar * 0.05 + 2);
  const totalHostTargetZar = spotPriceZar * guestCount;

  // 8-Second 3-Input Hero Roll-Call Builder State
  const [quickTitle, setQuickTitle] = useState<string>("");
  const [quickSpots, setQuickSpots] = useState<number>(10);
  const [quickPriceZar, setQuickPriceZar] = useState<number>(100);
  const [quickHostName, setQuickHostName] = useState<string>("");
  const [quickHostPhone, setQuickHostPhone] = useState<string>("");
  const [quickWhenWhere, setQuickWhenWhere] = useState<string>("");
  const [quickPublishing, setQuickPublishing] = useState<boolean>(false);
  const [quickError, setQuickError] = useState<string | null>(null);

  const handleQuickCreateFromHero = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuickError(null);
    const trimmedTitle = quickTitle.trim();
    if (!trimmedTitle) {
      setQuickError("Please enter what you're organizing (e.g. Saturday Braai, Thursday Fives).");
      return;
    }
    const resolvedTitle = trimmedTitle;
    const isFreeMode = quickPriceZar === 0;
    const resolvedHost = quickHostName.trim() || (isFreeMode ? "Event Organiser" : "");
    const resolvedPhone = quickHostPhone.trim();

    // For Paid splits, if they haven't typed their name or phone yet, jump straight to /create with prefilled query params.
    // For Free Roll-Calls (mode === "free"), no phone number or bank details are required (Zero-Phone Privacy Mode)!
    if (!isFreeMode && (!resolvedHost || resolvedPhone.replace(/\D/g, "").length < 9)) {
      const params = new URLSearchParams({
        mode: "fixed",
        title: resolvedTitle,
        price: String(Math.max(15, quickPriceZar)),
        spots: String(quickSpots),
      });
      window.location.href = `/create?${params.toString()}`;
      return;
    }

    const parsedWhenWhere = quickWhenWhere.trim();
    const splitParts = parsedWhenWhere
      ? parsedWhenWhere.split(/\s*(?:•|@|\bat\b|,|-)\s*/i).map((s) => s.trim()).filter(Boolean)
      : [];
    const whenPart = splitParts[0] || "This Weekend • Time in Group";
    const wherePart = splitParts.length > 1 ? splitParts.slice(1).join(" • ") : "Pinned in WhatsApp Group";

    setQuickPublishing(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: resolvedTitle,
          category_vibe: activeHeroVibe.pillLabel,
          mode: isFreeMode ? "free" : "fixed",
          price_zar: isFreeMode ? 0 : Math.max(15, quickPriceZar),
          max_spots: quickSpots,
          event_date: whenPart || "This Week • 18:30 SAST",
          location_name: wherePart || "Pinned in WhatsApp Group",
          secret_location_pin: "Host will share exact pin in the group chat.",
          bring_items: [
            { id: "q-1", label: "🧊 2x 4kg Bags of Party Ice", claimed_by_name: null, claimed_rsvp_id: null },
            { id: "q-2", label: "⚽ Match Ball / Cooler Box", claimed_by_name: null, claimed_rsvp_id: null },
          ],
          host_name: resolvedHost,
          host_phone: isFreeMode ? "" : resolvedPhone,
          host_bank_name: isFreeMode ? null : "Direct PayShap / Bank",
          host_account_number: "",
          bake_pro_boost_into_price: false,
          mandate_accepted: true,
          allow_cash_on_arrival: true,
          allow_payday_promise: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Could not create link.");
      }
      const createdSlug = data?.event?.slug || data?.slug;
      const hostSecretToken = data?.host_secret_token;
      if (createdSlug && typeof window !== "undefined") {
        try {
          if (hostSecretToken) {
            localStorage.setItem(`pullthru_host_${createdSlug}`, hostSecretToken);
          }
        } catch {
          // ignore
        }
        const hostTokenParam = hostSecretToken
          ? `&hostToken=${encodeURIComponent(hostSecretToken)}`
          : "";
        window.location.href = `/e/${createdSlug}?created=1${hostTokenParam}`;
      }
    } catch (err) {
      setQuickError(err instanceof Error ? err.message : "Failed to publish link.");
      setQuickPublishing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#0F172A]">
      {/* Unified Mobile + Desktop Responsive Landing & Interactive Event Preview */}
      <div className="flex flex-col flex-1">
        <Navbar />

      <main className="flex-1">
        {/* =========================================================
            1. COMPACT, HIGH-DENSITY 2-COLUMN HERO
           ========================================================= */}
        <section className="py-8 sm:py-12">
          <div className="max-w-7xl mx-auto px-5 sm:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              {/* Left Column (7 cols) */}
              <div className="lg:col-span-7 space-y-5">
                <div className="inline-flex items-center gap-2.5 rounded-full border border-[#007749]/30 bg-[#007749]/10 px-3.5 py-1.5 text-xs font-bold text-[#007749] shadow-xs">
                  <SouthAfricaFlagSvg className="h-3.5 w-5" />
                  <span>See who&apos;s actually pulling through</span>
                </div>

                <h1 className="font-display text-4xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight leading-[1.06] text-[#0F172A]">
                  Get the crew together without the payment drama.
                </h1>

                <p className="max-w-2xl text-base sm:text-lg text-[#475569] leading-relaxed">
                  Drop a link in the group chat. Friends claim spots #1–#15 in one tap, claim who&apos;s bringing ice, and pay your PayShap or cash directly (<strong className="text-[#007749]">100% Free • R0 Host &amp; Guest Fees</strong>).
                </p>

                {/* 8-Second 3-Input Roll-Call Card right on Homepage Hero */}
                <form
                  onSubmit={handleQuickCreateFromHero}
                  className="rounded-3xl border-2 border-[#007749] bg-white p-4 sm:p-5 shadow-md space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6E2D8] pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-[#007749] text-white text-xs font-black">
                        ⚡
                      </span>
                      <span className="text-xs sm:text-sm font-extrabold text-[#0F172A]">
                        8-Second WhatsApp Roll-Call Builder
                      </span>
                    </div>
                    <div className="inline-flex rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] p-0.5 text-[11px] font-extrabold">
                      <button
                        type="button"
                        onClick={() => setQuickPriceZar(0)}
                        className={`rounded-lg px-2.5 py-1 transition ${
                          quickPriceZar === 0
                            ? "bg-[#007749] text-white shadow-2xs"
                            : "text-[#475569] hover:text-[#0F172A]"
                        }`}
                      >
                        🎉 Fast Free RSVP (No Phone #)
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickPriceZar(quickPriceZar === 0 ? 100 : quickPriceZar)}
                        className={`rounded-lg px-2.5 py-1 transition ${
                          quickPriceZar > 0
                            ? "bg-[#007749] text-white shadow-2xs"
                            : "text-[#475569] hover:text-[#0F172A]"
                        }`}
                      >
                        💸 Paid Split (R15+)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                    {/* Input 1: What's happening? */}
                    <div className="sm:col-span-6">
                      <label htmlFor="hero-quick-title" className="block text-[11px] font-extrabold uppercase tracking-wider text-[#0F172A] mb-1">
                        1. What&apos;s happening?
                      </label>
                      <input
                        id="hero-quick-title"
                        type="text"
                        value={quickTitle}
                        onChange={(e) => {
                          setQuickTitle(e.target.value);
                          if (quickError) setQuickError(null);
                        }}
                        placeholder="What are you organizing? (e.g. Saturday Braai, Thursday Fives, Padel)"
                        className="w-full rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-3 py-2 text-xs sm:text-sm font-bold text-[#0F172A] placeholder-[#64748B] focus:border-[#007749] focus:bg-white focus:outline-none"
                      />
                    </div>

                    {/* Input 2: Spots & Price (or R0 Free) */}
                    <div className="sm:col-span-3">
                      <label htmlFor="hero-quick-spots" className="block text-[11px] font-extrabold uppercase tracking-wider text-[#0F172A] mb-1">
                        2. Spots (1–30+ Free)
                      </label>
                      <div className="flex items-center gap-1">
                        {[4, 10, 15, 30].map((cnt) => (
                          <button
                            key={cnt}
                            type="button"
                            onClick={() => setQuickSpots(cnt)}
                            className={`flex-1 rounded-xl border py-2 text-xs font-extrabold transition ${
                              quickSpots === cnt
                                ? "border-[#007749] bg-[#007749] text-white"
                                : "border-[#E6E2D8] bg-[#FAF8F5] text-[#0F172A] hover:border-[#007749]/40"
                            }`}
                          >
                            {cnt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="hero-quick-price" className="text-[11px] font-extrabold uppercase tracking-wider text-[#0F172A]">
                          Price / Spot
                        </label>
                        <button
                          type="button"
                          onClick={() => setQuickPriceZar(quickPriceZar === 0 ? 100 : 0)}
                          className="text-[10px] font-extrabold text-[#007749] underline"
                        >
                          {quickPriceZar === 0 ? "Set Paid" : "R0 Free"}
                        </button>
                      </div>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-xs font-extrabold text-[#007749]">
                          R
                        </span>
                        <input
                          id="hero-quick-price"
                          type="number"
                          min={0}
                          max={5000}
                          step={5}
                          value={quickPriceZar}
                          onChange={(e) => setQuickPriceZar(Math.max(0, Number(e.target.value)))}
                          className="w-full rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] pl-6 pr-2 py-2 text-xs sm:text-sm font-extrabold font-mono-num text-[#0F172A] focus:border-[#007749] focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Input 3: Free Mode shows Host Name + When & Where (No Phone Needed!); Paid Mode shows Host Name + PayShap # */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label htmlFor="hero-quick-host" className="block text-[11px] font-extrabold uppercase tracking-wider text-[#0F172A] mb-1">
                        3A. Your Name (Host)
                      </label>
                      <input
                        id="hero-quick-host"
                        type="text"
                        value={quickHostName}
                        onChange={(e) => setQuickHostName(e.target.value)}
                        placeholder="Your Name (e.g. Sipho, Chloe, Alex)"
                        className="w-full rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-3 py-2 text-xs sm:text-sm font-semibold text-[#0F172A] placeholder-[#64748B] focus:border-[#007749] focus:bg-white focus:outline-none"
                      />
                    </div>
                    {quickPriceZar === 0 ? (
                      <div>
                        <label htmlFor="hero-quick-whenwhere" className="block text-[11px] font-extrabold uppercase tracking-wider text-[#007749] mb-1">
                          3B. When &amp; Where (Zero Phone # Required)
                        </label>
                        <input
                          id="hero-quick-whenwhere"
                          type="text"
                          value={quickWhenWhere}
                          onChange={(e) => setQuickWhenWhere(e.target.value)}
                          placeholder="e.g. Sat 10:00 • Green Point Park"
                          className="w-full rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-3 py-2 text-xs sm:text-sm font-semibold text-[#0F172A] placeholder-[#64748B] focus:border-[#007749] focus:bg-white focus:outline-none"
                        />
                      </div>
                    ) : (
                      <div>
                        <label htmlFor="hero-quick-phone" className="block text-[11px] font-extrabold uppercase tracking-wider text-[#0F172A] mb-1">
                          3B. Your PayShap / Cell Number
                        </label>
                        <input
                          id="hero-quick-phone"
                          type="tel"
                          value={quickHostPhone}
                          onChange={(e) => setQuickHostPhone(e.target.value)}
                          placeholder="e.g. 082 123 4567"
                          className="w-full rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-3 py-2 text-xs sm:text-sm font-mono-num font-bold text-[#0F172A] placeholder-[#64748B] focus:border-[#007749] focus:bg-white focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {quickError && (
                    <p className="text-xs font-bold text-rose-600">{quickError}</p>
                  )}

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                    <button
                      type="submit"
                      disabled={quickPublishing}
                      onClick={() => triggerHaptic("medium")}
                      className="tap-tactile flex-1 inline-flex items-center justify-center gap-2 bg-[#007749] text-white px-6 py-3.5 rounded-2xl text-sm font-extrabold hover:bg-[#005F3A] transition-all shadow-md shadow-emerald-950/10 active:scale-[0.98] disabled:opacity-50"
                    >
                      <span>
                        {quickPublishing
                          ? "Creating Your Live Link..."
                          : "📲 Create & Share to WhatsApp (8 sec)"}
                      </span>
                      <ArrowRight className="h-4 w-4 stroke-[2.2]" />
                    </button>

                    <Link
                      href={activeHeroVibe.liveHref}
                      onClick={() => triggerHaptic("light")}
                      className="tap-tactile inline-flex items-center justify-center gap-1.5 border border-[#E6E2D8] bg-[#FAF8F5] text-[#0F172A] px-4 py-3.5 rounded-2xl text-xs font-bold hover:bg-[#F3F0EA] transition-all active:scale-[0.98]"
                    >
                      <Smartphone className="h-4 w-4 text-[#007749]" />
                      <span>👀 Try Live Demo Wall</span>
                    </Link>
                  </div>
                </form>

                {/* Interactive 1-Tap Vibe Switcher Pills (Previews on Right Card First) */}
                <div className="pt-2">
                  <span className="text-xs font-bold text-[#64748B] block mb-2">
                    Tap a vibe to preview it on the live card →
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {(Object.values(HERO_VIBE_PREVIEWS) as HeroVibePreview[]).map((vibe) => {
                      const isActive = heroVibeId === vibe.id;
                      return (
                        <button
                          key={vibe.id}
                          type="button"
                          onClick={() => {
                            triggerHaptic("selection");
                            setHeroVibeId(vibe.id);
                            setHeroTestLocked(false);
                            setHeroClaimedItem(false);
                          }}
                          className={`tap-tactile inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition shadow-2xs cursor-pointer ${
                            isActive
                              ? "border-[#007749] bg-[#007749] text-white ring-2 ring-[#007749]/25"
                              : "border-[#E6E2D8] bg-white text-[#0F172A] hover:border-[#007749]"
                          }`}
                        >
                          <span>{vibe.pillLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Compact 4-Stat Proof Grid (With Bra Kay's R0 Host Fee Clarity) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                  <div className="rounded-2xl border border-slate-200/80 bg-white px-3.5 py-3 card-elevated">
                    <p className="font-mono-num text-base font-extrabold text-[#007749]">25 sec</p>
                    <p className="text-xs font-medium text-[#475569]">Link Creation</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 bg-white px-3.5 py-3 card-elevated">
                    <p className="font-mono-num text-base font-extrabold text-[#0F172A]">
                      100% <span className="text-xs font-bold text-[#007749]">(R0 Fee)</span>
                    </p>
                    <p className="text-xs font-medium text-[#475569]">Zero host shortfall</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 bg-white px-3.5 py-3 card-elevated">
                    <p className="font-mono-num text-base font-extrabold text-[#0F172A]">12 Banks</p>
                    <p className="text-xs font-medium text-[#475569]">All major SA banks</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 bg-white px-3.5 py-3 card-elevated">
                    <p className="font-mono-num text-base font-extrabold text-[#007749]">5 sec</p>
                    <p className="text-xs font-medium text-[#475569]">Direct PayShap</p>
                  </div>
                </div>
              </div>

              {/* Right Column (5 cols): Interactive Editorial Event Card Mockup */}
              <div className="lg:col-span-5">
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xl card-elevated animate-float-subtle">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 px-3 py-1 text-xs font-semibold text-[#007749]">
                      {activeHeroVibe.modeBadge}
                    </span>
                    <span className="font-mono-num text-xs font-semibold text-[#475569]">
                      {activeHeroVibe.whenWhere}
                    </span>
                  </div>

                  <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A]">
                    {activeHeroVibe.title}
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-[#475569]">
                    {activeHeroVibe.hostSubtitle}
                  </p>

                  {/* Clean Gradient Progress Bar (Supports Both Spot Caps & Gift Pot Thermometer) */}
                  <div className="mt-4 rounded-2xl bg-[#FAF8F5] border border-slate-200/80 p-3.5">
                    <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-[#0F172A] mb-2">
                      <span className="font-mono-num">
                        {activeHeroVibe.isPot
                          ? `🎁 ${formatZar(effectiveHeroRaisedZar)} / ${formatZar(
                              activeHeroVibe.targetZar || 3000
                            )} (${effectiveHeroLocked} In)`
                          : `🔥 ${effectiveHeroLocked} / ${activeHeroVibe.maxCount} Spots Locked In`}
                      </span>
                      <span className="font-mono-num text-[#007749] font-black">
                        {activeHeroVibe.priceBadge}
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#007749] to-teal-500 transition-all duration-300"
                        style={{ width: `${effectiveHeroPct}%` }}
                      />
                    </div>
                  </div>

                  {/* 3 Segmented Interactive Tabs (Squad / Bring-List / Gate Pin) */}
                  <div className="mt-3.5 grid grid-cols-3 gap-1 rounded-2xl bg-[#F3F0EA] p-1 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic("selection");
                        setHeroCardTab("squad");
                      }}
                      className={`tap-tactile rounded-xl py-1.5 font-bold transition cursor-pointer ${
                        heroCardTab === "squad"
                          ? "bg-white text-[#0F172A] shadow-2xs"
                          : "text-[#475569] hover:text-[#0F172A]"
                      }`}
                    >
                      👥 Squad ({effectiveHeroLocked}/{activeHeroVibe.maxCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic("selection");
                        setHeroCardTab("bring");
                      }}
                      className={`tap-tactile rounded-xl py-1.5 font-bold transition cursor-pointer ${
                        heroCardTab === "bring"
                          ? "bg-white text-[#0F172A] shadow-2xs"
                          : "text-[#475569] hover:text-[#0F172A]"
                      }`}
                    >
                      🎒 Bring-List ({activeHeroVibe.bringRows.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic("selection");
                        setHeroCardTab("pin");
                      }}
                      className={`tap-tactile rounded-xl py-1.5 font-bold transition cursor-pointer ${
                        heroCardTab === "pin"
                          ? "bg-white text-[#0F172A] shadow-2xs"
                          : "text-[#475569] hover:text-[#0F172A]"
                      }`}
                    >
                      🔒 Gate Pin
                    </button>
                  </div>

                  {/* Fixed-Height Tab Body (Zero Layout Shift) */}
                  <div className="mt-3 min-h-[138px] flex flex-col justify-between">
                    {heroCardTab === "squad" && (
                      <div className="space-y-2">
                        {activeHeroVibe.squadRows.map((guest, idx) => {
                          const isSimulatedRow = idx === 2 && heroTestLocked;
                          return (
                            <div
                              key={guest.num}
                              className={`flex items-center justify-between rounded-xl border px-3.5 py-2 text-xs sm:text-sm transition ${
                                guest.isFirst
                                  ? "border-amber-300/80 bg-gradient-to-r from-amber-500/[0.08] to-white"
                                  : isSimulatedRow
                                  ? "border-[#007749] bg-emerald-50/70"
                                  : "border-slate-200/70 bg-[#FAF8F5]/80"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span
                                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${
                                    guest.isFirst
                                      ? "bg-amber-100 text-amber-900 ring-1 ring-amber-400"
                                      : isSimulatedRow
                                      ? "bg-[#007749] text-white"
                                      : "bg-slate-200 text-slate-700"
                                  }`}
                                >
                                  {isSimulatedRow ? "YOU" : guest.initials}
                                </span>
                                <span className="font-mono-num text-xs font-bold text-[#475569]">
                                  {isSimulatedRow ? `#${effectiveHeroLocked}` : guest.num}
                                </span>
                                <span className="font-semibold text-[#0F172A] truncate">
                                  {isSimulatedRow ? "You (Just Locked In ⚡)" : guest.name}
                                </span>
                                <span className="hidden sm:inline text-xs text-[#475569] truncate">
                                  • {isSimulatedRow ? "Capitec Pay" : guest.tag}
                                </span>
                              </div>
                              <span className="inline-flex shrink-0 items-center rounded-full bg-[#007749]/10 px-2.5 py-0.5 text-xs font-semibold text-[#007749]">
                                Locked In ✅
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {heroCardTab === "bring" && (
                      <div className="space-y-2">
                        {activeHeroVibe.bringRows.map((item, idx) => {
                          const isInteractiveRow = idx === 2;
                          const isClaimed = isInteractiveRow
                            ? heroClaimedItem
                            : Boolean(item.claimedBy);
                          const claimedName = isInteractiveRow
                            ? heroClaimedItem
                              ? "Claimed by You ✓"
                              : "+ Tap to Claim"
                            : `Claimed by ${item.claimedBy}`;

                          return isInteractiveRow ? (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                triggerHaptic("light");
                                setHeroClaimedItem((prev) => !prev);
                              }}
                              className={`tap-tactile w-full flex items-center justify-between rounded-xl border px-3.5 py-2 text-xs sm:text-sm transition cursor-pointer ${
                                isClaimed
                                  ? "border-[#007749] bg-emerald-50/70"
                                  : "border-dashed border-[#007749]/50 bg-[#FAF8F5] hover:bg-emerald-50/40"
                              }`}
                            >
                              <span className="font-semibold text-[#0F172A] truncate">
                                {item.label}
                              </span>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-xs font-bold shrink-0 ${
                                  isClaimed
                                    ? "bg-[#007749] text-white"
                                    : "border border-[#007749] text-[#007749]"
                                }`}
                              >
                                {claimedName}
                              </span>
                            </button>
                          ) : (
                            <div
                              key={item.id}
                              className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-[#FAF8F5]/80 px-3.5 py-2 text-xs sm:text-sm"
                            >
                              <span className="font-semibold text-[#0F172A] truncate">
                                {item.label}
                              </span>
                              <span className="rounded-full bg-[#007749]/10 px-2.5 py-0.5 text-xs font-semibold text-[#007749] shrink-0">
                                {claimedName}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {heroCardTab === "pin" && (
                      <div className="space-y-2.5">
                        <div className="rounded-2xl border border-[#007749]/30 bg-[#007749]/[0.06] p-3.5">
                          <p className="text-xs font-bold text-[#007749]">
                            🔓 Secret Venue Pin &amp; Gate Code (Unlocked for Paid Squad)
                          </p>
                          <p className="mt-1 text-xs sm:text-sm font-semibold text-[#0F172A]">
                            {activeHeroVibe.secretPinText}
                          </p>
                        </div>
                        <div className="flex items-center justify-between rounded-2xl border border-[#E6E2D8] bg-[#FAF8F5] px-3.5 py-2.5 text-xs">
                          <div>
                            <p className="font-bold text-[#0F172A]">🔄 1-Tap Spot-Swap Active</p>
                            <p className="text-[#475569]">
                              Can&apos;t make it? Pass your spot on WhatsApp for R0.
                            </p>
                          </div>
                          <span className="rounded-full bg-[#FFB81C]/25 px-2.5 py-0.5 font-bold text-[#0F172A] shrink-0">
                            Included
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Interactive Card Footer: + Test Lock-In Button & Deep-Linked Live Event */}
                  <div className="mt-4 pt-3.5 border-t border-[#E6E2D8] flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic("success");
                        setHeroCardTab("squad");
                        setHeroTestLocked((prev) => !prev);
                      }}
                      className="tap-tactile rounded-full bg-[#007749]/10 hover:bg-[#007749]/20 px-3 py-1 text-xs font-bold text-[#007749] transition cursor-pointer"
                    >
                      {heroTestLocked
                        ? "↻ Reset Demo Spot"
                        : activeHeroVibe.isPot
                        ? "+ Test Chipping In"
                        : `+ Test Locking Spot #${ activeHeroVibe.lockedCount + 1 }`}
                    </button>

                    <div className="flex items-center gap-3">
                      <Link
                        href={activeHeroVibe.presetHref}
                        onClick={() => triggerHaptic("light")}
                        className="text-xs font-semibold text-[#475569] hover:text-[#0F172A] underline"
                      >
                        Use Template
                      </Link>
                      <Link
                        href={activeHeroVibe.liveHref}
                        onClick={() => triggerHaptic("light")}
                        className="tap-tactile text-xs sm:text-sm font-bold text-[#007749] hover:text-[#005F3A] transition-colors inline-flex items-center gap-1"
                      >
                        <span>Open Live Event</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            1.5 HOW PULLTHRU WORKS (3-STEP INTUITIVE WORKFLOW)
           ========================================================= */}
        <section id="how-it-works" className="py-12 sm:py-16 bg-white border-y border-[#E6E2D8] scroll-mt-14">
          <div className="max-w-7xl mx-auto px-5 sm:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#007749]/10 px-3 py-1 text-xs font-bold text-[#007749]">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Dead simple</span>
              </span>
              <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight text-[#0F172A] sm:text-4xl">
                How PullThru Works
              </h2>
              <p className="mt-2 text-base text-[#475569]">
                No app downloads. Built for Mzansi group chats and braais.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div className="rounded-3xl border border-[#E6E2D8] bg-[#FAF8F5] p-6 relative overflow-hidden group hover:border-[#007749]/40 transition shadow-xs">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#007749] text-white font-black text-lg shadow-sm mb-4">
                  1
                </div>
                <h3 className="font-display text-lg font-extrabold text-[#0F172A]">
                  Make a link
                </h3>
                <p className="mt-2 text-sm text-[#475569] leading-relaxed">
                  Pick an event title, spot price, and add your PayShap number, Capitec PayMe link, or bank details in 25 seconds.
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-[#007749]">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>PayShap, Capitec PayMe &amp; 12 SA Banks</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="rounded-3xl border border-[#E6E2D8] bg-[#FAF8F5] p-6 relative overflow-hidden group hover:border-[#007749]/40 transition shadow-xs">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#007749] text-white font-black text-lg shadow-sm mb-4">
                  2
                </div>
                <h3 className="font-display text-lg font-extrabold text-[#0F172A]">
                  Send it in WhatsApp
                </h3>
                <p className="mt-2 text-sm text-[#475569] leading-relaxed">
                  Friends pay you directly via 1-tap Capitec PayMe or PayShap (R0 guest fee!) and drop their POP slip or SMS to lock their spot.
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-[#007749]">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>R0 Guest Fees • Instant POP Verifier</span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="rounded-3xl border border-[#E6E2D8] bg-[#FAF8F5] p-6 relative overflow-hidden group hover:border-[#007749]/40 transition shadow-xs">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#007749] text-white font-black text-lg shadow-sm mb-4">
                  3
                </div>
                <h3 className="font-display text-lg font-extrabold text-[#0F172A]">
                  Show up &amp; enjoy
                </h3>
                <p className="mt-2 text-sm text-[#475569] leading-relaxed">
                  Cash lands in your bank account in 5 seconds (no 2-day gateway holds!), while PullThru updates the Squad Wall &amp; Bring-List live.
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-[#007749]">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>5-Second Direct Host Cash</span>
                </div>
              </div>
            </div>

            {/* Quick Action Footer */}
            <div className="mt-8 text-center flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/create"
                onClick={() => triggerHaptic("medium")}
                className="tap-tactile inline-flex items-center gap-2 rounded-full bg-[#007749] px-7 py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#005F3A] transition"
              >
                <span>⚡ Start an Event</span>
                <ArrowRight className="h-4 w-4 stroke-[2.5]" />
              </Link>
              <Link
                href="/e/thursday-fives-sandton"
                onClick={() => triggerHaptic("light")}
                className="tap-tactile inline-flex items-center gap-2 rounded-full border border-[#E6E2D8] bg-white px-6 py-3.5 text-sm font-bold text-[#0F172A] hover:bg-[#FAF8F5] transition"
              >
                <Smartphone className="h-4 w-4 text-[#007749]" />
                <span>📱 Try Live Mobile Demo</span>
              </Link>
            </div>
          </div>
        </section>

        {/* =========================================================
            2. LIVE SOUTH AFRICAN EXAMPLES 3x2 FULL GRID (#live-events)
           ========================================================= */}
        <section id="live-events" className="scroll-mt-16 bg-[#F3F0EA] py-10 sm:py-14 border-y border-[#E6E2D8]">
          <div className="max-w-7xl mx-auto px-5 sm:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#007749] mb-1.5">
                  INTERACTIVE SHOWCASE
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
                  Live Interactive Demos
                </h2>
              </div>
              <p className="text-sm text-[#475569] max-w-md">
                Tap any live demo to see how real South African squads lock spots, direct-pay hosts, and coordinate braais in 25 seconds.
              </p>
            </div>

            {/* 1-Tap Mode / Vibe Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {(
                [
                  { id: "all", label: `All (${events.length})` },
                  { id: "fixed", label: "⚽ Fixed Split" },
                  { id: "tiered", label: "🥩 Multi-Tier" },
                  { id: "pot", label: "🎁 Gift Pots" },
                  { id: "free", label: "🏃 Free RSVP" },
                ] as const
              ).map((tab) => {
                const isActive = activeModeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic("light");
                      setActiveModeFilter(tab.id);
                    }}
                    className={`tap-tactile rounded-full px-4 py-2 text-xs font-bold transition-all ${
                      isActive
                        ? "bg-[#007749] text-white shadow-xs ring-2 ring-[#007749]/30"
                        : "border border-[#E6E2D8] bg-white text-[#475569] hover:border-[#0F172A]/20 hover:text-[#0F172A]"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredEvents.map((ev) => {
                const isPot = ev.mode === "pot" && ev.targetPotZar;
                const progressPct = isPot
                  ? Math.min(
                      100,
                      Math.round(((ev.raisedZar ?? 0) / (ev.targetPotZar || 3000)) * 100)
                    )
                  : ev.maxSpots
                  ? Math.min(100, Math.round((ev.spotsLocked / ev.maxSpots) * 100))
                  : 80;

                const counterLabel = isPot
                  ? `${formatZar(ev.raisedZar ?? 0)} / ${formatZar(ev.targetPotZar || 3000)}`
                  : ev.maxSpots
                  ? `${ev.spotsLocked}/${ev.maxSpots} spots locked`
                  : `${ev.spotsLocked} locked`;

                const priceLabel =
                  ev.priceZar === 0 ? "Free RSVP" : formatZar(ev.priceZar);

                return (
                  <Link
                    key={ev.slug}
                    href={`/e/${ev.slug}`}
                    onClick={() => triggerHaptic("light")}
                    className="group flex flex-col justify-between bg-white rounded-2xl border border-slate-200/80 p-5 card-hover card-elevated transition"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-xs font-semibold text-[#475569]">
                          {ev.category}
                        </span>
                        <span className="rounded-full bg-[#FAF8F5] border border-[#E6E2D8] px-2.5 py-0.5 text-xs font-semibold text-[#0F172A]">
                          {ev.modeLabel}
                        </span>
                      </div>

                      <h3 className="font-display text-lg font-bold text-[#0F172A] group-hover:text-[#007749] transition-colors">
                        {ev.title}
                      </h3>
                      <p className="mt-1 text-xs sm:text-sm text-[#475569]">
                        Hosted by {ev.hostName}
                      </p>

                      {/* Clean When & Where Metadata Row */}
                      <div className="mt-3 flex flex-col gap-1.5 rounded-xl bg-[#FAF8F5] border border-[#E6E2D8]/80 px-3 py-2 text-xs text-[#475569]">
                        <div className="flex items-center gap-1.5 font-medium text-[#0F172A]">
                          <Calendar className="h-3.5 w-3.5 text-[#007749] shrink-0" />
                          <span className="truncate">{ev.eventDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-[#475569] shrink-0" />
                          <span className="truncate">{ev.locationName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-[#E6E2D8]">
                      <div className="flex items-center justify-between text-xs font-semibold text-[#0F172A] mb-1.5">
                        <span className="font-mono-num">{counterLabel}</span>
                        <span className="font-mono-num text-[#007749]">{priceLabel}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[#F3F0EA]">
                        <div
                          className="h-full rounded-full bg-[#007749]"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs font-semibold text-[#0F172A] group-hover:text-[#007749]">
                        <span>Open Live Event Wall →</span>
                      </div>
                    </div>
                  </Link>
                );
              })}

              {/* 6th Card: Fills the 3x2 Grid Completely with Zero Empty Space */}
              <Link
                href="/create"
                className="group flex flex-col justify-between rounded-2xl border border-[#0F172A] bg-[#0F172A] p-5 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-[#FFB81C]">
                      <Zap className="h-3.5 w-3.5" />
                      <span>Your Turn • 25s Setup</span>
                    </span>
                    <SouthAfricaFlagSvg className="h-3.5 w-5" />
                  </div>

                  <h3 className="font-display text-lg font-bold text-white">
                    Organising a Braai, 5-a-Side, Padel or Gift Pot?
                  </h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-white/75 leading-relaxed">
                    Pick a 1-tap South African preset, link your Capitec/FNB/Standard Bank account, and drop your link in WhatsApp.
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-white/15 flex items-center justify-between">
                  <span className="text-xs font-medium text-white/80">
                    100% Free for Hosts
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#007749] px-3.5 py-1.5 text-xs font-semibold text-white group-hover:bg-[#005F3A] transition-colors">
                    <span>Create Link Now</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* =========================================================
            3. 4-COLUMN COMPACT BENTO ROW (#modes)
           ========================================================= */}
        <section id="modes" className="scroll-mt-16 bg-[#FAF8F5] py-10 sm:py-14">
          <div className="max-w-7xl mx-auto px-5 sm:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#007749] mb-1.5">
                  ONE LINK, FOUR MODES
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
                  Designed for every kind of get-together.
                </h2>
              </div>
              <Link
                href="/create"
                className="text-sm font-semibold text-[#007749] hover:text-[#005F3A] inline-flex items-center gap-1"
              >
                <span>Try all 4 modes in the creator</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Card 1 */}
              <div className="flex flex-col justify-between bg-white rounded-2xl border border-slate-200/80 p-5 card-elevated card-hover">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAF8F5] border border-[#E6E2D8] text-[#007749]">
                      <Trophy className="h-5 w-5" />
                    </div>
                    <span className="font-mono-num text-xs font-semibold text-[#007749] bg-[#007749]/10 px-2.5 py-0.5 rounded-full">
                      10/10 Cap
                    </span>
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                    Soccer • Padel • Boats
                  </p>
                  <h3 className="mt-1 font-display text-lg font-bold text-[#0F172A]">
                    Fixed Split &amp; Spot Cap
                  </h3>
                  <p className="mt-2 text-sm text-[#475569] leading-relaxed">
                    <span className="font-semibold text-[#0F172A]">
                      &ldquo;No pay, no name on the wall.&rdquo;
                    </span>{" "}
                    Set a fixed price per player and a hard spot cap. Includes 1-click spot transfers if someone bails.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E6E2D8] text-xs font-medium text-[#475569] flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#007749]" />
                  <span>Locks capacity automatically</span>
                </div>
              </div>

              {/* Card 2 */}
              <div className="flex flex-col justify-between bg-white rounded-2xl border border-slate-200/80 p-5 card-elevated card-hover">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAF8F5] border border-[#E6E2D8] text-[#007749]">
                      <Utensils className="h-5 w-5" />
                    </div>
                    <span className="font-mono-num text-xs font-semibold text-[#0F172A] bg-[#F3F0EA] px-2.5 py-0.5 rounded-full">
                      R220 / R140 / R0
                    </span>
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                    Spitbraais • Team Lunches
                  </p>
                  <h3 className="mt-1 font-display text-lg font-bold text-[#0F172A]">
                    Multi-Tier &amp; Family
                  </h3>
                  <p className="mt-2 text-sm text-[#475569] leading-relaxed">
                    <span className="font-semibold text-[#0F172A]">
                      &ldquo;Meat + Dop, Meat Only, Kids Mahala.&rdquo;
                    </span>{" "}
                    Let guests pick their exact tier and add partners or kids on one link without group-chat math.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E6E2D8] text-xs font-medium text-[#475569] flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#007749]" />
                  <span>Supports +1 family bundles</span>
                </div>
              </div>

              {/* Card 3 */}
              <div className="flex flex-col justify-between bg-white rounded-2xl border border-slate-200/80 p-5 card-elevated card-hover">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAF8F5] border border-[#E6E2D8] text-[#007749]">
                      <Gift className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-semibold text-[#0F172A] bg-[#FFB81C]/25 px-2.5 py-0.5 rounded-full">
                      Amounts Hidden
                    </span>
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                    Baby Showers • Imali Yenduduzo • Stokvels
                  </p>
                  <h3 className="mt-1 font-display text-lg font-bold text-[#0F172A]">
                    Gift Pots &amp; Kitties
                  </h3>
                  <p className="mt-2 text-sm text-[#475569] leading-relaxed">
                    <span className="font-semibold text-[#0F172A]">
                      &ldquo;Show names, hide Rand amounts.&rdquo;
                    </span>{" "}
                    Perfect for baby showers, teacher gifts, and condolences (imali yenduduzo)—everyone chips in, but individual amounts stay private.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E6E2D8] text-xs font-medium text-[#475569] flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#007749]" />
                  <span>Payday pledge option</span>
                </div>
              </div>

              {/* Card 4 */}
              <div className="flex flex-col justify-between bg-white rounded-2xl border border-slate-200/80 p-5 card-elevated card-hover">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAF8F5] border border-[#E6E2D8] text-[#007749]">
                      <ClipboardCheck className="h-5 w-5" />
                    </div>
                    <span className="font-mono-num text-xs font-semibold text-[#007749] bg-[#007749]/10 px-2.5 py-0.5 rounded-full">
                      R0.00 Free
                    </span>
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                    Run Clubs • Hikes • Potjies
                  </p>
                  <h3 className="mt-1 font-display text-lg font-bold text-[#0F172A]">
                    Free RSVP + Bring-List
                  </h3>
                  <p className="mt-2 text-sm text-[#475569] leading-relaxed">
                    <span className="font-semibold text-[#0F172A]">
                      &ldquo;Lock who&apos;s bringing ice &amp; wood.&rdquo;
                    </span>{" "}
                    Zero-cost headcount with claimable items so you don&apos;t end up with 6 bags of ice and no charcoal.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E6E2D8] text-xs font-medium text-[#475569] flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#007749]" />
                  <span>1-tap item claiming</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            4. 100% R0 FREE ROLL-CALL & DIRECT PAYSHAP SAVINGS CALCULATOR (#calculator)
           ========================================================= */}
        <section id="calculator" className="scroll-mt-16 bg-[#F3F0EA] py-10 sm:py-14 border-t border-[#E6E2D8]">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 space-y-10">
            {/* 100% Free Banner (No R29 Paywall for 5-a-Side or Braais) */}
            <div className="rounded-3xl border-2 border-[#007749] bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-[#007749]/30 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#007749]">
                    🎉 100% Free for Hosts &amp; Squads • 1 to 100+ Spots
                  </span>
                  <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A]">
                    R0 Host Fee. R0 Guest Fee. Direct to Your PayShap.
                  </h2>
                  <p className="text-sm text-[#475569] leading-relaxed">
                    Whether it&apos;s 4 players for Padel, 10 players for Thursday 5-a-side soccer, or 25 friends for a Saturday spitbraai — PullThru is <strong className="text-[#0F172A]">100% free</strong>. Guests join the roll-call in 1 tap and pay your PayShap or cash directly.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <Link
                    href="/create"
                    className="tap-tactile inline-flex items-center gap-2 rounded-full bg-[#007749] px-6 py-3.5 text-sm font-extrabold text-white shadow-sm hover:bg-[#005F3A] transition"
                  >
                    <span>📲 Start Free Roll-Call Link</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Interactive Direct PayShap vs Traditional Ticketing Savings Slider */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-4 border-t border-[#E6E2D8]">
              <div className="lg:col-span-7 space-y-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#007749] mb-1.5">
                    ZERO MIDDLEMAN TAX CALCULATOR
                  </p>
                  <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
                    Ask for <span className="font-mono-num">{formatZar(spotPriceZar)}</span>. Guests pay{" "}
                    <span className="font-mono-num text-[#007749]">{formatZar(spotPriceZar)}</span> flat.
                  </h3>
                  <p className="mt-2 text-sm text-[#475569] max-w-xl">
                    Traditional ticketing platforms charge your friends 5% + R2 per ticket and hold your money for 2 business days. With PullThru&apos;s Direct PayShap &amp; Capitec PayMe flow, your squad pays R0 in fees and your money lands in 5 seconds.
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 card-elevated space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="spot-price-range" className="text-sm font-semibold text-[#0F172A]">
                        Spot or Kitty Price
                      </label>
                      <span className="font-mono-num text-base font-bold text-[#007749]">
                        {formatZar(spotPriceZar)}
                      </span>
                    </div>
                    <input
                      id="spot-price-range"
                      type="range"
                      min={50}
                      max={1000}
                      step={10}
                      value={spotPriceZar}
                      aria-valuetext={`R${spotPriceZar}`}
                      onChange={(e) => {
                        triggerHaptic("selection");
                        setSpotPriceZar(Number(e.target.value));
                      }}
                      className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#E6E2D8] accent-[#007749]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="guest-count-range" className="text-sm font-semibold text-[#0F172A]">
                        Total Squad Headcount
                      </label>
                      <span className="font-mono-num text-base font-bold text-[#0F172A]">
                        {guestCount} spots
                      </span>
                    </div>
                    <input
                      id="guest-count-range"
                      type="range"
                      min={4}
                      max={40}
                      step={1}
                      value={guestCount}
                      aria-valuetext={`${guestCount} spots`}
                      onChange={(e) => {
                        triggerHaptic("selection");
                        setGuestCount(Number(e.target.value));
                      }}
                      className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#E6E2D8] accent-[#007749]"
                    />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 card-elevated">
                  <div className="flex items-center justify-between pb-4 border-b border-[#E6E2D8]">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#475569]">
                        DIRECT PAYSHAP / CAPITEC PAYME
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-[#0F172A]">
                        Instant 5-second settlement to your bank
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-[#007749]/15 px-3 py-1 text-xs font-bold text-[#007749]">
                      R0.00 Fee
                    </span>
                  </div>

                  <div className="py-4 space-y-2.5 text-sm border-b border-[#E6E2D8]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#475569]">Each Guest Pays Host Directly</span>
                      <span className="font-mono-num font-bold text-[#0F172A]">
                        {formatZar(spotPriceZar)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#475569]">PullThru Guest Checkout Fee</span>
                      <span className="font-mono-num font-bold text-[#007749]">R0.00 (Free)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#475569]">PullThru Host Platform Fee ({guestCount} spots)</span>
                      <span className="font-mono-num font-bold text-[#007749]">
                        R0.00 (100% Free)
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-[#007749]">
                      <span>💰 Squad Saves vs. 5% + R2 Middlemen</span>
                      <span className="font-mono-num">
                        Save {formatZar(Math.max(0, guestCount * middlemanFeePerGuestZar))}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#007749]">
                          INSTANT CASH IN YOUR BANK
                        </p>
                        <p className="text-xs text-[#475569] mt-0.5">
                          <span className="font-mono-num">{guestCount}</span> ×{" "}
                          <span className="font-mono-num">{formatZar(spotPriceZar)}</span> • Lands in 5 seconds
                        </p>
                      </div>
                      <span className="font-mono-num text-2xl sm:text-3xl font-extrabold text-[#007749]">
                        {formatZar(totalHostTargetZar)}
                      </span>
                    </div>

                    <Link
                      href="/create"
                      onClick={() => triggerHaptic("medium")}
                      className="tap-tactile mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#007749] px-6 py-3.5 text-sm font-semibold text-white hover:bg-[#005F3A] transition-all shadow-md shadow-emerald-950/10 active:scale-[0.98]"
                    >
                      <span>Create Your Event Link</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            4B. "MANUAL EFT HELL VS PULLTHRU" COMPARISON (CEO Growth Lever)
           ========================================================= */}
        <section className="bg-white py-12 sm:py-16 border-t border-[#E6E2D8]">
          <div className="max-w-7xl mx-auto px-5 sm:px-8">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <span className="inline-block rounded-full bg-[#007749]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#007749] mb-2">
                Why Drop a Link Instead of Your Bank Account?
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
                Stop Playing Unpaid Debt Collector for Your Friends
              </h2>
              <p className="mt-2 text-sm sm:text-base text-[#475569]">
                Dropping your cellphone number in a WhatsApp group leaves you chasing ghost payments, checking bank statements at midnight, and covering shortfalls yourself.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {/* Left Column: The Old Way (EFT Group Chat Hell) */}
              <div className="rounded-3xl border-2 border-rose-200 bg-rose-50/40 p-6 sm:p-7 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-rose-200/80">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🤦‍♂️</span>
                    <h3 className="font-display text-lg font-bold text-rose-950">
                      Manual WhatsApp &amp; EFT
                    </h3>
                  </div>
                  <span className="rounded-full bg-rose-100 text-rose-800 px-2.5 py-0.5 text-xs font-bold">
                    Total headache
                  </span>
                </div>

                <ul className="space-y-3 text-xs sm:text-sm text-[#475569]">
                  <li className="flex items-start gap-2.5">
                    <span className="text-rose-500 font-bold shrink-0 mt-0.5">✕</span>
                    <span><strong>Ghosting &amp; Excuses:</strong> 4 people promise to EFT and disappear on match day.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-rose-500 font-bold shrink-0 mt-0.5">✕</span>
                    <span><strong>Proof of Payment Chaos:</strong> 12 blurry screenshots to cross-check against your banking app.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-rose-500 font-bold shrink-0 mt-0.5">✕</span>
                    <span><strong>Host Covers Shortfall:</strong> You end up R400 out of pocket because the venue won&apos;t wait.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-rose-500 font-bold shrink-0 mt-0.5">✕</span>
                    <span><strong>Last-minute dropouts:</strong> Someone pulls a hamstring 2 hours before kickoff and asks for an EFT refund.</span>
                  </li>
                </ul>
              </div>

              {/* Right Column: The PullThru Way */}
              <div className="rounded-3xl border-2 border-[#007749] bg-gradient-to-br from-emerald-50/60 to-white p-6 sm:p-7 space-y-4 shadow-sm relative overflow-hidden card-elevated">
                <div className="absolute top-0 right-0 bg-[#007749] text-white px-3 py-1 rounded-bl-xl text-[10px] font-bold uppercase tracking-wider">
                  Recommended
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-emerald-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⚡</span>
                    <h3 className="font-display text-lg font-bold text-[#0F172A]">
                      The 25-Second PullThru Link
                    </h3>
                  </div>
                  <span className="rounded-full bg-[#007749]/10 text-[#007749] px-2.5 py-0.5 text-xs font-bold">
                    Zero Drama
                  </span>
                </div>

                <ul className="space-y-3 text-xs sm:text-sm text-[#0F172A]">
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#007749] font-bold shrink-0 mt-0.5">✓</span>
                    <span><strong>No payment, no spot:</strong> First 10 to pay get their name on the wall. No chancers.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#007749] font-bold shrink-0 mt-0.5">✓</span>
                    <span><strong>Zero-Shortfall Payouts:</strong> 100% of your target settles straight to your SA bank account.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#007749] font-bold shrink-0 mt-0.5">✓</span>
                    <span><strong>Self-service spot swap:</strong> Can&apos;t make it? Guests can 1-tap pass their spot to a mate.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#007749] font-bold shrink-0 mt-0.5">✓</span>
                    <span><strong>Direct venue payout:</strong> Option to pay court or venue hire directly from the pot.</span>
                  </li>
                </ul>

                <div className="pt-2">
                  <Link
                    href="/create"
                    onClick={() => triggerHaptic("medium")}
                    className="tap-tactile flex w-full items-center justify-center gap-2 rounded-full bg-[#007749] px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-[#005F3A] transition-all active:scale-[0.98]"
                  >
                    <span>Create Your Event Link in 25s</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Honest SA Platform Comparison Table (/competitors Evidence Discipline) */}
            <div className="mt-12 max-w-5xl mx-auto">
              <div className="rounded-3xl border border-[#E6E2D8] bg-[#FAF8F5] p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#007749]">
                      South African Event &amp; Kitty Comparison (As of Oct 2026)
                    </span>
                    <h3 className="font-display text-lg sm:text-xl font-extrabold text-[#0F172A] mt-0.5">
                      How PullThru Compares to Global &amp; Local Alternatives
                    </h3>
                  </div>
                  <Link
                    href="/braai-calculator"
                    onClick={() => triggerHaptic("selection")}
                    className="tap-tactile inline-flex items-center gap-2 rounded-full border border-[#007749]/30 bg-white px-4 py-2 text-xs font-extrabold text-[#007749] shadow-2xs hover:bg-[#007749] hover:text-white transition"
                  >
                    <span>🥩 Try Free SA Braai Meat &amp; Ice Calculator →</span>
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-[#E6E2D8] text-[#475569]">
                        <th className="py-3 pr-4 font-bold">Feature / Capability</th>
                        <th className="py-3 px-4 font-extrabold text-[#007749] bg-emerald-50/70 rounded-t-xl">
                          🇿🇦 PullThru
                        </th>
                        <th className="py-3 px-4 font-bold">Partiful / Luma</th>
                        <th className="py-3 px-4 font-bold">Quicket / Howler</th>
                        <th className="py-3 pl-4 font-bold">WhatsApp Poll + EFT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6E2D8]/70 text-[#0F172A]">
                      <tr>
                        <td className="py-3 pr-4 font-semibold">Direct PayShap, Capitec PayMe &amp; POP Verifier (R0 Fee)</td>
                        <td className="py-3 px-4 font-bold text-[#007749] bg-emerald-50/40">✓ Built-in (ZAR • R0 Guest Fee)</td>
                        <td className="py-3 px-4 text-[#64748B]">✕ US Stripe only (No ZAR)</td>
                        <td className="py-3 px-4 text-[#475569]">✓ Yes (4.5%–6% Ticket Fee)</td>
                        <td className="py-3 pl-4 text-[#64748B]">Manual POP chasing</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-4 font-semibold">Host Setup Speed</td>
                        <td className="py-3 px-4 font-bold text-[#007749] bg-emerald-50/40">25 seconds (No password)</td>
                        <td className="py-3 px-4 text-[#475569]">1–2 mins</td>
                        <td className="py-3 px-4 text-[#64748B]">10+ mins (Organizer account)</td>
                        <td className="py-3 pl-4 text-[#475569]">1 min + hours chasing</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-4 font-semibold">1-Tap WhatsApp Spot-Swap</td>
                        <td className="py-3 px-4 font-bold text-[#007749] bg-emerald-50/40">✓ Automatic pass transfer</td>
                        <td className="py-3 px-4 text-[#64748B]">✕ Not available</td>
                        <td className="py-3 px-4 text-[#64748B]">Formal ticket transfer</td>
                        <td className="py-3 pl-4 text-[#64748B]">Host refunds manually</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-4 font-semibold">Bring-&apos;n-Bak Potluck Checklist</td>
                        <td className="py-3 px-4 font-bold text-[#007749] bg-emerald-50/40">✓ Claim ice, wors &amp; salads</td>
                        <td className="py-3 px-4 text-[#64748B]">Comment wall only</td>
                        <td className="py-3 px-4 text-[#64748B]">✕ Ticketed events only</td>
                        <td className="py-3 pl-4 text-[#64748B]">Lost in chat scroll</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-4 font-semibold">Best Fit For</td>
                        <td className="py-3 px-4 font-bold text-[#007749] bg-emerald-50/40 rounded-b-xl">
                          5-a-Side, Padel, Braais &amp; Gift Pots (4–100 guests)
                        </td>
                        <td className="py-3 px-4 text-[#475569]">Free US/EU house parties</td>
                        <td className="py-3 px-4 text-[#475569]">500+ person festivals &amp; concerts</td>
                        <td className="py-3 pl-4 text-[#475569]">2–3 close family members</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* =========================================================
          5. MINIMAL EDITORIAL FOOTER
         ========================================================= */}
      <footer className="bg-white border-t border-[#E6E2D8] py-8">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#E6E2D8]">
            <div className="flex items-center gap-2.5">
              <PullThruIconSvg size={32} />
              <span className="font-display text-lg font-extrabold text-[#0F172A]">
                PullThru.co.za
              </span>
              <SouthAfricaFlagSvg className="h-3.5 w-5" />
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-[#475569]">
              <Link href="/create" className="hover:text-[#0F172A] transition-colors">
                Create Event Link
              </Link>
              <Link href="/split-bill" className="text-[#007749] font-bold hover:text-[#005F3A] transition-colors">
                🧾 Split a Bill &amp; Tip
              </Link>
              <Link href="/braai-calculator" className="text-[#007749] font-bold hover:text-[#005F3A] transition-colors">
                🥩 Free Braai Calculator
              </Link>
              <Link href="/for-venues" className="text-[#007749] font-bold hover:text-[#005F3A] transition-colors">
                🏟️ For Venues &amp; Clubs
              </Link>
              <Link href="/5-a-side-and-padel" className="text-[#007749] font-bold hover:text-[#005F3A] transition-colors">
                ⚽ 5-a-Side &amp; Padel Split
              </Link>
              <Link href="/partiful-south-africa" className="hover:text-[#0F172A] transition-colors">
                Partiful SA Alternative
              </Link>
              <Link href="/quicket-alternative" className="hover:text-[#0F172A] transition-colors">
                Quicket Alternative
              </Link>
              <Link href="/group-gift-pot" className="hover:text-[#0F172A] transition-colors">
                Baby Shower &amp; Gift Pot
              </Link>
              <Link href="/help" className="hover:text-[#0F172A] transition-colors">
                Help &amp; Protection
              </Link>
              <Link href="/llms.txt" className="hover:text-[#0F172A] transition-colors">
                AI / LLMs.txt
              </Link>
              <Link href="/terms" className="hover:text-[#0F172A] transition-colors">
                SARB &amp; POPIA Legal
              </Link>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#475569]">
            <p className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#007749] shrink-0" />
              <span>
                Pure SaaS Event &amp; RSVP Tracker (Zero third-party fund aggregation — guests pay hosts directly via PayShap / Capitec PayMe) • POPIA Section 10 Compliant.
              </span>
            </p>
            <p className="font-mono-num shrink-0">© {new Date().getFullYear()} PullThru South Africa</p>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
