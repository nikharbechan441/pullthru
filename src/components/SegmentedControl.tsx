"use client";

import React from "react";
import { triggerHaptic } from "@/lib/haptics";

export interface SegmentTab<T extends string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface SegmentedControlProps<T extends string> {
  tabs: SegmentTab<T>[];
  activeTab: T;
  onChange: (id: T) => void;
  className?: string;
}

export default function SegmentedControl<T extends string>({
  tabs,
  activeTab,
  onChange,
  className = "",
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      className={`relative flex w-full items-center rounded-2xl bg-[#EFECE6] p-1 shadow-inner ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => {
              triggerHaptic("selection");
              onChange(tab.id);
            }}
            className={`tap-tactile relative z-10 flex flex-1 min-w-0 items-center justify-center gap-1 py-2 sm:py-2.5 px-1 sm:px-2 text-xs font-bold transition-all duration-150 active:scale-95 ${
              isActive
                ? "text-[#0F172A]"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span className="truncate">{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`font-mono-num ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                  isActive
                    ? "bg-[#007749] text-white"
                    : "bg-[#D8D4CA] text-[#475569]"
                }`}
              >
                {tab.badge}
              </span>
            )}
            {/* Sliding Pill Background */}
            {isActive && (
              <div className="absolute inset-0 -z-10 rounded-xl bg-white shadow-xs animate-in fade-in-50 zoom-in-95 duration-150" />
            )}
          </button>
        );
      })}
    </div>
  );
}
