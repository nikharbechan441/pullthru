"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import TastefulAdSlot from "@/components/TastefulAdSlot";
import {
  Flame,
  Users,
  ShoppingBag,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  Snowflake,
  Utensils,
  Calculator,
  Share2,
  ExternalLink,
} from "lucide-react";

type BraaiStyleId = "classic" | "spit" | "potjie";

interface BraaiStyleConfig {
  id: BraaiStyleId;
  label: string;
  tagline: string;
  defaultPerPersonZar: number;
  worsGramsPerPerson: number;
  chopsGramsPerPerson: number;
  sosatiesPerPerson: number;
  rollsOrLoavesDivisor: number;
  sideLabel: string;
  briquettesGuestsPerBag: number;
}

const BRAAI_STYLES: BraaiStyleConfig[] = [
  {
    id: "classic",
    label: "🥩 Classic Chops, Wors & Sosaties",
    tagline: "Traditional Mzansi bring-and-braai or Saturday squad kitty",
    defaultPerPersonZar: 140,
    worsGramsPerPerson: 180,
    chopsGramsPerPerson: 220,
    sosatiesPerPerson: 1.5,
    rollsOrLoavesDivisor: 4,
    sideLabel: "Garlic Bread Loaves & Potato Salad",
    briquettesGuestsPerBag: 6,
  },
  {
    id: "spit",
    label: "🔥 Premium Sirloin & Lamb Chops",
    tagline: "Rugby test match / milestone birthday feast",
    defaultPerPersonZar: 220,
    worsGramsPerPerson: 160,
    chopsGramsPerPerson: 300,
    sosatiesPerPerson: 1.5,
    rollsOrLoavesDivisor: 3,
    sideLabel: "Roosterkoek / Garlic Loaves & Greek Salad",
    briquettesGuestsPerBag: 5,
  },
  {
    id: "potjie",
    label: "🍲 Sunday Oxtail / Lamb Potjiekos",
    tagline: "Slow-cooked cast-iron potjie with roosterkoek & sides",
    defaultPerPersonZar: 120,
    worsGramsPerPerson: 100, // starter snack wors on the grid
    chopsGramsPerPerson: 280, // potjie meat cut weight
    sosatiesPerPerson: 0,
    rollsOrLoavesDivisor: 4,
    sideLabel: "Potbrood / Steamed Rice & Chakalaka",
    briquettesGuestsPerBag: 7,
  },
];

const braaiJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": "https://pullthru.co.za/braai-calculator#app",
      name: "PullThru South African Braai Meat, Charcoal, Ice & Kitty Calculator",
      applicationCategory: "LifestyleApplication, FinanceApplication",
      operatingSystem: "Web, Android, iOS, WhatsApp",
      url: "https://pullthru.co.za/braai-calculator",
      inLanguage: "en-ZA",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "ZAR",
        description:
          "Free South African braai calculator with 1-click WhatsApp kitty & Bring-'n-Bak checklist link.",
      },
      potentialAction: {
        "@type": "UseAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate:
            "https://pullthru.co.za/braai-calculator?guests={guests}&style={style}",
        },
      },
    },
    {
      "@type": "HowTo",
      name: "How to Calculate Meat, Charcoal & Ice for a South African Braai",
      description:
        "Calculate exact butchery weights (boerewors, chops, sosaties), 4kg bags of ice, and briquettes per guest in South Africa.",
      totalTime: "PT15S",
      step: [
        {
          "@type": "HowToStep",
          position: 1,
          name: "Calculate Meat Weight per Adult (400g–500g Uncooked)",
          text: "Budget 180g–200g of traditional boerewors plus 220g–300g of lamb or pork chops and 1.5 chicken sosaties per person.",
        },
        {
          "@type": "HowToStep",
          position: 2,
          name: "Calculate 4kg Ice Bags and Hardwood Charcoal",
          text: "Order 1x 4kg bag of ice for every 3 guests (for cooler boxes and drinks) and 1x 4kg bag of Namibian hardwood briquettes for every 5 to 6 guests.",
        },
        {
          "@type": "HowToStep",
          position: 3,
          name: "Launch a 1-Tap WhatsApp Braai Kitty & Bring-'n-Bak Link",
          text: "Tap 'Start WhatsApp Braai Kitty' on PullThru.co.za to collect the per-person Rand split via Direct PayShap or Capitec PayMe and assign ice, salads, and garlic bread.",
        },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How much braai meat, charcoal, and ice do I need per person in South Africa?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "For a standard South African braai, allow 400g to 500g of uncooked bone-in meat per adult (180g boerewors + 220g lamb/pork chops + 1–2 chicken sosaties), 1x 4kg bag of ice per 3 guests, 1x 4kg bag of briquettes/charcoal per 5–6 guests, and 1 garlic loaf per 4 guests. For 12 guests, that equals 2.0kg boerewors, 2.5kg chops, 18 sosaties, 4x 4kg bags of ice, and 2x 4kg bags of briquettes.",
          },
        },
        {
          "@type": "Question",
          name: "How do I split a Checkers Sixty60 and butchery braai bill on WhatsApp?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Use https://pullthru.co.za/braai-calculator to calculate your exact meat and ice list, then tap 'Start WhatsApp Braai Kitty'. It generates a single link where friends pay their R140–R220 share directly to your bank account via PayShap or Capitec PayMe (R0 guest fees) and claim Bring-'n-Bak items so nobody duplicates garlic bread or forgets the ice.",
          },
        },
      ],
    },
  ],
};

export default function BraaiCalculatorPage() {
  const [guests, setGuests] = useState<number>(12);
  const [styleId, setStyleId] = useState<BraaiStyleId>("classic");
  const [customPriceZar, setCustomPriceZar] = useState<number | null>(null);
  const [customTitle, setCustomTitle] = useState<string>("");
  const [copiedList, setCopiedList] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const rawGuests =
      params.get("guests") || params.get("people") || params.get("spots");
    if (rawGuests && !Number.isNaN(Number(rawGuests))) {
      setGuests(Math.max(4, Math.min(60, Math.round(Number(rawGuests)))));
    }
    const rawStyle = params.get("style");
    if (rawStyle === "classic" || rawStyle === "spit" || rawStyle === "potjie") {
      setStyleId(rawStyle);
    }
  }, []);
  const [copiedSixty60, setCopiedSixty60] = useState<boolean>(false);
  const [copiedEmbed, setCopiedEmbed] = useState<boolean>(false);

  const activeStyle = useMemo(
    () => BRAAI_STYLES.find((s) => s.id === styleId) || BRAAI_STYLES[0],
    [styleId]
  );

  const defaultStyleTitle = useMemo(() => {
    if (styleId === "potjie") return "Sunday Potjiekos & Chill 🍲🔥";
    if (styleId === "spit") return "Saturday Feast & Rugby Screening 🔥🥩";
    return "Saturday Braai & Rugby 🥩🔥";
  }, [styleId]);

  const resolvedTitle = customTitle.trim() || defaultStyleTitle;

  const perPersonZar = customPriceZar ?? activeStyle.defaultPerPersonZar;

  const handleStyleSelect = (newId: BraaiStyleId) => {
    setStyleId(newId);
    setCustomPriceZar(null);
  };

  // Exact South African quantities
  const calc = useMemo(() => {
    const worsKg = Math.max(0.5, Math.round(((guests * activeStyle.worsGramsPerPerson) / 1000) * 2) / 2);
    const chopsKg = Math.max(1.0, Math.round(((guests * activeStyle.chopsGramsPerPerson) / 1000) * 2) / 2);
    const sosatieCount = Math.ceil(guests * activeStyle.sosatiesPerPerson);
    const garlicLoaves = Math.max(2, Math.ceil(guests / activeStyle.rollsOrLoavesDivisor));
    const saladTubs = Math.max(1, Math.ceil(guests / 6));
    const iceBags4kg = Math.max(2, Math.ceil(guests / 3)); // 1x 4kg bag per 3 guests for cooler boxes + drinks
    const charcoalBags4kg = Math.max(2, Math.ceil(guests / activeStyle.briquettesGuestsPerBag));
    const firelightersBoxes = Math.max(1, Math.ceil(charcoalBags4kg / 3));

    const totalMeatKg = +(worsKg + chopsKg + (sosatieCount * 0.12)).toFixed(1);
    const totalPotZar = guests * perPersonZar;

    // Build Bring-'n-Bak checklist items for 1-click hydration into /create
    const bringChecklist = [
      `🧊 ${iceBags4kg}x 4kg Bags of Ice (Cooler Box)`,
      `🔥 ${charcoalBags4kg}x 4kg Bags Chisa / Namibian Hardwood + ${firelightersBoxes}x Blitz`,
      `🥖 ${garlicLoaves}x Garlic Bread Loaves`,
      `🥗 ${saladTubs}x Large Potato Salad / Chakalaka`,
      `🪑 Extra Camp Chairs & Cooler Box`,
      `🍻 Own Drinks / Mixers`,
    ];

    return {
      worsKg,
      chopsKg,
      sosatieCount,
      garlicLoaves,
      saladTubs,
      iceBags4kg,
      charcoalBags4kg,
      firelightersBoxes,
      totalMeatKg,
      totalPotZar,
      bringChecklist,
    };
  }, [guests, activeStyle, perPersonZar]);

  const createHref = useMemo(() => {
    const params = new URLSearchParams({
      preset: "braai",
      price: String(perPersonZar),
      spots: String(guests),
      title: resolvedTitle,
      bring: calc.bringChecklist.join("|"),
    });
    return `/create?${params.toString()}`;
  }, [perPersonZar, guests, resolvedTitle, calc.bringChecklist]);

  const whatsappSummaryText = useMemo(() => {
    const lines = [
      `*${resolvedTitle}* (${guests} Squad Members)`,
      `💰 *Braai Kitty:* R${perPersonZar}/person (Total Pot: R${calc.totalPotZar.toLocaleString("en-ZA")})`,
      ``,
      `🥩 *Butchery & Meat Order (${calc.totalMeatKg}kg total):*`,
      `• ${calc.worsKg}kg Traditional Boerewors`,
      `• ${calc.chopsKg}kg ${styleId === "potjie" ? "Oxtail / Lamb Potjie Cuts" : "Lamb & Pork Loin Chops"}`,
      ...(calc.sosatieCount > 0 ? [`• ${calc.sosatieCount}x Chicken / Apricot Sosaties`] : []),
      ``,
      `🧊 *Bring-'n-Bak & Sides Checklist:*`,
      ...calc.bringChecklist.map((item) => `• ${item}`),
      ``,
      `📲 *1-Tap Interactive Roll-Call & Bring-'n-Bak Wall (R0 Fee):*`,
      `https://pullthru.co.za${createHref}`,
      `🥩 *Adjust Meat & Ice Math:* https://pullthru.co.za/braai-calculator`,
    ];
    return lines.join("\n");
  }, [resolvedTitle, guests, perPersonZar, calc, styleId, createHref]);

  const handleCopyList = async () => {
    try {
      await navigator.clipboard.writeText(whatsappSummaryText);
      setCopiedList(true);
      setTimeout(() => setCopiedList(false), 2600);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleCopySixty60List = async () => {
    const sixty60Text = [
      `🛒 CHECKERS SIXTY60 & BUTCHERY SHOPPING LIST`,
      `Event: ${resolvedTitle} (${guests} Guests • R${perPersonZar}/head kitty)`,
      `Total Braai Kitty: R${calc.totalPotZar.toLocaleString("en-ZA")}`,
      `--------------------------------------------------`,
      `🥩 BUTCHERY COUNTER (${calc.totalMeatKg}kg total meat):`,
      `• ${calc.worsKg}kg Championship Boerewors (~${Math.ceil(calc.worsKg / 0.8)}x 800g coils)`,
      `• ${calc.chopsKg}kg ${styleId === "potjie" ? "Oxtail / Potjie Beef & Lamb Cuts" : "Lamb Loin / Pork Chops"} (~${Math.round(calc.chopsKg * 6)} pieces)`,
      ...(calc.sosatieCount > 0 ? [`• ${calc.sosatieCount}x Marinated Chicken / Apricot Sosaties`] : []),
      ``,
      `🔥 BRAAI ESSENTIALS & SIDES:`,
      `• ${calc.iceBags4kg}x 4kg Ice Bags (Cooler boxes & drinks)`,
      `• ${calc.charcoalBags4kg}x 4kg Briquettes / Sekelbos Hardwood`,
      `• ${calc.firelightersBoxes}x Blitz Firelighters`,
      `• ${calc.garlicLoaves}x Garlic Butter Baguettes / Loaves`,
      `• ${calc.saladTubs}x Large Creamy Potato Salad or Chakalaka`,
      ``,
      `📲 Turn this list into a live WhatsApp Roll-Call & Bring-'n-Bak Wall (R0 Fee):`,
      `https://pullthru.co.za${createHref}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(sixty60Text);
      setCopiedSixty60(true);
      setTimeout(() => setCopiedSixty60(false), 2600);
    } catch {
      // ignore
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0A08] text-[#FAF6F0] selection:bg-amber-500 selection:text-stone-950 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(braaiJsonLd) }}
      />
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-stone-800/80 bg-[#0D0A08]/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-stone-950 font-black text-base shadow-md shadow-amber-500/20">
              P
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-white text-base">
                PullThru
              </span>
              <span className="hidden sm:inline-block ml-2 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Free SA Braai Tool
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2.5">
            <Link
              href="/e/bokke-test-spitbraai"
              className="text-xs font-bold text-stone-300 hover:text-white px-3 py-2 rounded-xl border border-stone-800 hover:border-stone-700 transition"
            >
              👀 Live Braai Demo
            </Link>
            <Link
              href={createHref}
              className="text-xs font-extrabold bg-amber-500 hover:bg-amber-400 text-stone-950 px-3.5 py-2 rounded-xl transition shadow-sm"
            >
              ⚡ Start Kitty Link
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold mb-4">
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span>Mzansi Braai Meat, Charcoal, Ice & Kitty Split Calculator</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-[1.1]">
          How much meat, charcoal &amp; ice do you{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400">
            actually need?
          </span>
        </h1>
        <p className="mt-3 text-sm sm:text-base text-stone-400 max-w-2xl leading-relaxed">
          Slide your squad headcount below to calculate exact South African butchery weights (boerewors, chops, sosaties), 4kg bags of ice, briquettes, and per-person Rand split — then turn it into a live{" "}
          <strong className="text-stone-200">WhatsApp Kitty + Bring-&apos;n-Bak checklist link</strong> in 1 tap.
        </p>
      </section>

      {/* Interactive Calculator Grid */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Card 1: Squad Headcount & Braai Style */}
          <div className="rounded-3xl bg-[#16120E] border border-stone-800/90 p-5 sm:p-6 shadow-xl">
            <div className="flex items-center justify-between gap-2 mb-3">
              <label
                htmlFor="guests-slider"
                className="text-xs font-extrabold uppercase tracking-wider text-stone-400 flex items-center gap-1.5"
              >
                <Users className="w-4 h-4 text-amber-400" />
                1. How many people are pulling through?
              </label>
              <span className="px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-black text-lg">
                {guests} Guests
              </span>
            </div>

            <input
              id="guests-slider"
              type="range"
              min={4}
              max={40}
              step={1}
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="w-full accent-amber-500 h-2.5 bg-stone-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-stone-500 font-semibold mt-1.5">
              <span>4 (Small Chillas)</span>
              <span>12 (Standard Squad)</span>
              <span>24 (Big Birthday)</span>
              <span>40 (Full Feast)</span>
            </div>

            {/* Real-Time Mobile Metric Strip */}
            <div className="mt-4 flex sm:hidden items-center justify-between rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3 text-xs">
              <div>
                <span className="block text-[10px] uppercase font-bold text-amber-400">Total Meat</span>
                <span className="font-black text-white text-sm">{calc.totalMeatKg} kg</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-amber-400">4kg Ice</span>
                <span className="font-black text-white text-sm">{calc.iceBags4kg} bags</span>
              </div>
              <div className="text-right">
                <span className="block text-[10px] uppercase font-bold text-emerald-400">Squad Kitty</span>
                <span className="font-black text-emerald-400 text-sm">R{calc.totalPotZar.toLocaleString("en-ZA")}</span>
              </div>
            </div>

            {/* Quick Headcount Pills */}
            <div className="flex flex-wrap gap-2 mt-4">
              {[6, 10, 12, 16, 20, 30].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setGuests(num)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                    guests === num
                      ? "bg-amber-500 text-stone-950 border-amber-400 shadow-sm"
                      : "bg-stone-900/90 text-stone-300 border-stone-800 hover:border-stone-700"
                  }`}
                >
                  {num} people
                </button>
              ))}
            </div>

            {/* Braai Style Selector */}
            <div className="mt-6 pt-5 border-t border-stone-800/80">
              <p className="text-xs font-extrabold uppercase tracking-wider text-stone-400 mb-3 flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-amber-400" />
                2. Choose your Braai menu style
              </p>
              <div className="grid grid-cols-1 gap-2.5">
                {BRAAI_STYLES.map((st) => {
                  const selected = st.id === styleId;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => handleStyleSelect(st.id)}
                      className={`text-left p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                        selected
                          ? "bg-amber-500/15 border-amber-500/60 text-white shadow-md"
                          : "bg-stone-900/60 border-stone-800/90 text-stone-300 hover:border-stone-700"
                      }`}
                    >
                      <div>
                        <div className="font-extrabold text-sm text-white">
                          {st.label}
                        </div>
                        <div className="text-xs text-stone-400 mt-0.5">
                          {st.tagline}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-stone-950/90 border border-stone-800 text-amber-300">
                          ~R{st.defaultPerPersonZar}/pp
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Per-Person Kitty Split Override & Event Title */}
            <div className="mt-6 pt-5 border-t border-stone-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="kitty-price-input"
                  className="block text-xs font-extrabold uppercase tracking-wider text-stone-400 mb-1.5"
                >
                  3. Kitty Split Per Person (ZAR)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-amber-400">
                    R
                  </span>
                  <input
                    id="kitty-price-input"
                    type="number"
                    min={50}
                    max={1500}
                    step={10}
                    value={perPersonZar}
                    onChange={(e) =>
                      setCustomPriceZar(Math.max(0, Number(e.target.value) || 0))
                    }
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-stone-900 border border-stone-700 text-white font-black text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <p className="text-[11px] text-stone-400 mt-1">
                  Total Squad Kitty:{" "}
                  <strong className="text-emerald-400">
                    R{calc.totalPotZar.toLocaleString("en-ZA")}
                  </strong>{" "}
                  (100% paid to host)
                </p>
              </div>

              <div>
                <label
                  htmlFor="braai-title-input"
                  className="block text-xs font-extrabold uppercase tracking-wider text-stone-400 mb-1.5"
                >
                  4. WhatsApp Event Title
                </label>
                <input
                  id="braai-title-input"
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder={`e.g. ${defaultStyleTitle}`}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-700 text-white font-bold text-sm focus:outline-none focus:border-amber-500"
                />
                <p className="text-[11px] text-stone-400 mt-1">
                  Customizes your WhatsApp roll-call link
                </p>
              </div>
            </div>
          </div>

          {/* Why hosts use PullThru instead of chasing EFT screenshots */}
          <div className="rounded-3xl bg-gradient-to-br from-emerald-950/40 via-[#16120E] to-[#16120E] border border-emerald-500/25 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-300">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-white">
                  Stop fronting R{calc.totalPotZar.toLocaleString("en-ZA")} at the butchery on Friday afternoon
                </h2>
                <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                  Every South African braai host knows the pain: 14 people drop{" "}
                  <em>&ldquo;🔥 Count me in&rdquo;</em> in the WhatsApp group, you buy{" "}
                  <strong>{calc.totalMeatKg}kg of meat</strong> out of your own pocket, and 4 people flake when it rains. When you convert this calculator into a{" "}
                  <strong className="text-emerald-300">PullThru Kitty Link</strong>, friends lock in their{" "}
                  <strong>R{perPersonZar}</strong> via Direct PayShap or Capitec PayMe with R0 Guest Fees and claim a bag of ice or garlic loaf in one 25-second tap.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Butchery & Ice Output + 1-Tap Action (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-3xl bg-[#16120E] border border-amber-500/40 p-5 sm:p-6 shadow-2xl shadow-amber-950/20">
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
                  Butchery &amp; Ice Breakdown
                </span>
                <h2 className="text-xl font-black text-white mt-0.5">
                  {guests} Guests • {calc.totalMeatKg}kg Meat
                </h2>
              </div>
              <div className="text-right">
                <div className="text-xs text-stone-400">Total Kitty Pot</div>
                <div className="text-xl font-black text-emerald-400">
                  R{calc.totalPotZar.toLocaleString("en-ZA")}
                </div>
              </div>
            </div>

            {/* Meat Quantities */}
            <div className="mt-4 space-y-2.5">
              <div className="text-xs font-extrabold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                Butchery Order (R{perPersonZar}/person kitty)
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-2xl bg-stone-900/90 border border-stone-800">
                  <div className="text-xs text-stone-400">Boerewors</div>
                  <div className="text-lg font-black text-white mt-0.5">
                    {calc.worsKg} kg
                  </div>
                  <div className="text-[11px] text-stone-400">
                    ~{Math.ceil(calc.worsKg / 0.8)}x 800g coils
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-stone-900/90 border border-stone-800">
                  <div className="text-xs text-stone-400">
                    {styleId === "potjie" ? "Potjie Meat Cuts" : "Lamb / Pork Chops"}
                  </div>
                  <div className="text-lg font-black text-white mt-0.5">
                    {calc.chopsKg} kg
                  </div>
                  <div className="text-[11px] text-stone-400">
                    ~{Math.round(calc.chopsKg * 6)} thick-cut pieces
                  </div>
                </div>
              </div>

              {calc.sosatieCount > 0 && (
                <div className="p-3 rounded-2xl bg-stone-900/90 border border-stone-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">
                      Chicken / Apricot Sosaties
                    </div>
                    <div className="text-[11px] text-stone-400">
                      1–2 skewers per person on the grid
                    </div>
                  </div>
                  <span className="text-base font-black text-amber-300">
                    {calc.sosatieCount} skewers
                  </span>
                </div>
              )}
            </div>

            {/* Ice, Charcoal & Bring-'n-Bak Checklist */}
            <div className="mt-5 pt-4 border-t border-stone-800 space-y-2.5">
              <div className="text-xs font-extrabold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                <Snowflake className="w-3.5 h-3.5 text-sky-400" />
                Auto-Generated Bring-&apos;n-Bak Checklist
              </div>

              <ul className="space-y-1.5 text-xs text-stone-200">
                {calc.bringChecklist.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-stone-900/70 border border-stone-800/80"
                  >
                    <span className="font-semibold">{item}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      Claimable
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Primary CTA: Turn into Live WhatsApp Kitty Link */}
            <div className="mt-6 space-y-2.5">
              <Link
                href={createHref}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition"
              >
                <span>
                  ⚡ Turn This R{perPersonZar}/pp Braai Into a WhatsApp Link
                </span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </Link>

              <button
                type="button"
                onClick={handleCopyList}
                className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                {copiedList ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300">
                      Copied WhatsApp Shopping &amp; Ice List!
                    </span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-amber-400" />
                    <span>📋 Copy WhatsApp Shopping List Only</span>
                  </>
                )}
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCopySixty60List}
                  className="py-2.5 px-3 rounded-xl bg-teal-950/60 hover:bg-teal-900/60 border border-teal-500/40 text-teal-200 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  {copiedSixty60 ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-teal-300" />
                      <span className="text-teal-300">Copied Sixty60 List!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-3.5 h-3.5 text-teal-400" />
                      <span>🛒 Copy Sixty60 Grocery List</span>
                    </>
                  )}
                </button>

                <a
                  href="https://www.sixty60.co.za"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleCopySixty60List}
                  className="py-2.5 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  title="Copies list and opens Checkers Sixty60"
                >
                  <span>Open Sixty60 Web</span>
                  <ExternalLink className="w-3 h-3 text-stone-400" />
                </a>
              </div>
            </div>

            <p className="text-[11px] text-center text-stone-400 mt-3">
              Zero host fees • 100% of{" "}
              <strong className="text-stone-200">
                R{calc.totalPotZar.toLocaleString("en-ZA")}
              </strong>{" "}
              settles to your SA bank account
            </p>
          </div>
        </div>
      </section>

      {/* SEO FAQ / Mzansi Braai Portion Guide */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 mt-12">
        <div className="rounded-3xl bg-[#16120E] border border-stone-800/90 p-6 sm:p-8">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-extrabold uppercase tracking-wider mb-2">
            <Calculator className="w-4 h-4" />
            <span>South African Braai Rule of Thumb</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            How we calculate meat, ice, and briquettes for a South African braai
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5 text-xs text-stone-300 leading-relaxed">
            <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800">
              <h3 className="font-extrabold text-white text-sm mb-1">
                🥩 400g–500g Uncooked Meat per Adult
              </h3>
              <p>
                For a proper Saturday afternoon braai with sides, budget{" "}
                <strong>180g boerewors</strong>, <strong>220g lamb or pork chops</strong>, and{" "}
                <strong>1–2 chicken sosaties</strong> per adult. For a rugby test match or premium steak feast, bump prime cuts to 300g per person.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800">
              <h3 className="font-extrabold text-white text-sm mb-1">
                🧊 1x 4kg Bag of Ice per 3 Guests
              </h3>
              <p>
                Nothing kills a South African braai faster than warm drinks at 15:00. Budget half a bag per person for cooler boxes plus ice for glasses — and assign specific guests to claim{" "}
                <strong>4kg Ice Bags</strong> on your PullThru Bring-&apos;n-Bak checklist so one person isn&apos;t stuck buying 6 bags at the garage.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800">
              <h3 className="font-extrabold text-white text-sm mb-1">
                🔥 1x 4kg Bag of Briquettes / Sekelbos per 5–6 Guests
              </h3>
              <p>
                Keep an extra bag of Namibian hardwood or Chisa briquettes on standby so the coals stay ready when latecomers arrive or when you put roosterkoek and garlic bread on the grid last.
              </p>
            </div>
          </div>

          {/* Embed Calculator on Food/Lifestyle Blog or Butcher Website */}
          <div className="mt-6 pt-5 border-t border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
                🔗 Free Widget for SA Butchers, Food Blogs &amp; Estate Newsletters
              </span>
              <p className="text-xs text-stone-300 mt-0.5">
                Want to embed this South African Braai Meat &amp; Ice Calculator on your website or blog? Copy the responsive iframe snippet below.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (typeof navigator !== "undefined" && navigator.clipboard) {
                  navigator.clipboard.writeText(
                    `<iframe src="https://pullthru.co.za/braai-calculator" width="100%" height="760" style="border:1px solid #292524;border-radius:16px;" loading="lazy" title="SA Braai Meat, Ice & Kitty Calculator by PullThru"></iframe>\n<p style="font-size:12px;margin-top:6px;">Powered by <a href="https://pullthru.co.za/braai-calculator" target="_blank" rel="noopener">PullThru South Africa Braai Calculator & WhatsApp Kitty App</a></p>`
                  );
                  setCopiedEmbed(true);
                  setTimeout(() => setCopiedEmbed(false), 2600);
                }
              }}
              className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 px-4 py-2.5 text-xs font-bold text-amber-300 transition cursor-pointer"
            >
              {copiedEmbed ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Copied Embed Code!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Embed Code (&lt;iframe&gt;)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Tasteful AdSense / Weekend Braai Partner Slot */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-6">
        <TastefulAdSlot
          slotId="8842109401"
          variant="dark"
          context="braai"
        />
      </div>

      {/* Internal Link Hub */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 mt-6">
        <div className="rounded-3xl bg-[#16120E] border border-stone-800/90 p-5 sm:p-6">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-stone-400">
            Explore More South African Group Tools &amp; Guides
          </h2>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
            <Link
              href="/5-a-side-and-padel"
              className="rounded-full border border-stone-800 bg-stone-900/80 px-4 py-2 text-stone-200 hover:border-amber-500 transition"
            >
              ⚽ 5-a-Side &amp; Padel Court Calculator
            </Link>
            <Link
              href="/partiful-south-africa"
              className="rounded-full border border-stone-800 bg-stone-900/80 px-4 py-2 text-stone-200 hover:border-amber-500 transition"
            >
              🎉 Partiful &amp; Luma SA Alternative
            </Link>
            <Link
              href="/quicket-alternative"
              className="rounded-full border border-stone-800 bg-stone-900/80 px-4 py-2 text-stone-200 hover:border-amber-500 transition"
            >
              🎟️ Zero-Fee Quicket Alternative
            </Link>
            <Link
              href="/group-gift-pot"
              className="rounded-full border border-stone-800 bg-stone-900/80 px-4 py-2 text-stone-200 hover:border-amber-500 transition"
            >
              🎁 Baby Shower &amp; Teacher Gift Pot
            </Link>
            <Link
              href="/for-venues"
              className="rounded-full border border-stone-800 bg-stone-900/80 px-4 py-2 text-amber-300 hover:border-amber-500 transition"
            >
              🏟️ For Venues &amp; Group Bookings Desk
            </Link>
          </div>
        </div>
      </section>
      {/* Mobile Sticky Action Bar */}
      <div className="fixed sm:hidden bottom-0 left-0 right-0 z-40 border-t border-stone-800 bg-[#16120E]/95 backdrop-blur-md px-4 py-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center justify-between shadow-xl">
        <div>
          <span className="text-[10px] uppercase font-bold text-stone-400 block">{guests} Guests • {calc.totalMeatKg}kg Meat</span>
          <span className="text-sm font-black text-emerald-400">R{perPersonZar}/pp (R{calc.totalPotZar.toLocaleString("en-ZA")})</span>
        </div>
        <Link
          href={createHref}
          className="rounded-full bg-amber-500 px-4 py-2 text-xs font-black text-stone-950 hover:bg-amber-400 transition shadow-sm"
        >
          ⚡ Start Kitty →
        </Link>
      </div>
    </main>
  );
}
