"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

const ECTA_SECTION_43_TABLE = [
  {
    point: "1. Full Name & Legal Status",
    category: "corporate",
    disclosure:
      'PullThru Technologies (Pty) Ltd (trading as "PullThru" / pullthru.co.za) — South African Software-as-a-Service (SaaS) event RSVP tracker, bring-list checklist, and group coordination tool. PullThru is NOT a payment aggregator, money-pooling escrow, or third-party payment provider.',
  },
  {
    point: "2. Physical Address & Domicilium Citandi et Executandi",
    category: "corporate",
    disclosure:
      "Electronic service & compliance: legal@pullthru.co.za (Physical domicilium in the Republic of South Africa provided upon formal statutory request).",
  },
  {
    point: "3. Web Site Address & Official Electronic Mail",
    category: "corporate",
    disclosure:
      "Website: https://pullthru.co.za | Compliance & Privacy Desk: legal@pullthru.co.za & privacy@pullthru.co.za | Customer Support: support@pullthru.co.za",
  },
  {
    point: "4. Telephone Number",
    category: "corporate",
    disclosure:
      "Electronic Customer Support Desk: support@pullthru.co.za (Mon–Fri 08:00–17:00 SAST).",
  },
  {
    point: "5. Company Status & Designated Information Officer",
    category: "corporate",
    disclosure:
      "Operated by PullThru South Africa (pullthru.co.za). Designated Information Officer under POPIA Sections 17, 18 & 55: Founder & Information Officer Desk (privacy@pullthru.co.za / legal@pullthru.co.za).",
  },
  {
    point: "6. Address for Receipt of Legal Service",
    category: "corporate",
    disclosure:
      "Electronic legal service accepted at legal@pullthru.co.za (Physical domicilium registered in the Republic of South Africa available upon statutory request).",
  },
  {
    point: "7. Pure SaaS Billing & Non-Aggregation Policy",
    category: "banking",
    disclosure:
      "PullThru never collects, holds, splits, or aggregates event contributions on behalf of hosts. Guests pay event hosts directly peer-to-peer outside of PullThru via their own banking channels (PayShap, Capitec PayMe, or direct EFT). Yoco Technologies (Pty) Ltd and Direct PayShap Clearing are used strictly to bill organisers for PullThru's own flat software fees (R29 once-off Pro Event Boost, R79/month Organiser Club Pass, or R249 Tournament Pass), with 100% of software revenue earned by PullThru.",
  },
  {
    point: "8. Consumer Dispute Resolution & Ombud",
    category: "refunds",
    disclosure:
      "Consumers may refer unresolved disputes to the Consumer Goods and Services Ombud (CGSO) under the Consumer Protection Act 68 of 2008 at https://www.cgso.org.za or the National Consumer Commission (NCC).",
  },
  {
    point: "9. Main Characteristics of Goods / Services Offered",
    category: "banking",
    disclosure:
      "Cloud-hosted software-as-a-service (SaaS) social RSVP management, automated WhatsApp capacity tracking, Bring-'n-Bak potluck checklists, client-side Proof of Payment (POP) receipt verification, 5-a-Side team bib generators, and QR check-in passes.",
  },
  {
    point: "10. Full Price of Software Services (Pure SaaS Tiers)",
    category: "tax",
    disclosure:
      "Free Squad Tier: R0.00 (unlimited Free RSVPs and paid event tracking for 1–6 spots). Pro Event Boost: R29.00 once-off software pass per event (unlocks 7–100+ spots, Instant POP Verifier, Secret Gate Code Reveal, 5-a-Side Team Bib Generator, and 1-Tap Spot-Swap). Organiser Club Pass: R79.00 per month (unlimited Pro events). Guest Checkout Surcharge: R0.00 (PullThru charges zero ticket commissions or clearing fees to guests).",
  },
  {
    point: "11. Manner of Payment for PullThru Software Passes",
    category: "banking",
    disclosure:
      "Organisers purchasing a R29 Pro Event Boost, R79/month Organiser Club Pass, or R249 Tournament Pass pay PullThru directly via Yoco Technologies (Pty) Ltd (Apple Pay, Google Pay, or Visa/Mastercard) or Direct PayShap / EFT. Event guests settle their event host directly peer-to-peer via PayShap, Capitec PayMe, or EFT.",
  },
  {
    point: "12. Terms of Agreement & How to Access / Store Record",
    category: "corporate",
    disclosure:
      "These Terms govern every checkout and RSVP. Guests and Hosts may download, print, or save this page at any time, and every transaction generates a permanent cryptographic receipt link at pullthru.co.za.",
  },
  {
    point: "13. Time of Performance / Delivery",
    category: "refunds",
    disclosure:
      'Digital RSVP Passes, WhatsApp confirmation cards, and "Swap My Spot" transfer tokens are issued instantaneously upon RSVP submission or POP slip verification. Physical/social events take place on the date and venue specified by the named Host.',
  },
  {
    point: "14. Manner & Period Within Which Consumers May Access Full Transaction Record",
    category: "tax",
    disclosure:
      "Consumers may inspect their full itemised RSVP record, verified payment reference, and QR pass for a minimum of 5 years via their unique RSVP Pass link or by querying support@pullthru.co.za.",
  },
  {
    point: '15. Return, Exchange, Refund & "Swap My Spot" Policy',
    category: "refunds",
    disclosure:
      'PullThru charges guests R0.00 in checkout fees. Event spot transfers are free via "Swap My Spot", and direct event contribution refunds are handled peer-to-peer directly by the Host. Paid PullThru software upgrades (Pro Event Boost) are non-refundable once activated.',
  },
  {
    point: "16. Alternative Dispute Resolution (ADR) & Ombud",
    category: "refunds",
    disclosure:
      "Unresolved consumer disputes may be referred to the Consumer Goods and Services Ombud (CGSO) at info@cgso.org.za, the National Consumer Commission (NCC), or the Information Regulator (POPIA matters).",
  },
  {
    point: "17. Security Procedures & Privacy Policy",
    category: "privacy",
    disclosure:
      "TLS 1.3 encryption in transit, AES-256 encryption at rest, deterministic SHA-256 POP verification, zero custody of user banking credentials, and strict POPIA Section 18 compliance.",
  },
  {
    point: "18. Minimum Duration of Agreement",
    category: "corporate",
    disclosure:
      "Single-event transactional mandate per RSVP or event creation; zero recurring subscription lock-in or minimum duration obligations for Guests or Hosts.",
  },
];

export default function TermsAndStatutoryCenterPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredEctaRows = ECTA_SECTION_43_TABLE.filter((row) => {
    const matchesCategory = activeCategory === "all" || row.category === activeCategory;
    const matchesQuery =
      !normalizedQuery ||
      row.point.toLowerCase().includes(normalizedQuery) ||
      row.disclosure.toLowerCase().includes(normalizedQuery);
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#0F172A] selection:bg-[#007749]/15 selection:text-[#007749]">
      <Navbar />

      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-5 sm:px-8 space-y-6">
        {/* Compact Editorial Hero Header Card */}
        <div className="bg-white border border-[#E6E2D8] rounded-3xl p-6 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider">
                <span className="rounded-full bg-[#007749] px-3 py-1 text-white">
                  Republic of South Africa
                </span>
                <span className="rounded-full border border-[#E6E2D8] bg-[#F3F0EA] px-2.5 py-1 text-[#0F172A]">
                  Pure SaaS Architecture
                </span>
                <span className="rounded-full border border-[#E6E2D8] bg-[#F3F0EA] px-2.5 py-1 text-[#0F172A]">
                  Zero Money Custody
                </span>
                <span className="rounded-full border border-[#E6E2D8] bg-[#F3F0EA] px-2.5 py-1 text-[#0F172A]">
                  CPA &amp; ECTA Compliant
                </span>
                <span className="rounded-full border border-[#E6E2D8] bg-[#F3F0EA] px-2.5 py-1 text-[#0F172A]">
                  POPIA s18
                </span>
              </div>

              <h1 className="mt-3.5 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#0F172A] font-display leading-[1.12]">
                Software Terms of Service &amp; Privacy Policy
              </h1>
              <p className="mt-2.5 text-sm sm:text-base leading-relaxed text-[#475569]">
                PullThru (<span className="font-mono font-semibold text-[#007749]">pullthru.co.za</span>) provides cloud-hosted Software-as-a-Service (SaaS) tools for event RSVPs, WhatsApp team coordination, Bring-&apos;n-Bak checklists, and digital gate check-ins. PullThru does not take custody of, hold, or pool event money; all event contributions are settled directly peer-to-peer between guests and hosts via their own South African banking apps.
              </p>
            </div>

            {/* 4-Pill Quick-Jump Anchor Bar on the Right */}
            <div className="shrink-0 lg:w-96 rounded-2xl bg-[#F3F0EA] border border-[#E6E2D8] p-4 print:hidden">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#007749]">
                  Quick-Jump Statutory Bar
                </span>
                <span className="text-[11px] font-mono font-semibold text-[#475569]">7 Clauses</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { href: "#clause-1", label: "1. SARB & FinTech Shield" },
                  { href: "#clause-2", label: "2. SARS Tax Tiers" },
                  { href: "#clause-3", label: "3. Refunds & Billing" },
                  { href: "#clause-6", label: "6. POPIA, DPA & ECTA" },
                ].map((pill) => (
                  <a
                    key={pill.href}
                    href={pill.href}
                    className="group flex items-center justify-between rounded-xl border border-[#E6E2D8] bg-white px-3 py-2 text-xs font-semibold text-[#0F172A] transition-all hover:border-[#007749] hover:shadow-xs"
                  >
                    <span className="truncate group-hover:text-[#007749] transition-colors">{pill.label}</span>
                    <span aria-hidden="true" className="ml-1 text-[#007749] transition-transform group-hover:translate-x-0.5">
                      &rarr;
                    </span>
                  </a>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 pt-2 border-t border-[#E6E2D8] text-[11px] font-semibold text-[#475569]">
                <span>Additional:</span>
                <a href="#clause-4" className="text-[#0F172A] underline hover:text-[#007749]">
                  4. CPA s49 &amp; Liability Cap
                </a>
                <span>&bull;</span>
                <a href="#clause-5" className="text-[#0F172A] underline hover:text-[#007749]">
                  5. Prohibited Uses
                </a>
                <span>&bull;</span>
                <a href="#clause-7" className="text-[#0F172A] underline hover:text-[#007749]">
                  7. IP &amp; AI Non-Training
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 3-Column "30-Second Plain-English Summary" Bento Strip */}
        <section aria-label="30-Second Plain-English Summary" className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-3xl border border-[#E6E2D8] bg-white p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#007749]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#007749]">
                <span>1. For Hosts</span>
                <span>&bull;</span>
                <span>100% Direct PayShap / Bank Payout, Zero Custody</span>
              </div>
              <h2 className="mt-2.5 text-base font-extrabold text-[#0F172A] font-display">
                Your event kitty settles straight to your SA bank account
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-[#475569]">
                PullThru never pools, holds, or touches your money. Guests pay{" "}
                <strong className="font-semibold text-[#007749]">100% of the Event Contribution</strong> directly to
                your personal Capitec, FNB, Standard Bank, Absa, Nedbank, TymeBank, or Discovery Bank account via{" "}
                <strong className="font-semibold text-[#0F172A]">PayShap or Capitec PayMe</strong>. Casual private
                cost-sharing (meat, turf, or group gifts) is non-taxable reimbursement.
              </p>
            </div>
            <a
              href="#clause-1"
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#007749] hover:underline"
            >
              <span>Read SARB &amp; SARS Host Rules</span>
              <span aria-hidden="true">&rarr;</span>
            </a>
          </div>

          <div className="rounded-3xl border border-[#E6E2D8] bg-white p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#FFB81C]/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0F172A]">
                <span>2. For Guests</span>
                <span>&bull;</span>
                <span>R0 Guest Fee, Free Spot-Swap &amp; Privacy</span>
              </div>
              <h2 className="mt-2.5 text-base font-extrabold text-[#0F172A] font-display">
                R0.00 checkout fee, zero WhatsApp spam, free 1-tap transfers
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-[#475569]">
                Pay the host directly via PayShap or Capitec PayMe with{" "}
                <strong className="font-semibold text-[#007749]">R0.00 guest fees</strong> and paste your bank SMS/POP.
                Can&apos;t make it? Use your digital pass&apos;s{" "}
                <strong className="font-semibold text-[#007749]">&ldquo;Swap My Spot&rdquo;</strong> link to transfer
                your spot to a friend on WhatsApp for{" "}
                <strong className="font-semibold text-[#0F172A]">R0.00</strong>.
              </p>
            </div>
            <a
              href="#clause-3"
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#007749] hover:underline"
            >
              <span>Read Refund &amp; Spot-Swap Terms</span>
              <span aria-hidden="true">&rarr;</span>
            </a>
          </div>

          <div className="rounded-3xl border border-[#E6E2D8] bg-white p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#0F172A] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#FFB81C]">
                <span>3. For Regulators &amp; Banks</span>
                <span>&bull;</span>
                <span>Pure SaaS • NPS Act / SARS / POPIA s18</span>
              </div>
              <h2 className="mt-2.5 text-base font-extrabold text-[#0F172A] font-display">
                Built for SARB, PASA, SARS, CGSO &amp; Information Regulator
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-[#475569]">
                Pure software-as-a-service (SaaS) event tracker with{" "}
                <strong className="font-semibold text-[#0F172A]">zero third-party fund aggregation</strong> under the
                NPS Act 78 of 1998 and Banks Act 94 of 1990, automated{" "}
                <strong className="font-semibold text-[#0F172A]">Gambling &amp; Insurance Act</strong> keyword
                screening, <strong className="font-semibold text-[#0F172A]">CPA s49</strong> risk notice, and the full{" "}
                <strong className="font-semibold text-[#0F172A]">18-point ECTA s43(1)</strong> statutory table.
              </p>
            </div>
            <a
              href="#clause-6"
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#007749] hover:underline"
            >
              <span>Inspect 18-Point ECTA s43 Table</span>
              <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </section>

        {/* Interactive Keyword Filter / Search Input + Print / Save Statutory PDF Toolbar */}
        <div className="rounded-3xl border border-[#E6E2D8] bg-white p-4 sm:p-5 shadow-xs print:hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex-1">
              <label htmlFor="statutory-search" className="sr-only">
                Filter ECTA Section 43 disclosures &amp; statutory clauses by keyword
              </label>
              <div className="relative">
                <input
                  id="statutory-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter statutory clauses & 18-point ECTA table (e.g. 'SARB', 'Capitec', 'refund', 'tax', 'POPIA', 'CIPC')..."
                  className="w-full rounded-2xl border border-[#E6E2D8] bg-[#FAF8F5] px-4 py-2.5 text-xs sm:text-sm text-[#0F172A] placeholder:text-[#475569]/70 focus:border-[#007749] focus:bg-white focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-[#E6E2D8] px-2 py-0.5 text-[11px] font-bold text-[#0F172A] hover:bg-[#007749] hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-2xl border border-[#0F172A] bg-[#0F172A] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#007749] hover:border-[#007749] cursor-pointer"
              >
                <span aria-hidden="true">🖨️</span>
                <span>Print / Save Statutory PDF</span>
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[#E6E2D8]">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#475569] mr-1">
                ECTA Table Filter:
              </span>
              {[
                { id: "all", label: "All 18 Points" },
                { id: "banking", label: "SARB & Gateway" },
                { id: "tax", label: "SARS & Fees" },
                { id: "refunds", label: "Refunds & CPA" },
                { id: "privacy", label: "POPIA & Security" },
                { id: "corporate", label: "CIPC & Domicilium" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategory(tab.id)}
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
                    activeCategory === tab.id
                      ? "bg-[#007749] text-white"
                      : "bg-[#F3F0EA] text-[#0F172A] hover:border-[#007749]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <span className="text-[11px] font-mono font-semibold text-[#007749]">
              Showing {filteredEctaRows.length} of {ECTA_SECTION_43_TABLE.length} ECTA s43(1) disclosures
            </span>
          </div>
        </div>

        {/* 2-COLUMN HIGH-DENSITY GRID FOR CLAUSES 1, 2, 3, AND 4 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* CLAUSE 1 */}
          <section
            id="clause-1"
            className="scroll-mt-24 h-full bg-white border border-[#E6E2D8] rounded-3xl p-6 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#007749] font-mono text-xs font-bold text-white">
                  01
                </span>
                <div>
                  <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#007749]">
                    Pure SaaS Architecture &bull; NPS Act 78 of 1998 &bull; Banks Act 94 of 1990
                  </p>
                  <h2 className="mt-0.5 text-lg sm:text-xl font-extrabold text-[#0F172A] font-display leading-snug">
                    Clause 1: Pure Software-as-a-Service (SaaS) Event Tracker &amp; Direct Peer-to-Peer Bank Settlement
                  </h2>
                </div>
              </div>

              <div className="mt-4 space-y-3.5 text-xs sm:text-sm leading-relaxed text-[#475569]">
                <p>
                  <strong className="font-semibold text-[#0F172A]">1.1 Pure SaaS Technology Mandate:</strong> By
                  publishing an event, social pot, or cost-sharing kitty on PullThru, the named Event Organiser (&ldquo;
                  <strong className="font-semibold text-[#0F172A]">Host</strong>&rdquo;) utilises{" "}
                  <strong className="font-semibold text-[#0F172A]">PullThru Technologies (Pty) Ltd</strong> strictly as
                  a cloud software-as-a-service (SaaS) RSVP, Bring-&apos;n-Bak checklist, and Proof-of-Payment (POP)
                  verification utility.
                </p>

                <p>
                  <strong className="font-semibold text-[#0F172A]">
                    1.2 Zero Custody / Direct Peer-to-Peer PayShap &amp; Bank Architecture:
                  </strong>{" "}
                  PullThru operates a strict{" "}
                  <span className="font-mono font-semibold text-[#007749]">Direct Peer-to-Peer (P2P)</span> settlement
                  model:
                </p>

                <ul className="list-disc space-y-2 pl-5 text-[#475569]">
                  <li>
                    <strong className="font-semibold text-[#0F172A]">100% Direct to Host Bank Account:</strong> Guests
                    pay 100% of the Event Contribution directly from their own South African banking app into the
                    Host&apos;s designated South African bank account or PayShap ShapID (including via{" "}
                    <strong className="font-semibold text-[#0F172A]">PayShap, Capitec PayMe, or EFT</strong>).
                  </li>
                  <li>
                    <strong className="font-semibold text-[#0F172A]">PullThru Never Pools or Holds Host Funds:</strong>{" "}
                    PullThru never takes custody, possession, or discretionary control of Host event contributions in
                    PullThru&apos;s own corporate bank account, and never acts as an unregistered bank, stokvel
                    depository, or third-party payment aggregator under the <em>Banks Act 94 of 1990</em> or the{" "}
                    <em>National Payment System Act 78 of 1998</em>.
                  </li>
                  <li>
                    <strong className="font-semibold text-[#0F172A]">Instant POP Verification &amp; SHA-256 Deduplication:</strong>{" "}
                    When a Guest pastes their bank confirmation SMS or payment reference, PullThru computes a full
                    SHA-256 cryptographic digest to prevent duplicate or reused POP submissions and issues a 4-digit Gate
                    PIN pass.
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[#E6E2D8] bg-[#F3F0EA] p-4 text-xs leading-relaxed text-[#475569]">
              <strong className="font-semibold text-[#007749]">Payment Rail Transparency &amp; Host Verification:</strong>{" "}
              Every RSVP on the Host Dashboard clearly badges whether the Guest locked in via{" "}
              <strong className="font-semibold text-[#0F172A]">Instant PayShap</strong>,{" "}
              <strong className="font-semibold text-[#0F172A]">Capitec PayMe</strong>, or{" "}
              <strong className="font-semibold text-[#0F172A]">Standard Inter-Bank EFT</strong> (flagged for host bank
              statement verification before gate entry).
            </div>

            <div className="mt-3.5 rounded-2xl border border-[#007749]/30 bg-emerald-50/60 p-4 text-xs leading-relaxed text-[#0F172A]">
              <strong className="font-semibold text-[#007749]">1.3 FinTech Role Boundary &amp; Mandatory Host Sign-Off:</strong>
              <p className="mt-1 text-[#475569]">
                PullThru is an <strong>automated software and data-formatting utility</strong>, NOT a registered Financial Services Provider (FSP) under the FAIS Act, a bank under the Banks Act, or a SARS Registered Tax Practitioner. Automated regex parsing and SHA-256 deduplication of South African bank SMS notifications are administrative convenience features. The named Event Host remains solely responsible for verifying the receipt of funds in their personal banking application before admitting guests to any physical event. PullThru disclaims all liability for bank network clearing delays, uncollected guest funds, or disputed peer-to-peer transfers.
              </p>
            </div>
          </section>

          {/* CLAUSE 2 */}
          <section
            id="clause-2"
            className="scroll-mt-24 h-full bg-white border border-[#E6E2D8] rounded-3xl p-6 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#007749] font-mono text-xs font-bold text-white">
                  02
                </span>
                <div>
                  <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#007749]">
                    Value-Added Tax Act 89 of 1991 (s23) &bull; Income Tax Act 58 of 1962 (s1 &ldquo;Gross Income&rdquo;)
                  </p>
                  <h2 className="mt-0.5 text-lg sm:text-xl font-extrabold text-[#0F172A] font-display leading-snug">
                    Clause 2: Pure SaaS Pricing Model &amp; SARS Tax Separation
                  </h2>
                </div>
              </div>

              <div className="mt-4 space-y-3.5 text-xs sm:text-sm leading-relaxed text-[#475569]">
                <p>
                  PullThru separates software licensing fees from peer-to-peer Host event contributions so Guests pay{" "}
                  <strong className="font-semibold text-[#007749]">R0.00 in checkout fees</strong>:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-[#E6E2D8] bg-[#F3F0EA] p-4">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#007749]">
                      Contract A &mdash; PullThru Pure SaaS Tiers
                    </div>
                    <h3 className="mt-1 text-sm font-bold text-[#0F172A] font-display">
                      R0 Free (1–6 Spots) • R29 Pro Boost • R79/mo Club Pass
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#475569]">
                      Small events up to <strong className="font-semibold text-[#0F172A]">6 spots</strong> are{" "}
                      <strong className="font-semibold text-[#007749]">R0.00 Free forever</strong>. Events with{" "}
                      <strong className="font-semibold text-[#0F172A]">7+ spots</strong> use a flat{" "}
                      <code className="font-mono font-semibold text-[#007749]">R29.00</code> once-off Pro Event Boost
                      (or optional <code className="font-mono font-semibold text-[#007749]">+R2/spot</code> baked into
                      the host&apos;s spot price), or an{" "}
                      <code className="font-mono font-semibold text-[#007749]">R79.00/month</code> Organiser Club Pass.
                      Only these software fees constitute PullThru&apos;s &ldquo;gross income&rdquo; under Section 1 of
                      the Income Tax Act.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#E6E2D8] bg-[#F3F0EA] p-4">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#0F172A]">
                      Contract B &mdash; Direct Host Event Contribution
                    </div>
                    <h3 className="mt-1 text-sm font-bold text-[#0F172A] font-display">
                      100% Peer-to-Peer Event Contribution
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#475569]">
                      Entered into strictly between the <strong className="font-semibold text-[#0F172A]">Guest</strong>{" "}
                      and the named <strong className="font-semibold text-[#0F172A]">Event Host</strong>. Because Guests
                      transfer the Event Contribution directly to the Host&apos;s personal bank account via PayShap or
                      Capitec PayMe, those funds never pass through PullThru and form no part of PullThru&apos;s
                      turnover or tax liability.
                    </p>
                  </div>
                </div>

                {/* Host Tax FAQ Box */}
                <div className="rounded-2xl border border-[#E6E2D8] bg-[#F3F0EA] p-4">
                  <h3 className="text-sm font-extrabold text-[#0F172A] font-display">
                    Host Tax FAQ: Casual Cost-Sharing vs. Commercial Hosts &amp; SBC Section 12E
                  </h3>
                  <div className="mt-2.5 space-y-2.5 text-xs leading-relaxed text-[#475569]">
                    <div className="rounded-xl bg-white border border-[#E6E2D8] p-3">
                      <p className="font-bold text-[#007749]">
                        Q1: Do I owe SARS income tax when my friends chip in R150 each for meat, charcoal, or a 5-a-side
                        astro turf booking?
                      </p>
                      <p className="mt-1">
                        <strong className="font-semibold text-[#0F172A]">
                          No, if it is genuine cost-sharing reimbursement without a profit-making scheme.
                        </strong>{" "}
                        Under South African tax law, when friends pool funds solely to reimburse shared private expenses
                        (e.g., meat for a Saturday braai, turf hire, or a communal birthday gift) with no commercial
                        profit motive, those reimbursements are capital/private cost recoveries and do not constitute
                        &ldquo;gross income&rdquo; from a trade.
                      </p>
                    </div>
                    <div className="rounded-xl bg-white border border-[#E6E2D8] p-3">
                      <p className="font-bold text-[#007749]">
                        Q2: What if I run commercial events, run clubs, or profit-making ticketed experiences?
                      </p>
                      <p className="mt-1">
                        Commercial Hosts operating a scheme of profit-making are solely responsible for declaring their
                        net event revenue to SARS. If a Commercial Host&apos;s taxable supplies exceed R1,000,000 in any
                        12-month period, the Host is responsible for registering for VAT under the VAT Act.
                      </p>
                    </div>
                    <div className="rounded-xl bg-white border border-[#E6E2D8] p-3">
                      <p className="font-bold text-[#007749]">
                        Q3: Corporate Tax &amp; Small Business Corporation (SBC) Section 12E Note:
                      </p>
                      <p className="mt-1">
                        Because PullThru only recognises its own SaaS software fees (
                        <code className="font-mono font-semibold text-[#0F172A]">R29 Pro Boost / R79 Club Pass</code>)
                        as turnover and never touches Host event kitties, Host event pools do not inflate PullThru&apos;s
                        gross revenue thresholds for SARS Small Business Corporation (Section 12E of the Income Tax Act)
                        or compulsory VAT registration purposes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CLAUSE 3 */}
          <section
            id="clause-3"
            className="scroll-mt-24 h-full bg-white border border-[#E6E2D8] rounded-3xl p-6 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#007749] font-mono text-xs font-bold text-white">
                  03
                </span>
                <div>
                  <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#007749]">
                    Consumer Protection Act 68 of 2008 (s17 &amp; s27) &bull; ECTA Act 25 of 2002 (s42(2)(j))
                  </p>
                  <h2 className="mt-0.5 text-lg sm:text-xl font-extrabold text-[#0F172A] font-display leading-snug">
                    Clause 3: Refund Policy, Rainout Postponement &amp; &ldquo;Swap My Spot&rdquo;
                  </h2>
                </div>
              </div>

              <div className="mt-4 space-y-3.5 text-xs sm:text-sm leading-relaxed text-[#475569]">
                <p>
                  <strong className="font-semibold text-[#0F172A]">
                    3.1 R0.00 Guest Platform Fee &amp; Optional Host Pro Boosts:
                  </strong>{" "}
                  Guests pay <code className="rounded bg-[#F3F0EA] px-1.5 py-0.5 font-mono text-xs font-semibold text-[#007749]">R0.00</code>{" "}
                  in checkout fees to PullThru. Where a Host purchases an optional <code className="font-mono text-xs">R29.00</code>{" "}
                  Pro Event Boost or <code className="font-mono text-xs">R79.00/mo</code> Organiser Club Pass under{" "}
                  <strong className="font-semibold text-[#0F172A]">Contract A</strong>, that software license fee is
                  earned upon activation of the Pro event tools.
                </p>

                <p>
                  <strong className="font-semibold text-[#0F172A]">
                    3.2 Exclusion of 7-Day Cooling-Off Right (ECTA Section 42(2)(j)):
                  </strong>{" "}
                  Pursuant to{" "}
                  <strong className="font-semibold text-[#0F172A]">
                    Section 42(2)(j) of the Electronic Communications and Transactions Act 25 of 2002 (ECTA)
                  </strong>
                  , the general 7-day cooling-off right under Section 44 of ECTA{" "}
                  <strong className="font-semibold text-[#0F172A]">does not apply</strong> to electronic transactions
                  where the supplier undertakes to provide accommodation, transport, catering, or leisure services on a
                  specific date or within a specific period.
                </p>

                <div className="rounded-2xl border border-[#E6E2D8] bg-[#F3F0EA] p-4">
                  <p className="text-xs sm:text-sm leading-relaxed text-[#475569]">
                    <strong className="font-semibold text-[#0F172A]">
                      3.3 Free &ldquo;Swap My Spot&rdquo; Peer-to-Peer Transfer Tool:
                    </strong>{" "}
                    Can&apos;t make it to 5-a-side or the Saturday braai? Every Guest RSVP includes a free{" "}
                    <strong className="font-semibold text-[#007749]">&ldquo;Swap My Spot&rdquo;</strong> link on their
                    digital pass. With one tap, a Guest can reassign their locked spot and QR pass to a replacement
                    friend on WhatsApp at{" "}
                    <strong className="font-semibold text-[#0F172A]">R0.00 platform transfer cost</strong>, eliminating
                    host admin and protecting the group pot.
                  </p>
                </div>

                <p>
                  <strong className="font-semibold text-[#0F172A]">
                    3.4 Host Responsibility for Direct Event Contribution Refunds &amp; Rainouts:
                  </strong>{" "}
                  Because 100% of the Event Contribution is paid directly to the Host&apos;s personal bank account via
                  PayShap, Capitec PayMe, or EFT under{" "}
                  <strong className="font-semibold text-[#0F172A]">Contract B</strong>, any refund of the Event
                  Contribution (including under CPA Section 17 cancellation rules or event cancellation/rainout
                  postponement) is the sole financial responsibility of the named Event Host. If an outdoor event (such
                  as a padel match, run club, or braai) is postponed due to severe weather, all locked RSVP passes
                  automatically roll over to the rescheduled rainout date unless the Host elects to issue a direct
                  PayShap/EFT refund.
                </p>
                <p>
                  <strong className="font-semibold text-[#0F172A]">
                    3.5 Mandatory CPA Section 17(5) Cancellation Carve-Out (Death or Hospitalisation):
                  </strong>{" "}
                  In strict accordance with Section 17(5) of the Consumer Protection Act 68 of 2008, no cancellation charge
                  shall apply where a Guest is unable to honour their booking due to the death or hospitalisation of the
                  Guest or the person for whose benefit the booking was made.
                </p>
                <p>
                  <strong className="font-semibold text-[#0F172A]">
                    3.6 Direct Host-to-Guest Refund Clearing via PayShap / EFT:
                  </strong>{" "}
                  Where a Guest taps <em>Request Refund</em> on their pass or the Host cancels the event, PullThru logs
                  the refund request on the Host Dashboard so the Host can return the Guest&apos;s contribution directly
                  via PayShap (instant 5-second clearing) or EFT. Once a spot has been transferred via{" "}
                  <em>Swap My Spot</em>, the original ticket is permanently locked against double-dip refund claims.
                </p>
                <p>
                  <strong className="font-semibold text-[#0F172A]">
                    3.7 Digital Goods Instant Consumption &amp; 1-Click Subscription Cancellation (ECTA s42):
                  </strong>{" "}
                  Where a Host purchases an optional R29.00 once-off Pro Event Boost, the digital utility (unlocking 100+ guest spots, custom branding, and WhatsApp distribution tools) is delivered and consumed instantaneously upon publication, waiving 7-day cooling-off return rights in terms of Section 42 of ECTA. For Hosts subscribing to the R79.00/month Organiser Club Pass, recurring billing terms are clearly disclosed, and subscriptions may be cancelled self-serve at any time in 1 click from the Host Dashboard with zero penalty or cancellation fees.
                </p>
              </div>
            </div>
          </section>
          <section
            id="clause-4"
            className="scroll-mt-24 h-full bg-white border-2 border-[#0F172A] rounded-3xl p-6 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#0F172A] font-mono text-xs font-bold text-[#FFB81C]">
                  04
                </span>
                <div>
                  <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#007749]">
                    Consumer Protection Act 68 of 2008 &bull; Plain &amp; Conspicuous Statutory Risk Notice
                  </p>
                  <h2 className="mt-0.5 text-lg sm:text-xl font-extrabold uppercase tracking-tight text-[#0F172A] font-display leading-snug">
                    Clause 4: Limitation of Liability &amp; Assumption of Risk (CPA Section 49 &amp; Section 51(1)(c)
                    Conspicuous Notice)
                  </h2>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-[#E6E2D8] bg-[#F3F0EA] p-4 sm:p-5 text-xs font-semibold leading-relaxed text-[#0F172A]">
                <p className="uppercase tracking-wider text-[#007749] font-extrabold">
                  IMPORTANT CONSPICUOUS NOTICE IN TERMS OF SECTION 49 OF THE CONSUMER PROTECTION ACT 68 OF 2008:
                </p>
                <p className="mt-2.5">
                  1. PULLTHRU TECHNOLOGIES (PTY) LTD PROVIDES ONLY CLOUD RSVP SOFTWARE AND DISCLOSED PAYMENT ROUTING.
                  PULLTHRU DOES NOT ORGANISE, HOST, SUPERVISE, INSPECT, CATER, OR CONTROL ANY PHYSICAL EVENT, VENUE,
                  SPORTS MATCH, BRAAI, HIKE, OR SOCIAL GATHERING LISTED ON THE PLATFORM.
                </p>
                <p className="mt-2.5">
                  2. BY LOCKING IN AN RSVP OR ATTENDING AN EVENT, YOU EXPRESSLY ACKNOWLEDGE AND ASSUME ALL RISKS
                  ASSOCIATED WITH PHYSICAL ATTENDANCE, INCLUDING BUT NOT LIMITED TO: VENUE SAFETY HAZARDS, SPORTS
                  INJURIES (E.G. 5-A-SIDE SOCCER, PADEL, RUN CLUBS, HIKES), CATERING, ALLERGENS, FOODBORNE ILLNESS,
                  ALCOHOL CONSUMPTION, THEFT OR DAMAGE TO PERSONAL PROPERTY, OR NON-PERFORMANCE / MISAPPROPRIATION BY
                  THE NAMED EVENT HOST.
                </p>
                <p className="mt-2.5">
                  3. TO THE MAXIMUM EXTENT PERMITTED BY LAW, PULLTHRU TECHNOLOGIES (PTY) LTD, ITS DIRECTORS, AND
                  EMPLOYEES SHALL NOT BE LIABLE FOR ANY INJURY, LOSS, CLAIM, OR DAMAGE ARISING OUT OF THE HOST&apos;S
                  CONDUCT OR THE PHYSICAL EVENT, AND PULLTHRU&apos;S MAXIMUM AGGREGATE LIABILITY UNDER CONTRACT A SHALL
                  BE STRICTLY LIMITED TO THE SOFTWARE RSVP FEE PAID BY YOU TO PULLTHRU.
                </p>
                <p className="mt-2.5">
                  4. STRICT LIMITATION OF LIABILITY CAP &amp; &ldquo;AS-IS&rdquo; UPTIME: TO THE MAXIMUM EXTENT PERMITTED BY LAW, PULLTHRU SOFTWARE IS PROVIDED ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS WITHOUT WARRANTIES OF UNINTERRUPTED UPTIME OR ERROR-FREE OPERATION. PULLTHRU&apos;S TOTAL AGGREGATE LIABILITY UNDER ANY THEORY OF CONTRACT, DELICT, OR STATUTE SHALL BE STRICTLY CAPPED AT THE GREATER OF R1,000.00 ZAR OR THE TOTAL SOFTWARE FEES ACTUALLY PAID BY YOU TO PULLTHRU IN THE PRECEDING THREE (3) MONTHS.
                </p>
                <p className="mt-2.5">
                  5. GOVERNING LAW &amp; MANDATORY 30-DAY INFORMAL RESOLUTION: THESE TERMS SHALL BE GOVERNED BY AND CONSTRUED IN ACCORDANCE WITH THE LAWS OF THE REPUBLIC OF SOUTH AFRICA. BEFORE INITIATING ANY FORMAL ARBITRATION OR COURT PROCEEDINGS, THE PARTIES AGREE TO PARTICIPATE IN GOOD-FAITH INFORMAL DISPUTE NEGOTIATIONS UPON THIRTY (30) DAYS WRITTEN NOTICE TO LEGAL@PULLTHRU.CO.ZA.
                </p>
                <div className="mt-3 rounded-xl border border-[#007749]/30 bg-white p-3.5 text-xs font-bold text-[#007749]">
                  MANDATORY CPA SECTION 51(1)(c) STATUTORY CARVE-OUT: NOTHING IN THESE TERMS SHALL BE CONSTRUED AS
                  EXEMPTING OR INDEMNIFYING PULLTHRU TECHNOLOGIES (PTY) LTD FROM LIABILITY FOR ANY LOSS DIRECTLY OR
                  INDIRECTLY ATTRIBUTABLE TO THE GROSS NEGLIGENCE OR WILFUL MISCONDUCT OF PULLTHRU TECHNOLOGIES (PTY)
                  LTD OR ANY PERSON ACTING FOR OR CONTROLLED BY PULLTHRU, AS CONTEMPLATED IN SECTION 51(1)(c) OF THE
                  CONSUMER PROTECTION ACT 68 OF 2008.
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* CLAUSE 5 — FULL WIDTH */}
        <section
          id="clause-5"
          className="scroll-mt-24 bg-white border border-[#E6E2D8] rounded-3xl p-6 shadow-xs"
        >
          <div className="flex items-start sm:items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#007749] font-mono text-xs font-bold text-white">
              05
            </span>
            <div>
              <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#007749]">
                National Gambling Act 7 of 2004 &bull; Insurance Act 18 of 2017 &bull; Banks Act 94 of 1990
              </p>
              <h2 className="mt-0.5 text-lg sm:text-xl font-extrabold text-[#0F172A] font-display">
                Clause 5: Strictly Prohibited Uses &amp; Automated Statutory Filter
              </h2>
            </div>
          </div>

          <div className="mt-4 space-y-4 text-xs sm:text-sm leading-relaxed text-[#475569]">
            <p>
              PullThru enforces an automated statutory compliance filter at event creation and checkout. Hosts are
              strictly prohibited from using PullThru to create, promote, or collect funds for any of the following
              regulated activities:
            </p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-[#E6E2D8] bg-[#F3F0EA] p-4 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                    1. Unlicensed Gambling &amp; Paid Fantasy Pools
                  </div>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#475569]">
                    Pursuant to the{" "}
                    <strong className="font-semibold text-[#0F172A]">National Gambling Act 7 of 2004</strong>, PullThru
                    strictly bans{" "}
                    <strong className="font-semibold text-[#0F172A]">Fantasy Premier League (FPL) cash buy-ins</strong>,{" "}
                    <strong className="font-semibold text-[#0F172A]">SuperBru cash prize pools</strong>, sports sweeps,
                    raffles, lotteries, lucky draws, poker buy-ins, and any game of chance or mixed skill/chance for a
                    cash prize.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#E6E2D8] bg-[#F3F0EA] p-4 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                    2. Unlicensed Funeral Policies &amp; Burial Societies
                  </div>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#475569]">
                    Pursuant to the{" "}
                    <strong className="font-semibold text-[#0F172A]">Insurance Act 18 of 2017</strong>, PullThru
                    strictly bans recurring{" "}
                    <strong className="font-semibold text-[#0F172A]">burial societies</strong>, monthly funeral cover
                    schemes, or contingent risk policies promising future benefits on death.
                  </p>
                </div>
                <p className="mt-3 rounded-xl bg-white border border-[#E6E2D8] p-3 text-xs leading-relaxed text-[#007749]">
                  <strong>Permitted Cultural Carve-Out:</strong> Spontaneous, one-off bereavement condolence gifts (
                  <em>imali yenduduzo</em> / floral &amp; catering support after a bereavement has already occurred,
                  with no prior contractual entitlement) are lawful gifts and are expressly permitted.
                </p>
              </div>

              <div className="rounded-2xl border border-[#E6E2D8] bg-[#F3F0EA] p-4 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                    3. Deposit-Taking, Investment Schemes &amp; Unlicensed Liquor Sales
                  </div>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#475569]">
                    Pursuant to the <strong className="font-semibold text-[#0F172A]">Banks Act 94 of 1990</strong>, FAIS
                    Act, and the <strong className="font-semibold text-[#0F172A]">Liquor Act 59 of 2003</strong>,
                    PullThru strictly bans savings/investment clubs promising interest, pyramid/multiplication schemes,
                    and unlicensed commercial retail sale of alcohol (e.g. &ldquo;unlimited open bar ticket&rdquo; or
                    &ldquo;bottomless booze sale&rdquo; without a valid provincial liquor licence). Private events are
                    strictly BYOB or licensed-venue hosted, and no alcohol may be supplied to persons under 18.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CLAUSE 6 — FULL WIDTH */}
        <section
          id="clause-6"
          className="scroll-mt-24 bg-white border border-[#E6E2D8] rounded-3xl p-6 shadow-xs"
        >
          <div className="flex items-start sm:items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#007749] font-mono text-xs font-bold text-white">
              06
            </span>
            <div>
              <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#007749]">
                Protection of Personal Information Act 4 of 2013 (Sections 18, 55 &amp; 69) &bull; ECTA Act 25 of 2002
                (Section 43)
              </p>
              <h2 className="mt-0.5 text-lg sm:text-xl font-extrabold text-[#0F172A] font-display">
                Clause 6: POPIA Section 18 Privacy Notice, Synthetic Email Proxy Disclosure &amp; ECTA Section 43
                Mandatory 18-Point Statutory Table
              </h2>
            </div>
          </div>

          <div className="mt-4 space-y-6 text-xs sm:text-sm leading-relaxed text-[#475569]">
            {/* POPIA Section 18 Disclosure */}
            <div className="rounded-2xl border border-[#E6E2D8] bg-[#F3F0EA] p-5">
              <h3 className="text-sm sm:text-base font-extrabold text-[#0F172A] font-display">
                6.1 POPIA Section 18 Notification &amp; Synthetic Email Proxy Disclosure
              </h3>
              <ul className="mt-3 list-disc space-y-2.5 pl-5 text-xs sm:text-sm leading-relaxed text-[#475569]">
                <li>
                  <strong className="font-semibold text-[#0F172A]">Purpose of Processing (POPIA s13 &amp; s18):</strong>{" "}
                  We collect only your Display Name, WhatsApp cell number, optional dietary/custom host question
                  response, and transaction reference strictly to issue your RSVP Pass, display your attendance on the
                  Event Roll-Call (unless you toggle <em>Anonymous Guest</em>), and settle your Base Event Contribution
                  to the Host.
                </li>
                <li>
                  <strong className="font-semibold text-[#0F172A]">Zero Forced Email Collection Disclosure:</strong>{" "}
                  To eliminate checkout friction on WhatsApp, Guests only enter their Display Name, optional WhatsApp
                  number for pass recovery, and their bank POP reference. When an internal technical identifier is
                  required, PullThru generates a deterministic, non-marketing technical proxy address in the format{" "}
                  <code className="rounded-md border border-[#E6E2D8] bg-white px-2 py-0.5 font-mono text-xs font-semibold text-[#007749]">
                    wa_27XXXXXXXXX@rsvp.pullthru.co.za
                  </code>
                  . Your WhatsApp number is never sold or used for unsolicited electronic marketing (POPIA Section 69).
                </li>
                <li>
                  <strong className="font-semibold text-[#0F172A]">
                    Information Officer &amp; Regulator Registration Guide (POPIA s55):
                  </strong>{" "}
                  PullThru&apos;s designated Information Officer is{" "}
                  <strong className="font-semibold text-[#0F172A]">L. Mokoena</strong> (
                  <span className="font-mono font-semibold text-[#007749]">privacy@pullthru.co.za</span> /{" "}
                  <span className="font-mono font-semibold text-[#007749]">legal@pullthru.co.za</span>). Statutory
                  Information Officer registration is maintained via the Information Regulator of South Africa portal
                  at{" "}
                  <a
                    href="https://eservices.inforegulator.org.za"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono font-semibold text-[#007749] underline hover:text-[#005F3A]"
                  >
                    eservices.inforegulator.org.za
                  </a>{" "}
                  (15-minute CIPC director self-service registration workflow). Data subjects may lodge access,
                  correction, or deletion requests at any time or contact the Information Regulator at{" "}
                  <span className="font-mono font-semibold text-[#0F172A]">POPIAComplaints@inforegulator.org.za</span>.
                </li>
                <li>
                  <strong className="font-semibold text-[#0F172A]">
                    Data Retention &amp; De-Identification Schedule (POPIA Section 14 &amp; Tax Administration Act s29):
                  </strong>{" "}
                  Public Guest Wall entries and optional dietary/custom host answers (
                  <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs text-[#0F172A]">custom_answer</code>
                  ) are automatically de-identified 90 days after the event date concludes. Statutory financial order
                  records (
                  <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs text-[#0F172A]">public.orders</code>
                  ) are retained in encrypted, RLS-locked storage for 5 years strictly as required by Section 29 of the
                  Tax Administration Act 28 of 2011 and Section 14(1)(a) of POPIA.
                </li>
                <li>
                  <strong className="font-semibold text-[#0F172A]">
                    Zero-Retention / Ephemeral Memory Processing for Bank Slips &amp; SMS:
                  </strong>{" "}
                  Proof-of-Payment screenshots and bank SMS confirmation texts are processed in volatile, ephemeral browser and server memory (<span className="font-mono text-xs">RAM</span>) strictly to extract transaction amounts and compute non-reversible SHA-256 deduplication hashes. PullThru enforces a strict zero-retention policy: raw SMS text is never stored in persistent unencrypted ledgers or shared with third parties.
                </li>
                <li>
                  <strong className="font-semibold text-[#0F172A]">
                    Data Controller (Responsible Party) vs. Data Processor (Operator) Roles:
                  </strong>{" "}
                  In terms of POPIA Sections 20 and 21, the Event Host acts as the Responsible Party (Data Controller) determining the purpose and squad members for their event, and PullThru acts as the Operator (Data Processor) processing data solely on the Host&apos;s instructions. Sub-processors utilised for infrastructure are limited to Cloudflare (Edge CDN &amp; WAF), Supabase (PostgreSQL encrypted storage), and Yoco Technologies (Host software pass billing). Data subjects may exercise their right to access, correct, or delete information under POPIA Form 2 by emailing <span className="font-mono text-xs text-[#007749]">privacy@pullthru.co.za</span>.
                </li>
                <li>
                  <strong className="font-semibold text-[#0F172A]">
                    Children&apos;s Personal Information &amp; Parental Consent (POPIA Section 34 &amp; 35):
                  </strong>{" "}
                  PullThru does not knowingly collect personal information directly from children under 18 years of age.
                  Where an Event Host creates family ticket tiers (e.g. &ldquo;Kids Under 12&rdquo;) or a Guest includes minors in{" "}
                  <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs text-[#0F172A]">plus_one_names</code>,
                  the person submitting such details expressly warrants and confirms that they are a &ldquo;competent person&rdquo;
                  (parent or legal guardian) in terms of Section 35(1)(a) of the Protection of Personal Information Act 4 of 2013,
                  lawfully consenting to the processing and public social wall display of the minor&apos;s first name or nickname.
                </li>
              </ul>
            </div>

            {/* ECTA Section 43 18-Point Statutory Table */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-[#0F172A] font-display">
                    6.2 ECTA Section 43(1) Mandatory 18-Point Statutory Disclosure Table
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-[#475569]">
                    Full compliance with all 18 disclosures required under Section 43(1) of the Electronic
                    Communications and Transactions Act 25 of 2002, extinguishing the statutory 14-day cancellation
                    penalty under Section 43(3) of ECTA:
                  </p>
                </div>
                {(searchQuery || activeCategory !== "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setActiveCategory("all");
                    }}
                    className="self-start sm:self-auto shrink-0 rounded-full border border-[#007749] px-3 py-1 text-xs font-bold text-[#007749] hover:bg-[#007749] hover:text-white cursor-pointer"
                  >
                    Reset Filter ({filteredEctaRows.length}/18)
                  </button>
                )}
              </div>

              <div className="mt-3.5 overflow-hidden rounded-2xl border border-[#E6E2D8] bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="border-b border-[#E6E2D8] bg-[#F3F0EA] text-[#0F172A]">
                      <tr>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider text-[#007749] w-1/3">
                          ECTA s43(1) Statutory Item
                        </th>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider text-[#0F172A]">
                          PullThru Statutory Disclosure
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6E2D8]">
                      {filteredEctaRows.length > 0 ? (
                        filteredEctaRows.map((row) => (
                          <tr key={row.point} className="transition-colors hover:bg-[#FAF8F5]">
                            <td className="px-4 py-3 font-semibold text-[#0F172A] align-top">{row.point}</td>
                            <td className="px-4 py-3 text-[#475569] leading-relaxed align-top">{row.disclosure}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={2} className="px-4 py-6 text-center text-xs sm:text-sm text-[#475569]">
                            No statutory points matched &ldquo;<strong>{searchQuery}</strong>&rdquo;.{" "}
                            <button
                              type="button"
                              onClick={() => {
                                setSearchQuery("");
                                setActiveCategory("all");
                              }}
                              className="font-bold text-[#007749] underline cursor-pointer"
                            >
                              Show all 18 ECTA Section 43 disclosures
                            </button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CLAUSE 7 — INTELLECTUAL PROPERTY, COPYRIGHT & THIRD-PARTY TRADE MARKS */}
        <section
          id="clause-7"
          className="scroll-mt-24 bg-white border border-[#E6E2D8] rounded-3xl p-6 shadow-xs"
        >
          <div className="flex items-start sm:items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#007749] font-mono text-xs font-bold text-white">
              07
            </span>
            <div>
              <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#007749]">
                Copyright Act 98 of 1978 &bull; Trade Marks Act 194 of 1993 (Section 34(2)(c))
              </p>
              <h2 className="mt-0.5 text-lg sm:text-xl font-extrabold text-[#0F172A] font-display">
                Clause 7: Intellectual Property Ownership &amp; Third-Party Trade Marks Disclaimer
              </h2>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm leading-relaxed text-[#475569]">
            <div className="rounded-2xl border border-[#E6E2D8] bg-[#F3F0EA] p-5">
              <h3 className="text-sm sm:text-base font-extrabold text-[#0F172A] font-display">
                7.1 Proprietary Software, Brand &amp; Copyright (Act 98 of 1978)
              </h3>
              <p className="mt-2">
                All original source code, split-settlement algorithms, user interface layouts, copywriting, graphics,
                and the <strong className="font-semibold text-[#0F172A]">PullThru</strong> name and geometric emblem on{" "}
                <span className="font-mono font-semibold text-[#007749]">pullthru.co.za</span> and the{" "}
                <span className="font-mono font-semibold text-[#0F172A]">com.pullthru.za</span> application are the
                exclusive intellectual property of{" "}
                <strong className="font-semibold text-[#0F172A]">PullThru Technologies (Pty) Ltd</strong> and its
                founders, protected automatically under the South African <em>Copyright Act 98 of 1978</em> and common
                law passing-off principles. Unauthorised scraping, reproduction, or commercial cloning is strictly
                prohibited.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E6E2D8] bg-[#FAF8F5] p-5">
              <h3 className="text-sm sm:text-base font-extrabold text-[#0F172A] font-display">
                7.2 Nominative Fair Use &amp; Third-Party Trade Marks (s34(2)(c))
              </h3>
              <p className="mt-2">
                References on this platform to third-party payment rails, banks, and messaging services—including{" "}
                <strong className="font-semibold text-[#0F172A]">
                  Capitec®, Capitec Pay®, FNB®, Standard Bank®, Absa®, Nedbank®, TymeBank®, Discovery Bank®, Apple
                  Pay®, Ozow®, Yoco®, and WhatsApp®
                </strong>
                —are made strictly for descriptive compatibility and payment-routing identification in accordance with{" "}
                <em>Section 34(2)(c) of the Trade Marks Act 194 of 1993</em>. All third-party trade marks remain the
                property of their respective owners, and their display does not imply direct corporate sponsorship or
                banking endorsement of PullThru.
              </p>
            </div>

            <div className="col-span-1 md:col-span-2 rounded-2xl border border-[#007749]/30 bg-white p-5">
              <h3 className="text-sm sm:text-base font-extrabold text-[#0F172A] font-display">
                7.3 AI Governance, Customer Data Non-Training Guarantee &amp; Anti-Scraping Policy
              </h3>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#475569]">
                <strong className="text-[#007749]">Strict Non-Training Guarantee:</strong> PullThru unequivocally warrants that user-uploaded bank payment slips, guest lists, WhatsApp banter notes, and private event details are <strong>never used to train public or proprietary Artificial Intelligence (AI) or Large Language Model (LLM) datasets</strong>. You retain 100% ownership of your event data. Furthermore, automated bots, competitors, and scrapers are strictly prohibited from harvesting, cloning, reverse-engineering, or benchmarking PullThru&apos;s South African bank regex parsing rules, anti-fraud engines, banter badge taxonomy, or user experience architecture.
              </p>
            </div>
          </div>
        </section>

        {/* Compact Footer CTA Card */}
        <div className="flex flex-col items-start sm:items-center justify-between gap-4 rounded-3xl border border-[#E6E2D8] bg-white p-6 sm:flex-row shadow-xs print:hidden">
          <div>
            <p className="text-sm sm:text-base font-extrabold text-[#0F172A] font-display">
              Questions about Direct PayShap Pure SaaS Compliance, CPA s49, or POPIA s18?
            </p>
            <p className="mt-0.5 text-xs sm:text-sm text-[#475569]">
              Contact our Statutory Legal &amp; Compliance Desk at{" "}
              <span className="font-mono font-semibold text-[#007749]">legal@pullthru.co.za</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#E6E2D8] bg-[#F3F0EA] px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#0F172A] transition-all hover:border-[#007749] cursor-pointer"
            >
              <span>🖨️ Print Statutory Record</span>
            </button>
            <Link
              href="/"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#007749] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition-all hover:bg-[#005F3A]"
            >
              <span>&larr; Back to PullThru Home</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
