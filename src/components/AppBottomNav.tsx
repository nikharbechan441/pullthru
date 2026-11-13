"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Plus,
  Ticket,
  Crown,
  Flame,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptics";

export default function AppBottomNav() {
  const pathname = usePathname();
  const [hasSavedActivity, setHasSavedActivity] = useState(false);
  const [passUrl, setPassUrl] = useState<string | null>(null);
  const [liveSquadUrl, setLiveSquadUrl] = useState("/e/thursday-fives-sandton");
  const [hostHubUrl, setHostHubUrl] = useState("/create");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      let foundPassSlug: string | null = null;
      let foundPassRef: string | null = null;
      let foundPassRsvpId: string | null = null;
      let foundHostSlug: string | null = null;
      let foundHostToken: string | null = null;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (!foundPassSlug && key.startsWith("pullthru_ref_")) {
          const s = key.replace("pullthru_ref_", "");
          const ref = localStorage.getItem(key);
          const rsvpId = localStorage.getItem(`pullthru_rsvpid_${s}`) || "";
          if (s && ref && ref !== "PT_SAMPLE_DEMO") {
            foundPassSlug = s;
            foundPassRef = ref;
            foundPassRsvpId = rsvpId;
          }
        }
        if (!foundHostSlug && key.startsWith("pullthru_host_") && key !== "pullthru_host_profile_v1" && key !== "pullthru_host_token") {
          const s = key.replace("pullthru_host_", "");
          if (s.startsWith("saturday-champions-cup-spitbraai-kuier-")) {
            localStorage.removeItem(key);
            continue;
          }
          const token = localStorage.getItem(key);
          if (s && token) {
            foundHostSlug = s;
            foundHostToken = token;
          }
        }
      }

      if (foundPassSlug && foundPassRef) {
        setPassUrl(
          `/e/${foundPassSlug}/success?ref=${encodeURIComponent(foundPassRef)}${
            foundPassRsvpId ? `&rsvpId=${encodeURIComponent(foundPassRsvpId)}` : ""
          }`
        );
        setLiveSquadUrl(`/e/${foundPassSlug}`);
      } else {
        setPassUrl(null);
      }

      if (foundHostSlug && foundHostToken) {
        setHostHubUrl(
          `/e/${foundHostSlug}?hostToken=${encodeURIComponent(foundHostToken)}`
        );
        if (!foundPassSlug) {
          setLiveSquadUrl(`/e/${foundHostSlug}`);
        }
      }

      setHasSavedActivity(Boolean((foundPassSlug && foundPassRef) || (foundHostSlug && foundHostToken)));
    } catch {
      // ignore storage errors
    }
  }, [pathname]);

  if (
    !hasSavedActivity ||
    pathname === "/create" ||
    pathname === "/phone" ||
    pathname === "/playstore" ||
    pathname?.startsWith("/e/")
  ) {
    return null;
  }

  const isHome = pathname === "/" || pathname === "/feed" || pathname === "/app";
  const isCreate = pathname === "/create";
  const isPasses = pathname?.includes("/success") || pathname === "/passes";
  const isEvent = pathname?.startsWith("/e/") && !pathname?.includes("/success");

  return (
    <nav
      aria-label="App Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/92 backdrop-blur-xl border-t border-[#E6E2D8] pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] print:hidden"
    >
      <div className="max-w-md mx-auto px-6 flex items-center justify-between">
        {/* Tab 1: Explore / Squad Feed */}
        <Link
          href="/"
          onClick={() => triggerHaptic("selection")}
          className={`tap-tactile flex flex-col items-center gap-1 transition-all ${
            isHome
              ? "text-[#007749] font-bold"
              : "text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          <div className="relative">
            <Compass className={`h-5 w-5 ${isHome ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
            {isHome && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#007749]" />
            )}
          </div>
          <span className="text-[10px] tracking-tight">Squad Feed</span>
        </Link>

        {/* Tab 2: Active / Sample Event */}
        <Link
          href={liveSquadUrl}
          onClick={() => triggerHaptic("selection")}
          className={`tap-tactile flex flex-col items-center gap-1 transition-all ${
            isEvent
              ? "text-[#007749] font-bold"
              : "text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          <div className="relative">
            <Flame className={`h-5 w-5 ${isEvent ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#007749]" />
            </span>
          </div>
          <span className="text-[10px] tracking-tight">Live Squad</span>
        </Link>

        {/* Tab 3: CENTER PROMINENT ACTION BUTTON (+ HOST EVENT IN 25s) */}
        <Link
          href="/create"
          onClick={() => triggerHaptic("medium")}
          className="tap-tactile -mt-5 flex flex-col items-center group"
          aria-label="Host New Event in 25 Seconds"
        >
          <div className="flex h-13 w-13 items-center justify-center rounded-full bg-gradient-to-tr from-[#007749] to-[#00A362] text-white shadow-[0_6px_20px_rgba(0,119,73,0.35)] ring-4 ring-white group-hover:scale-105 active:scale-95 transition-all">
            <Plus className="h-6 w-6 stroke-[3]" />
          </div>
          <span className="text-[10px] font-extrabold text-[#007749] mt-0.5 tracking-tight">
            + Host
          </span>
        </Link>

        {/* Tab 4: My Passes & Tickets (only if real pass exists) */}
        {passUrl && (
          <Link
            href={passUrl}
            onClick={() => triggerHaptic("selection")}
            className={`tap-tactile flex flex-col items-center gap-1 transition-all ${
              isPasses
                ? "text-[#007749] font-bold"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <div className="relative">
              <Ticket className={`h-5 w-5 ${isPasses ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
              {isPasses && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#007749]" />
              )}
            </div>
            <span className="text-[10px] tracking-tight">My Passes</span>
          </Link>
        )}

        {/* Tab 5: Host Hub & Payouts */}
        <Link
          href={hostHubUrl}
          onClick={() => triggerHaptic("selection")}
          className={`tap-tactile flex flex-col items-center gap-1 transition-all ${
            isCreate
              ? "text-[#007749] font-bold"
              : "text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          <div className="relative">
            <Crown className={`h-5 w-5 ${isCreate ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
          </div>
          <span className="text-[10px] tracking-tight">Host Hub</span>
        </Link>
      </div>
    </nav>
  );
}
