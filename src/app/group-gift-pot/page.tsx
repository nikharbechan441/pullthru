import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { ArrowRight, Zap, HeartHandshake, ShieldCheck, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title:
    "Baby Shower, Teacher Gift & Group Money Pot Link South Africa — PullThru",
  description:
    "Collect contributions for a Baby Shower, Teacher Thank-You Gift, Office Farewell, Milestone Birthday, or Bereavement Pot on WhatsApp. Includes POPIA Dignity Mode (show names only, hide individual Rand amounts).",
  alternates: {
    canonical: "https://pullthru.co.za/group-gift-pot",
  },
  openGraph: {
    title: "Group Gift, Baby Shower & Teacher Collection Pot Link SA — PullThru",
    description:
      "Drop one dignified link in the WhatsApp group. Friends contribute any amount via PayShap, Capitec PayMe, or card with POPIA Dignity Mode (hide individual Rand amounts on the public wall).",
    url: "https://pullthru.co.za/group-gift-pot",
    siteName: "PullThru",
    locale: "en_ZA",
    type: "website",
    images: [
      {
        url: "/feature-graphic.png",
        width: 1024,
        height: 500,
        alt: "Group Gift, Baby Shower & Teacher Collection Pot Link SA — PullThru",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@pullthruza",
    creator: "@pullthruza",
    title: "Group Gift, Baby Shower & Teacher Collection Pot Link SA — PullThru",
    description:
      "Drop one dignified link in the WhatsApp group. Friends contribute any amount via PayShap, Capitec PayMe, or card with POPIA Dignity Mode.",
    images: ["/feature-graphic.png"],
  },
};

export default function GroupGiftPotPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How do I collect money for a teacher gift, baby shower, or farewell on WhatsApp in South Africa?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Use PullThru's Group Gift Pot (https://pullthru.co.za/group-gift-pot) to create a 15-second WhatsApp collection link. Contributors pay any Rand amount via Direct PayShap, Capitec PayMe, or card, and you can enable POPIA Dignity Mode to show contributor names and well-wishes on the public wall while keeping individual Rand amounts private.",
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
            <HeartHandshake className="h-3.5 w-3.5" />
            <span>POPIA Dignity Mode • Show Names Only, Hide Individual Rand Amounts</span>
          </div>

          <h1 className="font-display mt-4 text-3xl sm:text-5xl font-black tracking-tight text-[#0F172A] leading-[1.1]">
            Collect for Baby Showers, Teacher Gifts &amp; Group Pots on WhatsApp—With Full Dignity.
          </h1>

          <p className="mt-4 max-w-3xl text-base sm:text-lg text-[#475569] leading-relaxed">
            When you&apos;re collecting for a class teacher&apos;s end-of-year gift, a colleague&apos;s farewell, a baby shower pram pot, or a family bereavement fund, pasting bank details in a WhatsApp group feels awkward—and some people contribute R50 while others contribute R500.{" "}
            <strong className="text-[#0F172A]">
              PullThru&apos;s Dignity Pot lets everyone chip in any amount via PayShap, Capitec PayMe, or card while displaying only their name and well-wishes on the public wall.
            </strong>
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/create?mode=pot&preset=pot"
              className="inline-flex items-center gap-2 rounded-full bg-[#007749] px-7 py-3.5 text-sm font-extrabold text-white shadow-md hover:bg-[#005F3A] transition"
            >
              <Zap className="h-4 w-4 text-[#FFB81C]" />
              <span>Start a Group Gift Pot (15s)</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/e/mrs-dlamini-baby-shower"
              className="inline-flex items-center gap-2 rounded-full border border-[#E6E2D8] bg-[#FAF8F5] px-6 py-3.5 text-sm font-bold text-[#0F172A] hover:bg-white transition"
            >
              <span>View Live Baby Shower Pot Demo →</span>
            </Link>
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-3xl border border-[#E6E2D8] bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2 text-sm font-extrabold text-[#007749]">
              <ShieldCheck className="h-4 w-4" />
              <span>POPIA Dignity Toggle</span>
            </div>
            <h2 className="font-display mt-2 text-lg font-extrabold text-[#0F172A]">
              Hide Individual Rand Amounts
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-[#475569] leading-relaxed">
              Only the organiser sees the exact Rand breakdown. On the public WhatsApp wall, a parent who chipped in R80 and a parent who chipped in R500 are celebrated equally.
            </p>
          </div>

          <div className="rounded-3xl border border-[#E6E2D8] bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2 text-sm font-extrabold text-[#007749]">
              <CheckCircle2 className="h-4 w-4" />
              <span>No Crowdfunding Platform Cut</span>
            </div>
            <h2 className="font-display mt-2 text-lg font-extrabold text-[#0F172A]">
              100% Goes to the Gift or Family
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-[#475569] leading-relaxed">
              Charity crowdfunding sites take 5% to 8% of your pot and hold funds for days. With PullThru Direct PayShap &amp; Capitec PayMe, contributions land straight in the organiser&apos;s bank account.
            </p>
          </div>

          <div className="rounded-3xl border border-[#E6E2D8] bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2 text-sm font-extrabold text-[#007749]">
              <HeartHandshake className="h-4 w-4" />
              <span>Digital Greeting Card Wall</span>
            </div>
            <h2 className="font-display mt-2 text-lg font-extrabold text-[#0F172A]">
              Collect Messages &amp; Well-Wishes
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-[#475569] leading-relaxed">
              Every contributor can attach a personal message on the wall when they chip in—turning your collection link into a keepsake card for the recipient.
            </p>
          </div>
        </section>

        {/* Internal Link Hub */}
        <section className="mt-8 rounded-3xl border border-[#E6E2D8] bg-white p-6 shadow-xs">
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
              href="/quicket-alternative"
              className="rounded-full border border-[#E6E2D8] bg-[#FAF8F5] px-4 py-2 text-[#0F172A] hover:border-[#007749] transition"
            >
              🎟️ Zero-Fee Quicket Alternative
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
