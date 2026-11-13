"use client";

import React, { useState } from "react";
import { PullThruIconSvg } from "@/components/PullThruLogo";
import { SouthAfricaFlagSvg } from "@/components/Navbar";

export default function SplashScreen() {
  // Zero blocking delay on First Contentful Paint for cold ad & mobile web visitors
  const [visible] = useState(false);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#FAF8F5] transition-opacity duration-300 ease-out select-none pointer-events-none opacity-0"
    >
      <div className="flex flex-col items-center gap-4 text-center animate-in zoom-in-95 duration-300">
        {/* Animated App Icon */}
        <div className="relative">
          <div className="shadow-[0_12px_40px_rgba(0,119,73,0.35)] ring-4 ring-white rounded-[18px]">
            <PullThruIconSvg size={76} />
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-[#007749] border-2 border-white" />
          </span>
        </div>

        {/* Brand Name & Tagline */}
        <div>
          <h1 className="font-display text-2xl font-black tracking-tight text-[#0F172A]">
            PullThru
          </h1>
          <p className="mt-1 text-xs font-bold text-[#64748B] flex items-center justify-center gap-1.5">
            <span>See who&apos;s actually pulling through</span>
            <span>•</span>
            <SouthAfricaFlagSvg className="h-3 w-4.5 inline" />
          </p>
        </div>

        {/* Sleek App Loading Bar */}
        <div className="w-36 h-1 bg-[#E6E2D8] rounded-full overflow-hidden mt-3">
          <div className="h-full bg-gradient-to-r from-[#007749] to-[#00D47E] rounded-full animate-[progress_0.75s_ease-out_forwards]" />
        </div>
      </div>
    </div>
  );
}
