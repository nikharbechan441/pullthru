"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Star,
  Download,
  Share2,
  BookmarkPlus,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Lock,
  Smartphone,
  Globe,
  Mail,
  MapPin,
  Calendar,
  Users,
  Search,
  Menu,
  HelpCircle,
  Sparkles,
  Play,
  RotateCw,
} from "lucide-react";

export default function PlayStorePreviewPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const [installState, setInstallState] = useState<"idle" | "downloading" | "installed">("idle");
  const [progress, setProgress] = useState(0);
  const [activeDeviceTab, setActiveDeviceTab] = useState<"phone" | "tablet" | "chromebook">("phone");
  const [selectedScreenshotIndex, setSelectedScreenshotIndex] = useState(0);

  const handleInstallClick = () => {
    if (installState === "installed") {
      window.location.href = "/";
      return;
    }
    setInstallState("downloading");
    setProgress(15);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          setTimeout(() => setInstallState("installed"), 400);
          return 100;
        }
        return prev + 20;
      });
    }, 250);
  };

  const screenshots = [
    {
      id: "fives",
      title: "Lock In 5-a-Side & Padel Spots",
      subtitle: "Instant Capitec Pay, Apple Pay & Ozow EFT",
      tag: "5-a-Side Soccer",
      badge: "⚽ Match Ball Pumped",
      price: "R100.00 / spot",
      spots: "7 / 10 Locked",
      color: "from-emerald-900 to-slate-900",
      contentUrl: "/e/thursday-fives-sandton",
    },
    {
      id: "creator",
      title: "Create Link in 25 Seconds",
      subtitle: "3-Step Stepper + Custom Vibe Presets",
      tag: "Event Creator",
      badge: "✨ Custom Vibe",
      price: "From R50",
      spots: "Instant Link",
      color: "from-amber-900 to-slate-900",
      contentUrl: "/create",
    },
    {
      id: "spitbraai",
      title: "Multi-Tier & Bring-List",
      subtitle: "Claim Ice, Charcoal & Sides in 1 Tap",
      tag: "Spitbraai & Potjie",
      badge: "🥩 Full Lamb Spitbraai",
      price: "R220 / R140 / R0",
      spots: "16 / 20 Locked",
      color: "from-rose-900 to-slate-900",
      contentUrl: "/e/bokke-test-spitbraai",
    },
    {
      id: "babyshower",
      title: "Dignity Gift & Umgalelo Pot",
      subtitle: "Show Names Only • Hide Individual Rand Amounts",
      tag: "Gift Pot",
      badge: "🍼 Pram & Crib Pot",
      price: "R2,150 of R5,000",
      spots: "6 Contributors",
      color: "from-purple-900 to-slate-900",
      contentUrl: "/e/mrs-dlamini-baby-shower",
    },
    {
      id: "receipt",
      title: "Official Boarding Pass & SARS s54 Receipt",
      subtitle: "QR Gate Code & Direct 100% Host Settlement",
      tag: "Gate Pass",
      badge: "🥇 First In!",
      price: "Disclosed Agency",
      spots: "Verified POP",
      color: "from-teal-900 to-slate-900",
      contentUrl: "/e/thursday-fives-sandton/success?ref=PT_SAMPLE_DEMO&rsvpId=rsvp-1",
    },
    {
      id: "spotswap",
      title: "1-Tap Self-Service Spot Swap",
      subtitle: "Injured or stuck at work? Zero refund fee transfer",
      tag: "CPA s17 Transfer",
      badge: "🔄 Spot Transferred",
      price: "R0 Refund Loss",
      spots: "Instant Handover",
      color: "from-blue-900 to-slate-900",
      contentUrl: "/e/thursday-fives-sandton/success?ref=PT_SAMPLE_DEMO&rsvpId=rsvp-1",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#202124] font-sans antialiased selection:bg-[#007749]/20 selection:text-[#007749]">
      {/* Top Google Play App Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E8EAED] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Google Play Brand */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex items-center gap-1.5">
                {/* Google Play Triangle Logo */}
                <svg className="h-7 w-7" viewBox="0 0 40 40" fill="none">
                  <path d="M7.5 4.5L25.8 22.8L7.5 41.1V4.5Z" fill="#00D2FF" />
                  <path d="M25.8 22.8L32.4 16.2C33.6 15 34.2 13.4 34.2 11.7C34.2 9.2 32.5 7.1 30.1 6.8C29.4 6.7 28.7 6.8 28.1 7.1L7.5 4.5L25.8 22.8Z" fill="#00E676" />
                  <path d="M7.5 41.1L28.1 38.5C28.7 38.8 29.4 38.9 30.1 38.8C32.5 38.5 34.2 36.4 34.2 33.9C34.2 32.2 33.6 30.6 32.4 29.4L25.8 22.8L7.5 41.1Z" fill="#FF3D00" />
                  <path d="M25.8 22.8L32.4 29.4C34.5 27.3 35.5 24.3 35.1 21.3C34.8 19.3 33.8 17.5 32.4 16.2L25.8 22.8Z" fill="#FFD600" />
                </svg>
                <span className="text-xl font-bold tracking-tight text-[#5F6368]">
                  Google <span className="text-[#202124]">Play</span>
                </span>
              </div>
            </Link>

            {/* Nav Tabs */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#5F6368]">
              <span className="text-[#01875F] font-semibold border-b-2 border-[#01875F] py-5">
                Apps
              </span>
              <span className="hover:text-[#202124] cursor-pointer transition">Games</span>
              <span className="hover:text-[#202124] cursor-pointer transition">Movies</span>
              <span className="hover:text-[#202124] cursor-pointer transition">Books</span>
              <span className="hover:text-[#202124] cursor-pointer transition">Children</span>
            </nav>
          </div>

          {/* Search Bar & User */}
          <div className="flex items-center gap-3 flex-1 max-w-md justify-end">
            <div className="relative w-full max-w-xs hidden sm:block">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#5F6368]" />
              <input
                type="text"
                readOnly
                value="PullThru — SA WhatsApp Kitty"
                className="w-full pl-10 pr-4 py-2 bg-[#F1F3F4] rounded-full text-xs font-medium text-[#202124] border-none focus:outline-none"
              />
            </div>
            <div className="h-8 w-8 rounded-full bg-[#007749] text-white flex items-center justify-center font-bold text-xs ring-2 ring-emerald-600/30">
              ZA
            </div>
          </div>
        </div>
      </header>

      {/* Main Play Store Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-10">
        {/* Banner Alert: Live Preview Mockup */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#007749] text-white font-bold text-sm shadow-xs">
              🇿🇦
            </span>
            <div>
              <p className="font-bold text-[#0F172A]">
                Google Play Store Listing Simulator • South Africa (English / en-ZA)
              </p>
              <p className="text-[#475569]">
                Verified package: <code className="font-mono font-bold text-[#007749]">com.pullthru.za</code> • Release signing key verified
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-300 bg-white text-[#007749] font-bold hover:bg-emerald-50 transition"
            >
              <span>Preview Web App</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* 1. APP HEADER HERO CARD */}
        <section className="bg-white rounded-3xl border border-[#E8EAED] p-6 sm:p-10 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* App Icon */}
            <div className="md:col-span-3 flex flex-col items-center sm:items-start">
              <div className="relative h-32 w-32 sm:h-40 sm:w-40 rounded-[28%] overflow-hidden shadow-lg border border-slate-200/80 bg-[#007749]">
                <Image
                  src="/icon-512.png"
                  alt="PullThru Official App Icon"
                  width={160}
                  height={160}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
              <span className="mt-3 inline-flex items-center gap-1 rounded-md bg-[#E8F0FE] px-2 py-0.5 text-[11px] font-bold text-[#1A73E8]">
                ✓ Official Release
              </span>
            </div>

            {/* App Metadata & Actions */}
            <div className="md:col-span-9 space-y-4">
              <div>
                <h1 className="text-2xl sm:text-4xl font-extrabold text-[#202124] tracking-tight">
                  PullThru — SA WhatsApp Kitty
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-semibold text-[#01875F]">
                    PullThru Technologies (Pty) Ltd
                  </span>
                  <span className="text-[#5F6368]">•</span>
                  <span className="text-[#5F6368]">In-app purchases</span>
                  <span className="text-[#5F6368]">•</span>
                  <span className="text-[#5F6368]">Events &amp; Social</span>
                </div>
              </div>

              {/* Key App Stats Horizontal Bar */}
              <div className="flex flex-wrap items-center gap-6 sm:gap-10 py-3 border-y border-[#F1F3F4] text-center sm:text-left">
                {/* Rating */}
                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-1 font-bold text-sm text-[#202124]">
                    <span>4.9</span>
                    <Star className="h-3.5 w-3.5 fill-[#202124] text-[#202124]" />
                  </div>
                  <span className="text-[11px] text-[#5F6368]">1.42K reviews</span>
                </div>

                <div className="h-8 w-px bg-[#E8EAED]" />

                {/* Downloads */}
                <div>
                  <div className="font-bold text-sm text-[#202124]">50K+</div>
                  <span className="text-[11px] text-[#5F6368]">Downloads</span>
                </div>

                <div className="h-8 w-px bg-[#E8EAED]" />

                {/* Content Rating */}
                <div>
                  <div className="inline-flex items-center justify-center px-1 border border-[#202124] rounded-xs font-bold text-[10px] text-[#202124] leading-tight">
                    3+
                  </div>
                  <div className="text-[11px] text-[#5F6368] mt-0.5">Rated for 3+</div>
                </div>

                <div className="h-8 w-px bg-[#E8EAED] hidden sm:block" />

                {/* Top Chart Rank */}
                <div className="hidden sm:block">
                  <div className="font-bold text-sm text-[#01875F]">#1 Top Free</div>
                  <span className="text-[11px] text-[#5F6368]">Events (South Africa)</span>
                </div>
              </div>

              {/* Install CTA Button & Secondary Actions */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  disabled={installState === "downloading"}
                  className={`min-w-[160px] h-12 rounded-full font-bold text-sm px-8 transition-all flex items-center justify-center gap-2 shadow-sm ${
                    installState === "installed"
                      ? "bg-[#01875F] text-white hover:bg-[#00704E]"
                      : installState === "downloading"
                      ? "bg-[#E8EAED] text-[#5F6368] cursor-wait"
                      : "bg-[#01875F] text-white hover:bg-[#00704E] active:scale-[0.98]"
                  }`}
                >
                  {installState === "downloading" ? (
                    <>
                      <RotateCw className="h-4 w-4 animate-spin text-[#01875F]" />
                      <span>Installing ({progress}%)...</span>
                    </>
                  ) : installState === "installed" ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Open App</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>Install on phone</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: "PullThru — SA WhatsApp Kitty",
                        url: "https://pullthru.co.za",
                      });
                    }
                  }}
                  className="h-12 px-4 rounded-full border border-[#DADCE0] text-[#01875F] hover:bg-[#F8F9FA] transition flex items-center justify-center gap-1.5 text-xs font-semibold"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </button>

                <button
                  type="button"
                  className="h-12 px-4 rounded-full border border-[#DADCE0] text-[#01875F] hover:bg-[#F8F9FA] transition flex items-center justify-center gap-1.5 text-xs font-semibold"
                >
                  <BookmarkPlus className="h-4 w-4" />
                  <span>Add to wishlist</span>
                </button>
              </div>

              {/* Supported Devices Pill Row */}
              <div className="flex items-center gap-2 text-xs text-[#5F6368] pt-1">
                <Smartphone className="h-3.5 w-3.5 text-[#01875F]" />
                <span>This app is available for all of your devices (Phone, Tablet, Chromebook)</span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. GOOGLE PLAY FEATURE GRAPHIC BANNER */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#202124]">Feature Graphic &amp; Banner</h2>
            <span className="text-xs font-mono text-[#5F6368]">1024 × 500 PNG • Store Header</span>
          </div>

          <div className="relative rounded-3xl overflow-hidden border border-[#E8EAED] shadow-md bg-slate-900 group">
            <Image
              src="/feature-graphic.png"
              alt="PullThru Google Play Store 1024x500 Feature Graphic"
              width={1024}
              height={500}
              className="w-full h-auto object-cover max-h-[460px]"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6 sm:p-8">
              <div className="text-white space-y-1">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#FFB81C] px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-[#0F172A]">
                  🇿🇦 OFFICIAL LAUNCH TRAILER
                </span>
                <h3 className="text-xl sm:text-2xl font-black">
                  Stop chasing EFTs. Get paid before kickoff.
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 max-w-xl">
                  Capitec Pay, Apple Pay &amp; Ozow Instant EFT in 5 seconds. Direct split settlement into your South African bank account.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. DEVICE SCREENSHOT CAROUSEL */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#202124]">Phone Screenshots</h2>
              <p className="text-xs text-[#5F6368]">
                Real-world mobile UI captured on Samsung Galaxy &amp; Google Pixel
              </p>
            </div>

            {/* Device Selector Pills */}
            <div className="inline-flex rounded-full border border-[#DADCE0] bg-white p-1 text-xs font-semibold">
              {(["phone", "tablet", "chromebook"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveDeviceTab(tab)}
                  className={`px-3 py-1 rounded-full capitalize transition ${
                    activeDeviceTab === tab
                      ? "bg-[#01875F] text-white font-bold"
                      : "text-[#5F6368] hover:text-[#202124]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Screenshots Scrollable Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {screenshots.map((s, index) => (
              <div
                key={s.id}
                className="rounded-3xl border border-[#E8EAED] bg-white p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between group"
              >
                {/* Mockup Frame Header */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#F1F3F4]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#01875F]">
                    {s.tag}
                  </span>
                  <span className="text-[10px] font-mono text-[#5F6368]">
                    Screen #{index + 1}
                  </span>
                </div>

                {/* Simulated Phone Display Screen */}
                <div className={`rounded-2xl bg-gradient-to-br ${s.color} p-4 text-white space-y-3 min-h-[280px] flex flex-col justify-between relative overflow-hidden shadow-inner`}>
                  {/* Status Bar */}
                  <div className="flex items-center justify-between text-[10px] opacity-80">
                    <span>14:30</span>
                    <span>5G • 🇿🇦</span>
                  </div>

                  {/* Card Content */}
                  <div className="space-y-1.5 my-auto">
                    <span className="inline-block rounded-full bg-white/20 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-bold text-emerald-200">
                      {s.badge}
                    </span>
                    <h4 className="text-lg font-extrabold leading-snug">
                      {s.title}
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {s.subtitle}
                    </p>
                  </div>

                  {/* Scarcity / Price Bottom Capsule */}
                  <div className="flex items-center justify-between rounded-xl bg-white/10 backdrop-blur-md p-2.5 text-xs font-bold border border-white/10">
                    <span className="font-mono text-emerald-300">{s.price}</span>
                    <span className="text-slate-200">{s.spots}</span>
                  </div>
                </div>

                {/* Preview Link */}
                <div className="mt-3 pt-2 flex items-center justify-between">
                  <span className="text-xs text-[#5F6368] font-medium">
                    Tap to test screen live:
                  </span>
                  <Link
                    href={s.contentUrl}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#01875F] hover:underline"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. ABOUT THIS APP SECTION */}
        <section className="bg-white rounded-3xl border border-[#E8EAED] p-6 sm:p-10 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#F1F3F4] pb-4">
            <h2 className="text-xl font-bold text-[#202124]">About this app</h2>
            <ChevronRight className="h-5 w-5 text-[#5F6368]" />
          </div>

          <p className="text-sm text-[#3C4043] leading-relaxed">
            <strong>Drop a 25-second link in your WhatsApp group for 5-a-Side Soccer, Padel, Spitbraais, Baby Showers, or Run Clubs.</strong> Instant Capitec Pay, Ozow Instant EFT, and Apple Pay. Stop chasing unpaid guests—spots only lock when paid.
          </p>

          <div className="space-y-3 text-xs text-[#3C4043]">
            <h3 className="text-sm font-bold text-[#202124]">🌟 South Africa’s Favorite Group Rituals:</h3>
            <ul className="space-y-2 list-disc list-inside">
              <li>
                <strong>⚽ 5-a-Side &amp; Padel:</strong> Fixed split pricing with automatic team bib allocation (Green vs Gold) and real-time locked squad lists.
              </li>
              <li>
                <strong>🥩 Spitbraai &amp; Potjie:</strong> Multi-tier ticketing (e.g. Full Braai R220 vs Meat &amp; Sides R140 vs Kids Under 12 R0).
              </li>
              <li>
                <strong>🧊 Bring-List Checklist:</strong> 1-tap claimable items list (bags of ice, wood, salad, Bluetooth speaker) so 4 people don&apos;t bring tomato sauce and nobody brings charcoal.
              </li>
              <li>
                <strong>🎁 Dignity Gift &amp; Umgalelo Pot:</strong> Confidential collections for baby showers, teacher gifts, and family support (*&ldquo;Show Names Only, Hide Amounts&rdquo;* mode).
              </li>
              <li>
                <strong>🔄 1-Tap Self-Service Spot Swap (CPA Section 17):</strong> Pulled a hamstring or stuck at work? Send your secret swap link to a mate to transfer your paid spot on the wall with zero refund fee losses.
              </li>
              <li>
                <strong>🗓️ Payday 25th Pledge (Standby):</strong> Let friends pledge their spot until salary hits on the 25th without blocking paying attendees.
              </li>
            </ul>
          </div>

          {/* What's New Box */}
          <div className="rounded-2xl border border-[#E8EAED] bg-[#F8F9FA] p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#202124]">What&apos;s new</span>
              <span className="text-[#5F6368] font-mono">v1.0.4 • Released Oct 2026</span>
            </div>
            <p className="text-xs text-[#5F6368] leading-relaxed">
              • Added Custom Vibe Presets (+ Add Your Own with 20-emoji picker)<br />
              • Added WhatsApp 1-Command Quick Fill (/pullthru 5aside R100 10spots)<br />
              • Full support for Capitec Pay biometric approval &amp; Apple Pay instant clearing<br />
              • Enhanced POPIA Section 18 privacy masking for Dignity Pots
            </p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 pt-2">
            {[
              "Events & Social",
              "Fintech South Africa",
              "Capitec Pay",
              "5-a-Side Soccer",
              "Padel",
              "Braai Kitty",
              "Productivity",
            ].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[#DADCE0] bg-white px-3 py-1 text-xs font-semibold text-[#5F6368]"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>

        {/* 5. DATA SAFETY (GOOGLE PLAY REQUIRED DISCLOSURE) */}
        <section className="bg-white rounded-3xl border border-[#E8EAED] p-6 sm:p-10 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#F1F3F4] pb-4">
            <div>
              <h2 className="text-xl font-bold text-[#202124]">Data safety</h2>
              <p className="text-xs text-[#5F6368] mt-0.5">
                Safety starts with understanding how developers collect and share your data.
              </p>
            </div>
            <ShieldCheck className="h-6 w-6 text-[#01875F]" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#3C4043]">
            <div className="flex items-start gap-3 p-3.5 rounded-2xl border border-[#F1F3F4] bg-[#F8F9FA]">
              <Lock className="h-4 w-4 text-[#01875F] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-[#202124]">Data is encrypted in transit</strong>
                <span>Your personal information and payments are transferred over a secure HTTPS connection.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl border border-[#F1F3F4] bg-[#F8F9FA]">
              <CheckCircle2 className="h-4 w-4 text-[#01875F] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-[#202124]">No data shared with third parties</strong>
                <span>The developer declares that this app does not sell or share user data with other companies.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl border border-[#F1F3F4] bg-[#F8F9FA]">
              <Users className="h-4 w-4 text-[#01875F] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-[#202124]">Data collected: Name &amp; Phone</strong>
                <span>Required strictly for the event attendee roster, gate pass issuance, and WhatsApp receipt dispatch.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl border border-[#F1F3F4] bg-[#F8F9FA]">
              <ShieldCheck className="h-4 w-4 text-[#01875F] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-[#202124]">You can request data deletion</strong>
                <span>The developer provides a mechanism for you to request that your RSVP records and profile be removed.</span>
              </div>
            </div>
          </div>
        </section>

        {/* 6. RATINGS & REVIEWS (MZANSI USERS) */}
        <section className="bg-white rounded-3xl border border-[#E8EAED] p-6 sm:p-10 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#F1F3F4] pb-4">
            <div>
              <h2 className="text-xl font-bold text-[#202124]">Ratings and reviews</h2>
              <p className="text-xs text-[#5F6368] mt-0.5">
                Ratings and reviews are verified and from people who use the same type of device as you.
              </p>
            </div>
            <span className="text-xs font-bold text-[#01875F] hover:underline cursor-pointer">
              See all 1,420 reviews
            </span>
          </div>

          {/* Rating Breakdown Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
            <div className="sm:col-span-4 text-center sm:text-left">
              <div className="text-5xl font-black text-[#202124]">4.9</div>
              <div className="flex items-center justify-center sm:justify-start gap-1 my-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-[#01875F] text-[#01875F]" />
                ))}
              </div>
              <span className="text-xs text-[#5F6368]">1,420 verified Mzansi users</span>
            </div>

            {/* Stars Bar Graph */}
            <div className="sm:col-span-8 space-y-1.5 text-xs font-medium text-[#5F6368]">
              <div className="flex items-center gap-2">
                <span>5</span>
                <div className="h-2 flex-1 rounded-full bg-[#E8EAED] overflow-hidden">
                  <div className="h-full bg-[#01875F] w-[92%]" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span>4</span>
                <div className="h-2 flex-1 rounded-full bg-[#E8EAED] overflow-hidden">
                  <div className="h-full bg-[#01875F] w-[6%]" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span>3</span>
                <div className="h-2 flex-1 rounded-full bg-[#E8EAED] overflow-hidden">
                  <div className="h-full bg-[#01875F] w-[1%]" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span>2</span>
                <div className="h-2 flex-1 rounded-full bg-[#E8EAED] overflow-hidden">
                  <div className="h-full bg-[#01875F] w-[0.5%]" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span>1</span>
                <div className="h-2 flex-1 rounded-full bg-[#E8EAED] overflow-hidden">
                  <div className="h-full bg-[#01875F] w-[0.5%]" />
                </div>
              </div>
            </div>
          </div>

          {/* User Review Cards */}
          <div className="space-y-4 pt-2">
            {[
              {
                name: "Thabo Mokoena (Soweto, Joburg)",
                date: "19 October 2026",
                stars: 5,
                comment:
                  "Finally stopped chasing 10 guys for R100 on Thursday night soccer. Dropped the link in our WhatsApp group, everyone paid with Capitec Pay in 4 seconds, and team bibs were sorted before kickoff. Literal game changer!",
              },
              {
                name: "Willem Steenkamp (Centurion, Pretoria)",
                date: "18 October 2026",
                stars: 5,
                comment:
                  "The 1-tap spot swap saved our Padel fourball when Jaco pulled a calf muscle 2 hours before the game. He tapped swap, sent the link to his brother, and the spot transferred without anyone needing a refund.",
              },
              {
                name: "Fatima Patel (Overport, Durban)",
                date: "16 October 2026",
                stars: 5,
                comment:
                  "Used the dignity pot mode for a school teacher's farewell gift. Loved that it hides individual Rand amounts so nobody feels pressured or embarrassed about what they can afford. Beautiful UI!",
              },
            ].map((review, i) => (
              <div key={i} className="border-t border-[#F1F3F4] pt-4 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-slate-200 font-bold flex items-center justify-center text-[#202124]">
                      {review.name[0]}
                    </div>
                    <span className="font-bold text-[#202124]">{review.name}</span>
                  </div>
                  <span className="text-[#5F6368]">{review.date}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  {[...Array(review.stars)].map((_, s) => (
                    <Star key={s} className="h-3 w-3 fill-[#01875F] text-[#01875F]" />
                  ))}
                </div>
                <p className="text-[#3C4043] leading-relaxed">{review.comment}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 7. DEVELOPER CONTACT & STATUTORY INFO */}
        <section className="bg-white rounded-3xl border border-[#E8EAED] p-6 sm:p-8 shadow-xs text-xs text-[#5F6368] space-y-4">
          <h2 className="text-base font-bold text-[#202124]">Developer contact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-[#01875F]" />
              <a href="https://pullthru.co.za" className="text-[#01875F] font-semibold hover:underline">
                pullthru.co.za
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#01875F]" />
              <a href="mailto:support@pullthru.co.za" className="text-[#01875F] font-semibold hover:underline">
                support@pullthru.co.za
              </a>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#01875F]" />
              <span>Johannesburg, Gauteng, South Africa</span>
            </div>
          </div>
          <div className="pt-2 border-t border-[#F1F3F4] flex flex-wrap items-center justify-between gap-2">
            <span>© 2026 PullThru Technologies (Pty) Ltd • All Rights Reserved</span>
            <Link href="/terms" className="text-[#01875F] hover:underline font-semibold">
              Privacy Policy &amp; Terms
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
