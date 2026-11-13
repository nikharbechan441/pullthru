"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  ShieldCheck,
  Search,
  RefreshCw,
  AlertTriangle,
  Lock,
  HelpCircle,
  CheckCircle2,
  ArrowUpRight,
  KeyRound,
  Clock,
} from "lucide-react";

const HELP_CATEGORIES = [
  { id: "all", label: "All Protection & How-Tos" },
  { id: "scams", label: "🛡️ Direct PayShap & Anti-Scam" },
  { id: "refunds", label: "💸 Refunds & Rainouts" },
  { id: "tickets", label: "🎟️ Lost Ticket & Spot-Swap" },
  { id: "hosts", label: "👑 Host Pricing & Shortfalls" },
];

const FAQ_ITEMS = [
  {
    category: "scams",
    question: "1. How do Direct PayShap & Capitec PayMe payments work, and what stops fake POPs?",
    answer:
      "PullThru operates as a Pure SaaS Event & RSVP Tracker with R0.00 guest fees. Guests pay 100% of the spot price directly to the Host's verified South African bank account or PayShap ShapID (`082...`), or via 1-Tap Capitec PayMe, and paste their bank confirmation SMS or POP reference. Three safeguards protect every event: (1) Deterministic SHA-256 POP Deduplication: Every bank SMS/POP is hashed in full so nobody can reuse or duplicate another player's payment SMS. (2) Verified Bank vs Cash Separation: The live wall distinguishes Instant PayShap, Capitec PayMe, Standard EFT (pending clearance), and Host Cash so hosts can verify every cent. (3) Crowd-Freeze Alert: If 2+ verified guests report an issue at the venue, a public Dispute Warning Banner is placed on the event wall.",
  },
  {
    category: "refunds",
    question: "2. How do refunds work if an event is cancelled, rained out, or postponed?",
    answer:
      "If a host postpones an event (e.g. rainout or turf floodlight failure), the previous date is shown transparently on the event wall and your locked QR pass automatically rolls over to the new date—or you can transfer your spot for R0.00 via 'Swap My Spot', or tap 'Request Refund' so the Host is notified to return your contribution directly via PayShap or EFT.",
  },
  {
    category: "refunds",
    question: "3. Who processes my refund and how fast does it clear?",
    answer:
      "Because 100% of your event contribution goes directly to the Host's bank account via PayShap or Capitec PayMe (PullThru never holds or aggregates your money), refunds are sent directly from the Host back to your cell number / bank account via PayShap (clears in 5 seconds) or EFT. You can also use 'Swap My Spot' on your pass to sell or transfer your spot to a replacement friend in 1 tap with R0.00 fees.",
  },
  {
    category: "tickets",
    question: "4. I paid via PayShap / Capitec PayMe, or switched phones! Where is my ticket?",
    answer:
      "Don't panic—simply open the event link again or use the '🔍 Find My Pass' tool below, and enter the WhatsApp number or name you used when locking in your spot. Your QR pass, 4-digit Gate PIN, and secret venue gate code will unlock immediately.",
  },
  {
    category: "tickets",
    question: "5. How do I use 'Swap My Spot' without getting scammed or double-charged?",
    answer:
      "Open your pass (`/e/[slug]/success`) and scroll to 'Can't Make It? Swap / Transfer My Spot'. Important: Only send your secret swap link in a private 1-on-1 WhatsApp DM to your replacement friend (never drop it in a 50-person group chat). Once they claim your spot, the old pass is invalidated, a new 4-digit Gate PIN is generated for them, any Bring-'n-Bak item you claimed (like charcoal or ice) can be released back to the list, and double-dip refunds on the original ticket are permanently blocked.",
  },
  {
    category: "tickets",
    question: "6. Is a 'Payday 25th Pledge (Standby)' an entry ticket?",
    answer:
      "No. A Payday 25th Pledge puts you on the Standby list so the host knows you want to pull through on payday, but it does NOT lock a paid capacity spot, does NOT unlock the secret estate gate code, and cannot be swapped or sold. When payday hits, tap '💳 Settle My Pledge Now' on the event wall to convert it into a locked pass.",
  },
  {
    category: "hosts",
    question: "7. How does PullThru's Pure SaaS pricing work? (Free 1–6 Spots, R29 Pro Boost, R79/mo Club Pass)",
    answer:
      "Guests always pay R0.00 in checkout fees. For Hosts: (1) Small Groups (1–6 spots, like a Padel 4-ball or intimate dinner) are 100% Free forever. (2) Squad Events (7+ spots, like 5-a-Side soccer or a Saturday Spitbraai) use a once-off R29 Pro Event Boost—or you can tick 'Bake +R2/spot into ticket price' when creating your event (e.g. R100 becomes R102) so your squad covers the R29 for you! (3) Weekly Organisers can unlock the R79/month Organiser Club Pass for unlimited Pro events and 1-Tap Weekly Clone.",
  },
  {
    category: "hosts",
    question: "8. What if someone claims the Charcoal or Meat on the Bring-'n-Bak list and then bails?",
    answer:
      "When a guest refunds or swaps their spot, PullThru automatically releases their claimed Bring-'n-Bak item back to the unclaimed checklist. In addition, as the Host, you can tap the '↺ Release Item' button next to any claimed item on the Bring-List tab at any time to free it up for another squad member.",
  },
  {
    category: "hosts",
    question: "9. I opened my event in Chrome instead of WhatsApp and lost my Host Admin Bar! How do I unlock it?",
    answer:
      "Tap the '👑 Host? Unlock Controls' button at the top right of your event page and paste your Backup Host Key (`host_...`) or your full Private Host Admin Link. Tip: Always tap '🔑 Backup Private Host Admin Link' in your Host Bar right after creating an event and save it to your WhatsApp 'Message Yourself' chat.",
  },
];

export default function BuyerProtectionAndHelpPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [eventInput, setEventInput] = useState("");
  const [lookupWhatsapp, setLookupWhatsapp] = useState("");
  const [lookupName, setLookupName] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [recoveredPassUrl, setRecoveredPassUrl] = useState<string | null>(null);
  const [recoveredGuestName, setRecoveredGuestName] = useState<string | null>(null);

  const extractSlug = (raw: string): string => {
    const trimmed = raw.trim();
    if (!trimmed) return "";
    const match = trimmed.match(/\/e\/([^/?#]+)/i);
    if (match && match[1]) return match[1];
    return trimmed.replace(/^\/+|\/+$/g, "");
  };

  const handlePassLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = extractSlug(eventInput);
    if (!slug) {
      setLookupError("Please enter the event link or slug (e.g. thursday-fives-sandton).");
      return;
    }
    setLookingUp(true);
    setLookupError(null);
    setRecoveredPassUrl(null);
    try {
      const res = await fetch("/api/rsvp", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "recover_pass",
          slug,
          whatsappNumber: lookupWhatsapp.trim(),
          guestName: lookupName.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Could not find a matching pass on that event.");
      }
      if (data?.rsvp?.id && typeof window !== "undefined") {
        localStorage.setItem(`pullthru_rsvpid_${slug}`, data.rsvp.id);
        if (data.rsvp.swap_token) {
          const tokens = JSON.parse(localStorage.getItem("pullthru_swap_tokens") || "{}");
          tokens[data.rsvp.id] = data.rsvp.swap_token;
          localStorage.setItem("pullthru_swap_tokens", JSON.stringify(tokens));
        }
      }
      setRecoveredGuestName(data?.rsvp?.guest_name || "Guest");
      setRecoveredPassUrl(data?.passUrl || `/e/${slug}/success?rsvpId=${data?.rsvp?.id || ""}`);
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : "Could not recover pass.");
    } finally {
      setLookingUp(false);
    }
  };

  const visibleFaqs = FAQ_ITEMS.filter(
    (item) => selectedCategory === "all" || item.category === selectedCategory
  );

  const helpFaqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((f) => ({
      "@type": "Question",
      name: f.question.replace(/^\d+\.\s*/, ""),
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#0F172A] pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(helpFaqJsonLd) }}
      />
      <Navbar />

      <main className="mx-auto max-w-6xl px-5 pt-6 sm:px-8 space-y-8">
        {/* Hero Protection Banner */}
        <section className="rounded-3xl border border-[#E6E2D8] bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#007749] px-3 py-1 text-white">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>PullThru Mzansi Trust &amp; Safety Shield</span>
            </span>
            <span className="rounded-full border border-[#E6E2D8] bg-[#FAF8F5] px-3 py-1 text-[#0F172A]">
              Anti-Scam Escrow Hold
            </span>
            <span className="rounded-full border border-[#E6E2D8] bg-[#FAF8F5] px-3 py-1 text-[#0F172A]">
              Self-Serve Ticket Lookup
            </span>
            <span className="rounded-full border border-[#E6E2D8] bg-[#FAF8F5] px-3 py-1 text-[#0F172A]">
              CPA s17 Refunds
            </span>
          </div>

          <h1 className="font-display mt-4 text-2xl sm:text-4xl font-black tracking-tight text-[#0F172A]">
            Customer Protection, Refunds &amp; How-To Center
          </h1>
          <p className="mt-2.5 max-w-3xl text-sm sm:text-base text-[#475569] leading-relaxed">
            Built for real South African groups—from Thursday 5-a-side and Padel to Spitbraais and Baby Showers. Here is how PullThru protects your money if a host disappears, how to recover a lost pass in 5 seconds, and how refunds &amp; spot-swaps work.
          </p>

          {/* 4 Pillar Cards */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-[#E6E2D8] bg-[#FAF8F5] p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#007749]/10 text-[#007749]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h2 className="font-display mt-3 text-sm font-extrabold text-[#0F172A]">
                1. Direct PayShap &amp; POP Hash
              </h2>
              <p className="mt-1 text-xs text-[#475569] leading-relaxed">
                100% of funds go straight to the host&apos;s bank account with SHA-256 POP deduplication so fake or reused SMSes are blocked.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E6E2D8] bg-[#FAF8F5] p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h2 className="font-display mt-3 text-sm font-extrabold text-[#0F172A]">
                2. Rail Badges &amp; EFT Audit
              </h2>
              <p className="mt-1 text-xs text-[#475569] leading-relaxed">
                Every RSVP displays whether it was paid via Instant PayShap, Capitec PayMe, or Standard EFT (awaiting host clearance).
              </p>
            </div>

            <div className="rounded-2xl border border-[#E6E2D8] bg-[#FAF8F5] p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFB81C]/20 text-[#0F172A]">
                <KeyRound className="h-5 w-5" />
              </div>
              <h2 className="font-display mt-3 text-sm font-extrabold text-[#0F172A]">
                3. 4-Digit Anti-Screenshot PIN
              </h2>
              <p className="mt-1 text-xs text-[#475569] leading-relaxed">
                Every paid pass has a live SAST clock + unique 4-digit Gate PIN (`#XXXX`) so screenshot forwarders get caught at the door.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E6E2D8] bg-[#FAF8F5] p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-[#007749]">
                <Clock className="h-5 w-5" />
              </div>
              <h2 className="font-display mt-3 text-sm font-extrabold text-[#0F172A]">
                4. R0 Guest Fee &amp; Spot-Swap
              </h2>
              <p className="mt-1 text-xs text-[#475569] leading-relaxed">
                Guests pay R0.00 in platform fees, and can transfer their spot to a chommie for R0.00 in 1 tap on WhatsApp.
              </p>
            </div>
          </div>
        </section>

        {/* Interactive Self-Serve Lost Pass Finder */}
        <section
          id="find-pass"
          className="rounded-3xl border-2 border-[#007749]/30 bg-white p-6 sm:p-8 shadow-xs"
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-center">
            <div className="lg:col-span-5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#007749]/10 px-3 py-1 text-xs font-bold text-[#007749]">
                <Search className="h-3.5 w-3.5" />
                <span>Instant Self-Serve Recovery</span>
              </span>
              <h2 className="font-display mt-2.5 text-xl sm:text-2xl font-black text-[#0F172A]">
                🔍 Lost Your Ticket or Switched Phones?
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-[#475569] leading-relaxed">
                If your network dropped after approving Capitec Pay or you opened the link in a new browser, enter the event link/slug and your WhatsApp number below to unlock your pass, QR code, and secret gate PIN immediately.
              </p>
            </div>

            <div className="lg:col-span-7">
              <form
                onSubmit={handlePassLookup}
                className="rounded-2xl border border-[#E6E2D8] bg-[#FAF8F5] p-4 sm:p-5 space-y-3"
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#0F172A]">
                      1. Event Link or Slug *
                    </label>
                    <input
                      type="text"
                      required
                      value={eventInput}
                      onChange={(e) => setEventInput(e.target.value)}
                      placeholder="e.g. thursday-fives-sandton"
                      className="w-full rounded-xl border border-[#E6E2D8] bg-white px-3 py-2 text-xs sm:text-sm text-[#0F172A] focus:border-[#007749] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#0F172A]">
                      2. WhatsApp Number Used
                    </label>
                    <input
                      type="tel"
                      value={lookupWhatsapp}
                      onChange={(e) => setLookupWhatsapp(e.target.value)}
                      placeholder="e.g. 082 123 4567"
                      className="w-full rounded-xl border border-[#E6E2D8] bg-white px-3 py-2 text-xs sm:text-sm text-[#0F172A] focus:border-[#007749] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#0F172A]">
                      3. Or Name on Wall
                    </label>
                    <input
                      type="text"
                      value={lookupName}
                      onChange={(e) => setLookupName(e.target.value)}
                      placeholder="e.g. Thabo M"
                      className="w-full rounded-xl border border-[#E6E2D8] bg-white px-3 py-2 text-xs sm:text-sm text-[#0F172A] focus:border-[#007749] focus:outline-none"
                    />
                  </div>
                </div>

                {lookupError && (
                  <div className="rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2.5 text-xs font-bold text-rose-800">
                    ⚠️ {lookupError}
                  </div>
                )}

                {recoveredPassUrl && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-950">
                    <span className="inline-flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-[#007749]" />
                      <span>Found Pass for {recoveredGuestName}!</span>
                    </span>
                    <Link
                      href={recoveredPassUrl}
                      className="inline-flex items-center gap-1 rounded-full bg-[#007749] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#005F3A]"
                    >
                      <span>Open My Pass &amp; Gate PIN →</span>
                    </Link>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] text-[#475569]">
                    Works even if you didn&apos;t enter an email at checkout.
                  </span>
                  <button
                    type="submit"
                    disabled={lookingUp}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#007749] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#005F3A] disabled:opacity-50 cursor-pointer"
                  >
                    <Search className="h-3.5 w-3.5" />
                    <span>{lookingUp ? "Searching..." : "Recover My Pass Now"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* Filterable FAQ & Step-by-Step How-To Guide */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl sm:text-2xl font-black text-[#0F172A] flex items-center gap-2">
              <HelpCircle className="h-6 w-6 text-[#007749]" />
              <span>Frequently Asked Questions &amp; Step-by-Step How-Tos</span>
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {HELP_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                    selectedCategory === cat.id
                      ? "bg-[#007749] text-white"
                      : "border border-[#E6E2D8] bg-white text-[#475569] hover:text-[#0F172A]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {visibleFaqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-3xl border border-[#E6E2D8] bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-display text-base font-extrabold text-[#0F172A]">
                    {faq.question}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-[#475569] leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom Statutory & Support Bar */}
        <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-[#E6E2D8] bg-white p-6 shadow-xs">
          <div>
            <h3 className="font-display text-base font-extrabold text-[#0F172A]">
              Still need help with an event, refund reference, or POPIA request?
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-[#475569]">
              Read our full SARB, SARS s54, CPA s17/s49 &amp; Liquor Act statutory disclosures or email{" "}
              <span className="font-mono font-bold text-[#007749]">support@pullthru.co.za</span>.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/terms"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E6E2D8] bg-[#FAF8F5] px-4 py-2.5 text-xs font-bold text-[#0F172A] hover:border-[#007749]"
            >
              <Lock className="h-3.5 w-3.5 text-[#007749]" />
              <span>SARB &amp; Statutory Terms</span>
            </Link>
            <Link
              href="/create"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#007749] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#005F3A]"
            >
              <span>Create Protected Event Link</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
