"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Redesign1ReceiptSandbox from "@/components/redesigns/Redesign1ReceiptSandbox";
import Redesign2FloodlightScoreboard from "@/components/redesigns/Redesign2FloodlightScoreboard";
import Redesign3WhatsAppEditorial from "@/components/redesigns/Redesign3WhatsAppEditorial";
import { triggerHaptic } from "@/lib/haptics";
import { Receipt, Trophy, MessageSquare, Sparkles } from "lucide-react";

function RedesignsStudioInner() {
  const searchParams = useSearchParams();
  const initialTab = searchParams?.get("v") === "2" ? 2 : searchParams?.get("v") === "3" ? 3 : 1;
  const [activeDesign, setActiveDesign] = useState<1 | 2 | 3>(initialTab);

  return (
    <div className="relative min-h-screen pb-20">
      {/* Render Active Full-Page Interactive Redesign */}
      {activeDesign === 1 && <Redesign1ReceiptSandbox />}
      {activeDesign === 2 && <Redesign2FloodlightScoreboard />}
      {activeDesign === 3 && <Redesign3WhatsAppEditorial />}

      {/* =====================================================================
          FLOATING COMPACT STUDIO SWITCHER HUD (Pinned cleanly at bottom center)
         ===================================================================== */}
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 w-[95%] max-w-2xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 rounded-2xl border-2 border-[#111315] bg-white/95 backdrop-blur-md p-2 shadow-[0_12px_32px_rgba(0,0,0,0.28)]">
          <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-bold uppercase tracking-wider text-[#111315]">
            <Sparkles className="h-3.5 w-3.5 text-[#007749]" />
            <span>Landing Redesign Studio:</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                triggerHaptic("selection");
                setActiveDesign(1);
              }}
              className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold transition-all cursor-pointer ${
                activeDesign === 1
                  ? "bg-[#111315] text-[#FFB81C] shadow-xs"
                  : "bg-[#F5F1E8] text-[#111315] hover:bg-[#E6E2D8]"
              }`}
            >
              <Receipt className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">1. Thermal Receipt</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic("selection");
                setActiveDesign(2);
              }}
              className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold transition-all cursor-pointer ${
                activeDesign === 2
                  ? "bg-[#00D67F] text-[#090F0C] shadow-xs"
                  : "bg-[#F5F1E8] text-[#111315] hover:bg-[#E6E2D8]"
              }`}
            >
              <Trophy className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">2. Floodlight Club</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic("selection");
                setActiveDesign(3);
              }}
              className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold transition-all cursor-pointer ${
                activeDesign === 3
                  ? "bg-[#0B6E4F] text-white shadow-xs"
                  : "bg-[#F5F1E8] text-[#111315] hover:bg-[#E6E2D8]"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">3. WhatsApp Editorial</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RedesignsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF8F5]" />}>
      <RedesignsStudioInner />
    </Suspense>
  );
}
