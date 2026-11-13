"use client";

import React from "react";

interface PullThruLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showWordmark?: boolean;
  tagline?: string;
}

const SIZE_MAP = {
  xs: { box: "h-7 w-7", icon: 28, text: "text-base" },
  sm: { box: "h-9 w-9", icon: 36, text: "text-lg" },
  md: { box: "h-11 w-11", icon: 44, text: "text-xl" },
  lg: { box: "h-14 w-14", icon: 56, text: "text-2xl" },
  xl: { box: "h-20 w-20", icon: 80, text: "text-3xl" },
};

/**
 * PullThru Brand Mark:
 * An energetic, modern geometric emblem. Two interlocking continuous loops
 * forming a dynamic 'P' and pass-through ticket loop:
 * Represents pulling together a crew, locking in, and passing through the gate.
 */
export function PullThruIconSvg({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="PullThru Emblem"
    >
      <defs>
        <linearGradient id="pt-grad-primary" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#007749" />
          <stop offset="0.6" stopColor="#009A5B" />
          <stop offset="1" stopColor="#00D47E" />
        </linearGradient>
        <linearGradient id="pt-grad-accent" x1="12" y1="12" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00D47E" />
          <stop offset="1" stopColor="#FFB81C" />
        </linearGradient>
      </defs>

      {/* Rounded Soft Container */}
      <rect width="48" height="48" rx="14" fill="url(#pt-grad-primary)" />

      {/* Stylized 'P' Pass-Through Dynamic Loop */}
      {/* 1. Stem of the P with rounded tip */}
      <path
        d="M16 13C16 11.8954 16.8954 11 18 11H20C21.1046 11 22 11.8954 22 13V35C22 36.1046 21.1046 37 20 37H18C16.8954 37 16 36.1046 16 35V13Z"
        fill="white"
      />

      {/* 2. Sweeping upper loop forming the P and entry pass */}
      <path
        d="M20 11H27C32.5228 11 37 15.4772 37 21C37 26.5228 32.5228 31 27 31H20V25H27C29.2091 25 31 23.2091 31 21C31 18.7909 29.2091 17 27 17H20V11Z"
        fill="white"
      />

      {/* 3. The "Pull-Through" Arrow / Pulse Spark */}
      <circle cx="27" cy="21" r="3" fill="url(#pt-grad-accent)" />
      <path
        d="M24 33L29 37L24 41"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
    </svg>
  );
}

export default function PullThruLogo({
  size = "md",
  className = "",
  showWordmark = true,
  tagline,
}: PullThruLogoProps) {
  const currentSize = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="shrink-0 transition-transform duration-200 group-hover:scale-105">
        <PullThruIconSvg size={currentSize.icon} />
      </div>

      {showWordmark && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={`font-display ${currentSize.text} font-black tracking-tight text-[#0F172A]`}>
              PullThru
            </span>
          </div>
          {tagline ? (
            <span className="text-[10px] font-semibold text-[#64748B] mt-0.5 tracking-tight">
              {tagline}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
