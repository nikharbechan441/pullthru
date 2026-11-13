"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Script from "next/script";
import { Sparkles, ArrowUpRight, ShieldCheck } from "lucide-react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export interface TastefulAdSlotProps {
  /** AdSense data-ad-slot ID once created in Google AdSense console */
  slotId?: string;
  /** Visual theme to match dark calculator pages vs warm editorial pages */
  variant?: "light" | "dark";
  /** Contextual fallback partner theme when AdSense is pending review or blocked */
  context?: "braai" | "sport" | "general";
  /** Show subtle hint that R29 Pro Boost removes ads on event walls */
  showProRemoveHint?: boolean;
  className?: string;
}

const DEFAULT_ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "ca-pub-3943711113843734";

const CONTEXT_PARTNER_COPY = {
  braai: {
    badge: "Weekend Braai & Grocery Partner",
    headline: "Planning a 10+ Guest Braai or Potjie? Split the Meat & Ice Kitty in 15 Seconds",
    subtext:
      "Lock in everyone's Rand share upfront via Direct PayShap or Capitec PayMe (R0 guest fees) and export a Checkers Sixty60 shopping list.",
    ctaLabel: "Launch Braai Kitty Link →",
    ctaHref: "/create?preset=braai",
  },
  sport: {
    badge: "5-a-Side & Padel Captain Partner",
    headline: "Run Weekly 5-a-Side or Padel Matches? Clone Your Squad Link in 10 Seconds",
    subtext:
      "Stop re-typing bank details every Tuesday. Run 4 to 25+ spot games 100% free (R0 fees), with auto-bib teams and 1-tap PayShap roll-call.",
    ctaLabel: "Explore 5-a-Side & Padel Tools →",
    ctaHref: "/5-a-side-and-padel",
  },
  general: {
    badge: "South African Group Bookings Partner",
    headline: "Booking a Birthday Table, Spa Morning, Karting Race, or Weekend Lodge?",
    subtext:
      "Don't front a R5,000 venue deposit on your own card while chasing WhatsApp EFTs. Collect everyone's share in one afternoon with R0 guest fees.",
    ctaLabel: "Start Free Group Link →",
    ctaHref: "/create",
  },
};

export default function TastefulAdSlot({
  slotId = "8842109482",
  variant = "light",
  context = "general",
  showProRemoveHint = false,
  className = "",
}: TastefulAdSlotProps) {
  const partner = CONTEXT_PARTNER_COPY[context] || CONTEXT_PARTNER_COPY.general;
  const isDark = variant === "dark";

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch {
      // Safe no-op when AdBlocker is active or AdSense account is pending review
    }
  }, []);

  return (
    <aside
      aria-label="Sponsored Advertisement"
      data-testid="tasteful-ad-slot"
      className={`mx-auto w-full max-w-5xl ${className}`}
    >
      {/* Lazy-loaded Google AdSense script so Lighthouse LCP/TBT remain 95+ */}
      <Script
        id="pullthru-adsense-loader"
        async
        strategy="lazyOnload"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${DEFAULT_ADSENSE_CLIENT}`}
        crossOrigin="anonymous"
      />

      <div
        className={`relative overflow-hidden rounded-2xl border px-4 py-3.5 sm:px-5 sm:py-4 transition ${
          isDark
            ? "border-stone-800/90 bg-[#16120E]/90 text-stone-200"
            : "border-[#E6E2D8] bg-white/90 text-[#0F172A] shadow-2xs"
        }`}
      >
        {/* Top Micro-Label Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="inline-flex items-center gap-1.5">
            <span
              className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest ${
                isDark
                  ? "bg-stone-800 text-stone-400 border border-stone-700"
                  : "bg-[#FAF8F5] text-[#64748B] border border-[#E6E2D8]"
              }`}
            >
              Sponsored • AdSense
            </span>
            <span
              className={`text-[11px] font-bold ${
                isDark ? "text-amber-400" : "text-[#007749]"
              }`}
            >
              {partner.badge}
            </span>
          </div>

          {showProRemoveHint && (
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-semibold ${
                isDark ? "text-stone-400" : "text-[#64748B]"
              }`}
            >
              <ShieldCheck className="h-3 w-3 text-[#007749]" />
              <span>Dignity Pot walls are 100% ad-free</span>
            </span>
          )}
        </div>

        {/* Official Google AdSense Responsive Unit Container */}
        <ins
          className="adsbygoogle block w-full overflow-hidden"
          style={{ display: "block", minHeight: "1px" }}
          data-ad-client={DEFAULT_ADSENSE_CLIENT}
          data-ad-slot={slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />

        {/* Sleek Native Partner Card (Always provides high-utility SA value while AdSense reviews domain or when AdBlocker is on) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="space-y-0.5 max-w-2xl">
            <p
              className={`text-xs sm:text-sm font-extrabold leading-snug ${
                isDark ? "text-white" : "text-[#0F172A]"
              }`}
            >
              {partner.headline}
            </p>
            <p
              className={`text-[11px] sm:text-xs leading-relaxed ${
                isDark ? "text-stone-400" : "text-[#475569]"
              }`}
            >
              {partner.subtext}
            </p>
          </div>

          <Link
            href={partner.ctaHref}
            className={`shrink-0 inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-extrabold transition ${
              isDark
                ? "bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25"
                : "bg-[#007749]/10 border border-[#007749]/30 text-[#007749] hover:bg-[#007749] hover:text-white"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{partner.ctaLabel}</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
