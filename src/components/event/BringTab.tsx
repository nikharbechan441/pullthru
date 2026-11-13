"use client";

import React, { useState } from "react";
import { ShoppingBag, Plus } from "lucide-react";
import { EventItem } from "@/types/database";
import { triggerHaptic } from "@/lib/haptics";

interface BringTabProps {
  event: EventItem;
  hostMode: boolean;
  onClaimItem: (itemId: string) => void;
  onAddNewItem?: (label: string) => void;
  onUnclaimItem?: (itemId: string) => void;
}

export default function BringTab({
  event,
  hostMode,
  onClaimItem,
  onAddNewItem,
  onUnclaimItem,
}: BringTabProps) {
  const [newLabel, setNewLabel] = useState("");
  const items = event.bring_items || [];
  const claimedCount = items.filter((b) => b.claimed_by_name).length;

  return (
    <div className="space-y-4">
      {/* Intro Header Card */}
      <div className="rounded-2xl border border-[#E6E2D8] bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4.5 w-4.5 text-[#007749]" />
            <h3 className="font-display text-sm font-black text-[#0F172A]">
              Bring-List / What to Bring
            </h3>
          </div>
          <span className="font-mono-num rounded-full bg-[#EFECE6] px-2.5 py-0.5 text-xs font-bold text-[#0F172A]">
            {claimedCount} / {items.length} Claimed
          </span>
        </div>
        <p className="mt-1 text-xs text-[#64748B]">
          No more 4 people bringing tomato sauce and nobody bringing charcoal! Tap to claim an item.
        </p>
      </div>

      {/* Interactive Item Cards */}
      <div className="grid grid-cols-1 gap-2">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#E6E2D8] bg-white p-6 text-center text-xs text-[#64748B]">
            No items needed for this one — just pull through!
          </div>
        ) : (
          items.map((item) => {
            const isClaimed = Boolean(item.claimed_by_name);
            return (
              <div
                key={item.id}
                className={`flex items-center justify-between rounded-2xl border p-3.5 transition-all ${
                  isClaimed
                    ? "border-[#E6E2D8] bg-[#F7F5F0] opacity-80"
                    : "border-[#007749]/30 bg-white shadow-xs"
                }`}
              >
                <div className="min-w-0 pr-2">
                  <p className="truncate text-xs font-black text-[#0F172A]">{item.label}</p>
                  {isClaimed ? (
                    <p className="mt-0.5 text-[11px] font-bold text-[#007749]">
                      ✅ Claimed by {item.claimed_by_name}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-[11px] text-[#64748B]">Open to claim</p>
                  )}
                </div>

                {!isClaimed ? (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic("medium");
                      onClaimItem(item.id);
                    }}
                    className="tap-tactile shrink-0 rounded-full bg-[#007749] px-3.5 py-1.5 text-xs font-black text-white shadow-xs active:bg-[#005F3A]"
                  >
                    I&apos;ll Bring This
                  </button>
                ) : (
                  hostMode &&
                  onUnclaimItem && (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic("light");
                        onUnclaimItem(item.id);
                      }}
                      className="tap-tactile shrink-0 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[11px] font-extrabold text-amber-900 hover:bg-amber-100"
                    >
                      ↺ Release Item
                    </button>
                  )
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Host Add Custom Item */}
      {hostMode && onAddNewItem && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newLabel.trim()) return;
            onAddNewItem(newLabel.trim());
            setNewLabel("");
          }}
          className="flex gap-2 pt-1"
        >
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Add item (e.g. 🧊 3x Bags of Ice)"
            className="flex-1 rounded-xl border border-[#E6E2D8] bg-white px-3.5 py-2 text-xs font-semibold focus:border-[#007749] focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-xl bg-[#0F172A] px-4 py-2 text-xs font-bold text-white shadow-xs shrink-0 flex items-center gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add</span>
          </button>
        </form>
      )}
    </div>
  );
}
