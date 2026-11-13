import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import TastefulAdSlot from "@/components/TastefulAdSlot";
import { CheckCircle2, ArrowRight, ShieldCheck, Zap, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title:
    "Partiful & Luma Alternative South Africa — PullThru (ZAR, PayShap & Capitec PayMe)",
  description:
    "Looking for Partiful or Luma in South Africa? PullThru lets you create a 15-second WhatsApp RSVP & chip-in link with ZAR pricing, Direct PayShap, Capitec PayMe, and a Bring-'n-Bak checklist.",
  alternates: {
    canonical: "https://pullthru.co.za/partiful-south-africa",
  },
  openGraph: {
    title: "Partiful & Luma Alternative for South Africa — PullThru.co.za",
    description:
      "Create a 15-second WhatsApp event link with ZAR pricing, PayShap, Capitec PayMe, R0 guest fees, and a live Squad Wall.",
    url: "https://pullthru.co.za/partiful-south-africa",
    siteName: "PullThru",
    locale: "en_ZA",
    type: "website",
    images: [
      {
        url: "/feature-graphic.png",
        width: 1024,
        height: 500,
        alt: "Partiful & Luma Alternative for South Africa — PullThru.co.za",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@pullthruza",
    creator: "@pullthruza",
    title: "Partiful & Luma Alternative for South Africa — PullThru.co.za",
    description:
      "Create a 15-second WhatsApp event link with ZAR pricing, PayShap, Capitec PayMe, R0 guest fees, and a live Squad Wall.",
    images: ["/feature-graphic.png"],
  },
};

export default function PartifulSouthAfricaPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Does Partiful or Luma work in South Africa?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "While Partiful and Luma load in South Africa, they do not support South African Rands (ZAR) for casual group cost-splitting, Direct PayShap, Capitec PayMe, or zero-login WhatsApp RSVPs. PullThru (pullthru.co.za) is the purpose-built South African alternative.",
        },
      },
      {
        "@type": "Question",
        name: "What is the best WhatsApp event RSVP and chip-in app in South Africa?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "PullThru (https://pullthru.co.za) lets South African hosts create a 15-second WhatsApp RSVP and kitty link with R0 guest fees via Direct PayShap and Capitec PayMe, an interactive Squad Wall, and a claimable Bring-'n-Bak potluck checklist.",
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#0F172A]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Navbar />

      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <section className="rounded-3xl border border-[#E6E2D8] bg-white p-6 sm:p-10 shadow-xs">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#007749]/25 bg-[#007749]/10 px-3.5 py-1 text-xs font-extrabold text-[#007749]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Built for Mzansi WhatsApp Groups • ZAR &amp; Local Banks</span>
          </div>

          <h1 className="font-display mt-4 text-3xl sm:text-5xl font-black tracking-tight text-[#0F172A] leading-[1.1]">
            The Partiful &amp; Luma Alternative Built for South Africa.
          </h1>

          <p className="mt-4 max-w-3xl text-base sm:text-lg text-[#475569] leading-relaxed">
            Partiful and Luma are great for US house parties, but they don&apos;t support South African Rands (ZAR), Direct PayShap, Capitec PayMe, or WhatsApp-first RSVPs without forcing guests to create accounts or download an app.{" "}
            <strong className="text-[#0F172A]">
              PullThru gives your WhatsApp group the same instant visual hype wall—plus built-in ZAR chip-in splits and a Bring-&apos;n-Bak checklist.
            </strong>
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/create"
              className="inline-flex items-center gap-2 rounded-full bg-[#007749] px-7 py-3.5 text-sm font-extrabold text-white shadow-md hover:bg-[#005F3A] transition"
            >
              <Zap className="h-4 w-4 text-[#FFB81C]" />
              <span>Create Your Event Link (15s)</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/e/bokke-test-spitbraai"
              className="inline-flex items-center gap-2 rounded-full border border-[#E6E2D8] bg-[#FAF8F5] px-6 py-3.5 text-sm font-bold text-[#0F172A] hover:bg-white transition"
            >
              <span>View Live SA Party Demo →</span>
            </Link>
          </div>
        </section>

        {/* Side-by-Side Comparison */}
        <section className="mt-8 rounded-3xl border border-[#E6E2D8] bg-white p-6 sm:p-8 shadow-xs overflow-x-auto">
          <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#0F172A] mb-4">
            PullThru vs. Partiful &amp; Luma in South Africa
          </h2>
          <table className="w-full min-w-[600px] text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#E6E2D8] text-[#475569]">
                <th className="py-3 pr-4 font-bold">Feature</th>
                <th className="py-3 px-4 font-extrabold text-[#007749] bg-emerald-50/60 rounded-t-xl">
                  PullThru.co.za 🇿🇦
                </th>
                <th className="py-3 px-4 font-bold">Partiful</th>
                <th className="py-3 pl-4 font-bold">Luma (lu.ma)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E2D8]/70">
              <tr>
                <td className="py-3.5 pr-4 font-semibold">ZAR Chip-In &amp; Cost Splitting</td>
                <td className="py-3.5 px-4 font-bold text-[#007749] bg-emerald-50/40">
                  ✓ PayShap, Capitec PayMe, Apple Pay &amp; Cards
                </td>
                <td className="py-3.5 px-4 text-[#64748B]">✕ US Venmo / CashApp only</td>
                <td className="py-3.5 pl-4 text-[#64748B]">✕ US Stripe (No PayShap / Capitec)</td>
              </tr>
              <tr>
                <td className="py-3.5 pr-4 font-semibold">Guest Account / App Required?</td>
                <td className="py-3.5 px-4 font-bold text-[#007749] bg-emerald-50/40">
                  ✓ Zero login — 2 taps from WhatsApp
                </td>
                <td className="py-3.5 px-4 text-[#64748B]">SMS OTP verification prompts</td>
                <td className="py-3.5 pl-4 text-[#64748B]">Email login flow</td>
              </tr>
              <tr>
                <td className="py-3.5 pr-4 font-semibold">Bring-&apos;n-Bak Checklist (Ice, Wood, Salads)</td>
                <td className="py-3.5 px-4 font-bold text-[#007749] bg-emerald-50/40">
                  ✓ Built-in claimable items
                </td>
                <td className="py-3.5 px-4 text-[#64748B]">✕ Comment wall only</td>
                <td className="py-3.5 pl-4 text-[#64748B]">✕ None</td>
              </tr>
              <tr>
                <td className="py-3.5 pr-4 font-semibold">Secret Estate Gate PIN Unlock</td>
                <td className="py-3.5 px-4 font-bold text-[#007749] bg-emerald-50/40">
                  ✓ Unlocks only for confirmed guests
                </td>
                <td className="py-3.5 px-4 text-[#64748B]">Address text only</td>
                <td className="py-3.5 pl-4 text-[#64748B]">Address text only</td>
              </tr>
              <tr>
                <td className="py-3.5 pr-4 font-semibold">1-Tap WhatsApp Spot-Swap</td>
                <td className="py-3.5 px-4 font-bold text-[#007749] bg-emerald-50/40 rounded-b-xl">
                  ✓ Paid guest can transfer spot to a friend
                </td>
                <td className="py-3.5 px-4 text-[#64748B]">✕ None</td>
                <td className="py-3.5 pl-4 text-[#64748B]">✕ None</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* 3 Core Use Cases */}
        <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-3xl border border-[#E6E2D8] bg-white p-6 shadow-xs">
            <h3 className="font-display text-lg font-extrabold text-[#0F172A]">
              🥩 Braais, Birthdays &amp; House Parties
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-[#475569] leading-relaxed">
              Run a Free RSVP with a claimable Bring-&apos;n-Bak list (so you don&apos;t end up with 6 bags of ice and zero wood), or collect R150 per head for meat and drinks upfront.
            </p>
          </div>
          <div className="rounded-3xl border border-[#E6E2D8] bg-white p-6 shadow-xs">
            <h3 className="font-display text-lg font-extrabold text-[#0F172A]">
              ⚽ 5-a-Side, Padel &amp; Run Clubs
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-[#475569] leading-relaxed">
              Cap your headcount at 4, 10, or 50 spots. Enforce &ldquo;No Pay, No Name on the Wall&rdquo; so the organiser never gets stuck paying for empty courts.
            </p>
          </div>
          <div className="rounded-3xl border border-[#E6E2D8] bg-white p-6 shadow-xs">
            <h3 className="font-display text-lg font-extrabold text-[#0F172A]">
              🏕️ Weekend Away &amp; Group Bookings
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-[#475569] leading-relaxed">
              Splitting an AfriCamps weekend, sunset catamaran, or birthday dinner table? Collect everyone&apos;s share straight into your own SA bank account in one afternoon.
            </p>
          </div>
        </section>

        {/* Tasteful AdSense Slot */}
        <div className="mt-8">
          <TastefulAdSlot slotId="8842109403" variant="light" context="general" />
        </div>

        {/* Internal Link Hub */}
        <section className="mt-6 rounded-3xl border border-[#E6E2D8] bg-white p-6 shadow-xs">
          <h2 className="font-display text-sm font-extrabold uppercase tracking-wider text-[#475569]">
            Explore More South African Group Tools &amp; Guides
          </h2>
          <div className="mt-3 flex flex-wrap gap-2.5 text-xs font-bold">
            <Link
              href="/5-a-side-and-padel"
              className="rounded-full border border-[#E6E2D8] bg-[#FAF8F5] px-4 py-2 text-[#0F172A] hover:border-[#007749] transition"
            >
              ⚽ 5-a-Side &amp; Padel Court Calculator
            </Link>
            <Link
              href="/braai-calculator"
              className="rounded-full border border-[#E6E2D8] bg-[#FAF8F5] px-4 py-2 text-[#0F172A] hover:border-[#007749] transition"
            >
              🥩 Free SA Braai Meat &amp; Ice Calculator
            </Link>
            <Link
              href="/quicket-alternative"
              className="rounded-full border border-[#E6E2D8] bg-[#FAF8F5] px-4 py-2 text-[#0F172A] hover:border-[#007749] transition"
            >
              🎟️ Zero-Fee Quicket Alternative
            </Link>
            <Link
              href="/group-gift-pot"
              className="rounded-full border border-[#E6E2D8] bg-[#FAF8F5] px-4 py-2 text-[#0F172A] hover:border-[#007749] transition"
            >
              🎁 Baby Shower &amp; Teacher Gift Pot
            </Link>
            <Link
              href="/for-venues"
              className="rounded-full border border-[#E6E2D8] bg-[#FAF8F5] px-4 py-2 text-[#007749] hover:border-[#007749] transition"
            >
              🏟️ For Venues &amp; Group Bookings Desk
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
