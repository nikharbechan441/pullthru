import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import TastefulAdSlot from "@/components/TastefulAdSlot";
import { ArrowRight, Zap, Sparkles, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title:
    "Quicket & Howler Alternative for Casual Events & Clubs — PullThru South Africa",
  description:
    "Stop losing 5% to 7% in ticketing fees on casual group events, run clubs, 5-a-side games, and birthday dinners. PullThru lets guests pay R0 guest fees via Direct PayShap or Capitec PayMe.",
  alternates: {
    canonical: "https://pullthru.co.za/quicket-alternative",
  },
  openGraph: {
    title: "Zero-Fee Quicket Alternative for Social Events & Sports Clubs — PullThru",
    description:
      "Collect event RSVPs and per-spot payments on WhatsApp with R0 guest fees and instant direct settlement to your SA bank account.",
    url: "https://pullthru.co.za/quicket-alternative",
    siteName: "PullThru",
    locale: "en_ZA",
    type: "website",
    images: [
      {
        url: "/feature-graphic.png",
        width: 1024,
        height: 500,
        alt: "Zero-Fee Quicket Alternative for Social Events & Sports Clubs — PullThru",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@pullthruza",
    creator: "@pullthruza",
    title: "Zero-Fee Quicket Alternative for Social Events & Sports Clubs — PullThru",
    description:
      "Collect event RSVPs and per-spot payments on WhatsApp with R0 guest fees and instant direct settlement to your SA bank account.",
    images: ["/feature-graphic.png"],
  },
};

export default function QuicketAlternativePage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is a zero-fee alternative to Quicket and Howler for small social events in South Africa?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "PullThru (pullthru.co.za) is a WhatsApp-first event RSVP and group payment tool for 4 to 100+ guests in South Africa. Unlike commercial ticketing sites that charge 4.9% + R5 per ticket and hold payouts in escrow, PullThru lets guests pay hosts directly via PayShap or Capitec PayMe with R0.00 guest fees.",
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
            <span>R0 Guest Surcharges • Direct 5-Second Bank Payouts</span>
          </div>

          <h1 className="font-display mt-4 text-3xl sm:text-5xl font-black tracking-tight text-[#0F172A] leading-[1.1]">
            Why Pay 5%–7% Ticketing Fees for a Casual Social Event or Sports Club?
          </h1>

          <p className="mt-4 max-w-3xl text-base sm:text-lg text-[#475569] leading-relaxed">
            Formal ticketing platforms like Quicket and Howler are built for 2,000-person music festivals—which is why they charge 4.9% + R5 per ticket and hold your payout until days after the event.{" "}
            <strong className="text-[#0F172A]">
              For groups of 4 to 100 people (5-a-side soccer, padel tournaments, run clubs, hiking groups, spitbraais, and birthday tables), PullThru settles 100% directly to your bank account with R0.00 guest fees on PayShap and Capitec PayMe.
            </strong>
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/create"
              className="inline-flex items-center gap-2 rounded-full bg-[#007749] px-7 py-3.5 text-sm font-extrabold text-white shadow-md hover:bg-[#005F3A] transition"
            >
              <Zap className="h-4 w-4 text-[#FFB81C]" />
              <span>Launch Your Zero-Fee Event Link (15s)</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/e/thursday-fives-sandton"
              className="inline-flex items-center gap-2 rounded-full border border-[#E6E2D8] bg-[#FAF8F5] px-6 py-3.5 text-sm font-bold text-[#0F172A] hover:bg-white transition"
            >
              <span>See Live 5-a-Side Wall Demo →</span>
            </Link>
          </div>
        </section>

        {/* Fee Math Comparison */}
        <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-rose-200 bg-white p-6 sm:p-8 shadow-xs">
            <span className="inline-flex rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-extrabold text-rose-800">
              Traditional Ticketing Gateways (Quicket / Howler)
            </span>
            <h2 className="font-display mt-3 text-xl font-extrabold text-[#0F172A]">
              20 Guests × R250 Ticket = R5,000 Gross
            </h2>
            <ul className="mt-4 space-y-2.5 text-xs sm:text-sm text-[#475569]">
              <li>• Commission &amp; Booking Fees (~4.9% + R5 + VAT): <strong className="text-rose-700">-R380 to -R450 lost</strong></li>
              <li>• Payout Speed: Held in escrow until days after the event</li>
              <li>• Setup Time: 15 minutes of organizer account &amp; bank verification forms</li>
              <li>• Refunds / Drop-outs: Formal refund requests &amp; non-refundable booking fees</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-[#007749]/35 bg-white p-6 sm:p-8 shadow-sm">
            <span className="inline-flex rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-extrabold text-[#007749]">
              PullThru.co.za Direct Peer-to-Peer Mode
            </span>
            <h2 className="font-display mt-3 text-xl font-extrabold text-[#0F172A]">
              20 Guests × R250 Spot = R5,000 in Your Bank
            </h2>
            <ul className="mt-4 space-y-2.5 text-xs sm:text-sm text-[#0F172A]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#007749] shrink-0" />
                <span><strong>R0.00 Guest Fee</strong> via Direct PayShap or Capitec PayMe</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#007749] shrink-0" />
                <span><strong>Instant 5-Second Payout:</strong> Money lands straight in your bank account</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#007749] shrink-0" />
                <span><strong>15-Second Setup:</strong> No password, no organizer approval delay</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#007749] shrink-0" />
                <span><strong>1-Tap Spot-Swap:</strong> Guests transfer their own spot if they bail</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Tasteful AdSense Slot */}
        <div className="mt-8">
          <TastefulAdSlot slotId="8842109404" variant="light" context="sport" />
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
              href="/partiful-south-africa"
              className="rounded-full border border-[#E6E2D8] bg-[#FAF8F5] px-4 py-2 text-[#0F172A] hover:border-[#007749] transition"
            >
              🎉 Partiful &amp; Luma SA Alternative
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
