"use client";

import React, { useState } from "react";
import { Calendar, MapPin, Lock, Unlock, Copy, Check, ShieldCheck, Phone } from "lucide-react";
import { EventItem } from "@/types/database";
import { triggerHaptic } from "@/lib/haptics";

interface DetailsTabProps {
  event: EventItem;
  hasUnlockedPin: boolean;
  hostMode: boolean;
  onOpenCheckout: () => void;
}

export default function DetailsTab({
  event,
  hasUnlockedPin,
  hostMode,
  onOpenCheckout,
}: DetailsTabProps) {
  const [copiedPin, setCopiedPin] = useState(false);
  const isPinVisible = hasUnlockedPin || hostMode;

  const handleCopyPin = () => {
    if (!event.secret_location_pin) return;
    navigator.clipboard.writeText(event.secret_location_pin);
    triggerHaptic("success");
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Date & Location Card */}
      <div className="rounded-2xl border border-[#E6E2D8] bg-white p-4 shadow-xs space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#007749]/10 text-[#007749]">
            <Calendar className="h-4.5 w-4.5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#64748B]">
              Date &amp; Time
            </span>
            <p className="text-xs font-extrabold text-[#0F172A]">{event.event_date}</p>
          </div>
        </div>

        <div className="flex items-start gap-3 border-t border-[#E6E2D8]/60 pt-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#007749]/10 text-[#007749]">
            <MapPin className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#64748B]">
              Location &amp; Venue
            </span>
            <p className="truncate text-xs font-extrabold text-[#0F172A]">{event.location_name}</p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                event.location_name
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-[#007749]/10 px-2 py-0.5 text-[10px] font-black text-[#007749]"
            >
              Open in Maps ↗
            </a>
          </div>
        </div>
      </div>

      {/* Secret Pin & Gate Code Box */}
      <div
        className={`rounded-2xl border p-4 ${
          isPinVisible
            ? "border-[#007749]/40 bg-[#007749]/[0.06]"
            : "border-[#E6E2D8] bg-[#F7F5F0]"
        }`}
      >
        {isPinVisible && event.secret_location_pin ? (
          <div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#007749]">
                <Unlock className="h-4 w-4" />
                <span>Gate Code &amp; Access Unlocked</span>
              </span>
              <button
                type="button"
                onClick={handleCopyPin}
                className="tap-tactile inline-flex items-center gap-1 rounded-full bg-[#007749] px-2.5 py-1 text-[10px] font-bold text-white shadow-xs"
              >
                {copiedPin ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copiedPin ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <p className="font-mono-num mt-2 rounded-xl bg-white p-2.5 text-xs font-black text-[#0F172A] shadow-xs">
              {event.secret_location_pin}
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Lock className="h-4.5 w-4.5 text-[#007749] shrink-0" />
              <div>
                <p className="text-xs font-black text-[#0F172A]">Gate Code &amp; Access Details</p>
                <p className="text-[11px] text-[#64748B]">
                  Unlocks automatically as soon as your spot is confirmed.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenCheckout}
              className="shrink-0 text-xs font-black text-[#007749] underline"
            >
              Unlock →
            </button>
          </div>
        )}
      </div>

      {/* Description & Custom Question */}
      {event.description && (
        <div className="rounded-2xl border border-[#E6E2D8] bg-white p-4 shadow-xs space-y-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#64748B]">
            From the Host
          </span>
          <p className="text-xs text-[#334155] leading-relaxed whitespace-pre-wrap">
            {event.description}
          </p>
        </div>
      )}

      {/* Host Bio & Verified Bank Subaccount */}
      <div className="rounded-2xl border border-[#E6E2D8] bg-white p-4 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#007749] text-xs font-black text-white">
            {event.host_name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-black text-[#0F172A]">{event.host_name}</span>
              <ShieldCheck className="h-3.5 w-3.5 text-[#007749]" />
            </div>
            <p className="text-[10px] text-[#64748B]">
              {event.mode === "free"
                ? "100% Free RSVP Roll-Call"
                : `Direct payout to ${event.host_bank_name || "Capitec Bank"}`}
            </p>
          </div>
        </div>

        {event.host_phone && (
          <a
            href={`https://wa.me/${event.host_phone.replace(/[^0-9]/g, "").replace(/^0/, "27")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="tap-tactile inline-flex items-center gap-1 rounded-full border border-[#25D366] bg-[#25D366]/10 px-2.5 py-1 text-[11px] font-bold text-[#075E54]"
          >
            <Phone className="h-3 w-3" />
            <span>Host WA</span>
          </a>
        )}
      </div>
    </div>
  );
}
