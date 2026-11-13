"use client";

import React, { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { triggerHaptic } from "@/lib/haptics";
import { reportFunnelStep } from "@/lib/telemetry";
import { EventMode, EventTier, BringItem, ProFeeSplitMode } from "@/types/database";
import {
  calculateCheckoutSplit,
  calculateFlakeCushionPricing,
  formatZar,
} from "@/lib/fees";
import {
  SA_BANKS,
  validateEventCompliance,
  validateVelocityCaps,
  determineSettlementSchedule,
  validateSaBankAccount,
} from "@/lib/compliance";
import {
  Zap,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Calendar,
  MapPin,
  Lock,
  Plus,
  Trash2,
  Building2,
  CheckCircle2,
  EyeOff,
  Clock,
  HelpCircle,
  ArrowRight,
  Users,
  Wallet,
  PackagePlus,
  AlertTriangle,
  MessageSquare,
  RotateCcw,
  Copy,
  Check,
  X,
  Banknote,
} from "lucide-react";

const LOCAL_GREETINGS = [
  { label: "Sanibonani", text: "Sanibonani crew! " },
  { label: "Molweni", text: "Molweni mawethu! " },
  { label: "Dumela", text: "Dumela bagaetsho! " },
  { label: "Goeiedag", text: "Goeiedag almal! " },
  { label: "Howzit", text: "Howzit everyone! " },
];

interface VibePreset {
  id: string;
  vibe: string;
  shortLabel: string;
  mode: EventMode;
  title: string;
  description: string;
  priceZar: number;
  maxSpots: number | null;
  targetPotZar: number | null;
  whenLabel: string;
  locationName: string;
  secretPin: string;
  tiers: EventTier[];
  bringItems: string[];
  customQuestion: string;
  hideAmountsOnWall: boolean;
  allowPaydayPromise: boolean;
  allowCashOnArrival?: boolean;
}

const HOST_PROFILE_STORAGE_KEY = "pullthru_host_profile_v1";

function formatSaBankAccount(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  if (digits.length <= 10)
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
}

const DEFAULT_HOST_PROFILE = {
  hostName: "",
  hostPhone: "",
  selectedBankCode: "",
  accountNumber: "",
};

const DEMO_PREFILL_NAMES = new Set([
  "tariq davids",
  "tariq",
  "host",
  "organiser",
  "event organiser",
  "pullthru host",
]);
const DEMO_PREFILL_PHONES = new Set([
  "0825550194",
  "27825550194",
  "0820000000",
  "27820000000",
  "0821234567",
  "27821234567",
]);
const DEMO_PREFILL_ACCOUNTS = new Set(["1648291045", "0000000000", "1234567890"]);

const VIBE_PRESETS: VibePreset[] = [
  {
    id: "fives",
    vibe: "⚽ 5-a-Side Soccer",
    shortLabel: "⚽ 5-a-Side",
    mode: "fixed",
    title: "Thursday Night 5-a-Side (Court 3)",
    description:
      "R100 per player locks your spot. First 10 paid play — no 'I'll EFT you next week' excuses!",
    priceZar: 100,
    maxSpots: 10,
    targetPotZar: null,
    whenLabel: "This Thursday 19:00",
    locationName: "Fives Futbol Century City / Sandton",
    secretPin: "Court 3 — Ask reception for the PullThru booking",
    tiers: [],
    bringItems: ["⚽ Match Ball", "🦺 Bibs", "🧊 Energades"],
    customQuestion: "",
    hideAmountsOnWall: false,
    allowPaydayPromise: false,
  },
  {
    id: "padel",
    vibe: "🎾 Padel Court",
    shortLabel: "🎾 Padel Court",
    mode: "fixed",
    title: "Saturday Morning Padel Court Split",
    description:
      "90-minute Playtomic court booked! R150 per player locks your spot on the glass court.",
    priceZar: 150,
    maxSpots: 4,
    targetPotZar: null,
    whenLabel: "This Saturday 09:00",
    locationName: "Virgin Active Padel / Africa Padel",
    secretPin: "Court 2 — Balls & racquets at reception under host name",
    tiers: [],
    bringItems: ["🎾 Fresh Can of Balls", "🧊 Rehydrate"],
    customQuestion: "",
    hideAmountsOnWall: false,
    allowPaydayPromise: false,
  },
  {
    id: "office-lunch",
    vibe: "🥪 Friday Office Food Run",
    shortLabel: "🥪 Office Food Run",
    mode: "tiered",
    title: "Friday Office Nandos & Burger Run",
    description:
      "Lock in your lunch order before 11:30 AM! Settle your exact meal via PayShap or Card in 10 seconds — zero hunting colleagues down for R95.",
    priceZar: 110,
    maxSpots: 25,
    targetPotZar: null,
    whenLabel: "This Friday 12:30",
    locationName: "Office Kitchen / Boardroom",
    secretPin: "Delivery arriving 12:45 — pick up in main canteen",
    tiers: [
      { id: "t-nandos-half", label: "1/4 Chicken + Chips & Roll", price_zar: 95 },
      { id: "t-burger-combo", label: "Prego Burger Combo + Chips", price_zar: 115 },
      { id: "t-wrap-healthy", label: "Halloumi Wrap / Green Salad", price_zar: 105 },
    ],
    bringItems: ["🥤 2L Cold Drink", "🍪 Office Dessert Pack"],
    customQuestion: "Spice level (Mild / Hot / Lemon & Herb) or drink preference:",
    hideAmountsOnWall: false,
    allowPaydayPromise: false,
  },
  {
    id: "golf-4ball",
    vibe: "🏌️‍♂️ Saturday Golf 4-Ball",
    shortLabel: "🏌️‍♂️ Weekend 4-Ball",
    mode: "fixed",
    title: "Saturday Morning Golf 4-Ball Split",
    description:
      "Tee-off locked for 07:30 AM! R450 per golfer covers green fees and shared cart. First 4 paid take the fairways — no morning no-shows!",
    priceZar: 450,
    maxSpots: 4,
    targetPotZar: null,
    whenLabel: "This Saturday 07:30",
    locationName: "Royal Johannesburg / Randpark / Durbanville Golf Club",
    secretPin: "Pro Shop: Booking confirmed under host's name — pick up cart 14 & 15",
    tiers: [],
    bringItems: ["🏌️ 1x Sleeve Pro V1 Balls", "🧊 Cooler Box & Rehydrate"],
    customQuestion: "GolfRSA handicap index & cart buddy preference:",
    hideAmountsOnWall: false,
    allowPaydayPromise: false,
  },
  {
    id: "braai",
    vibe: "🥩 Spitbraai / Potjie",
    shortLabel: "🥩 Spitbraai / Potjie",
    mode: "tiered",
    title: "Saturday Champions Cup Spitbraai & Kuier",
    description:
      "Lamb spit, roosterkoek & garlic bread sorted. Pick your tier below and claim an item to bring!",
    priceZar: 220,
    maxSpots: 20,
    targetPotZar: null,
    whenLabel: "This Saturday 14:00",
    locationName: "Sipho's Lapa, Bryanston",
    secretPin: "Gate Code #4829 — Park on the grass verge",
    tiers: [
      { id: "t-full", label: "Full Braai + Dop", price_zar: 220 },
      { id: "t-meat", label: "Meat Only", price_zar: 140 },
      { id: "t-sides", label: "Sides Only", price_zar: 60 },
      { id: "t-kids", label: "Kids Under 12", price_zar: 0 },
    ],
    bringItems: ["🧊 6x Bags of Ice", "🔥 3x Sekelbos Wood", "🥗 Potato Salad"],
    customQuestion: "Any halaal/dietary notes or drink preferences?",
    hideAmountsOnWall: false,
    allowPaydayPromise: true,
  },
  {
    id: "pot",
    vibe: "🎁 Gift / Umgalelo Pot",
    shortLabel: "🎁 Gift / Umgalelo Pot",
    mode: "pot",
    title: "Thandi's Baby Shower & Pram Gift Pot",
    description:
      "Let's bless Thandi & Baby Khumalo! Contribute whatever you're comfortable with — individual Rand amounts are hidden on the public wall.",
    priceZar: 150,
    maxSpots: null,
    targetPotZar: 3000,
    whenLabel: "This Sunday 12:00",
    locationName: "Botanical Gardens Tea Room",
    secretPin: "Table reserved under 'Zinhle'",
    tiers: [],
    bringItems: ["🎂 Cupcake Platter", "🎈 Helium Balloons"],
    customQuestion: "Write a short blessing note for the card:",
    hideAmountsOnWall: true,
    allowPaydayPromise: true,
  },
  {
    id: "lunch",
    vibe: "🍔 Friday Team Lunch",
    shortLabel: "🍔 Friday Team Lunch",
    mode: "tiered",
    title: "Friday Squad Burger & Wrap Run",
    description:
      "No more splitting a single R2,400 restaurant bill on one person's card. Pick your meal & pay your exact share in 10 seconds.",
    priceZar: 125,
    maxSpots: 16,
    targetPotZar: null,
    whenLabel: "This Friday 12:30",
    locationName: "Rocomamas / Office Boardroom",
    secretPin: "",
    tiers: [
      { id: "t-burger", label: "Beef Burger + Chips", price_zar: 125 },
      { id: "t-wrap", label: "Chicken Wrap", price_zar: 105 },
      { id: "t-vegan", label: "Vegan Bowl", price_zar: 110 },
    ],
    bringItems: ["🥤 2L Coke Zero Pack"],
    customQuestion: "Any allergies or sauce preferences?",
    hideAmountsOnWall: false,
    allowPaydayPromise: false,
  },
  {
    id: "run",
    vibe: "🏃 Run Club (Free)",
    shortLabel: "🏃 Run Club (Free)",
    mode: "free",
    title: "Sunday Sunrise 5km Pipe Track & Coffee",
    description:
      "Free community social pace! Lock your RSVP so we know headcount before we set off at 06:30 sharp.",
    priceZar: 0,
    maxSpots: 30,
    targetPotZar: null,
    whenLabel: "This Sunday 06:30",
    locationName: "Kloof Nek Parking Lot, Cape Town",
    secretPin: "Look for the green PullThru flag by the coffee van",
    tiers: [],
    bringItems: ["📸 Film Camera", "🍊 Bag of Naartjies"],
    customQuestion: "",
    hideAmountsOnWall: false,
    allowPaydayPromise: false,
  },
  {
    id: "golf",
    vibe: "🏌️‍♂️ Golf Day Challenge",
    shortLabel: "🏌️‍♂️ Golf Challenge",
    mode: "tiered",
    title: "Annual Alumni & Friends 18-Hole Golf Day",
    description:
      "18-hole championship course, golf carts, halfway house lunch, and dinner prize-giving. Tax invoices provided on request.",
    priceZar: 1800,
    maxSpots: 36,
    targetPotZar: null,
    whenLabel: "Next Friday 11:30",
    locationName: "Steyn City / Wanderers Golf Club",
    secretPin: "Pro Shop: Quote booking 'PullThru Golf Day' for cart keys",
    tiers: [
      { id: "t-4ball", label: "Full 4-Ball (4 Players)", price_zar: 6400 },
      { id: "t-single", label: "Individual Player (Cart + Lunch)", price_zar: 1800 },
      { id: "t-dinner", label: "Dinner & Prize Giving Only", price_zar: 450 },
    ],
    bringItems: ["🏌️ 4x Longest Drive Sponsor Prizes", "🍺 19th Hole Drinks Sponsor"],
    customQuestion: "Official GolfRSA handicap & home club:",
    hideAmountsOnWall: false,
    allowPaydayPromise: false,
  },
  {
    id: "trip",
    vibe: "🏔️ Weekend Away / Tour",
    shortLabel: "🏔️ Weekend Away",
    mode: "fixed",
    title: "Clarens Mountain Lodge Weekend Away",
    description:
      "R3,200/head covers 2 nights private chalet stay, shared spitbraai meat packs, craft gin tasting & wood. Lock in early to secure your room!",
    priceZar: 3200,
    maxSpots: 14,
    targetPotZar: null,
    whenLabel: "Fri 20 Nov - Sun 22 Nov",
    locationName: "Clarens Mountain Lodge, Free State",
    secretPin: "Keybox Code 9042 at Main Reception Lodge",
    tiers: [],
    bringItems: [
      "🥩 Wagyu / Ribeye Braai Pack",
      "🪵 4x Bags Sekelbos",
      "🍷 Red Wine Case",
      "🍳 Sunday Breakfast Chef Team",
    ],
    customQuestion: "Dietary restrictions or room-sharing partner preference:",
    hideAmountsOnWall: false,
    allowPaydayPromise: false,
  },
  {
    id: "corporate",
    vibe: "🏢 Corporate Team Social",
    shortLabel: "🏢 Corporate Social",
    mode: "tiered",
    title: "Year-End Padel Social & Gourmet Spitbraai",
    description:
      "R650 per employee covers 3-hour padel court booking, racquet hire, coach demo, and full lamb spitbraai buffet. Corporate invoice available for company finance.",
    priceZar: 650,
    maxSpots: 48,
    targetPotZar: null,
    whenLabel: "Friday 5 Dec • 14:00",
    locationName: "Virgin Active Padel Club, Sandton",
    secretPin: "Sandton Gate Parking Code #7721",
    tiers: [
      { id: "t-padel-braai", label: "Padel Tournament + Braai Buffet", price_zar: 650 },
      { id: "t-braai-only", label: "Spitbraai & Social Spectator Only", price_zar: 380 },
    ],
    bringItems: ["🏆 Floating Trophy & Medals", "🧊 10x Ice Bags"],
    customQuestion: "Padel skill level (Beginner / Intermediate / Pro):",
    hideAmountsOnWall: false,
    allowPaydayPromise: false,
  },
];

const QUICK_WHEN_CHIPS = [
  "This Thursday 19:00",
  "This Friday 12:30",
  "This Saturday 14:00",
  "This Sunday 12:00",
  "Payday Friday (25th)",
];

const QUICK_SPOTS_OPTIONS: (number | null)[] = [6, 8, 10, 12, 16, 20, 30, null];

const SUGGESTED_BRING_CHIPS = [
  "🧊 4x Bags of Ice",
  "🔥 3x Sekelbos Wood",
  "🥗 Potato Salad",
  "🔊 Bluetooth Speaker",
  "⚽ Match Ball",
  "🦺 Bibs",
];

const INPUT_CLASS =
  "w-full bg-[#FAF8F5] border border-[#E6E2D8] text-[#0F172A] rounded-xl px-3.5 py-2.5 text-base sm:text-sm placeholder-[#475569]/60 transition-colors focus:border-[#007749] focus:bg-white focus:outline-none";

function CreateEventForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active preset & progressive stepper state (Starts clean & blank unless user taps a preset or ?preset= query param)
  const [selectedPresetId, setSelectedPresetId] = useState<string>("custom");
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState<boolean>(false);
  const activeStepRef = React.useRef<1 | 2 | 3>(1);
  const [clonedFromSlug, setClonedFromSlug] = useState<string | null>(null);
  const [prefilledVenueName, setPrefilledVenueName] = useState<string | null>(null);

  const goToStep = useCallback((nextStep: 1 | 2 | 3, pushHistory = true) => {
    const prevStep = activeStepRef.current;
    activeStepRef.current = nextStep;
    setActiveStep(nextStep);
    void reportFunnelStep(`create_step_${nextStep}_view`);
    if (
      pushHistory &&
      typeof window !== "undefined" &&
      nextStep !== prevStep
    ) {
      try {
        window.history.pushState({ pullthruCreateStep: nextStep }, "");
      } catch {
        // ignore history API errors
      }
    }
  }, []);

  // Browser & Android Hardware Back-Button Stepper Guard (Step 3 -> Step 2 -> Step 1)
  useEffect(() => {
    if (typeof window === "undefined") return;
    void reportFunnelStep("create_step_1_view");
    try {
      window.history.replaceState({ pullthruCreateStep: 1 }, "");
    } catch {
      // ignore
    }

    const handlePopState = (e: PopStateEvent) => {
      const targetStep = e.state?.pullthruCreateStep;
      if (targetStep === 1 || targetStep === 2 || targetStep === 3) {
        activeStepRef.current = targetStep;
        setActiveStep(targetStep);
        triggerHaptic("light");
        return;
      }
      if (activeStepRef.current > 1) {
        const prev = (activeStepRef.current - 1) as 1 | 2;
        activeStepRef.current = prev;
        setActiveStep(prev);
        triggerHaptic("light");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Direct Venue Escrow Split States (CEO feature)
  const [enableVenueSplit, setEnableVenueSplit] = useState<boolean>(false);
  const [venueName, setVenueName] = useState<string>("");
  const [venueBankCode, setVenueBankCode] = useState<string>(SA_BANKS[0].code);
  const [venueAccountNumber, setVenueAccountNumber] = useState<string>("");
  const [venueDepositZar, setVenueDepositZar] = useState<number>(0);

  // Core Event State (Clean blank form by default — no pre-filled demo text unless user picks a preset)
  const [mode, setMode] = useState<EventMode>("fixed");
  const [categoryVibe, setCategoryVibe] = useState<string>("✨ Group Event / Kitty");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [eventDate, setEventDate] = useState<string>("");
  const [locationName, setLocationName] = useState<string>("");
  const [secretPin, setSecretPin] = useState<string>("");

  // Contextual smart placeholders (no cheap-looking canned text forced into the user's inputs!)
  const [activeTitlePlaceholder, setActiveTitlePlaceholder] = useState<string>(
    "e.g. Saturday Braai, Thursday 5-a-Side, Camps Bay Picnic"
  );
  const [activeLocationPlaceholder, setActiveLocationPlaceholder] = useState<string>(
    "e.g. Fives Futbol Sandton, Camps Bay, My Place"
  );
  const [activeWhenPlaceholder, setActiveWhenPlaceholder] = useState<string>(
    "e.g. This Saturday 16:00, Thursday 19:00"
  );
  const [activePinPlaceholder, setActivePinPlaceholder] = useState<string>(
    "Optional gate code #4829, pitch 3, or parking instructions"
  );
  const [activeDescPlaceholder, setActiveDescPlaceholder] = useState<string>(
    "Optional notes (e.g. Bring your own meat and drinks)"
  );

  // Mode-specific pricing & spots (default 6 spots = Free Tier, generic Multi-Tier options)
  const [priceZar, setPriceZar] = useState<number>(100);
  const [maxSpots, setMaxSpots] = useState<number | null>(6);
  const [flakeCushionActive, setFlakeCushionActive] = useState<boolean>(false);
  const [baseUncushionedSpotZar, setBaseUncushionedSpotZar] = useState<number>(100);
  const [targetPotZar, setTargetPotZar] = useState<number>(3000);
  const [tiers, setTiers] = useState<EventTier[]>([
    { id: "t-standard", label: "Standard Spot", price_zar: 150 },
    { id: "t-early", label: "Early Bird / Option 2", price_zar: 100 },
    { id: "t-free", label: "Kids / Spectator (Free)", price_zar: 0 },
  ]);
  const [showSecretPinField, setShowSecretPinField] = useState<boolean>(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState<boolean>(false);
  const [whatsappCommandInput, setWhatsappCommandInput] = useState<string>("");
  const [whatsappCommandFeedback, setWhatsappCommandFeedback] = useState<string | null>(null);

  // User Custom Presets (LocalStorage persisted)
  const [customPresets, setCustomPresets] = useState<VibePreset[]>([]);
  const [showAddCustomModal, setShowAddCustomModal] = useState<boolean>(false);
  const [customVibeEmoji, setCustomVibeEmoji] = useState<string>("🎉");
  const [customVibeName, setCustomVibeName] = useState<string>("");
  const [customVibeMode, setCustomVibeMode] = useState<EventMode>("fixed");
  const [customVibePrice, setCustomVibePrice] = useState<number>(150);
  const [customVibeMaxSpots, setCustomVibeMaxSpots] = useState<number>(12);
  const [customVibeBringItems, setCustomVibeBringItems] = useState<string>("");
  const [customVibeWhen, setCustomVibeWhen] = useState<string>("");
  const [customVibeLocation, setCustomVibeLocation] = useState<string>("");

  // Load user custom presets from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("pullthru_user_custom_vibes");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCustomPresets(parsed);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const handleCloseCustomModal = useCallback(() => {
    setShowAddCustomModal(false);
    setCustomVibeName("");
    setCustomVibeBringItems("");
    setCustomVibeWhen("");
    setCustomVibeLocation("");
    setCustomVibeEmoji("🎉");
    setCustomVibeMode("fixed");
    setCustomVibePrice(150);
    setCustomVibeMaxSpots(12);
  }, []);

  useEffect(() => {
    if (!showAddCustomModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseCustomModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showAddCustomModal, handleCloseCustomModal]);

  const handleSaveCustomPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customVibeName.trim()) return;

    const trimmed = customVibeName.trim();
    const shortLabel = `${customVibeEmoji} ${trimmed}`;
    const newId = `user-vibe-${Date.now()}`;

    const parsedBring = customVibeBringItems
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const newPreset: VibePreset = {
      id: newId,
      vibe: shortLabel,
      shortLabel: shortLabel,
      mode: customVibeMode,
      title: trimmed,
      description: `Join us for ${trimmed}! Lock in your spot via PullThru so we can finalize numbers and secure the booking.`,
      priceZar: customVibeMode === "free" ? 0 : Math.max(50, customVibePrice),
      maxSpots: customVibeMaxSpots > 0 ? customVibeMaxSpots : null,
      targetPotZar: customVibeMode === "pot" ? 3000 : null,
      whenLabel: customVibeWhen.trim() || "This Weekend",
      locationName: customVibeLocation.trim() || "Johannesburg / Cape Town",
      secretPin: "",
      tiers:
        customVibeMode === "tiered"
          ? [
              { id: `t-${Date.now()}-1`, label: "Standard Spot", price_zar: customVibePrice || 150 },
              {
                id: `t-${Date.now()}-2`,
                label: "VIP / Premium",
                price_zar: Math.round((customVibePrice || 150) * 1.5),
              },
              { id: `t-${Date.now()}-3`, label: "Spectator (Free)", price_zar: 0 },
            ]
          : [],
      bringItems:
        parsedBring.length > 0 ? parsedBring : ["🧊 Ice", "🥤 Cold Drinks / Cups", "🍿 Snacks"],
      customQuestion: "",
      hideAmountsOnWall: customVibeMode === "pot",
      allowPaydayPromise: true,
    };

    const updated = [...customPresets, newPreset];
    setCustomPresets(updated);
    try {
      localStorage.setItem("pullthru_user_custom_vibes", JSON.stringify(updated));
    } catch {
      // Ignore
    }

    applyPreset(newPreset);
    triggerHaptic("success");
    setShowAddCustomModal(false);
    setCustomVibeName("");
  };

  const handleDeleteCustomPreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic("warning");
    const updated = customPresets.filter((p) => p.id !== id);
    setCustomPresets(updated);
    try {
      localStorage.setItem("pullthru_user_custom_vibes", JSON.stringify(updated));
    } catch {
      // Ignore
    }
    if (selectedPresetId === id) {
      applyPreset(VIBE_PRESETS[0]);
    }
  };

  const handleRunWhatsappCommand = () => {
    if (!whatsappCommandInput.trim()) return;
    const clean = whatsappCommandInput.trim();
    const match = clean.match(
      /^\/?pullthru\s+([a-zA-Z0-9_\-]+)\s+R?(\d+)(?:\s+(\d+)\s*(?:spots|people|pax|heads)?)?/i
    );
    if (!match) {
      setWhatsappCommandFeedback(
        "Invalid format. Try: /pullthru 5aside R100 10spots (or braai, padel, golf, trip)"
      );
      return;
    }
    const [, rawVibe, rawPrice, rawSpots] = match;
    const price = Math.max(15, parseInt(rawPrice, 10));
    const spots = rawSpots ? Math.max(1, parseInt(rawSpots, 10)) : 10;
    const vibeKey = rawVibe.toLowerCase();
    const allPresets = [...VIBE_PRESETS, ...customPresets];
    const preset = allPresets.find(
      (p) => p.id === vibeKey || p.shortLabel.toLowerCase().includes(vibeKey)
    );
    if (preset) {
      applyPreset(preset);
      setPriceZar(price);
      setMaxSpots(spots);
    } else {
      const customLabel = `✨ ${rawVibe.charAt(0).toUpperCase() + rawVibe.slice(1)}`;
      setCategoryVibe(customLabel);
      setTitle(`${rawVibe.toUpperCase()} Match / Session`);
      setPriceZar(price);
      setMaxSpots(spots);
      setMode("fixed");
    }
    setWhatsappCommandFeedback(
      `⚡ Pre-filled in 1s from WhatsApp command: R${price}/spot • ${spots} spots!`
    );
  };

  // 1-Tap Preset, Calculator Overrides, or Clone Hydration from URL query param (?preset=braai&price=140&spots=12&title=...&bring=...)
  useEffect(() => {
    const presetParam = searchParams?.get("preset");
    if (presetParam) {
      const matched = VIBE_PRESETS.find(
        (p) => p.id.toLowerCase() === presetParam.toLowerCase()
      );
      if (matched) {
        applyPreset(matched);
      }
    }

    const rawSpots =
      searchParams?.get("spots") ||
      searchParams?.get("people") ||
      searchParams?.get("guests") ||
      searchParams?.get("pax") ||
      searchParams?.get("cap");
    const parsedSpots =
      rawSpots && !Number.isNaN(Number(rawSpots))
        ? Math.max(2, Math.round(Number(rawSpots)))
        : 6;
    if (rawSpots && !Number.isNaN(Number(rawSpots))) {
      setMaxSpots(parsedSpots);
    }

    const billParam =
      searchParams?.get("bill") || searchParams?.get("total");
    const tipParam = searchParams?.get("tip");
    const priceParam = searchParams?.get("price");
    const tiersParam = searchParams?.get("tiers");

    if (priceParam && !Number.isNaN(Number(priceParam))) {
      const parsedPrice = Math.max(0, Number(priceParam));
      setPriceZar(parsedPrice);
      setBaseUncushionedSpotZar(parsedPrice);
      if (parsedPrice > 0) setMode("fixed");
    }

    if (billParam && !Number.isNaN(Number(billParam))) {
      const billVal = Math.max(0, Number(billParam));
      const tipVal =
        tipParam && !Number.isNaN(Number(tipParam))
          ? Math.max(0, Number(tipParam))
          : 0;
      const computedPerPerson = Math.max(
        10,
        Math.ceil((billVal * (1 + tipVal / 100)) / parsedSpots / 5) * 5
      );
      if (!priceParam || Number.isNaN(Number(priceParam))) {
        setPriceZar(computedPerPerson);
        setBaseUncushionedSpotZar(computedPerPerson);
        setMode("fixed");
      }
      setCategoryVibe("🍽️ Dinner / Bill Split");
      setDescription(
        `Bill split for R${billVal.toLocaleString()}${
          tipVal > 0 ? ` + ${tipVal}% service tip` : ""
        } across ${parsedSpots} people (R${computedPerPerson}/person). Settle directly via PayShap or Capitec PayMe with R0 guest fees.`
      );
    }

    if (tiersParam && tiersParam.trim().length > 0) {
      const parsedTiers = tiersParam
        .split("|")
        .map((chunk, idx) => {
          const [rawLabel, rawVal] = chunk.split(":");
          const label = (rawLabel || `Option ${idx + 1}`).trim();
          const price_zar = Math.max(0, Number(rawVal) || 100);
          return {
            id: `t-url-${idx + 1}`,
            label,
            price_zar,
          };
        })
        .filter((t) => t.label.length > 0);
      if (parsedTiers.length > 0) {
        setTiers(parsedTiers);
        setMode("tiered");
      }
    }

    const targetParam =
      searchParams?.get("target") || searchParams?.get("amount");
    if (targetParam && !Number.isNaN(Number(targetParam))) {
      setTargetPotZar(Math.max(100, Number(targetParam)));
    }

    const whenParam = searchParams?.get("when") || searchParams?.get("date");
    if (whenParam && whenParam.trim().length > 0) {
      setEventDate(whenParam.trim());
    }

    const titleParam = searchParams?.get("title");
    if (titleParam && titleParam.trim().length > 0) {
      setTitle(titleParam.trim());
    }

    const venueParam = searchParams?.get("venue");
    if (venueParam && venueParam.trim().length > 0) {
      const cleanVenue = venueParam.trim();
      setPrefilledVenueName(cleanVenue);
      setLocationName(cleanVenue);
      if (!titleParam || !titleParam.trim()) {
        setTitle(`Group Booking @ ${cleanVenue}`);
      }
    }

    const modeParam = searchParams?.get("mode");
    if (
      modeParam === "fixed" ||
      modeParam === "tiered" ||
      modeParam === "pot" ||
      modeParam === "free"
    ) {
      setMode(modeParam);
      if (modeParam === "pot") {
        setHideAmountsOnWall(true);
      }
    }

    const bringParam = searchParams?.get("bring");
    if (bringParam && bringParam.trim().length > 0) {
      const items = bringParam
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean);
      if (items.length > 0) {
        setBringItems(
          items.map((label, idx) => ({
            id: `calc-bi-${idx + 1}`,
            label,
            claimed_by_name: null,
            claimed_rsvp_id: null,
          }))
        );
      }
    }

    const cloneSlug = searchParams?.get("clone");
    if (!cloneSlug) return;
    setClonedFromSlug(cloneSlug);

    fetch(`/api/events?slug=${encodeURIComponent(cloneSlug)}`)
      .then((res) => res.json())
      .then((data) => {
        const ev = data?.event || data;
        if (ev?.title) {
          setTitle(`Next: ${ev.title}`);
          if (ev.category_vibe) setCategoryVibe(ev.category_vibe);
          if (ev.mode) setMode(ev.mode);
          if (ev.description) setDescription(ev.description);
          if (typeof ev.price_zar === "number") {
            const unbakedPrice =
              ev.bake_pro_boost_into_price && ev.price_zar >= 52
                ? ev.price_zar - 2
                : ev.price_zar;
            setPriceZar(unbakedPrice);
          }
          if (ev.max_spots !== undefined) setMaxSpots(ev.max_spots);
          if (ev.location_name) setLocationName(ev.location_name);
          if (ev.capitec_payme_url) setCapitecPayMeUrl(ev.capitec_payme_url);
          if (ev.pro_fee_split_mode) {
            setProFeeSplitMode(ev.pro_fee_split_mode);
          } else if (typeof ev.bake_pro_boost_into_price === "boolean") {
            setProFeeSplitMode(ev.bake_pro_boost_into_price ? "squad_100" : "host_100");
          }
          if (Array.isArray(ev.bring_items) && ev.bring_items.length > 0) {
            setBringItems(
              ev.bring_items.map((b: { id?: string; label: string }) => ({
                id:
                  b.id ||
                  `bring-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                label: b.label,
                claimed_by_name: null,
                claimed_rsvp_id: null,
              }))
            );
          }
          if (Array.isArray(ev.tiers) && ev.tiers.length > 0) {
            setTiers(
              ev.tiers.map((t: EventTier) => ({
                ...t,
                price_zar:
                  ev.bake_pro_boost_into_price && t.price_zar >= 52
                    ? t.price_zar - 2
                    : t.price_zar,
              }))
            );
          }
          if (ev.custom_question) setCustomQuestion(ev.custom_question);
          if (ev.allow_cash_on_arrival !== undefined) {
            setAllowCashOnArrival(Boolean(ev.allow_cash_on_arrival));
          }
        }
      })
      .catch(() => {});
  }, [searchParams]);

  // Bring-'n-Bak items (Start empty at 0 items active so items are only added when the host clicks them!)
  const [bringItems, setBringItems] = useState<BringItem[]>([]);
  const [customBringInput, setCustomBringInput] = useState<string>("");

  const availableBringSuggestions = useMemo(() => {
    const allPresets = [...VIBE_PRESETS, ...customPresets];
    const activePreset = allPresets.find((p) => p.id === selectedPresetId);
    const merged = [
      ...(activePreset?.bringItems || []),
      ...SUGGESTED_BRING_CHIPS,
    ];
    return Array.from(new Set(merged));
  }, [selectedPresetId, customPresets]);

  // Optional custom checkout question & toggles
  const [customQuestion, setCustomQuestion] = useState<string>("");
  const [hideAmountsOnWall, setHideAmountsOnWall] = useState<boolean>(false);
  const [allowPaydayPromise, setAllowPaydayPromise] = useState<boolean>(false);
  const [allowCashOnArrival, setAllowCashOnArrival] = useState<boolean>(true);

  // Host Details & Direct Bank / PayShap Account
  const [hostName, setHostName] = useState<string>(DEFAULT_HOST_PROFILE.hostName);
  const [hostPhone, setHostPhone] = useState<string>(DEFAULT_HOST_PROFILE.hostPhone);
  const [selectedBankCode, setSelectedBankCode] = useState<string>(
    DEFAULT_HOST_PROFILE.selectedBankCode
  );
  const [accountNumber, setAccountNumber] = useState<string>(
    DEFAULT_HOST_PROFILE.accountNumber
  );
  const [capitecPayMeUrl, setCapitecPayMeUrl] = useState<string>("");
  const [proFeeSplitMode, setProFeeSplitMode] = useState<ProFeeSplitMode>("squad_100");
  // 1 to 100+ spots are 100% R0 Free — zero R29 paywall or +R4/spot tax on 5-a-side & braais
  const isProBoostRequired = false;
  const bakeProBoostIntoPrice = false;

  const expectedTurnoutSpots = useMemo(() => {
    const rawCap = maxSpots && maxSpots > 0 ? maxSpots : 15;
    if (rawCap <= 7) return 7;
    // 80% real-world turnout cushion (e.g. if host sets 10 spots and only 8 fill, R29 is still 100% covered!)
    return Math.max(7, Math.floor(rawCap * 0.8));
  }, [maxSpots]);

  const spotProMarkupZar = useMemo(() => {
    if (!isProBoostRequired) return 0;
    if (proFeeSplitMode === "squad_100") {
      return Math.max(1, Math.ceil(29 / expectedTurnoutSpots));
    }
    if (proFeeSplitMode === "split_50_50") {
      return Math.max(1, Math.ceil(14.5 / expectedTurnoutSpots));
    }
    return 0; // host_100
  }, [isProBoostRequired, proFeeSplitMode, expectedTurnoutSpots]);

  const [mandateAccepted, setMandateAccepted] = useState<boolean>(true);
  const [profileHydrated, setProfileHydrated] = useState<boolean>(false);

  // Submission status
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copiedPreviewWa, setCopiedPreviewWa] = useState<boolean>(false);
  const [showMoreBanks, setShowMoreBanks] = useState<boolean>(false);

  const isFormDirty = useMemo(() => {
    if (selectedPresetId === "custom") {
      return (
        Boolean(title.trim()) ||
        Boolean(description.trim()) ||
        bringItems.length > 0 ||
        Boolean(customQuestion.trim()) ||
        activeStep > 1
      );
    }
    const activePreset = VIBE_PRESETS.find((p) => p.id === selectedPresetId);
    if (!activePreset) return Boolean(title.trim()) || activeStep > 1;
    return (
      title.trim() !== activePreset.title.trim() ||
      description.trim() !== activePreset.description.trim() ||
      bringItems.length > 0 ||
      Boolean(customQuestion.trim()) ||
      activeStep > 1
    );
  }, [selectedPresetId, title, description, bringItems.length, customQuestion, activeStep]);

  useEffect(() => {
    if (!isFormDirty || isSubmitting) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isFormDirty, isSubmitting]);

  const handleRequestExit = useCallback(() => {
    if (activeStepRef.current > 1) {
      goToStep((activeStepRef.current - 1) as 1 | 2, false);
      return;
    }
    if (isFormDirty) {
      setShowExitConfirmModal(true);
      return;
    }
    router.push("/");
  }, [goToStep, isFormDirty, router]);

  const previewFixedSpotZar =
    mode === "fixed" ? Number(priceZar) + spotProMarkupZar : Number(priceZar);

  // Flake Cushion (80% Safe Turnout Split) Preview for Fixed Mode
  const flakeCushionPreview = useMemo(() => {
    const spots = maxSpots && maxSpots >= 4 ? maxSpots : 10;
    const referenceBaseZar = flakeCushionActive
      ? Math.max(15, baseUncushionedSpotZar)
      : Math.max(15, Number(priceZar) || 100);
    const totalTargetZar = referenceBaseZar * spots;
    return calculateFlakeCushionPricing({
      totalTargetZar,
      maxSpots: spots,
      safeTurnoutRatio: 0.8,
    });
  }, [maxSpots, flakeCushionActive, baseUncushionedSpotZar, priceZar]);

  const handleToggleFlakeCushion = (enable: boolean) => {
    triggerHaptic("light");
    if (enable && !flakeCushionActive) {
      const currentBase = Math.max(15, Number(priceZar) || 100);
      setBaseUncushionedSpotZar(currentBase);
      const spots = maxSpots && maxSpots >= 4 ? maxSpots : 10;
      const calc = calculateFlakeCushionPricing({
        totalTargetZar: currentBase * spots,
        maxSpots: spots,
        safeTurnoutRatio: 0.8,
      });
      setPriceZar(calc.cushionedSpotZar);
      setFlakeCushionActive(true);
    } else if (!enable && flakeCushionActive) {
      setPriceZar(Math.max(15, baseUncushionedSpotZar));
      setFlakeCushionActive(false);
    }
  };

  const handleCopyPreviewWa = () => {
    const firstPaidTierZar = tiers.find((t) => t.price_zar >= 15)?.price_zar || tiers[0]?.price_zar || 0;
    const previewTierZar =
      mode === "tiered" && firstPaidTierZar > 0
        ? firstPaidTierZar + spotProMarkupZar
        : firstPaidTierZar;
    const pricingSummary =
      mode === "fixed"
        ? `💰 Spot: R${previewFixedSpotZar}`
        : mode === "pot"
        ? `🎁 Target Kitty: R${targetPotZar || priceZar}`
        : mode === "tiered"
        ? `🎟️ Tiers: from R${previewTierZar}`
        : `🎟️ Entry: Free (Mahala)`;
    const descriptionSnippet = description
      ? `📝 ${description.slice(0, 100)}${description.length > 100 ? "..." : ""}\n`
      : "";
    const sample =
      `🇿🇦 *${(title || "Event").toUpperCase()}*\n` +
      `📍 ${locationName || "Venue"} • 🗓️ ${eventDate || "Date"}\n` +
      `${pricingSummary}\n` +
      `${descriptionSnippet}\n` +
      `Lock your spot in 25 seconds via Direct PayShap / Capitec PayMe (R0 Guest Fee):\n` +
      `👉 [Live link generated when you tap Publish below]`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(sample);
      setCopiedPreviewWa(true);
      setTimeout(() => setCopiedPreviewWa(false), 2500);
    }
  };

  // Hydrate Returning Host Profile from localStorage on mount (scrubbing legacy demo pre-fills)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HOST_PROFILE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.isCleared) {
          setHostName("");
          setHostPhone("");
          setSelectedBankCode("");
          setAccountNumber("");
        } else {
          const savedName = typeof parsed.hostName === "string" ? parsed.hostName.trim() : "";
          const savedPhone = typeof parsed.hostPhone === "string" ? parsed.hostPhone.trim() : "";
          const savedAcc = typeof parsed.accountNumber === "string" ? parsed.accountNumber.trim() : "";

          const isLegacyDemoName = DEMO_PREFILL_NAMES.has(savedName.toLowerCase());
          const isLegacyDemoPhone = DEMO_PREFILL_PHONES.has(savedPhone.replace(/\D/g, ""));
          const isLegacyDemoAcc = DEMO_PREFILL_ACCOUNTS.has(savedAcc.replace(/\D/g, ""));

          const cleanName = savedName && !isLegacyDemoName ? savedName : "";
          const cleanPhone = savedPhone && !isLegacyDemoPhone ? savedPhone : "";
          const cleanAcc = savedAcc && !isLegacyDemoAcc ? savedAcc : "";
          const hasRealSavedProfile = Boolean(cleanName || cleanPhone || cleanAcc);

          setHostName(cleanName);
          setHostPhone(cleanPhone);
          if (
            hasRealSavedProfile &&
            typeof parsed.selectedBankCode === "string" &&
            SA_BANKS.some((b) => b.code === parsed.selectedBankCode)
          ) {
            setSelectedBankCode(parsed.selectedBankCode);
          } else {
            setSelectedBankCode("");
          }
          setAccountNumber(cleanAcc);
          if (typeof parsed.capitecPayMeUrl === "string" && parsed.capitecPayMeUrl.trim()) {
            setCapitecPayMeUrl(parsed.capitecPayMeUrl);
          }
        }
      }
    } catch {
      // Ignore storage access errors
    } finally {
      setProfileHydrated(true);
    }
  }, []);

  const isResettingProfileRef = React.useRef(false);

  // Auto-save Host Profile changes to localStorage
  useEffect(() => {
    if (!profileHydrated) return;
    if (isResettingProfileRef.current) {
      isResettingProfileRef.current = false;
      return;
    }
    try {
      localStorage.setItem(
        HOST_PROFILE_STORAGE_KEY,
        JSON.stringify({
          hostName,
          hostPhone,
          selectedBankCode,
          accountNumber,
          capitecPayMeUrl,
          isCleared: !hostName.trim() && !hostPhone.trim() && !accountNumber.trim(),
        })
      );
    } catch {
      // Ignore storage errors
    }
  }, [profileHydrated, hostName, hostPhone, selectedBankCode, accountNumber, capitecPayMeUrl]);

  const handleResetHostProfile = () => {
    isResettingProfileRef.current = true;
    try {
      localStorage.setItem(
        HOST_PROFILE_STORAGE_KEY,
        JSON.stringify({
          hostName: "",
          hostPhone: "",
          selectedBankCode: "",
          accountNumber: "",
          isCleared: true,
        })
      );
    } catch {
      // Ignore
    }
    setHostName("");
    setHostPhone("");
    setSelectedBankCode("");
    setAccountNumber("");
  };

  // Apply 1-Tap South African Vibe Preset (Configures mode & smart placeholders without cheap dummy pre-filled text!)
  const applyPreset = (preset: VibePreset) => {
    triggerHaptic("light");
    void reportFunnelStep("create_preset_select", preset.id);
    setSelectedPresetId(preset.id);
    setMode(preset.mode);
    setCategoryVibe(preset.vibe);

    // Set clean, contextual smart placeholders so the user sees clear guidance without having to delete fake text
    setActiveTitlePlaceholder(preset.title ? `e.g. ${preset.title}` : "e.g. Saturday Braai, Thursday 5-a-Side");
    setActiveLocationPlaceholder(preset.locationName ? `e.g. ${preset.locationName}` : "e.g. Camps Bay, Fives Sandton, My Place");
    setActiveWhenPlaceholder(preset.whenLabel ? `e.g. ${preset.whenLabel}` : "e.g. This Saturday 16:00");
    setActivePinPlaceholder(preset.secretPin ? `e.g. ${preset.secretPin}` : "Optional gate code or instructions");
    setActiveDescPlaceholder(preset.description || "Optional notes or instructions");

    // Configure structural parameters
    setPriceZar(preset.priceZar);
    setBaseUncushionedSpotZar(preset.priceZar);
    setFlakeCushionActive(false);
    setMaxSpots(preset.maxSpots);
    setTargetPotZar(preset.targetPotZar ?? 3000);
    setTiers(preset.tiers.length > 0 ? preset.tiers.map((t) => ({ ...t })) : []);
    // Keep Bring-List at 0 active items unless the user explicitly clicks a suggestion chip in Step 2
    setBringItems([]);
    setCustomQuestion(preset.customQuestion);
    setHideAmountsOnWall(preset.hideAmountsOnWall);
    setAllowPaydayPromise(preset.allowPaydayPromise);
    setAllowCashOnArrival(preset.allowCashOnArrival !== undefined ? preset.allowCashOnArrival : true);
    setSubmitError(null);
  };

  // Clear preset to start custom blank event
  const handleClearToBlank = () => {
    triggerHaptic("light");
    setSelectedPresetId("custom");
    setCategoryVibe("✨ Custom Group Kitty / Event");
    setTitle("");
    setDescription("");
    setEventDate("");
    setLocationName("");
    setSecretPin("");
    setActiveTitlePlaceholder("e.g. Saturday Braai, Thursday 5-a-Side, Camps Bay Picnic");
    setActiveLocationPlaceholder("e.g. Fives Futbol Sandton, Camps Bay, My Place");
    setActiveWhenPlaceholder("e.g. This Saturday 16:00, Thursday 19:00");
    setActivePinPlaceholder("Optional gate code #4829, pitch 3, or parking instructions");
    setActiveDescPlaceholder("Optional notes (e.g. Bring your own meat and drinks)");
    setPriceZar(mode === "free" ? 0 : 100);
    setBaseUncushionedSpotZar(mode === "free" ? 0 : 100);
    setFlakeCushionActive(false);
    setMaxSpots(10);
    setTargetPotZar(3000);
    setTiers([{ id: `t-${Date.now()}`, label: "Standard Spot", price_zar: 120 }]);
    setBringItems([]);
    setCustomQuestion("");
    setHideAmountsOnWall(mode === "pot");
    setAllowPaydayPromise(false);
    setAllowCashOnArrival(true);
    setEnableVenueSplit(false);
    setVenueName("");
    setVenueDepositZar(0);
    setVenueAccountNumber("");
    setPrefilledVenueName(null);
    setClonedFromSlug(null);
    setSubmitError(null);
  };

  // Switch Event Mode manually
  const handleModeSelect = (nextMode: EventMode) => {
    triggerHaptic("light");
    setMode(nextMode);
    if (nextMode === "free") {
      setPriceZar(0);
    } else if (nextMode === "fixed" && priceZar < 15) {
      setPriceZar(100);
    } else if (nextMode === "pot") {
      if (priceZar < 15) setPriceZar(150);
      setHideAmountsOnWall(true);
      setAllowPaydayPromise(true);
    } else if (nextMode === "tiered" && tiers.length === 0) {
      setTiers([
        { id: `t-${Date.now()}-1`, label: "Standard Spot", price_zar: 150 },
        { id: `t-${Date.now()}-2`, label: "Early Bird / Option 2", price_zar: 100 },
        { id: `t-${Date.now()}-3`, label: "Kids / Spectator (Free)", price_zar: 0 },
      ]);
    }
  };

  // Live Social Event & Group Split Safety Check
  const complianceCheck = useMemo(
    () =>
      validateEventCompliance(title, description, [
        ...(mode === "tiered" ? tiers.map((t) => t.label) : []),
        ...bringItems.map((b) => b.label),
        customQuestion,
      ]),
    [title, description, mode, tiers, bringItems, customQuestion]
  );

  // Effective reference price for checkout preview & settlement calculation
  const effectiveUnitPriceZar = useMemo(() => {
    if (mode === "free") return 0;
    if (mode === "tiered") {
      const paidTiers = tiers.filter((t) => t.price_zar >= 15);
      const maxPaid =
        paidTiers.length > 0
          ? Math.min(25000, Math.max(...paidTiers.map((t) => t.price_zar)))
          : 0;
      return maxPaid > 0 ? maxPaid + spotProMarkupZar : maxPaid;
    }
    const base = Math.min(25000, Math.max(15, Number(priceZar) || 15));
    return mode === "fixed" ? base + spotProMarkupZar : base;
  }, [mode, priceZar, tiers, spotProMarkupZar]);

  // Minimum paid tier price for WhatsApp "From R..." preview
  const minPaidTierPriceZar = useMemo(() => {
    const paidTiers = tiers.filter((t) => t.price_zar >= 15);
    if (paidTiers.length === 0) return 0;
    const minBase = Math.min(...paidTiers.map((t) => t.price_zar));
    return minBase + spotProMarkupZar;
  }, [tiers, spotProMarkupZar]);

  // Velocity Caps Validation (Direct Peer-to-Peer Single Spot Cap up to R25,000)
  const velocityCheck = useMemo(() => {
    if (mode === "free") return { valid: true };
    const unitPriceToCheck =
      mode === "tiered"
        ? Math.max(0, ...tiers.map((t) => Number(t.price_zar) || 0))
        : Number(priceZar) || 0;
    if (unitPriceToCheck > 25000) {
      return {
        valid: false,
        error: "Maximum single spot or tier price is R25,000.00.",
      };
    }
    return { valid: true };
  }, [mode, priceZar, tiers]);

  // Live Checkout Split Preview
  const checkoutPreview = useMemo(() => {
    try {
      return calculateCheckoutSplit(
        mode === "free" ? 0 : Math.max(15, effectiveUnitPriceZar),
        1
      );
    } catch {
      return calculateCheckoutSplit(100, 1);
    }
  }, [mode, effectiveUnitPriceZar]);

  // Live 2-Tier Host Trust Ladder & Settlement Schedule
  const settlementInfo = useMemo(() => {
    return determineSettlementSchedule({
      mode,
      priceZar: effectiveUnitPriceZar,
      maxSpots,
      targetPotZar: mode === "pot" ? targetPotZar : null,
      tiers: mode === "tiered" ? tiers : undefined,
      trustTier: "tier_0_new",
    });
  }, [mode, effectiveUnitPriceZar, maxSpots, targetPotZar, tiers]);

  // Bank Account validation (Optional at link creation time; strictly validated if user enters digits)
  const bankValidation = useMemo(() => {
    if (mode === "free" || !accountNumber.trim()) {
      return {
        valid: true,
        skipped: true,
        error: undefined as string | undefined,
        bank: undefined,
        last4: undefined as string | undefined,
      };
    }
    return {
      ...validateSaBankAccount(selectedBankCode || SA_BANKS[0].code, accountNumber),
      skipped: false,
    };
  }, [mode, selectedBankCode, accountNumber]);

  // Add or toggle Bring-'n-Bak item
  const toggleBringChip = (label: string) => {
    const exists = bringItems.some((item) => item.label === label);
    if (exists) {
      setBringItems((prev) => prev.filter((item) => item.label !== label));
    } else {
      setBringItems((prev) => [
        ...prev,
        {
          id: `bi-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          label,
          claimed_by_name: null,
          claimed_rsvp_id: null,
        },
      ]);
    }
  };

  const handleAddCustomBringItem = () => {
    const trimmed = customBringInput.trim();
    if (!trimmed) return;
    if (!bringItems.some((i) => i.label.toLowerCase() === trimmed.toLowerCase())) {
      setBringItems((prev) => [
        ...prev,
        {
          id: `bi-${Date.now()}`,
          label: trimmed,
          claimed_by_name: null,
          claimed_rsvp_id: null,
        },
      ]);
    }
    setCustomBringInput("");
  };

  // Tier Management
  const updateTier = (
    id: string,
    field: "label" | "price_zar" | "max_spots",
    value: string | number
  ) => {
    setTiers((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              [field]:
                field === "price_zar"
                  ? Math.max(0, Number(value) || 0)
                  : field === "max_spots"
                  ? String(value).trim() === ""
                    ? undefined
                    : Math.max(1, Math.round(Number(value) || 1))
                  : String(value),
            }
          : t
      )
    );
  };

  const addTier = () => {
    setTiers((prev) => [
      ...prev,
      {
        id: `t-${Date.now()}`,
        label: `Option ${prev.length + 1}`,
        price_zar: 120,
      },
    ]);
  };

  const removeTier = (id: string) => {
    if (tiers.length <= 1) return;
    setTiers((prev) => prev.filter((t) => t.id !== id));
  };

  // Validate tiers (allow R0 for kids/free tier, >= R15 for paid tiers, and non-empty labels)
  const invalidTier = useMemo(() => {
    if (mode !== "tiered") return null;
    return tiers.find((t) => t.price_zar > 0 && t.price_zar < 15) || null;
  }, [mode, tiers]);

  const emptyTierLabel = useMemo(() => {
    if (mode !== "tiered") return false;
    return tiers.some((t) => !t.label.trim());
  }, [mode, tiers]);

  // Explicit human-readable checklist of blocking reasons near Submit CTA
  const blockingReasons = useMemo(() => {
    const reasons: string[] = [];
    if (!complianceCheck.compliant) {
      reasons.push(
        complianceCheck.reason ||
          "Event title or description violates SA gambling/insurance compliance rules"
      );
    }
    if (!velocityCheck.valid) {
      reasons.push(
        velocityCheck.error || "Contribution exceeds FICA velocity cap (max R5,000 per spot)"
      );
    }
    if (!title.trim() || title.trim().length < 3) {
      reasons.push("Enter an Event or Kitty Title (or tap a 1-Tap Vibe Preset above)");
    }
    if (mode === "fixed" && priceZar < 15) {
      reasons.push("Set a Fixed Spot Price of at least R15 (or switch to Free RSVP)");
    }
    if (mode === "pot" && priceZar < 15) {
      reasons.push("Set a Suggested Contribution of at least R15");
    }
    if (mode === "pot" && targetPotZar < 100) {
      reasons.push("Set a Target Pot Goal of at least R100");
    }
    if (
      mode === "tiered" &&
      (tiers.length === 0 ||
        Boolean(invalidTier) ||
        emptyTierLabel ||
        !tiers.some((t) => t.price_zar >= 15))
    ) {
      reasons.push(
        "All tiers must have a name, be R0 (Free) or ≥ R15, and include at least one paid tier (≥ R15)"
      );
    }
    if (mode !== "free" && settlementInfo.estimatedPoolZar > 250000) {
      reasons.push(
        "Estimated event pool exceeds the R250,000 single-event limit (reduce spots, price, or target pot)"
      );
    }
    if (mode !== "free" && hostPhone.trim().length > 0 && hostPhone.replace(/\D/g, "").length < 9) {
      reasons.push(
        "Enter a valid SA Host WhatsApp Number (at least 9 digits) or leave blank to add later"
      );
    }
    if (mode !== "free") {
      if (accountNumber.trim().length > 0 && !bankValidation.valid) {
        reasons.push(
          bankValidation.error ||
            "Enter a valid 9–11 digit SA bank account number (or leave blank to add later)"
        );
      }
      if (!mandateAccepted) {
        reasons.push("Tick the Host Mandate & CPA Indemnity checkbox above");
      }
    }
    return reasons;
  }, [
    complianceCheck.compliant,
    complianceCheck.reason,
    velocityCheck.valid,
    velocityCheck.error,
    title,
    mode,
    priceZar,
    targetPotZar,
    tiers,
    invalidTier,
    emptyTierLabel,
    settlementInfo.estimatedPoolZar,
    hostPhone,
    accountNumber,
    bankValidation.valid,
    bankValidation.error,
    mandateAccepted,
  ]);

  const canSubmit = blockingReasons.length === 0 && !isSubmitting;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;
    setHasAttemptedSubmit(true);
    setSubmitError(null);
    void reportFunnelStep("create_publish_attempt", `${mode}:${selectedPresetId}`);

    if (blockingReasons.length > 0) {
      if (!title.trim() || title.trim().length < 3 || !complianceCheck.compliant) {
        goToStep(1);
      } else if (
        (mode === "fixed" && priceZar < 15) ||
        (mode === "tiered" && (tiers.length === 0 || Boolean(invalidTier) || emptyTierLabel || !tiers.some((t) => t.price_zar >= 15)))
      ) {
        goToStep(2);
      } else {
        goToStep(3);
      }
      setSubmitError(blockingReasons[0]);
      triggerHaptic("warning");
      return;
    }

    setIsSubmitting(true);

    try {
      const hasBankAccount =
        mode !== "free" && accountNumber.replace(/\D/g, "").length >= 9;
      const selectedBank = hasBankAccount
        ? SA_BANKS.find((b) => b.code === selectedBankCode) || SA_BANKS[0]
        : null;

      const effectiveFixedPrice =
        mode === "fixed" ? Number(priceZar) + spotProMarkupZar : Number(priceZar);

      const payload = {
        mode,
        category_vibe: categoryVibe,
        title: title.trim(),
        description: description.trim(),
        price_zar:
          mode === "free"
            ? 0
            : mode === "tiered"
            ? effectiveUnitPriceZar
            : effectiveFixedPrice,
        min_pot_contribution_zar: mode === "pot" ? 15 : undefined,
        target_pot_zar: mode === "pot" ? Number(targetPotZar) || 3000 : null,
        tiers:
          mode === "tiered"
            ? tiers.map((t) => ({
                ...t,
                label: t.label.trim(),
                price_zar:
                  t.price_zar > 0
                    ? t.price_zar + spotProMarkupZar
                    : t.price_zar,
              }))
            : [],
        bring_items: bringItems,
        custom_question: customQuestion.trim() ? customQuestion.trim() : null,
        hide_amounts_on_wall: hideAmountsOnWall,
        allow_payday_promise: allowPaydayPromise,
        allow_cash_on_arrival: allowCashOnArrival,
        event_date: eventDate.trim() || "This Weekend (Time in WhatsApp Group)",
        location_name: locationName.trim() || "TBA",
        secret_location_pin: secretPin.trim() ? secretPin.trim() : null,
        max_spots: maxSpots,
        host_name: hostName.trim() || "Event Organiser",
        host_phone: mode === "free" ? "" : hostPhone.trim(),
        host_bank_code: selectedBank ? selectedBank.code : null,
        host_bank_name: selectedBank ? selectedBank.shortName : null,
        bank_code: selectedBank ? selectedBank.code : null,
        bank_name: selectedBank ? selectedBank.shortName : null,
        account_number: hasBankAccount ? accountNumber.replace(/\D/g, "") : null,
        capitec_payme_url:
          mode !== "free" && capitecPayMeUrl.trim()
            ? capitecPayMeUrl.trim()
            : null,
        bake_pro_boost_into_price: bakeProBoostIntoPrice,
        pro_fee_split_mode: proFeeSplitMode,
        is_pro_boosted: false,
        pro_boost_reference: null,
        mandate_accepted: mandateAccepted,
        venue_name: enableVenueSplit && venueName.trim() ? venueName.trim() : null,
        venue_deposit_zar:
          enableVenueSplit && venueDepositZar > 0 ? venueDepositZar : null,
        venue_bank_name: enableVenueSplit
          ? SA_BANKS.find((b) => b.code === venueBankCode)?.shortName || null
          : null,
        venue_account_number:
          enableVenueSplit && venueAccountNumber
            ? venueAccountNumber.replace(/\D/g, "")
            : null,
      };

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || data?.reason || "Failed to create event link.");
      }

      const createdEvent = data?.event || data;
      const slug = createdEvent?.slug;
      const secretToken =
        createdEvent?.host_secret_token || data?.host_secret_token || "host_demo_token";

      void reportFunnelStep("create_publish_success", slug || "created");

      if (slug && typeof window !== "undefined") {
        localStorage.setItem(`pullthru_host_${slug}`, secretToken);
      }

      router.push(`/e/${slug}?created=1&hostToken=${encodeURIComponent(secretToken)}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setSubmitError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#0F172A]">
      <Navbar />

      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-5 sm:px-8">
        <form onSubmit={handleSubmit} noValidate>
          {/* TOP COMPACT BAR */}
          <section className="mb-6 bg-white rounded-2xl border border-[#E6E2D8] p-5 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRequestExit}
                    className="inline-flex items-center gap-1 rounded-full border border-[#E6E2D8] bg-white px-2.5 py-0.5 text-[11px] font-bold text-[#0F172A] hover:border-[#007749] hover:bg-[#FAF8F5] transition cursor-pointer"
                    title="Step back or exit to Home"
                  >
                    <span>← {activeStep > 1 ? `Back to Step ${activeStep - 1}` : "Exit"}</span>
                  </button>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E6E2D8] bg-[#FAF8F5] px-3 py-0.5 text-[11px] font-semibold text-[#0F172A]">
                    <Zap className="h-3 w-3 text-[#FFB81C] fill-[#FFB81C]" />
                    <span>Create your event link in 25 seconds</span>
                  </span>
                  <span className="text-[11px] font-medium text-[#475569]">
                    No app downloads • Paid straight to your bank
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A] font-display">
                  Drop a link in the WhatsApp group.{" "}
                  <span className="text-[#007749]">Get paid first.</span>
                </h1>
              </div>

              {/* 1-Tap South African Vibe Presets */}
              <div className="space-y-2 lg:max-w-2xl">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#475569] flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-[#FFB81C]" />
                    1-Tap South African Vibe Presets
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic("light");
                        setShowAddCustomModal(true);
                      }}
                      className="text-[11px] font-bold text-[#007749] hover:underline flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3 stroke-[2.5]" />
                      <span>Add Your Own</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleClearToBlank}
                      className="text-[11px] font-semibold text-[#475569] hover:text-[#007749] transition-colors"
                    >
                      🧹 Clear / Start Blank
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar -mx-1 px-1 sm:flex-wrap sm:overflow-visible sm:mx-0 sm:px-0">
                  {VIBE_PRESETS.map((preset) => {
                    const isSelected = selectedPresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className={`tap-tactile inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-all active:scale-[0.98] ${
                          isSelected
                            ? "bg-[#007749] text-white shadow-xs ring-2 ring-[#FFB81C]/50"
                            : "bg-[#FAF8F5] border border-[#E6E2D8] text-[#0F172A] hover:border-[#007749]/40 hover:bg-white"
                        }`}
                      >
                        <span>{preset.shortLabel}</span>
                      </button>
                    );
                  })}

                  {/* User-Added Custom Presets */}
                  {customPresets.map((preset) => {
                    const isSelected = selectedPresetId === preset.id;
                    return (
                      <div
                        key={preset.id}
                        className={`inline-flex items-center rounded-full transition-all ${
                          isSelected
                            ? "bg-[#007749] text-white shadow-xs ring-2 ring-[#FFB81C]/50"
                            : "bg-emerald-50/50 border border-emerald-300 text-[#0F172A] hover:border-[#007749] hover:bg-white"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => applyPreset(preset)}
                          className="tap-tactile inline-flex items-center gap-1.5 pl-3.5 pr-1.5 py-2 text-xs font-semibold"
                        >
                          <span>{preset.shortLabel}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteCustomPreset(preset.id, e)}
                          title="Remove custom vibe"
                          aria-label={`Remove ${preset.shortLabel}`}
                          className={`tap-tactile flex h-7 w-7 items-center justify-center rounded-full text-xs transition-colors mr-1 ${
                            isSelected
                              ? "bg-white/20 text-white hover:bg-white/40"
                              : "text-[#64748B] hover:bg-rose-100 hover:text-rose-600"
                          }`}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}

                  {/* + Add Your Own Vibe Preset Button */}
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic("light");
                      setShowAddCustomModal(true);
                    }}
                    className="tap-tactile inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold border-2 border-dashed border-[#007749]/60 text-[#007749] bg-emerald-50/60 hover:bg-emerald-100 hover:border-[#007749] transition-all active:scale-[0.98] shadow-2xs"
                  >
                    <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                    <span>Add Your Own</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* 1-TAP CLONE CELEBRATION BANNER */}
          {clonedFromSlug && (
            <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-50 p-4 mb-6 text-xs text-emerald-950 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-5 w-5 text-[#007749] shrink-0" />
                <div>
                  <span className="font-bold text-sm block text-emerald-900">
                    ⚡ 1-Tap Event Clone Active!
                  </span>
                  <span>
                    Format, tiers, and bring-items pre-filled from <code>{clonedFromSlug}</code>. Tweak your date and banking details below to launch in seconds.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setClonedFromSlug(null)}
                className="text-[#007749] font-bold hover:underline shrink-0 text-xs px-2 py-1"
              >
                Dismiss ✕
              </button>
            </div>
          )}

          {prefilledVenueName && (
            <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-[#007749]/35 bg-[#007749]/[0.06] px-4 py-3 text-xs text-slate-900">
              <div className="flex items-center gap-2">
                <span className="text-base">🏟️</span>
                <div>
                  <span className="font-extrabold text-[#007749]">
                    Splitting a Group Booking for {prefilledVenueName}:
                  </span>{" "}
                  <span>
                    Set your per-person share and spot count below, drop the link in your WhatsApp group, and collect everyone&apos;s deposit in one afternoon.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPrefilledVenueName(null)}
                className="text-[#007749] font-bold hover:underline shrink-0 text-xs px-2 py-1"
              >
                Dismiss ✕
              </button>
            </div>
          )}

          {/* PROGRESSIVE 3-STEP SEGMENTED STEPPER (Video 1 & 3: One Screen, One Job) */}
          <div className="mb-6 rounded-2xl bg-white border border-[#E6E2D8] p-2 card-elevated">
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {[
                { step: 1, title: "1. Vibe & Details", sub: "When, Where & Title" },
                { step: 2, title: "2. Spots & Items", sub: "Tiers & Bring-Items" },
                { step: 3, title: "3. Bank & Launch", sub: "Direct Payout Split" },
              ].map((s) => {
                const isActive = activeStep === s.step;
                const isPast = activeStep > s.step;
                return (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => {
                      triggerHaptic("light");
                      goToStep(s.step as 1 | 2 | 3);
                    }}
                    className={`tap-tactile flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2.5 rounded-xl py-2.5 px-3 text-center sm:text-left transition-all ${
                      isActive
                        ? "bg-[#007749] text-white shadow-xs font-bold ring-2 ring-[#007749]/30"
                        : isPast
                        ? "bg-emerald-50 text-[#007749] font-semibold hover:bg-emerald-100"
                        : "bg-[#FAF8F5] text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black shrink-0 ${
                        isActive
                          ? "bg-white text-[#007749]"
                          : isPast
                          ? "bg-[#007749] text-white"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {isPast ? "✓" : s.step}
                    </span>
                    <div className="min-w-0">
                      <span className="block text-xs font-bold leading-tight truncate">
                        {s.title}
                      </span>
                      <span
                        className={`hidden sm:block text-[10px] mt-0.5 truncate ${
                          isActive ? "text-emerald-100" : "text-slate-500"
                        }`}
                      >
                        {s.sub}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2-COLUMN DESKTOP FORM GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: EVENT DETAILS & BRING-'N-BAK */}
            <div className="lg:col-span-7 space-y-6">
              {/* CARD 1: EVENT MODE, TITLE, DATE/LOCATION & SECRET PIN */}
              <section className={`bg-white rounded-2xl border border-[#E6E2D8] p-5 sm:p-6 shadow-xs space-y-5 card-elevated ${activeStep !== 1 ? "hidden lg:block" : ""}`}>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6E2D8] pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#007749] text-xs font-bold text-white">
                      1
                    </span>
                    <div>
                      <h2 className="text-lg font-bold text-[#0F172A] font-display">
                        Event Mode &amp; Details
                      </h2>
                      <p className="text-xs text-[#475569]">
                        Choose how your crew chips in or locks their RSVP
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-[#FAF8F5] border border-[#E6E2D8] px-3 py-1 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Vibe:</span>
                    <input
                      type="text"
                      value={categoryVibe}
                      onChange={(e) => setCategoryVibe(e.target.value)}
                      placeholder="e.g. 🎾 Tennis / Padel"
                      className="bg-transparent font-semibold text-[#0F172A] focus:outline-none w-32 sm:w-44 text-base sm:text-xs"
                      title="Edit vibe / category"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic("light");
                        setShowAddCustomModal(true);
                      }}
                      className="tap-tactile text-[#007749] hover:text-[#005F3A] font-bold text-[11px] underline"
                      title="Add your own preset"
                    >
                      +New
                    </button>
                  </div>
                </div>

                {/* Clean 4-Pill Mode Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#475569]">
                    Collection / RSVP Mode
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(
                      [
                        { id: "fixed", label: "Fixed Split", sub: "Per spot (e.g. R100)" },
                        { id: "tiered", label: "Multi-Tier", sub: "Adults / Kids / Meals" },
                        { id: "pot", label: "Open Gift Pot", sub: "Any amount ≥ R15" },
                        { id: "free", label: "Free RSVP", sub: "R0.00 • Headcount" },
                      ] as const
                    ).map((item) => {
                      const active = mode === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleModeSelect(item.id)}
                          className={`rounded-xl border p-3 text-left transition-all ${
                            active
                              ? "border-[#007749] bg-[#007749] text-white shadow-xs"
                              : "border-[#E6E2D8] bg-[#FAF8F5] text-[#0F172A] hover:border-[#007749]/40 hover:bg-white"
                          }`}
                        >
                          <div className="text-xs sm:text-sm font-bold">{item.label}</div>
                          <div
                            className={`text-[11px] mt-0.5 ${
                              active ? "text-white/85" : "text-[#475569]"
                            }`}
                          >
                            {item.sub}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Title & Description + Live Compliance Guardrail */}
                <div className="space-y-4">
                  {/* 8-SECOND 3-INPUT ROLL-CALL CARD (Partiful Style: Roll-Call First, Money Second) */}
                  <div className="rounded-2xl border-2 border-[#007749]/35 bg-gradient-to-br from-emerald-50/60 via-white to-[#FAF8F5] p-4 sm:p-5 space-y-4 shadow-2xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/70 pb-2.5">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-[#007749] flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5 text-[#FFB81C] fill-[#FFB81C]" />
                        <span>8-Second WhatsApp Roll-Call Card (3 Inputs → Live Link)</span>
                      </span>
                      <div className="inline-flex rounded-xl border border-emerald-200 bg-white p-0.5 text-[11px] font-extrabold">
                        <button
                          type="button"
                          onClick={() => handleModeSelect("free")}
                          className={`rounded-lg px-2.5 py-1 transition ${
                            mode === "free"
                              ? "bg-[#007749] text-white shadow-2xs"
                              : "text-[#475569] hover:text-[#0F172A]"
                          }`}
                        >
                          🎉 Fast Roll-Call (Free RSVP • No Phone #)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleModeSelect(mode === "free" ? "fixed" : mode)}
                          className={`rounded-lg px-2.5 py-1 transition ${
                            mode !== "free"
                              ? "bg-[#007749] text-white shadow-2xs"
                              : "text-[#475569] hover:text-[#0F172A]"
                          }`}
                        >
                          💸 Paid Split / Pot (R15+)
                        </button>
                      </div>
                    </div>

                    {/* Input 1: What's happening? */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label
                          htmlFor="event-title"
                          className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]"
                        >
                          1. What&apos;s happening? (Event or Roll-Call Title) *
                        </label>
                        {!title.trim() && (
                          <button
                            type="button"
                            onClick={() => applyPreset(VIBE_PRESETS[0])}
                            className="text-[11px] font-bold text-[#007749] hover:underline"
                          >
                            ⚡ Or tap a 1-Tap Preset above
                          </button>
                        )}
                      </div>
                      <input
                        id="event-title"
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={activeTitlePlaceholder || "e.g. Saturday Braai, Thursday 5-a-Side, Camps Bay Picnic"}
                        className={INPUT_CLASS}
                      />
                    </div>

                    {/* Input 2: How many spots & price (or R0 Free)? */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label htmlFor="quick-spot-price" className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]">
                            2A. Price per Spot (or R0 Free)
                          </label>
                          <button
                            type="button"
                            onClick={() => handleModeSelect(mode === "free" ? "fixed" : "free")}
                            className="text-[11px] font-bold text-[#007749] hover:underline"
                          >
                            {mode === "free" ? "Switch to Paid Split" : "Make R0 Free RSVP"}
                          </button>
                        </div>
                        {mode === "free" ? (
                          <div className="flex items-center justify-between rounded-xl border border-[#007749]/40 bg-emerald-50/70 px-3.5 py-2 text-xs font-bold text-[#007749]">
                            <span>R0.00 Free RSVP (No Phone # or Bank Required)</span>
                            <button
                              type="button"
                              onClick={() => handleModeSelect("fixed")}
                              className="underline text-[#0F172A]"
                            >
                              Set Price
                            </button>
                          </div>
                        ) : (
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-sm font-bold text-[#007749]">R</span>
                            <input
                              id="quick-spot-price"
                              type="number"
                              min={15}
                              max={5000}
                              step={5}
                              value={priceZar}
                              onChange={(e) => {
                                const nextPrice = Math.max(0, Number(e.target.value));
                                if (mode === "tiered") setMode("fixed");
                                setPriceZar(nextPrice);
                                setBaseUncushionedSpotZar(nextPrice);
                                setFlakeCushionActive(false);
                              }}
                              className="w-full bg-white border border-[#E6E2D8] text-[#0F172A] rounded-xl pl-7 pr-3 py-2 text-base sm:text-sm font-bold font-mono-num focus:border-[#007749] focus:outline-none"
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label htmlFor="quick-max-spots" className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A]">
                            2B. How Many Spots? (1–30+ Free)
                          </label>
                          <div className="flex items-center gap-1">
                            {[4, 10, 15, 30].map((cnt) => (
                              <button
                                key={cnt}
                                type="button"
                                onClick={() => setMaxSpots(cnt)}
                                className={`rounded px-1.5 py-0.5 text-[10px] font-bold transition ${
                                  maxSpots === cnt
                                    ? "bg-[#007749] text-white"
                                    : "bg-white border border-[#E6E2D8] text-[#475569] hover:border-[#007749]"
                                }`}
                              >
                                {cnt}
                              </button>
                            ))}
                          </div>
                        </div>
                        <input
                          id="quick-max-spots"
                          type="number"
                          min={2}
                          max={500}
                          value={maxSpots === null ? "" : maxSpots}
                          placeholder="Unlimited"
                          onChange={(e) => {
                            const raw = e.target.value.trim();
                            setMaxSpots(raw === "" ? null : Math.max(2, Math.min(500, Math.round(Number(raw) || 6))));
                          }}
                          className="w-full bg-white border border-[#E6E2D8] text-[#0F172A] rounded-xl px-3 py-2 text-base sm:text-sm font-bold font-mono-num focus:border-[#007749] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Input 3: Free Mode shows Host Name + When/Where + 1-Tap Bring-List; Paid Mode shows Host Name + PayShap # */}
                    {mode === "free" ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label htmlFor="quick-host-name" className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A] mb-1">
                              3A. Your Name (Host)
                            </label>
                            <input
                              id="quick-host-name"
                              type="text"
                              value={hostName}
                              onChange={(e) => setHostName(e.target.value)}
                              placeholder="Your Name (e.g. Sipho, Chloe, Alex)"
                              className="w-full bg-white border border-[#E6E2D8] text-[#0F172A] rounded-xl px-3.5 py-2 text-base sm:text-sm font-medium focus:border-[#007749] focus:outline-none"
                            />
                          </div>
                          <div>
                            <label htmlFor="quick-event-date" className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A] mb-1">
                              3B. Date &amp; Time
                            </label>
                            <input
                              id="quick-event-date"
                              type="text"
                              value={eventDate}
                              onChange={(e) => setEventDate(e.target.value)}
                              placeholder={activeWhenPlaceholder || "e.g. This Saturday • 16:00"}
                              className="w-full bg-white border border-[#E6E2D8] text-[#0F172A] rounded-xl px-3.5 py-2 text-base sm:text-sm font-medium focus:border-[#007749] focus:outline-none"
                            />
                          </div>
                          <div>
                            <label htmlFor="quick-location-name" className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A] mb-1">
                              3C. Location / Park / Venue
                            </label>
                            <input
                              id="quick-location-name"
                              type="text"
                              value={locationName}
                              onChange={(e) => setLocationName(e.target.value)}
                              placeholder={activeLocationPlaceholder || "e.g. Camps Bay, Fives Sandton, My Place"}
                              className="w-full bg-white border border-[#E6E2D8] text-[#0F172A] rounded-xl px-3.5 py-2 text-base sm:text-sm font-medium focus:border-[#007749] focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* 1-Tap Bring-List Quick Chips for Free Social Meetups */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="text-[11px] font-extrabold text-[#007749] mr-1">
                            + 1-Tap Bring-List (Optional):
                          </span>
                          {[
                            "🧊 2x Bags of Party Ice",
                            "🥨 Snacks / Crisps & Dips",
                            "🥤 Cooler Box & Soft Drinks",
                            "🧺 Picnic Blanket / Camp Chairs",
                          ].map((chip) => {
                            const active = bringItems.some((b) => b.label === chip);
                            return (
                              <button
                                key={chip}
                                type="button"
                                onClick={() => toggleBringChip(chip)}
                                className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                                  active
                                    ? "bg-[#007749] text-white shadow-2xs"
                                    : "bg-white border border-[#E6E2D8] text-[#0F172A] hover:border-[#007749]"
                                }`}
                              >
                                {active ? `✓ ${chip}` : `+ ${chip}`}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="quick-host-name" className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A] mb-1">
                            3A. Your Name (Host)
                          </label>
                          <input
                            id="quick-host-name"
                            type="text"
                            value={hostName}
                            onChange={(e) => setHostName(e.target.value)}
                            placeholder="Your Name (e.g. Sipho, Chloe, Alex)"
                            className="w-full bg-white border border-[#E6E2D8] text-[#0F172A] rounded-xl px-3.5 py-2 text-base sm:text-sm font-medium focus:border-[#007749] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label htmlFor="quick-host-phone" className="block text-xs font-extrabold uppercase tracking-wider text-[#0F172A] mb-1">
                            3B. Your PayShap / Cell Number
                          </label>
                          <input
                            id="quick-host-phone"
                            type="tel"
                            value={hostPhone}
                            onChange={(e) => setHostPhone(e.target.value)}
                            placeholder="e.g. 082 123 4567 (guests copy in 1 tap)"
                            className="w-full bg-white border border-[#E6E2D8] text-[#0F172A] rounded-xl px-3.5 py-2 text-base sm:text-sm font-medium focus:border-[#007749] focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {submitError && (
                      <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-xs font-semibold text-red-800 flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-red-600 shrink-0" />
                        <span>{submitError}</span>
                      </div>
                    )}

                    {/* Primary 8-Second Express Launch CTA */}
                    <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => {
                          triggerHaptic("medium");
                          if (!title.trim() || title.trim().length < 3) {
                            setSubmitError("Enter an event title above (or tap a Vibe Preset) to publish your link.");
                            return;
                          }
                          void handleSubmit();
                        }}
                        className="tap-tactile flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#007749] px-6 py-3.5 text-sm font-extrabold text-white shadow-md shadow-emerald-950/15 hover:bg-[#005F3A] transition disabled:opacity-50"
                      >
                        <span>📲 {isSubmitting ? "Creating Roll-Call Link..." : "Create & Share to WhatsApp (8 sec)"}</span>
                        <ArrowRight className="h-4 w-4 stroke-[2.4]" />
                      </button>
                      <span className="text-[11px] font-semibold text-[#475569] text-center sm:text-right">
                        Or add optional When, Where &amp; Bring-List below ↓
                      </span>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="event-desc"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#475569] mb-1.5"
                    >
                      What&apos;s the plan? / Event details (Optional)
                    </label>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-2 no-scrollbar">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#475569] shrink-0">
                        Greeting:
                      </span>
                      {LOCAL_GREETINGS.map((g) => {
                        const isActive = description.startsWith(g.text);
                        return (
                          <button
                            key={g.label}
                            type="button"
                            onClick={() => {
                              const cleaned = description.replace(
                                /^(Sanibonani crew! |Molweni mawethu! |Dumela bagaetsho! |Goeiedag almal! |Howzit gents & ladies! |Howzit everyone! )/,
                                ""
                              );
                              if (isActive) {
                                setDescription(cleaned);
                              } else {
                                setDescription(g.text + cleaned);
                              }
                            }}
                            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition ${
                              isActive
                                ? "bg-[#007749] text-white shadow-xs font-bold"
                                : "border border-[#E6E2D8] bg-[#FAF8F5] text-[#0F172A] hover:border-[#007749] hover:bg-white"
                            }`}
                          >
                            {isActive ? `✓ ${g.label}` : g.label}
                          </button>
                        );
                      })}
                    </div>
                    <textarea
                      id="event-desc"
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Optional notes for the WhatsApp group (what's included, dress code, etc.)..."
                      className={INPUT_CLASS}
                    />
                  </div>

                  {/* LIVE COMPLIANCE GUARDRAIL BANNER */}
                  {!complianceCheck.compliant && (
                    <div
                      role="alert"
                      className="rounded-2xl border border-red-300 bg-red-50/90 p-4 text-[#0F172A]"
                    >
                      <div className="flex items-start gap-3">
                        <ShieldAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                        <div className="space-y-2">
                          <span className="inline-block rounded-full bg-red-100 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-red-800 border border-red-200">
                            Heads up • Social Events &amp; Group Splits Only
                          </span>
                          <p className="text-xs sm:text-sm font-medium text-red-900 leading-relaxed">
                            PullThru is built for real-world sports games, braais, trips, and group gift pots (no betting pools or raffles).
                          </p>
                          <button
                            type="button"
                            onClick={() => applyPreset(VIBE_PRESETS[0])}
                            className="inline-flex items-center gap-1.5 rounded-full bg-white border border-red-300 px-3.5 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100 transition-colors"
                          >
                            Reset to 5-a-Side Title
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* When & Location Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="event-when" className="block text-xs font-semibold uppercase tracking-wider text-[#475569] mb-1 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-[#007749]" />
                      When (Quick Chips or Custom — Optional)
                    </label>
                    <input
                      id="event-when"
                      type="text"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      placeholder={activeWhenPlaceholder || "e.g. This Saturday • 16:00"}
                      className={INPUT_CLASS}
                    />
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {QUICK_WHEN_CHIPS.map((chip) => {
                        const active = eventDate === chip;
                        return (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => setEventDate(chip)}
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all ${
                              active
                                ? "border-[#007749] bg-[#007749] text-white"
                                : "border-[#E6E2D8] bg-[#FAF8F5] text-[#475569] hover:border-[#007749]/40 hover:text-[#0F172A]"
                            }`}
                          >
                            {chip}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label htmlFor="event-location" className="block text-xs font-semibold uppercase tracking-wider text-[#475569] mb-1 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-[#007749]" />
                        Location Name (Optional — defaults to TBA)
                      </label>
                      <input
                        id="event-location"
                        type="text"
                        value={locationName}
                        onChange={(e) => setLocationName(e.target.value)}
                        placeholder={activeLocationPlaceholder || "e.g. Camps Bay, Fives Sandton, My Place"}
                        className={INPUT_CLASS}
                      />
                    </div>

                    <div>
                      {!showSecretPinField && !secretPin ? (
                        <button
                          type="button"
                          onClick={() => setShowSecretPinField(true)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#007749] hover:underline pt-1"
                        >
                          <Lock className="h-3.5 w-3.5 text-[#FFB81C]" />
                          <span>+ Add Secret Estate Gate Pin or Court Booking # (Optional)</span>
                        </button>
                      ) : (
                        <div>
                          <label htmlFor="event-secret-pin" className="block text-xs font-semibold uppercase tracking-wider text-[#475569] mb-1 flex items-center gap-1.5">
                            <Lock className="h-3.5 w-3.5 text-[#FFB81C]" />
                            Secret Pin / Gate Code (Unlocked after RSVP)
                          </label>
                          <input
                            id="event-secret-pin"
                            type="text"
                            value={secretPin}
                            onChange={(e) => setSecretPin(e.target.value)}
                            placeholder={activePinPlaceholder || "Optional gate code or court booking # (hidden until RSVP)"}
                            className={INPUT_CLASS}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* STEP 1 NAVIGATION & EXPRESS LAUNCH BUTTONS */}
                <div className="pt-4 border-t border-[#E6E2D8] flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-[#475569] font-medium">Step 1 of 3: Vibe &amp; Details</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => {
                        triggerHaptic("medium");
                        if (!title.trim() || title.trim().length < 3) {
                          setSubmitError("Enter an event title above (or tap a Vibe Preset) to publish your link.");
                          return;
                        }
                        void handleSubmit();
                      }}
                      className="tap-tactile inline-flex items-center gap-1.5 rounded-full border-2 border-[#007749] bg-emerald-50/80 px-4 py-2 text-xs font-bold text-[#007749] hover:bg-emerald-100 transition disabled:opacity-50"
                    >
                      <span>⚡ {isSubmitting ? "Publishing..." : "Publish Link Now (Add Bank Later)"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic("light");
                        if (!title.trim()) {
                          setSubmitError("Please enter an event or kitty title (or tap a Vibe Preset above)");
                          return;
                        }
                        setSubmitError(null);
                        goToStep(2);
                      }}
                      className="tap-tactile inline-flex items-center gap-2 rounded-full bg-[#007749] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#005F3A]"
                    >
                      <span>Next: Spots &amp; Pricing</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </section>

              {/* CARD 2A: PRICING, SPOTS & TIERS (Step 2) */}
              <section className={`bg-white rounded-2xl border border-[#E6E2D8] p-5 sm:p-6 shadow-xs space-y-5 card-elevated ${activeStep !== 2 ? "hidden lg:block" : ""}`}>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6E2D8] pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#007749] text-xs font-bold text-white">
                      2
                    </span>
                    <div>
                      <h2 className="text-lg font-bold text-[#0F172A] font-display">
                        Pricing, Spots &amp; Headcount
                      </h2>
                      <p className="text-xs text-[#475569]">
                        Set spot price, capacity, and contribution
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#FAF8F5] border border-[#E6E2D8] px-3 py-1 text-xs font-medium text-[#475569]">
                    {mode === "fixed" ? "Fixed Price" : mode === "tiered" ? "Multi-Tier" : mode === "pot" ? "Gift Pot" : "Free RSVP"}
                  </span>
                </div>

                {/* MODE-SPECIFIC PRICING & TIERS */}
                {mode === "fixed" && (
                  <div className="rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] p-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="event-fixed-price" className="block text-xs font-semibold uppercase tracking-wider text-[#475569] mb-1">
                          Spot Price (ZAR — Min R15)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-2.5 text-sm font-bold text-[#007749]">
                            R
                          </span>
                          <input
                            id="event-fixed-price"
                            type="number"
                            min={15}
                            max={5000}
                            step={5}
                            value={priceZar}
                            onChange={(e) => {
                              const nextPrice = Math.max(0, Number(e.target.value));
                              setPriceZar(nextPrice);
                              setBaseUncushionedSpotZar(nextPrice);
                              setFlakeCushionActive(false);
                            }}
                            className="w-full bg-white border border-[#E6E2D8] text-[#0F172A] rounded-xl pl-8 pr-4 py-2.5 text-base sm:text-sm font-bold font-mono-num focus:border-[#007749] focus:outline-none"
                          />
                        </div>
                        {priceZar < 15 && (
                          <p className="mt-1 text-xs font-medium text-red-600">
                            Minimum paid kitty spot is R15 (use Free RSVP mode for R0 events).
                          </p>
                        )}
                        {!velocityCheck.valid && velocityCheck.error && (
                          <p className="mt-1 text-xs font-medium text-red-600">
                            {velocityCheck.error}
                          </p>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <label htmlFor="custom-spots-fixed" className="text-xs font-semibold uppercase tracking-wider text-[#475569] flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-[#007749]" />
                            Max Spots / People Cap
                          </label>
                          <span className="text-[11px] font-bold text-[#007749]">
                            {maxSpots === null ? "Unlimited spots" : `${maxSpots} people max`}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {QUICK_SPOTS_OPTIONS.map((opt) => {
                            const isSelected = maxSpots === opt;
                            return (
                              <button
                                key={opt === null ? "unlimited" : opt}
                                type="button"
                                onClick={() => setMaxSpots(opt)}
                                className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all ${
                                  isSelected
                                    ? "border-[#007749] bg-[#007749] text-white"
                                    : "border-[#E6E2D8] bg-white text-[#475569] hover:border-[#007749]/40 hover:text-[#0F172A]"
                                }`}
                              >
                                {opt === null ? "Unlimited" : opt}
                              </button>
                            );
                          })}
                          {/* Custom Headcount Input */}
                          <div className="inline-flex items-center rounded-lg border border-[#E6E2D8] bg-white overflow-hidden focus-within:border-[#007749] focus-within:ring-1 focus-within:ring-[#007749]/20">
                            <button
                              type="button"
                              aria-label="Decrease spots"
                              onClick={() => setMaxSpots((prev) => Math.max(2, (prev ?? 10) - 1))}
                              className="px-2 py-1.5 text-xs font-black text-[#475569] hover:bg-slate-100 hover:text-[#0F172A]"
                            >
                              −
                            </button>
                            <input
                              id="custom-spots-fixed"
                              type="number"
                              min={2}
                              max={500}
                              placeholder="Custom #"
                              value={maxSpots === null ? "" : maxSpots}
                              onChange={(e) => {
                                const raw = e.target.value.trim();
                                if (raw === "") {
                                  setMaxSpots(null);
                                } else {
                                  const num = Math.max(1, Math.min(500, Math.round(Number(raw) || 1)));
                                  setMaxSpots(num);
                                }
                              }}
                              className="w-16 text-center text-xs font-bold font-mono-num text-[#0F172A] bg-transparent py-1.5 focus:outline-none"
                            />
                            <button
                              type="button"
                              aria-label="Increase spots"
                              onClick={() => setMaxSpots((prev) => Math.min(500, (prev ?? 10) + 1))}
                              className="px-2 py-1.5 text-xs font-black text-[#475569] hover:bg-slate-100 hover:text-[#0F172A]"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pre-Event Flake Cushion (8-of-10 Safe Split) Helper */}
                    {maxSpots !== null && maxSpots >= 4 && priceZar >= 15 && (
                      <div
                        className={`rounded-xl border p-3.5 transition-all ${
                          flakeCushionActive
                            ? "border-[#007749] bg-emerald-50/70"
                            : "border-amber-300/80 bg-amber-50/40"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <p className="text-xs font-extrabold text-[#0F172A] flex items-center gap-1.5">
                              <span>🛡️ Flake Cushion (What if only {flakeCushionPreview.safeTurnoutSpots} of {maxSpots} pay &amp; show up?)</span>
                              {flakeCushionActive && (
                                <span className="rounded-full bg-[#007749] px-2 py-0.5 text-[10px] font-black uppercase text-white">
                                  Active ✓
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-[#475569]">
                              {flakeCushionActive ? (
                                <>
                                  Priced at <strong className="text-[#007749] font-mono-num">{formatZar(flakeCushionPreview.cushionedSpotZar)}/spot</strong> so your{" "}
                                  <strong className="font-mono-num">{formatZar(flakeCushionPreview.totalTargetZar)}</strong> booking is 100% covered even if{" "}
                                  <strong>{flakeCushionPreview.bufferSpotsCount} people bail</strong> ({flakeCushionPreview.safeTurnoutSpots}/{maxSpots} turnout). If all {maxSpots} pay, you get{" "}
                                  <strong className="text-[#007749] font-mono-num">+{formatZar(flakeCushionPreview.surplusIfFullZar)}</strong> extra for ice/drinks!
                                </>
                              ) : (
                                <>
                                  At <strong className="font-mono-num">{formatZar(flakeCushionPreview.standardSpotZar)}/spot</strong>, if only{" "}
                                  <strong>{flakeCushionPreview.safeTurnoutSpots} of {maxSpots}</strong> pitch up, you&apos;ll be short{" "}
                                  <strong className="text-amber-900 font-mono-num">
                                    {formatZar(flakeCushionPreview.totalTargetZar - flakeCushionPreview.standardSpotZar * flakeCushionPreview.safeTurnoutSpots)}
                                  </strong>
                                  . Or price for {flakeCushionPreview.safeTurnoutSpots} guaranteed spots (<strong className="text-[#007749] font-mono-num">{formatZar(flakeCushionPreview.cushionedSpotZar)}/spot</strong>) &amp; use any extra for drinks/ice!
                                </>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleToggleFlakeCushion(false)}
                              className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
                                !flakeCushionActive
                                  ? "bg-[#0F172A] text-white shadow-2xs"
                                  : "border border-[#E6E2D8] bg-white text-[#475569] hover:text-[#0F172A]"
                              }`}
                            >
                              Exact {maxSpots}/{maxSpots} ({formatZar(flakeCushionPreview.standardSpotZar)})
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleFlakeCushion(true)}
                              className={`rounded-lg px-2.5 py-1.5 text-[11px] font-extrabold transition ${
                                flakeCushionActive
                                  ? "bg-[#007749] text-white shadow-2xs"
                                  : "border border-[#007749]/40 bg-white text-[#007749] hover:bg-emerald-50"
                              }`}
                            >
                              🛡️ Safe {flakeCushionPreview.safeTurnoutSpots}/{maxSpots} ({formatZar(flakeCushionPreview.cushionedSpotZar)})
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Direct PayShap / Capitec PayMe Preview + Pro Boost 3-Way Split Selector */}
                    <div className="rounded-xl border border-[#E6E2D8] bg-white p-3.5 space-y-3 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-[#007749]">
                            ⚡ Host Gets 100% Instantly: {formatZar(previewFixedSpotZar)}/spot
                          </span>
                          <span className="text-[#E6E2D8]">•</span>
                          <span className="text-[#475569]">
                            Guest Checkout Fee:{" "}
                            <strong className="text-[#007749]">R0.00 (Free)</strong>
                          </span>
                        </div>
                        <span className="rounded-full bg-emerald-50 border border-[#007749]/30 px-2.5 py-0.5 text-[11px] font-bold text-[#007749]">
                          ✓ 1–100+ Spots 100% Free (R0 Fee)
                        </span>
                      </div>

                      {isProBoostRequired && (
                        <div className="rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50/70 via-white to-amber-50/30 p-3.5 space-y-2.5 shadow-2xs">
                          <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-emerald-100 pb-2">
                            <span className="text-[11px] font-black text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                              <span>⚡</span> Pro Event Boost (R29) Coverage
                            </span>
                            <span className="text-[10px] text-[#475569]">Choose how the platform fee is handled</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {/* Option 1: Squad Covers 100% (Default) */}
                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic("light");
                                setProFeeSplitMode("squad_100");
                              }}
                              className={`tap-tactile relative flex flex-col justify-between rounded-xl border-2 p-2.5 text-left transition-all ${
                                proFeeSplitMode === "squad_100"
                                  ? "border-[#007749] bg-white ring-2 ring-[#007749]/20 shadow-xs"
                                  : "border-[#E6E2D8] bg-white/70 hover:border-[#007749]/40"
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span className="text-xs font-black text-[#0F172A]">👑 Squad Covers</span>
                                  <span className="rounded bg-emerald-600 px-1 py-0.2 text-[9px] font-black uppercase text-white">Default</span>
                                </div>
                                <p className="text-[11px] text-[#475569] leading-snug">
                                  +{formatZar(Math.max(1, Math.ceil(29 / expectedTurnoutSpots)))}/spot ({formatZar(Number(priceZar) + Math.max(1, Math.ceil(29 / expectedTurnoutSpots)))}). Auto-cushioned so even if only {expectedTurnoutSpots}/{maxSpots ?? 20} fill, <strong className="text-[#007749]">you pay R0 out of pocket</strong>!
                                </p>
                              </div>
                              <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-emerald-700">
                                <span>Host: R0.00 (80% buffer)</span>
                                {proFeeSplitMode === "squad_100" && <CheckCircle2 className="h-3 w-3 text-[#007749]" />}
                              </div>
                            </button>

                            {/* Option 2: 50 / 50 Split */}
                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic("light");
                                setProFeeSplitMode("split_50_50");
                              }}
                              className={`tap-tactile relative flex flex-col justify-between rounded-xl border-2 p-2.5 text-left transition-all ${
                                proFeeSplitMode === "split_50_50"
                                  ? "border-amber-500 bg-white ring-2 ring-amber-500/20 shadow-xs"
                                  : "border-[#E6E2D8] bg-white/70 hover:border-amber-500/40"
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span className="text-xs font-black text-[#0F172A]">🤝 50 / 50 Split</span>
                                </div>
                                <p className="text-[11px] text-[#475569] leading-snug">
                                  +{formatZar(Math.max(1, Math.ceil(14.5 / expectedTurnoutSpots)))}/spot ({formatZar(Number(priceZar) + Math.max(1, Math.ceil(14.5 / expectedTurnoutSpots)))}). Squad covers half; you settle ~R14.50.
                                </p>
                              </div>
                              <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-amber-800">
                                <span>Host: ~R14.50</span>
                                {proFeeSplitMode === "split_50_50" && <CheckCircle2 className="h-3 w-3 text-amber-600" />}
                              </div>
                            </button>

                            {/* Option 3: Host Absorbs 100% */}
                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic("light");
                                setProFeeSplitMode("host_100");
                              }}
                              className={`tap-tactile relative flex flex-col justify-between rounded-xl border-2 p-2.5 text-left transition-all ${
                                proFeeSplitMode === "host_100"
                                  ? "border-slate-800 bg-white ring-2 ring-slate-800/20 shadow-xs"
                                  : "border-[#E6E2D8] bg-white/70 hover:border-slate-400"
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span className="text-xs font-black text-[#0F172A]">💼 Host Absorbs</span>
                                </div>
                                <p className="text-[11px] text-[#475569] leading-snug">
                                  Pristine round ticket ({formatZar(Number(priceZar))}). You settle R29.
                                </p>
                              </div>
                              <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-700">
                                <span>Host: R29.00</span>
                                {proFeeSplitMode === "host_100" && <CheckCircle2 className="h-3 w-3 text-slate-800" />}
                              </div>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {mode === "tiered" && (
                  <div className="rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] p-4 space-y-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-[#0F172A] font-display">
                          Multi-Tier Options (Braai / Team Lunch / Families)
                        </h3>
                        <p className="text-xs text-[#475569]">
                          Set R0 for free Kids tiers, or R15+ for paid adult/meal tiers.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addTier}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#007749] bg-white px-3 py-1 text-xs font-semibold text-[#007749] hover:bg-[#007749] hover:text-white transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Tier
                      </button>
                    </div>

                    <div className="space-y-2">
                      {tiers.map((tier) => (
                        <div
                          key={tier.id}
                          className="flex flex-wrap items-center gap-2 rounded-xl border border-[#E6E2D8] bg-white p-2"
                        >
                          <input
                            type="text"
                            value={tier.label}
                            onChange={(e) => updateTier(tier.id, "label", e.target.value)}
                            placeholder="Tier label (e.g., Full Braai + Dop)"
                            className="min-w-[140px] flex-1 rounded-lg border border-[#E6E2D8] bg-[#FAF8F5] px-3 py-1.5 text-base sm:text-sm text-[#0F172A] focus:border-[#007749] focus:bg-white focus:outline-none"
                          />
                          <div className="relative w-24 sm:w-28">
                            <span className="absolute left-3 top-1.5 text-xs font-bold text-[#007749]">
                              R
                            </span>
                            <input
                              type="number"
                              min={0}
                              value={tier.price_zar}
                              onChange={(e) => updateTier(tier.id, "price_zar", e.target.value)}
                              className="w-full rounded-lg border border-[#E6E2D8] bg-[#FAF8F5] pl-7 pr-2.5 py-1.5 text-base sm:text-sm font-bold font-mono-num text-[#0F172A] focus:border-[#007749] focus:bg-white focus:outline-none"
                            />
                          </div>
                          <input
                            type="number"
                            min={1}
                            value={tier.max_spots ?? ""}
                            onChange={(e) =>
                              updateTier(tier.id, "max_spots", e.target.value)
                            }
                            placeholder="Max spots"
                            title="Optional per-tier spot limit"
                            className="w-24 rounded-lg border border-[#E6E2D8] bg-[#FAF8F5] px-2.5 py-1.5 text-base sm:text-xs font-mono-num text-[#0F172A] placeholder-[#475569]/60 focus:border-[#007749] focus:bg-white focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => removeTier(tier.id)}
                            disabled={tiers.length <= 1}
                            aria-label="Remove tier"
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#475569] hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {invalidTier && (
                      <p className="text-xs font-medium text-red-600">
                        Tier &ldquo;{invalidTier.label || "Untitled"}&rdquo; is R
                        {invalidTier.price_zar}. Paid tiers must be at least R15 (or R0 for free
                        kids/guest tiers).
                      </p>
                    )}
                    {emptyTierLabel && (
                      <p className="text-xs font-medium text-red-600">
                        Please enter a label for every tier option.
                      </p>
                    )}
                    {!velocityCheck.valid && velocityCheck.error && (
                      <p className="text-xs font-medium text-red-600">{velocityCheck.error}</p>
                    )}

                    {/* Max Spots Cap for Multi-Tier Events */}
                    <div className="pt-2 border-t border-[#E6E2D8] flex flex-wrap items-center justify-between gap-2">
                      <label htmlFor="custom-spots-tiered" className="text-xs font-semibold uppercase tracking-wider text-[#475569] flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-[#007749]" />
                        Total Headcount / Spots Cap ({maxSpots === null ? "Unlimited" : `${maxSpots} people`})
                      </label>
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar -mx-1 px-1 sm:flex-wrap sm:overflow-visible sm:mx-0 sm:px-0">
                        {QUICK_SPOTS_OPTIONS.map((opt) => {
                          const isSelected = maxSpots === opt;
                          return (
                            <button
                              key={opt === null ? "unlimited" : opt}
                              type="button"
                              onClick={() => setMaxSpots(opt)}
                              className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition-all ${
                                isSelected
                                  ? "border-[#007749] bg-[#007749] text-white"
                                  : "border-[#E6E2D8] bg-white text-[#475569] hover:border-[#007749]/40 hover:text-[#0F172A]"
                              }`}
                            >
                              {opt === null ? "Unlimited" : opt}
                            </button>
                          );
                        })}
                        <div className="inline-flex items-center rounded-lg border border-[#E6E2D8] bg-white overflow-hidden focus-within:border-[#007749] focus-within:ring-1 focus-within:ring-[#007749]/20">
                          <button
                            type="button"
                            aria-label="Decrease spots"
                            onClick={() => setMaxSpots((prev) => Math.max(2, (prev ?? 10) - 1))}
                            className="px-2 py-1 text-xs font-black text-[#475569] hover:bg-slate-100 hover:text-[#0F172A]"
                          >
                            −
                          </button>
                          <input
                            id="custom-spots-tiered"
                            type="number"
                            min={2}
                            max={500}
                            placeholder="Custom #"
                            value={maxSpots === null ? "" : maxSpots}
                            onChange={(e) => {
                              const raw = e.target.value.trim();
                              if (raw === "") {
                                setMaxSpots(null);
                              } else {
                                const num = Math.max(1, Math.min(500, Math.round(Number(raw) || 1)));
                                setMaxSpots(num);
                              }
                            }}
                            className="w-16 text-center text-xs font-bold font-mono-num text-[#0F172A] bg-transparent py-1 focus:outline-none"
                          />
                          <button
                            type="button"
                            aria-label="Increase spots"
                            onClick={() => setMaxSpots((prev) => Math.min(500, (prev ?? 10) + 1))}
                            className="px-2 py-1 text-xs font-black text-[#475569] hover:bg-slate-100 hover:text-[#0F172A]"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Direct PayShap / Capitec PayMe Preview */}
                    <div className="rounded-xl border border-[#E6E2D8] bg-white p-3.5 space-y-2.5 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-[#007749]">
                            ⚡ Host Gets 100% Instantly ({formatZar(checkoutPreview.totalBasePriceZar)} tier)
                          </span>
                          <span className="text-[#E6E2D8]">•</span>
                          <span className="text-[#475569]">
                            Guest Checkout Fee: <strong className="text-[#007749]">R0.00</strong>
                          </span>
                        </div>
                        <span className="rounded-full bg-emerald-50 border border-[#007749]/30 px-2.5 py-0.5 text-[11px] font-bold text-[#007749]">
                          ✓ 1–100+ Spots 100% Free (R0 Fee)
                        </span>
                      </div>

                      {isProBoostRequired && (
                        <div className="rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50/70 via-white to-amber-50/30 p-3.5 space-y-2.5 shadow-2xs">
                          <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-emerald-100 pb-2">
                            <span className="text-[11px] font-black text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                              <span>⚡</span> Pro Event Boost (R29) Coverage
                            </span>
                            <span className="text-[10px] text-[#475569]">Choose how the platform fee is handled across tiers</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {/* Option 1: Squad Covers 100% (Default) */}
                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic("light");
                                setProFeeSplitMode("squad_100");
                              }}
                              className={`tap-tactile relative flex flex-col justify-between rounded-xl border-2 p-2.5 text-left transition-all ${
                                proFeeSplitMode === "squad_100"
                                  ? "border-[#007749] bg-white ring-2 ring-[#007749]/20 shadow-xs"
                                  : "border-[#E6E2D8] bg-white/70 hover:border-[#007749]/40"
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span className="text-xs font-black text-[#0F172A]">👑 Squad Covers</span>
                                  <span className="rounded bg-emerald-600 px-1 py-0.2 text-[9px] font-black uppercase text-white">Default</span>
                                </div>
                                <p className="text-[11px] text-[#475569] leading-snug">
                                  +{formatZar(Math.max(1, Math.ceil(29 / expectedTurnoutSpots)))}/spot added to paid tiers (R0 kids stay R0). Cushioned so if {expectedTurnoutSpots}/{maxSpots ?? 20} fill, <strong className="text-[#007749]">you pay R0 out of pocket</strong>!
                                </p>
                              </div>
                              <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-emerald-700">
                                <span>Host: R0.00 (80% buffer)</span>
                                {proFeeSplitMode === "squad_100" && <CheckCircle2 className="h-3 w-3 text-[#007749]" />}
                              </div>
                            </button>

                            {/* Option 2: 50 / 50 Split */}
                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic("light");
                                setProFeeSplitMode("split_50_50");
                              }}
                              className={`tap-tactile relative flex flex-col justify-between rounded-xl border-2 p-2.5 text-left transition-all ${
                                proFeeSplitMode === "split_50_50"
                                  ? "border-amber-500 bg-white ring-2 ring-amber-500/20 shadow-xs"
                                  : "border-[#E6E2D8] bg-white/70 hover:border-amber-500/40"
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span className="text-xs font-black text-[#0F172A]">🤝 50 / 50 Split</span>
                                </div>
                                <p className="text-[11px] text-[#475569] leading-snug">
                                  +{formatZar(Math.max(1, Math.ceil(14.5 / expectedTurnoutSpots)))}/spot added to paid tiers. You settle ~R14.50 once-off.
                                </p>
                              </div>
                              <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-amber-800">
                                <span>Host: ~R14.50</span>
                                {proFeeSplitMode === "split_50_50" && <CheckCircle2 className="h-3 w-3 text-amber-600" />}
                              </div>
                            </button>

                            {/* Option 3: Host Absorbs 100% */}
                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic("light");
                                setProFeeSplitMode("host_100");
                              }}
                              className={`tap-tactile relative flex flex-col justify-between rounded-xl border-2 p-2.5 text-left transition-all ${
                                proFeeSplitMode === "host_100"
                                  ? "border-slate-800 bg-white ring-2 ring-slate-800/20 shadow-xs"
                                  : "border-[#E6E2D8] bg-white/70 hover:border-slate-400"
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span className="text-xs font-black text-[#0F172A]">💼 Host Absorbs</span>
                                </div>
                                <p className="text-[11px] text-[#475569] leading-snug">
                                  Pristine tier prices. You settle R29 once-off (ideal for corporate/VIP).
                                </p>
                              </div>
                              <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-700">
                                <span>Host: R29.00</span>
                                {proFeeSplitMode === "host_100" && <CheckCircle2 className="h-3 w-3 text-slate-800" />}
                              </div>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {mode === "pot" && (
                  <div className="rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] p-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="event-pot-contribution" className="block text-xs font-semibold uppercase tracking-wider text-[#475569] mb-1">
                          Suggested Contribution (ZAR — Min R15)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-2.5 text-sm font-bold text-[#007749]">
                            R
                          </span>
                          <input
                            id="event-pot-contribution"
                            type="number"
                            min={15}
                            max={5000}
                            step={5}
                            value={priceZar}
                            onChange={(e) => {
                              const nextPrice = Math.max(0, Number(e.target.value));
                              setPriceZar(nextPrice);
                              setBaseUncushionedSpotZar(nextPrice);
                              setFlakeCushionActive(false);
                            }}
                            className="w-full bg-white border border-[#E6E2D8] text-[#0F172A] rounded-xl pl-8 pr-4 py-2.5 text-base sm:text-sm font-bold font-mono-num focus:border-[#007749] focus:outline-none"
                          />
                        </div>
                        {priceZar < 15 && (
                          <p className="mt-1 text-xs font-medium text-red-600">
                            Suggested contribution must be at least R15.
                          </p>
                        )}
                        {!velocityCheck.valid && velocityCheck.error && (
                          <p className="mt-1 text-xs font-medium text-red-600">
                            {velocityCheck.error}
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="event-target-pot" className="block text-xs font-semibold uppercase tracking-wider text-[#475569] mb-1">
                          Target Pot Goal (ZAR — Min R200)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-2.5 text-sm font-bold text-[#007749]">
                            R
                          </span>
                          <input
                            id="event-target-pot"
                            type="number"
                            min={200}
                            step={100}
                            value={targetPotZar}
                            onChange={(e) => setTargetPotZar(Math.max(0, Number(e.target.value)))}
                            className="w-full bg-white border border-[#E6E2D8] text-[#0F172A] rounded-xl pl-8 pr-4 py-2.5 text-base sm:text-sm font-bold font-mono-num focus:border-[#007749] focus:outline-none"
                          />
                        </div>
                        {targetPotZar < 200 && (
                          <p className="mt-1 text-xs font-medium text-red-600">
                            Target pot goal must be at least R200.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Direct PayShap / Capitec PayMe Preview */}
                    <div className="rounded-xl border border-[#E6E2D8] bg-white p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-[#007749]">
                          ⚡ Pot Gets 100% Instantly: {formatZar(checkoutPreview.totalBasePriceZar)}
                        </span>
                        <span className="text-[#E6E2D8]">•</span>
                        <span className="text-[#475569]">
                          Contributor Checkout Fee:{" "}
                          <strong className="text-[#007749]">R0.00 (Direct PayShap / PayMe)</strong>
                        </span>
                      </div>
                      <span className="rounded-full bg-emerald-50 border border-[#007749]/30 px-2.5 py-0.5 text-[11px] font-bold text-[#007749]">
                        100% Direct to Host Bank
                      </span>
                    </div>

                    {/* Gift Pot & Family Collection Reassurance */}
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-900 flex items-start gap-2">
                      <span className="text-base shrink-0">🤝</span>
                      <p className="leading-relaxed">
                        <strong>100% Private &amp; Direct to Organiser:</strong> Built for birthdays, baby showers, teacher gifts, farewells, and family support (<em>Imali Yenduduzo</em>) — contributors pay you directly with R0 guest fees and optional amount privacy on the wall.
                      </p>
                    </div>
                  </div>
                )}

                {mode === "free" && (
                  <div className="rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-[#007749]">
                          Free Community RSVP Mode (R0.00)
                        </span>
                        <p className="text-xs text-[#475569] mt-0.5">
                          Guests lock their spot in 1 tap with WhatsApp reminders &amp;
                          Bring-&apos;n-Bak claims.
                        </p>
                      </div>
                      <span className="text-[11px] font-bold text-[#007749]">
                        {maxSpots === null ? "Unlimited spots" : `${maxSpots} people max`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar -mx-1 px-1 sm:flex-wrap sm:overflow-visible sm:mx-0 sm:px-0">
                      {[10, 15, 30, 50, 100, null].map((opt) => {
                        const isSelected = maxSpots === opt;
                        return (
                          <button
                            key={opt === null ? "unlimited" : opt}
                            type="button"
                            onClick={() => setMaxSpots(opt)}
                            className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all ${
                              isSelected
                                ? "border-[#007749] bg-[#007749] text-white"
                                : "border-[#E6E2D8] bg-white text-[#475569] hover:border-[#007749]/40 hover:text-[#0F172A]"
                            }`}
                          >
                            {opt === null ? "Unlimited" : opt}
                          </button>
                        );
                      })}
                      <div className="inline-flex items-center rounded-lg border border-[#E6E2D8] bg-white overflow-hidden focus-within:border-[#007749] focus-within:ring-1 focus-within:ring-[#007749]/20">
                        <button
                          type="button"
                          aria-label="Decrease spots"
                          onClick={() => setMaxSpots((prev) => Math.max(2, (prev ?? 15) - 1))}
                          className="px-2 py-1.5 text-xs font-black text-[#475569] hover:bg-slate-100 hover:text-[#0F172A]"
                        >
                          −
                        </button>
                        <input
                          id="custom-spots-free"
                          type="number"
                          min={2}
                          max={500}
                          placeholder="Custom #"
                          value={maxSpots === null ? "" : maxSpots}
                          onChange={(e) => {
                            const raw = e.target.value.trim();
                            if (raw === "") {
                              setMaxSpots(null);
                            } else {
                              const num = Math.max(1, Math.min(500, Math.round(Number(raw) || 1)));
                              setMaxSpots(num);
                            }
                          }}
                          className="w-16 text-center text-xs font-bold font-mono-num text-[#0F172A] bg-transparent py-1.5 focus:outline-none"
                        />
                        <button
                          type="button"
                          aria-label="Increase spots"
                          onClick={() => setMaxSpots((prev) => Math.min(500, (prev ?? 15) + 1))}
                          className="px-2 py-1.5 text-xs font-black text-[#475569] hover:bg-slate-100 hover:text-[#0F172A]"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* CARD 2B: BRING-'N-BAK CHECKLIST, CUSTOM QUESTION & PRIVACY TOGGLES (Step 2) */}
              <section className={`bg-white rounded-2xl border border-[#E6E2D8] p-5 sm:p-6 shadow-xs space-y-5 card-elevated ${activeStep !== 2 ? "hidden lg:block" : ""}`}>
                <div className="flex items-center justify-between border-b border-[#E6E2D8] pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#007749] text-xs font-bold text-white">
                      2
                    </span>
                    <div>
                      <h2 className="text-lg font-bold text-[#0F172A] font-display flex items-center gap-2">
                        <PackagePlus className="h-4 w-4 text-[#007749]" />
                        <span>Bring-List &amp; Group Options</span>
                      </h2>
                      <p className="text-xs text-[#475569]">
                        Guests claim items to bring &amp; set dignity/payday preferences
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {bringItems.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setBringItems([])}
                        className="text-[11px] font-bold text-[#E03C31] hover:underline"
                      >
                        Clear all
                      </button>
                    )}
                    <span className="rounded-full bg-[#FAF8F5] border border-[#E6E2D8] px-2.5 py-1 text-xs font-semibold text-[#007749]">
                      {bringItems.length} items active
                    </span>
                  </div>
                </div>

                {/* Quick suggestion chips */}
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {availableBringSuggestions.map((chip) => {
                      const active = bringItems.some((i) => i.label === chip);
                      return (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => toggleBringChip(chip)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                            active
                              ? "border-[#007749] bg-[#007749] text-white"
                              : "border-[#E6E2D8] bg-[#FAF8F5] text-[#475569] hover:border-[#007749]/40 hover:text-[#0F172A]"
                          }`}
                        >
                          {active ? `✓ ${chip}` : `+ ${chip}`}
                        </button>
                      );
                    })}
                  </div>

                  {/* Active items list */}
                  {bringItems.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {bringItems.map((item) => (
                        <span
                          key={item.id}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#007749]/30 bg-[#FAF8F5] px-3 py-1 text-xs font-semibold text-[#0F172A]"
                        >
                          {item.label}
                          <button
                            type="button"
                            onClick={() =>
                              setBringItems((prev) => prev.filter((i) => i.id !== item.id))
                            }
                            className="text-[#475569] hover:text-red-600 font-bold"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customBringInput}
                      onChange={(e) => setCustomBringInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomBringItem();
                        }
                      }}
                      placeholder="Add custom item (e.g. 🪑 2x Camp Chairs, 🥗 Chakalaka, 🪵 Extra wood)..."
                      className="flex-1 rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-3.5 py-2 text-base sm:text-sm text-[#0F172A] placeholder-[#475569]/60 focus:border-[#007749] focus:bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomBringItem}
                      className="rounded-xl border border-[#E6E2D8] bg-white px-4 py-2 text-xs font-semibold text-[#0F172A] hover:border-[#007749] hover:text-[#007749] transition-colors"
                    >
                      Add Item
                    </button>
                  </div>
                </div>

                {/* Custom Checkout Question */}
                <div className="pt-2 border-t border-[#E6E2D8]">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#475569] mb-1.5 flex items-center gap-1.5">
                    <HelpCircle className="h-3.5 w-3.5 text-[#007749]" />
                    Optional Custom Checkout Question
                  </label>
                  <input
                    type="text"
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    placeholder="Dietary requirements, kid's age, or dress size?"
                    className={INPUT_CLASS}
                  />
                </div>

                {/* Privacy, Payday & Cash Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] p-3.5 hover:border-[#007749]/40 transition">
                    <input
                      type="checkbox"
                      checked={allowCashOnArrival}
                      onChange={(e) => setAllowCashOnArrival(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-[#E6E2D8] accent-[#007749] shrink-0"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
                        <Banknote className="h-3.5 w-3.5 text-[#007749]" />
                        Allow Cash on Arrival
                      </span>
                      <span className="text-[11px] text-[#475569] block mt-0.5 leading-snug">
                        Friends can reserve spots and pay you cash at the pitch or braai. You confirm receipt before locking.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] p-3.5 hover:border-[#007749]/40 transition">
                    <input
                      type="checkbox"
                      checked={allowPaydayPromise}
                      onChange={(e) => setAllowPaydayPromise(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-[#E6E2D8] accent-[#007749] shrink-0"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-[#FFB81C]" />
                        Allow &ldquo;Pay on Payday (25th)&rdquo;
                      </span>
                      <span className="text-[11px] text-[#475569] block mt-0.5 leading-snug">
                        Lets friends pledge now and get a quick WhatsApp reminder on payday (25th).
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] p-3.5 hover:border-[#007749]/40 transition">
                    <input
                      type="checkbox"
                      checked={hideAmountsOnWall}
                      onChange={(e) => setHideAmountsOnWall(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-[#E6E2D8] accent-[#007749] shrink-0"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
                        <EyeOff className="h-3.5 w-3.5 text-[#007749]" />
                        Hide Individual Rand Amounts
                      </span>
                      <span className="text-[11px] text-[#475569] block mt-0.5 leading-snug">
                        Shows names only on the public wall so nobody feels awkward about what they chipped in.
                      </span>
                    </div>
                  </label>
                </div>

                {/* STEP 2 NAVIGATION BUTTONS */}
                <div className="pt-4 border-t border-[#E6E2D8] flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic("light");
                      goToStep(1, false);
                    }}
                    className="tap-tactile inline-flex items-center gap-1.5 rounded-full border border-[#E6E2D8] bg-white px-4 py-2 text-xs font-semibold text-[#0F172A] hover:bg-slate-50"
                  >
                    <span>← Back: Details</span>
                  </button>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => {
                        triggerHaptic("medium");
                        void handleSubmit();
                      }}
                      className="tap-tactile inline-flex items-center gap-1.5 rounded-full border-2 border-[#007749] bg-emerald-50/80 px-4 py-2 text-xs font-bold text-[#007749] hover:bg-emerald-100 transition disabled:opacity-50"
                    >
                      <span>⚡ {isSubmitting ? "Publishing..." : "Publish Link Now"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (mode === "tiered") {
                          if (invalidTier || emptyTierLabel || !tiers.some((t) => t.price_zar >= 15)) {
                            setSubmitError(
                              emptyTierLabel
                                ? "Please give every tier a name."
                                : invalidTier
                                ? "Each paid tier must be at least R15.00."
                                : "At least one tier must be R15.00 or higher."
                            );
                            triggerHaptic("warning");
                            return;
                          }
                        }
                        triggerHaptic("light");
                        goToStep(3);
                      }}
                      className="tap-tactile inline-flex items-center gap-2 rounded-full bg-[#007749] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#005F3A]"
                    >
                      <span>Next: Host Banking &amp; Launch</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </section>
            </div>

            {/* RIGHT COLUMN: HOST PAYOUT, LIVE PREVIEWS & PUBLISH CTA */}
            <div className="lg:col-span-5 lg:sticky lg:top-20 space-y-6">
              {/* CARD 3: HOST DETAILS, SA BANK PICKER, LIVE SETTLEMENT & WHATSAPP PREVIEW (Step 3) */}
              <section className={`bg-white rounded-2xl border border-[#E6E2D8] p-5 sm:p-6 shadow-sm space-y-5 card-elevated ${activeStep !== 3 ? "hidden lg:block" : ""}`}>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6E2D8] pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#007749] text-xs font-bold text-white">
                      3
                    </span>
                    <div>
                      <h2 className="text-lg font-bold text-[#0F172A] font-display flex items-center gap-1.5">
                        <Wallet className="h-4 w-4 text-[#007749]" />
                        <span>Direct SA Bank Payout &amp; Publish</span>
                      </h2>
                      <p className="text-xs text-[#475569]">
                        Direct payout to your bank — or skip for now &amp; add later
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-50 border border-[#007749]/30 px-2.5 py-0.5 text-[11px] font-bold text-[#007749]">
                    ⚡ Optional Now
                  </span>
                </div>

                {/* Returning Host Remembered Badge */}
                {(hostName.trim() || hostPhone.trim() || accountNumber.trim()) ? (
                  <div className="flex items-center justify-between rounded-xl bg-[#FAF8F5] border border-[#E6E2D8] px-3 py-2 text-[11px]">
                    <span className="font-semibold text-[#007749] flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      Your host &amp; bank details are remembered on this device
                    </span>
                    <button
                      type="button"
                      onClick={handleResetHostProfile}
                      className="inline-flex items-center gap-1 font-semibold text-[#475569] hover:text-[#0F172A] transition-colors"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Clear
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-xl bg-emerald-50/70 border border-emerald-200/80 px-3 py-2 text-[11px]">
                    <span className="font-semibold text-emerald-950 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-[#007749] shrink-0" />
                      Optional now: Leave blank to publish your link immediately and add bank details later from Host Controls
                    </span>
                  </div>
                )}

                {/* Host Contact Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label htmlFor="host-name" className="block text-xs font-semibold uppercase tracking-wider text-[#475569] mb-1">
                      Your Host Display Name (Optional)
                    </label>
                    <input
                      id="host-name"
                      type="text"
                      value={hostName}
                      onChange={(e) => setHostName(e.target.value)}
                      placeholder="Your first name or nickname"
                      className={INPUT_CLASS}
                    />
                  </div>

                  <div>
                    <label htmlFor="host-phone" className="block text-xs font-semibold uppercase tracking-wider text-[#475569] mb-1">
                      Your WhatsApp / PayShap Number (Optional)
                    </label>
                    <input
                      id="host-phone"
                      type="tel"
                      value={hostPhone}
                      onChange={(e) => setHostPhone(e.target.value)}
                      placeholder="Your SA WhatsApp number"
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>

                {mode !== "free" ? (
                  <div className="space-y-4 pt-1 border-t border-[#E6E2D8]">
                    {/* Direct SA Bank Picker */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#475569] flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-[#007749]" />
                          Select Your South African Bank (Optional Now)
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowMoreBanks((prev) => !prev)}
                          className="text-[11px] font-semibold text-[#007749] hover:underline"
                        >
                          {showMoreBanks
                            ? "− Top 6 Banks"
                            : "+ 6 More Banks"}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2">
                        {(showMoreBanks ||
                        SA_BANKS.slice(6).some((b) => b.code === selectedBankCode)
                          ? SA_BANKS
                          : SA_BANKS.slice(0, 6)
                        ).map((bank) => {
                          const isSelected = selectedBankCode === bank.code;
                          return (
                            <button
                              key={bank.code}
                              type="button"
                              onClick={() => setSelectedBankCode(bank.code)}
                              className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left transition-all ${
                                isSelected
                                  ? "border-[#007749] bg-[#007749] text-white shadow-xs"
                                  : "border-[#E6E2D8] bg-[#FAF8F5] text-[#0F172A] hover:border-[#007749]/40 hover:bg-white"
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span
                                  className="h-2 w-2 rounded-full shrink-0 ring-1 ring-black/10"
                                  style={{
                                    backgroundColor: isSelected ? "#FFB81C" : bank.color,
                                  }}
                                />
                                <span className="text-xs font-bold truncate">
                                  {bank.shortName}
                                </span>
                              </div>
                              {isSelected && (
                                <CheckCircle2 className="h-3.5 w-3.5 text-[#FFB81C] shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Account Number Input */}
                    <div>
                      <label htmlFor="host-account-number" className="block text-xs font-semibold uppercase tracking-wider text-[#475569] mb-1">
                        SA Bank Account Number (Optional — Add Now or Later)
                      </label>
                      <input
                        id="host-account-number"
                        type="text"
                        inputMode="numeric"
                        value={accountNumber}
                        onChange={(e) => {
                          setAccountNumber(formatSaBankAccount(e.target.value));
                        }}
                        placeholder="9–11 digit account # (or leave blank to add later)"
                        className={`${INPUT_CLASS} font-mono-num`}
                      />
                      {accountNumber.trim().length > 0 && !bankValidation.valid && bankValidation.error && (
                        <p className="mt-1 text-xs font-medium text-red-600 flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {bankValidation.error}
                        </p>
                      )}
                    </div>

                    {/* Optional 1-Tap Capitec PayMe / SnapScan Deep-Link Input */}
                    <div>
                      <label htmlFor="host-capitec-payme" className="block text-xs font-semibold uppercase tracking-wider text-[#475569] mb-1">
                        Optional 1-Tap Capitec PayMe or SnapScan Link
                      </label>
                      <input
                        id="host-capitec-payme"
                        type="url"
                        value={capitecPayMeUrl}
                        onChange={(e) => setCapitecPayMeUrl(e.target.value)}
                        placeholder="e.g. https://payme.capitecbank.co.za/..."
                        className={INPUT_CLASS}
                      />
                      <p className="mt-1 text-[11px] text-[#475569]">
                        Gives guests a 1-tap button to open their Capitec app directly alongside your PayShap cellphone ID ({hostPhone || "082..."}).
                      </p>
                    </div>

                    {/* Venue / Pitch Deposit Target Tracker (Transparent Squad Breakdown) */}
                    <div className="rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] p-3.5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-[#007749]" />
                          <div>
                            <span className="text-xs font-bold text-[#0F172A] block">
                              Venue / Pitch Deposit Tracker (Optional)
                            </span>
                            <span className="text-[11px] text-[#475569]">
                              Show the squad the exact court hire or lodge deposit target you are paying
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEnableVenueSplit((prev) => !prev)}
                          className="rounded-full border border-[#007749] px-3 py-1 text-xs font-bold text-[#007749] hover:bg-[#007749] hover:text-white transition"
                        >
                          {enableVenueSplit ? "− Remove Target" : "+ Add Venue Target"}
                        </button>
                      </div>

                      {enableVenueSplit && (
                        <div className="space-y-3 pt-2 border-t border-[#E6E2D8]">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label htmlFor="venue-name-input" className="block text-[11px] font-semibold text-[#475569] mb-1">
                                Venue / Facility Name
                              </label>
                              <input
                                id="venue-name-input"
                                type="text"
                                value={venueName}
                                onChange={(e) => setVenueName(e.target.value)}
                                placeholder="e.g. Fives Futbol / Virgin Active Padel"
                                className={INPUT_CLASS}
                              />
                            </div>
                            <div>
                              <label htmlFor="venue-deposit-input" className="block text-[11px] font-semibold text-[#475569] mb-1">
                                Deposit Amount (ZAR)
                              </label>
                              <input
                                id="venue-deposit-input"
                                type="number"
                                value={venueDepositZar || ""}
                                onChange={(e) =>
                                  setVenueDepositZar(
                                    Math.max(0, Number(e.target.value))
                                  )
                                }
                                placeholder="e.g. 1000"
                                className={`${INPUT_CLASS} font-mono-num`}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label htmlFor="venue-bank-code" className="block text-[11px] font-semibold text-[#475569] mb-1">
                                Venue SA Bank (For Your Reference)
                              </label>
                              <select
                                id="venue-bank-code"
                                value={venueBankCode}
                                onChange={(e) => setVenueBankCode(e.target.value)}
                                className="w-full rounded-xl border border-[#E6E2D8] bg-white px-3 py-2 text-base sm:text-xs font-bold text-[#0F172A]"
                              >
                                {SA_BANKS.map((b) => (
                                  <option key={b.code} value={b.code}>
                                    {b.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label htmlFor="venue-account-number" className="block text-[11px] font-semibold text-[#475569] mb-1">
                                Venue Account / Booking Ref
                              </label>
                              <input
                                id="venue-account-number"
                                type="text"
                                inputMode="numeric"
                                value={venueAccountNumber}
                                onChange={(e) =>
                                  setVenueAccountNumber(
                                    formatSaBankAccount(e.target.value)
                                  )
                                }
                                placeholder="Venue account or booking ref"
                                className={`${INPUT_CLASS} font-mono-num`}
                              />
                            </div>
                          </div>

                          <p className="text-[10px] text-[#007749] font-medium flex items-center gap-1.5">
                            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                            <span>
                              Transparent Squad Breakdown: Displays the venue name and deposit target on your event wall so the crew sees exactly what their kitty covers.
                            </span>
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Live Direct PayShap / Capitec PayMe Settlement Preview */}
                    <div className="rounded-xl bg-emerald-50/70 border border-[#007749]/30 p-3.5 space-y-1.5">
                      <div className="flex items-center justify-between flex-wrap gap-1.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#007749]/30 px-2.5 py-0.5 text-[11px] font-bold text-[#007749]">
                          <span className="h-2 w-2 rounded-full bg-[#007749]" />
                          ⚡ Instant 5-Second Direct Bank Settlement (PayShap / PayMe)
                        </span>
                        <span className="text-xs font-bold text-[#0F172A] font-mono-num">
                          Est. Pot: {formatZar(settlementInfo.estimatedPoolZar)}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#475569] leading-relaxed">
                        Guests pay your {SA_BANKS.find((b) => b.code === selectedBankCode)?.shortName || "SA"} account directly via PayShap ({hostPhone || "Cellphone ID"}), Capitec PayMe, or EFT with R0.00 guest fees. PullThru verifies their POP slip automatically.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl bg-[#FAF8F5] border border-[#E6E2D8] p-3.5 text-xs text-[#475569]">
                    <strong className="text-[#0F172A]">
                      No Bank Account Needed for Free RSVPs:
                    </strong>{" "}
                    Your event is set to R0.00 Free RSVP mode. Switch to Fixed, Multi-Tier, or
                    Open Pot if you want to collect money into your SA bank account.
                  </div>
                )}

                {/* Live WhatsApp Link Preview Card */}
                <div className="rounded-xl border border-[#007749]/25 bg-[#007749]/[0.04] p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold uppercase tracking-wider text-[#007749] flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Live WhatsApp Group Preview
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyPreviewWa}
                      className="font-mono-num text-[11px] font-bold text-[#007749] hover:underline inline-flex items-center gap-1"
                    >
                      {copiedPreviewWa ? (
                        <>
                          <Check className="h-3 w-3" />
                          <span>Copied Sample!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy Preview Text</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="rounded-lg bg-white border border-[#E6E2D8] p-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-[#007749]">
                        {categoryVibe}
                      </span>
                      <span className="text-[11px] font-bold font-mono-num text-[#0F172A] bg-[#FAF8F5] border border-[#E6E2D8] rounded-full px-2 py-0.5">
                        {mode === "free"
                          ? "Free RSVP"
                          : mode === "pot"
                          ? `From R${priceZar || 0} • Goal ${formatZar(targetPotZar || 0)}`
                          : mode === "tiered"
                          ? `${tiers.length} Tiers • From ${formatZar(minPaidTierPriceZar || effectiveUnitPriceZar)}`
                          : `${formatZar(previewFixedSpotZar || 0)} / spot`}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-[#0F172A] truncate">
                      {title.trim() || "Untitled Event"}
                    </p>
                    <p className="text-[11px] text-[#475569] truncate">
                      📅 {eventDate || "TBD"} • 📍 {locationName || "Location TBD"}
                      {maxSpots ? ` • 👥 ${maxSpots} spots` : ""}
                    </p>
                  </div>
                </div>

                {/* Simple Direct Settlement Reassurance */}
                <div className="flex items-center gap-2 rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-3.5 py-2.5 text-[11px] text-[#475569]">
                  <ShieldCheck className="h-4 w-4 text-[#007749] shrink-0" />
                  <span>
                    <strong className="text-[#0F172A]">100% R0 Host &amp; Guest Fees:</strong> Friends pay your PayShap or bank directly (or cash at the pitch/braai). PullThru never holds your money.
                  </span>
                </div>

                {/* Scannable Blocking Reasons Checklist right above Submit CTA (only shown after typing or submit attempt) */}
                {(hasAttemptedSubmit || title.trim().length > 0) && blockingReasons.length > 0 && (
                  <div
                    role="status"
                    className="rounded-xl border border-[#FFB81C] bg-[#FFB81C]/10 p-3.5 space-y-1.5"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F172A]">
                      <AlertTriangle className="h-3.5 w-3.5 text-[#D97706] shrink-0" />
                      <span>Complete to publish your WhatsApp link:</span>
                    </div>
                    <ul className="space-y-1 pl-5 list-disc text-[11px] font-medium text-[#475569]">
                      {blockingReasons.map((reason, idx) => (
                        <li key={idx} className="text-[#0F172A]">
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Error Banner */}
                {submitError && (
                  <div className="rounded-xl border border-red-300 bg-red-50 p-3.5 text-xs font-semibold text-red-800 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-red-600 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Primary Submit CTA & Step 3 Mobile Back Button */}
                <div className="pt-1 space-y-2.5">
                  <div className="flex items-center justify-between pb-1 lg:hidden">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic("light");
                        goToStep(2, false);
                      }}
                      className="tap-tactile inline-flex items-center gap-1.5 rounded-full border border-[#E6E2D8] bg-white px-4 py-2 text-xs font-semibold text-[#0F172A] hover:bg-slate-50"
                    >
                      <span>← Back: Spots &amp; Items</span>
                    </button>
                    <span className="text-xs text-[#475569] font-medium">Step 3 of 3</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    onClick={() => triggerHaptic("medium")}
                    className="tap-tactile w-full bg-[#007749] text-white rounded-2xl py-4 px-6 text-sm sm:text-base font-bold hover:bg-[#005F3A] transition-all inline-flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/15 disabled:opacity-50 active:scale-[0.98]"
                  >
                    <span>
                      {isSubmitting
                        ? "Publishing & Generating Link..."
                        : "⚡ Publish & Copy WhatsApp Link"}
                    </span>
                    <ArrowRight className="h-4 w-4 stroke-[2.2]" />
                  </button>

                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#475569] text-center">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#007749] shrink-0" />
                    <span>
                      Unlocks <strong className="text-[#0F172A]">Host Controls</strong> &amp;
                      1-tap WhatsApp group summary on the next screen.
                    </span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </form>

        {/* =========================================================
            ADD YOUR OWN CUSTOM VIBE PRESET MODAL
           ========================================================= */}
        {showAddCustomModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="custom-vibe-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                triggerHaptic("light");
                handleCloseCustomModal();
              }
            }}
          >
            <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-6 sm:p-7 space-y-5 overflow-hidden card-elevated">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E6E2D8]">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200/60 text-lg">
                    ✨
                  </span>
                  <div>
                    <h3 id="custom-vibe-modal-title" className="font-display text-lg font-bold text-[#0F172A]">
                      Add Your Own Vibe Preset
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      Saved to your browser for 1-tap reuse anytime
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    handleCloseCustomModal();
                  }}
                  className="tap-tactile flex h-8 w-8 items-center justify-center rounded-full bg-[#FAF8F5] text-[#64748B] hover:text-[#0F172A] hover:bg-slate-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCustomPreset} className="space-y-4 text-left">
                {/* Quick Emoji Picker */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#475569] mb-1.5">
                    Pick Icon / Emoji
                  </label>
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-2xl bg-[#FAF8F5] border border-[#E6E2D8]">
                    {[
                      "🎾", "🍷", "🎉", "🎂", "🏕️", "🎮", "🚴", "🍕",
                      "🍼", "🏖️", "🎣", "🏉", "⛳", "🏊", "💃", "✨",
                      "🍖", "🍻", "🏎️", "⚽"
                    ].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          triggerHaptic("selection");
                          setCustomVibeEmoji(emoji);
                        }}
                        className={`tap-tactile flex h-9 w-9 items-center justify-center rounded-xl text-base transition-all active:scale-90 ${
                          customVibeEmoji === emoji
                            ? "bg-white shadow-xs ring-2 ring-[#007749] scale-110"
                            : "hover:bg-white text-slate-700"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vibe Title / Name */}
                <div>
                  <label htmlFor="custom-vibe-name" className="block text-xs font-semibold uppercase tracking-wider text-[#475569] mb-1">
                    Vibe / Gathering Name *
                  </label>
                  <div className="flex items-center rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-3.5 py-2.5 focus-within:border-[#007749] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#007749]/15">
                    <span className="text-lg mr-2.5">{customVibeEmoji}</span>
                    <input
                      id="custom-vibe-name"
                      type="text"
                      required
                      autoFocus
                      value={customVibeName}
                      onChange={(e) => setCustomVibeName(e.target.value)}
                      placeholder="e.g. Sunday Wine Tasting, Padel League, Matric Vac..."
                      className="w-full bg-transparent text-base sm:text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Collection Mode Selection */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#475569] mb-1.5">
                    Default Mode
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {(
                      [
                        { id: "fixed", label: "Fixed Split" },
                        { id: "tiered", label: "Multi-Tier" },
                        { id: "pot", label: "Gift Pot" },
                        { id: "free", label: "Free RSVP" },
                      ] as const
                    ).map((m) => {
                      const active = customVibeMode === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            triggerHaptic("selection");
                            setCustomVibeMode(m.id);
                          }}
                          className={`tap-tactile rounded-xl px-2.5 py-2 text-xs font-semibold border text-center transition-all ${
                            active
                              ? "bg-[#007749] border-[#007749] text-white shadow-2xs"
                              : "bg-[#FAF8F5] border-[#E6E2D8] text-[#475569] hover:bg-white"
                          }`}
                        >
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Price & Spot Cap Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="custom-vibe-price" className="block text-xs font-semibold uppercase tracking-wider text-[#475569] mb-1">
                      {customVibeMode === "free" ? "Price" : "Default Spot Price"}
                    </label>
                    <div className="flex items-center rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-3 py-2 text-sm">
                      <span className="font-semibold text-[#64748B] mr-1">R</span>
                      <input
                        id="custom-vibe-price"
                        type="number"
                        disabled={customVibeMode === "free"}
                        value={customVibeMode === "free" ? 0 : customVibePrice}
                        onChange={(e) => setCustomVibePrice(Number(e.target.value))}
                        className="w-full bg-transparent font-mono-num font-bold text-[#0F172A] focus:outline-none disabled:text-[#94A3B8]"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="custom-vibe-spots" className="block text-xs font-semibold uppercase tracking-wider text-[#475569] mb-1">
                      Spot Cap (Pax)
                    </label>
                    <div className="flex items-center rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-3 py-2 text-sm">
                      <input
                        id="custom-vibe-spots"
                        type="number"
                        value={customVibeMaxSpots || ""}
                        onChange={(e) => setCustomVibeMaxSpots(e.target.value ? Number(e.target.value) : 10)}
                        placeholder="12 (or empty)"
                        className="w-full bg-transparent font-mono-num font-bold text-[#0F172A] focus:outline-none"
                      />
                      <span className="text-xs text-[#64748B] ml-1">spots</span>
                    </div>
                  </div>
                </div>

                {/* Suggested Bring Items */}
                <div>
                  <label htmlFor="custom-vibe-bring" className="block text-xs font-semibold uppercase tracking-wider text-[#475569] mb-1">
                    Default Bring-&apos;n-Bak Checklist (comma separated)
                  </label>
                  <input
                    id="custom-vibe-bring"
                    type="text"
                    value={customVibeBringItems}
                    onChange={(e) => setCustomVibeBringItems(e.target.value)}
                    placeholder="e.g. Ice, Cups, Snacks, Speaker"
                    className="w-full rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-3.5 py-2 text-base sm:text-xs text-[#0F172A] placeholder-[#94A3B8] focus:border-[#007749] focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={handleCloseCustomModal}
                    className="tap-tactile rounded-full px-4 py-2.5 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!customVibeName.trim()}
                    className="tap-tactile inline-flex items-center gap-2 rounded-full bg-[#007749] text-white px-5 py-2.5 text-xs font-bold shadow-md hover:bg-[#005F3A] transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Save &amp; Use Vibe</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================
            UNSAVED CHANGES / EXIT CONFIRMATION DIALOG (Report Item #5)
           ========================================================= */}
        {showExitConfirmModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-confirm-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          >
            <div className="relative w-full max-w-md rounded-3xl border border-[#E6E2D8] bg-white p-6 shadow-2xl space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 text-lg">
                    ⚠️
                  </span>
                  <div>
                    <h3 id="exit-confirm-modal-title" className="font-display text-lg font-extrabold text-[#0F172A]">
                      Leave event setup?
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      Your unsaved event edits will be discarded if you exit now.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowExitConfirmModal(false)}
                  aria-label="Close dialog"
                  className="rounded-full p-1.5 text-[#64748B] hover:bg-[#FAF8F5] hover:text-[#0F172A]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="rounded-2xl border border-[#E6E2D8] bg-[#FAF8F5] p-3 text-xs text-[#475569]">
                💡 <strong className="text-[#0F172A]">Note:</strong> Your Host Display Name, WhatsApp number, and SA bank details stay safely saved on this device for next time.
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExitConfirmModal(false)}
                  className="rounded-full border border-[#E6E2D8] bg-white px-4 py-2.5 text-xs font-bold text-[#0F172A] hover:bg-[#FAF8F5] transition cursor-pointer"
                >
                  Keep Editing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExitConfirmModal(false);
                    router.push("/");
                  }}
                  className="rounded-full bg-[#E03C31] px-5 py-2.5 text-xs font-extrabold text-white hover:bg-red-700 transition cursor-pointer"
                >
                  Discard &amp; Exit
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function CreateEventPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF8F5]" />}>
      <CreateEventForm />
    </Suspense>
  );
}
