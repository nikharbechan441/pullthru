"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { X, Smartphone, ArrowRight, Bell } from "lucide-react";

const STORAGE_KEY = "pullthru_app_notif_dismissed_v1";
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.pullthru.za";

// Strictly default to DISABLED to enforce the CEO & UX "Zero Browser Install Popups" guarantee.
// Only enabled if explicitly toggled via NEXT_PUBLIC_ENABLE_INSTALL_PROMPT="true"
const IS_PROMPT_ENABLED = process.env.NEXT_PUBLIC_ENABLE_INSTALL_PROMPT === "true";

export default function AppInstallNotification() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!IS_PROMPT_ENABLED) return;
    if (typeof window === "undefined") return;

    // 1. Do NOT show if user is already inside the native Capacitor app
    const isNative = Boolean(
      (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
        ?.Capacitor?.isNativePlatform?.()
    );
    if (isNative) return;

    // 2. Do NOT show if the user has already seen and dismissed the single notification
    try {
      const alreadyDismissed = localStorage.getItem(STORAGE_KEY);
      if (alreadyDismissed === "true") return;
    } catch {
      // Ignore localStorage errors
    }

    // Small delay so it smoothly slides in without blocking initial page load
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Ignore
    }
  };

  const handleGetApp = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Ignore
    }
    // Attempt deep link to Google Play Store on Android devices, fallback to web URL
    const isAndroid = /android/i.test(navigator.userAgent || "");
    if (isAndroid) {
      window.location.href = "market://details?id=com.pullthru.za";
      setTimeout(() => {
        window.open(PLAY_STORE_URL, "_blank", "noopener,noreferrer");
      }, 500);
    } else {
      window.open(PLAY_STORE_URL, "_blank", "noopener,noreferrer");
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="PullThru Mobile App Notification"
      className="fixed top-3 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-top-4 duration-300 print:hidden"
    >
      <div className="relative flex items-center justify-between gap-3 rounded-2xl border border-[#007749]/30 bg-white/95 p-3.5 shadow-xl backdrop-blur-md">
        {/* App Icon */}
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-black/10 bg-[#007749] shadow-xs flex items-center justify-center">
          <span className="font-display font-black text-white text-base tracking-tighter">
            PT
          </span>
          <span className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-[#FFB81C]" />
        </div>

        {/* Notification Text */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-md bg-[#007749]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#007749]">
              <Bell className="h-2.5 w-2.5" />
              <span>Native App</span>
            </span>
            <span className="text-[10px] font-semibold text-[#64748B]">
              Google Play
            </span>
          </div>
          <p className="mt-0.5 text-xs font-bold text-[#0F172A] leading-snug">
            Get the PullThru Android App
          </p>
          <p className="text-[11px] text-[#475569] leading-tight truncate">
            Persistent WhatsApp lock-in alerts &amp; 1-tap event management.
          </p>
        </div>

        {/* Action Button & Dismiss */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleGetApp}
            className="inline-flex items-center gap-1 rounded-full bg-[#007749] px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#005F3A] active:scale-95"
          >
            <span>Get App</span>
            <ArrowRight className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss app notification"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#64748B] hover:bg-slate-100 hover:text-[#0F172A] transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
