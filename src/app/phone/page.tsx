"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Smartphone,
  RotateCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Wifi,
  BatteryCharging,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Sparkles,
  ArrowRight,
  Check,
} from "lucide-react";

type DeviceModel = "iphone15pro" | "galaxyS24" | "pixel8";

interface ScreenRoute {
  id: string;
  name: string;
  category: string;
  path: string;
  badge: string;
}

const ROUTES: ScreenRoute[] = [
  {
    id: "fives",
    name: "⚽ 5-a-Side Sandton",
    category: "Fixed Split & Spot Scarcity",
    path: "/e/thursday-fives-sandton",
    badge: "Most Popular",
  },
  {
    id: "creator",
    name: "⚡ 25-Second Creator",
    category: "3-Step Wizard & Custom Vibe",
    path: "/create",
    badge: "Host Tool",
  },
  {
    id: "spitbraai",
    name: "🥩 Bokke Spitbraai",
    category: "Multi-Tier & Bring-'n-Bak",
    path: "/e/bokke-test-spitbraai",
    badge: "Tiered Spots",
  },
  {
    id: "pot",
    name: "🍼 Baby Shower Pot",
    category: "Dignity Confidential Gift",
    path: "/e/mrs-dlamini-baby-shower",
    badge: "POPIA Privacy",
  },
  {
    id: "ticket",
    name: "🎟️ Gate Pass & Receipt",
    category: "QR Pass & 1-Tap Spot Swap",
    path: "/e/thursday-fives-sandton/success?ref=PT_SAMPLE_DEMO&rsvpId=rsvp-1",
    badge: "Verified POP",
  },
  {
    id: "home",
    name: "🏠 Home & Calculator",
    category: "Landing Page & Payout Slider",
    path: "/",
    badge: "Landing",
  },
];

export default function PhonePreviewPage() {
  const [activeRoute, setActiveRoute] = useState<ScreenRoute>(ROUTES[0]);
  const [device, setDevice] = useState<DeviceModel>("iphone15pro");
  const [scale, setScale] = useState<number>(0.9);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<string>("16:42");

  // Keep clock live to SAST local time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-ZA", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const reloadIframe = () => {
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-[#0E131F] text-slate-100 flex flex-col font-sans selection:bg-[#007749]/40">
      {/* Top Simulator Control Bar */}
      <header className="sticky top-0 z-50 bg-[#151C2C]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Brand & Mode */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 font-display text-lg font-extrabold tracking-tight text-white hover:text-emerald-400 transition"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#007749] text-sm text-white font-black shadow-xs">
                P
              </span>
              <span>PullThru</span>
            </Link>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Interactive Smartphone Simulator</span>
            </span>
          </div>

          {/* Device Model Selector */}
          <div className="flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-900/80 p-1 text-xs font-semibold">
            {[
              { id: "iphone15pro", label: "iPhone 15 Pro" },
              { id: "galaxyS24", label: "Samsung Galaxy S24" },
              { id: "pixel8", label: "Google Pixel 8" },
            ].map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDevice(d.id as DeviceModel)}
                className={`px-3 py-1 rounded-full transition-all ${
                  device === d.id
                    ? "bg-[#007749] text-white font-bold shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Scale & Quick Actions */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 bg-slate-900/80 rounded-full border border-slate-700/80 p-1 text-xs">
              <button
                type="button"
                onClick={() => setScale((s) => Math.max(0.7, s - 0.1))}
                title="Zoom Out"
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="px-1 text-[11px] font-mono text-slate-300">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setScale((s) => Math.min(1.0, s + 0.1))}
                title="Zoom In"
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={reloadIframe}
              title="Refresh Screen"
              className="p-2 rounded-full border border-slate-700/80 bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              <RotateCw className="h-4 w-4" />
            </button>

            <a
              href={activeRoute.path}
              target="_blank"
              rel="noopener noreferrer"
              title="Open full page in new tab"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-700/80 bg-slate-900/80 text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 transition"
            >
              <span>Full Tab</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Screen Route Quick Selector Strip */}
        <div className="max-w-7xl mx-auto mt-2.5 pt-2 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1">
            Tap Screen:
          </span>
          {ROUTES.map((route) => {
            const isActive = activeRoute.id === route.id;
            return (
              <button
                key={route.id}
                type="button"
                onClick={() => setActiveRoute(route)}
                className={`tap-tactile shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-[#007749] text-white font-bold ring-2 ring-emerald-400/30 shadow-xs"
                    : "bg-slate-900/60 border border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
                }`}
              >
                <span>{route.name}</span>
                <span
                  className={`text-[10px] rounded-full px-1.5 py-0.2 ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {route.badge}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Workspace: Centered Smartphone Mockup Frame */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 overflow-y-auto">
        <div
          className="transition-transform duration-300 origin-top flex flex-col items-center"
          style={{ transform: `scale(${scale})` }}
        >
          {/* PHONE CHASSIS WRAPPER */}
          <div
            className={`relative transition-all duration-300 shadow-[0_25px_70px_rgba(0,0,0,0.85)] ${
              device === "iphone15pro"
                ? "w-[393px] h-[852px] rounded-[55px] bg-[#1E2024] p-[12px] ring-1 ring-white/20 border-4 border-[#3D3F43]"
                : device === "galaxyS24"
                ? "w-[412px] h-[880px] rounded-[42px] bg-[#18191C] p-[10px] ring-1 ring-white/15 border-4 border-[#2D3035]"
                : "w-[412px] h-[860px] rounded-[48px] bg-[#1A1C1E] p-[11px] ring-1 ring-white/15 border-4 border-[#35383E]"
            }`}
          >
            {/* PHYSICAL BUTTONS SIMULATION */}
            {/* Volume Up / Down (Left side) */}
            <div className="absolute -left-[7px] top-[140px] w-[3px] h-[45px] bg-[#2E3034] rounded-l-sm" />
            <div className="absolute -left-[7px] top-[195px] w-[3px] h-[45px] bg-[#2E3034] rounded-l-sm" />
            {/* Power Button (Right side) */}
            <div className="absolute -right-[7px] top-[160px] w-[3px] h-[65px] bg-[#2E3034] rounded-r-sm" />

            {/* SCREEN BEZEL INNER FRAME */}
            <div
              className={`relative w-full h-full overflow-hidden bg-[#FAF8F5] flex flex-col ${
                device === "iphone15pro"
                  ? "rounded-[45px]"
                  : device === "galaxyS24"
                  ? "rounded-[34px]"
                  : "rounded-[38px]"
              }`}
            >
              {/* TOP STATUS BAR OVERLAY */}
              <div className="relative z-30 h-11 px-7 flex items-center justify-between text-xs font-semibold text-[#0F172A] bg-transparent pointer-events-none select-none">
                {/* Time Display */}
                <div className="font-mono text-[13px] font-bold tracking-tight">
                  {currentTime}
                </div>

                {/* DYNAMIC ISLAND / PUNCH-HOLE NOTCH */}
                {device === "iphone15pro" ? (
                  <div className="absolute left-1/2 -translate-x-1/2 top-2.5 h-[28px] w-[110px] bg-black rounded-full flex items-center justify-between px-3 text-white shadow-xs">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#007749] ring-2 ring-black" />
                    <span className="text-[10px] font-bold text-slate-300">PullThru</span>
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-800" />
                  </div>
                ) : (
                  <div className="absolute left-1/2 -translate-x-1/2 top-2 h-4 w-4 bg-black rounded-full ring-2 ring-black" />
                )}

                {/* Right Status Icons: 5G, Wifi, Battery */}
                <div className="flex items-center gap-1.5 text-[#0F172A]">
                  <span className="text-[11px] font-black tracking-tight text-[#007749]">
                    5G
                  </span>
                  <Wifi className="h-3.5 w-3.5 stroke-[2.4]" />
                  <div className="flex items-center gap-0.5">
                    <div className="w-5 h-2.5 rounded-xs border border-[#0F172A] p-0.5 flex items-center">
                      <div className="h-full w-full bg-[#007749] rounded-2xs" />
                    </div>
                  </div>
                </div>
              </div>

              {/* LIVE EMBEDDED APPLICATION (SCROLLABLE & FULLY INTERACTIVE) */}
              <div className="relative flex-1 w-full overflow-hidden bg-[#FAF8F5]">
                <iframe
                  key={`${activeRoute.path}-${iframeKey}`}
                  src={activeRoute.path}
                  title="PullThru Mobile App Simulator"
                  className="w-full h-full border-none select-auto"
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                />
              </div>

              {/* BOTTOM HOME INDICATOR BAR */}
              <div className="relative z-30 pb-2 pt-1 bg-transparent pointer-events-none select-none">
                <div className="w-32 h-1 rounded-full bg-[#0F172A]/70 mx-auto" />
              </div>
            </div>
          </div>

          {/* ACTIVE SCREEN INFO CARD BELOW PHONE */}
          <div className="mt-6 text-center space-y-1 max-w-md">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/90 px-3.5 py-1 text-xs">
              <span className="font-bold text-white">{activeRoute.name}</span>
              <span className="text-slate-500">•</span>
              <span className="text-emerald-400 font-medium">
                {activeRoute.category}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              💡 <strong>Tip:</strong> The phone is fully live and interactive! Tap cards, scroll, enter names, test custom vibes, and try Capitec Pay directly on the phone screen above.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
