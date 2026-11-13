"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { triggerHaptic } from "@/lib/haptics";

interface BottomSheetDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: string;
  children: React.ReactNode;
}

export default function BottomSheetDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  children,
}: BottomSheetDrawerProps) {
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [currentTranslateY, setCurrentTranslateY] = useState(0);

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setCurrentTranslateY(0);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setDragStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartY === null) return;
    const deltaY = e.touches[0].clientY - dragStartY;
    if (deltaY > 0) {
      setCurrentTranslateY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    if (currentTranslateY > 100) {
      triggerHaptic("light");
      onClose();
    }
    setCurrentTranslateY(0);
    setDragStartY(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center print:hidden">
      {/* Dimmed Backdrop with Blur */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => {
          triggerHaptic("light");
          onClose();
        }}
      />

      {/* Slide-Up Surface */}
      <div
        style={{ transform: `translateY(${currentTranslateY}px)` }}
        className="relative z-10 w-full max-w-lg rounded-t-[32px] border-t border-[#E6E2D8] bg-[#FAF8F5] pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl transition-transform duration-200 max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-300 ease-out"
      >
        {/* Native Grab Handle */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="flex w-full cursor-grab flex-col items-center pt-3 pb-2 select-none active:cursor-grabbing"
        >
          <div className="h-1.5 w-12 rounded-full bg-[#D1CCC2]" />
        </div>

        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[#E6E2D8] px-5 pb-3 pt-1">
          <div>
            {badge && (
              <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-[#007749] bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md mb-0.5">
                {badge}
              </span>
            )}
            <h3 className="font-display text-lg font-black text-[#0F172A] leading-tight">
              {title}
            </h3>
            {subtitle && <p className="text-xs text-[#64748B]">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic("light");
              onClose();
            }}
            className="tap-tactile flex h-8 w-8 items-center justify-center rounded-full bg-[#EFECE6] text-[#475569] active:scale-95"
            aria-label="Close Drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Drawer Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}
