"use client";

import React, { useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { triggerHaptic } from "@/lib/haptics";

interface BottomSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: string;
  children: React.ReactNode;
}

export default function BottomSheetModal({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  children,
}: BottomSheetModalProps) {
  const handleClose = useCallback(() => {
    triggerHaptic("light");
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 print:hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        className="w-full max-w-lg mx-auto bg-white rounded-t-[32px] border-t border-[#E6E2D8] shadow-2xl p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 card-elevated"
      >
        {/* Native Pull Handle */}
        <div className="w-12 h-1.5 rounded-full bg-[#CBD5E1] mx-auto -mt-1 mb-2 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E6E2D8]">
          <div className="space-y-0.5">
            {badge && (
              <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-[#007749] bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                {badge}
              </span>
            )}
            <h3 className="font-display text-lg font-extrabold text-[#0F172A] leading-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-[#475569]">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close sheet"
            className="tap-tactile flex h-9 w-9 items-center justify-center rounded-full bg-[#FAF8F5] border border-[#E6E2D8] text-[#64748B] hover:text-[#0F172A] transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sheet Content */}
        <div className="pt-1 pb-2">
          {children}
        </div>
      </div>
    </div>
  );
}
