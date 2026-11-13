import { EventMode, TrustTier } from "@/types/database";

export interface SaBankInfo {
  code: string;
  name: string;
  shortName: string;
  minDigits: number;
  maxDigits: number;
  color: string;
}

export const SA_BANKS: SaBankInfo[] = [
  {
    code: "470010",
    name: "Capitec Bank",
    shortName: "Capitec",
    minDigits: 9,
    maxDigits: 11,
    color: "#0072ce",
  },
  {
    code: "250655",
    name: "First National Bank (FNB)",
    shortName: "FNB",
    minDigits: 9,
    maxDigits: 11,
    color: "#009a9b",
  },
  {
    code: "051001",
    name: "Standard Bank",
    shortName: "Standard Bank",
    minDigits: 9,
    maxDigits: 11,
    color: "#0033a1",
  },
  {
    code: "198765",
    name: "Nedbank",
    shortName: "Nedbank",
    minDigits: 9,
    maxDigits: 11,
    color: "#006341",
  },
  {
    code: "632005",
    name: "Absa Bank",
    shortName: "Absa",
    minDigits: 9,
    maxDigits: 11,
    color: "#af144b",
  },
  {
    code: "678910",
    name: "TymeBank",
    shortName: "TymeBank",
    minDigits: 9,
    maxDigits: 11,
    color: "#f5a623",
  },
  {
    code: "679000",
    name: "Discovery Bank",
    shortName: "Discovery",
    minDigits: 9,
    maxDigits: 11,
    color: "#1e293b",
  },
  {
    code: "888000",
    name: "Bank Zero",
    shortName: "Bank Zero",
    minDigits: 9,
    maxDigits: 11,
    color: "#10b981",
  },
  {
    code: "580105",
    name: "Investec Bank",
    shortName: "Investec",
    minDigits: 9,
    maxDigits: 11,
    color: "#0f172a",
  },
  {
    code: "430000",
    name: "African Bank",
    shortName: "African Bank",
    minDigits: 9,
    maxDigits: 11,
    color: "#1d4ed8",
  },
  {
    code: "683000",
    name: "Sasfin Bank",
    shortName: "Sasfin",
    minDigits: 9,
    maxDigits: 11,
    color: "#0369a1",
  },
  {
    code: "462005",
    name: "Bidvest Bank",
    shortName: "Bidvest",
    minDigits: 9,
    maxDigits: 11,
    color: "#4338ca",
  },
];

const SEQUENTIAL_DUMMY_ACCOUNTS = new Set([
  "123456789",
  "1234567890",
  "12345678901",
  "0123456789",
  "01234567890",
  "987654321",
  "9876543210",
  "98765432109",
]);

export function validateSaBankAccount(
  bankCode: string,
  accountNumber: string
): {
  valid: boolean;
  error?: string;
  bank?: SaBankInfo;
  last4?: string;
} {
  const normalizedBankInput = (bankCode || "").trim().toLowerCase();
  const bank = SA_BANKS.find(
    (b) =>
      b.code.toLowerCase() === normalizedBankInput ||
      b.shortName.toLowerCase() === normalizedBankInput ||
      b.name.toLowerCase() === normalizedBankInput
  );
  if (!bank) {
    return {
      valid: false,
      error: "Please select a valid South African bank.",
    };
  }

  const cleanAccount = (accountNumber || "").replace(/[\s-]/g, "");
  if (!/^\d+$/.test(cleanAccount)) {
    return {
      valid: false,
      error: "Account number must contain only digits.",
      bank,
    };
  }

  if (
    cleanAccount.length < bank.minDigits ||
    cleanAccount.length > bank.maxDigits
  ) {
    return {
      valid: false,
      error: `${bank.shortName} account numbers must be between ${bank.minDigits} and ${bank.maxDigits} digits.`,
      bank,
    };
  }

  // Check if all digits are repeating (e.g., 0000000000 or 1111111111)
  if (/^(\d)\1+$/.test(cleanAccount)) {
    return {
      valid: false,
      error: "Invalid account number (repeating digits are not allowed).",
      bank,
    };
  }

  // Check for sequential dummy numbers (e.g., 123456789, 1234567890, 0123456789, 9876543210)
  if (
    SEQUENTIAL_DUMMY_ACCOUNTS.has(cleanAccount) ||
    "01234567890123456789".includes(cleanAccount) ||
    "98765432109876543210".includes(cleanAccount)
  ) {
    return {
      valid: false,
      error: "Invalid account number (sequential test digits are not allowed).",
      bank,
    };
  }

  return {
    valid: true,
    bank,
    last4: cleanAccount.slice(-4),
  };
}

const GAMBLING_BLOCKLIST = [
  "fpl",
  "fantasy premier league",
  "superbru",
  "betting pool",
  "betting pot",
  "raffle",
  "lottery",
  "lotto",
  "powerball",
  "lucky draw",
  "poker buy-in",
  "casino",
  "win cash",
  "hollywoodbets",
  "betway",
  "sportingbet",
  "50/50",
  "sweepstake",
  "last man standing",
  "jackpot",
  "bookmaker",
];

const INSURANCE_FINANCIAL_BLOCKLIST = [
  "burial society",
  "monthly funeral policy",
  "funeral policy",
  "funeral cover",
  "stokvel savings investment",
  "forex pool",
  "crypto investment",
  "double your money",
  "ponzi",
  "pyramid scheme",
  "guaranteed return",
];

const UNLICENSED_LIQUOR_BLOCKLIST = [
  "unlicensed liquor",
  "illegal liquor sale",
  "sell alcohol without licence",
  "bootleg liquor",
];

export function sanitizeGuestComment(text: string | null | undefined): string | null {
  if (!text || !String(text).trim()) return null;
  let cleaned = String(text).trim().slice(0, 280);
  // Mask raw 10-digit SA mobile numbers (06x-08x or +27) accidentally pasted on the public wall (POPIA anti-self-doxxing)
  cleaned = cleaned.replace(
    /(?:\+27|0)[6-8][0-9][\s\-]?[0-9]{3}[\s\-]?[0-9]{4}\b/g,
    "[Phone Hidden for POPIA]"
  );
  // Mask raw email addresses pasted into public comments
  cleaned = cleaned.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    "[Email Hidden for POPIA]"
  );
  return cleaned;
}

export function deriveGatePin(tokenOrId: string): string {
  const seed = String(tokenOrId || "pullthru-pass");
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const pinNum = 1000 + (Math.abs(hash) % 9000);
  return String(pinNum);
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildWordPattern(word: string): string {
  const lower = word.toLowerCase();
  // Consonant + 'y' pluralization (e.g., society -> societies, lottery -> lotteries, policy -> policies)
  if (lower.length > 2 && /[^aeiou]y$/.test(lower)) {
    const stem = escapeRegExp(lower.slice(0, -1));
    return `${stem}(?:y|ies)`;
  }
  return `${escapeRegExp(lower)}(?:e?s)?`;
}

function containsBlockedPhrase(text: string, phrase: string): boolean {
  const normalizedText = (text || "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/_/g, " ");
  // Also normalize common leetspeak & separator obfuscations (e.g. r4ffl3, r-a-f-f-l-e, r.a.f.f.l.e)
  const deLeeted = normalizedText
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/([a-zA-Z])[.\-*]+(?=[a-zA-Z])/g, "$1");
  if (phrase === "50/50") {
    return /\b50\s*[/\-]\s*50\b/i.test(normalizedText);
  }
  const tokens = phrase
    .trim()
    .split(/[\s\-/]+/)
    .filter(Boolean);
  const patternStr = tokens.map(buildWordPattern).join("[\\s\\-/]+");
  const pattern = new RegExp(`\\b${patternStr}\\b`, "i");
  return pattern.test(normalizedText) || pattern.test(deLeeted);
}

export function validateEventCompliance(
  title: string,
  description: string = "",
  additionalTexts: string[] = []
): {
  compliant: boolean;
  reason?: string;
  statute?: string;
} {
  const extra = Array.isArray(additionalTexts) ? additionalTexts.join(" ") : "";
  const combined = `${title || ""} ${description || ""} ${extra}`;

  for (const term of GAMBLING_BLOCKLIST) {
    if (containsBlockedPhrase(combined, term)) {
      return {
        compliant: false,
        statute: "National Gambling Act 7 of 2004",
        reason: `Events involving "${term}" or games of chance/sports pools are prohibited on PullThru under the National Gambling Act 7 of 2004. PullThru is strictly for non-speculative social event cost-sharing and group gifts.`,
      };
    }
  }

  for (const term of INSURANCE_FINANCIAL_BLOCKLIST) {
    if (containsBlockedPhrase(combined, term)) {
      return {
        compliant: false,
        statute: "Insurance Act 18 of 2017 / Friendly Societies Act",
        reason: `Recurring policies, burial societies, or investment pools ("${term}") require FSCA/Prudential Authority licensing under the Insurance Act 18 of 2017. Note: One-off bereavement condolence pots ("condolence", "umgalelo", "bereavement", "imali yenduduzo", "memorial") are permitted.`,
      };
    }
  }

  for (const term of UNLICENSED_LIQUOR_BLOCKLIST) {
    if (containsBlockedPhrase(combined, term)) {
      return {
        compliant: false,
        statute: "Liquor Act 59 of 2003",
        reason: `Unlicensed commercial alcohol retail ("${term}") is prohibited under the Liquor Act 59 of 2003. Private invite-only BYOB or non-profit group cost-sharing is permitted for 18+ guests.`,
      };
    }
  }

  return { compliant: true };
}

export const MAX_SINGLE_CONTRIBUTION_ZAR = 5000;
export const MAX_UNVERIFIED_EVENT_POOL_ZAR = 25000;
export const AUTO_SETTLEMENT_THRESHOLD_ZAR = 3000;

export function validateVelocityCaps(params: {
  totalBasePriceZar: number;
  currentPoolRaisedZar?: number;
  trustTier?: TrustTier;
}): {
  valid: boolean;
  error?: string;
} {
  const {
    totalBasePriceZar,
    currentPoolRaisedZar = 0,
    trustTier = "tier_0_new",
  } = params;

  if (!Number.isFinite(totalBasePriceZar) || totalBasePriceZar < 0) {
    return {
      valid: false,
      error: "Contribution amount must be a valid non-negative number.",
    };
  }

  if (!Number.isFinite(currentPoolRaisedZar) || currentPoolRaisedZar < 0) {
    return {
      valid: false,
      error: "Current pool amount must be a valid non-negative number.",
    };
  }

  if (totalBasePriceZar > MAX_SINGLE_CONTRIBUTION_ZAR) {
    return {
      valid: false,
      error: `FICA & Anti-Fraud Velocity Cap: Maximum single contribution is R${MAX_SINGLE_CONTRIBUTION_ZAR.toLocaleString("en-ZA")}.00 per checkout.`,
    };
  }

  if (
    trustTier === "tier_0_new" &&
    currentPoolRaisedZar + totalBasePriceZar > MAX_UNVERIFIED_EVENT_POOL_ZAR
  ) {
    return {
      valid: false,
      error: `SARB / FICA Tier-0 Pool Cap: Unverified event pools are capped at R${MAX_UNVERIFIED_EVENT_POOL_ZAR.toLocaleString("en-ZA")}.00 total.`,
    };
  }

  return { valid: true };
}

export function determineSettlementSchedule(params: {
  mode: EventMode;
  priceZar: number;
  maxSpots: number | null;
  targetPotZar?: number | null;
  trustTier?: TrustTier;
  tiers?: { price_zar: number }[];
  isPublic?: boolean;
}): {
  schedule: "auto" | "manual";
  estimatedPoolZar: number;
  explanation: string;
} {
  const { mode, priceZar, maxSpots, targetPotZar, trustTier, tiers, isPublic } = params;

  const basePrice = Number.isFinite(priceZar) && priceZar > 0 ? priceZar : 0;
  const maxTierPrice =
    mode === "tiered" && Array.isArray(tiers) && tiers.length > 0
      ? Math.max(0, ...tiers.map((t) => Number(t?.price_zar) || 0))
      : 0;
  const safePrice =
    mode === "tiered" ? Math.max(basePrice, maxTierPrice) : basePrice;
  const hasExplicitSpots =
    maxSpots !== null &&
    maxSpots !== undefined &&
    Number.isFinite(maxSpots) &&
    maxSpots > 0;
  const safeSpots = hasExplicitSpots ? maxSpots : 15;
  const safeTargetPot =
    targetPotZar !== null &&
    targetPotZar !== undefined &&
    Number.isFinite(targetPotZar) &&
    targetPotZar > 0
      ? targetPotZar
      : safePrice * 15;

  const estimatedPoolZar =
    mode === "free"
      ? 0
      : mode === "pot"
        ? safeTargetPot
        : safePrice * safeSpots;

  // Uncapped paid events without an explicit spots limit or public discovery events from unverified hosts must default to protected post-event settlement
  const isUncappedPaid =
    (mode === "fixed" || mode === "tiered") && !hasExplicitSpots;
  const isPublicUnverifiedPaid =
    Boolean(isPublic) && mode !== "free" && trustTier !== "tier_1_trusted";

  if (
    !isUncappedPaid &&
    !isPublicUnverifiedPaid &&
    (estimatedPoolZar <= AUTO_SETTLEMENT_THRESHOLD_ZAR ||
      trustTier === "tier_1_trusted")
  ) {
    return {
      schedule: "auto",
      estimatedPoolZar,
      explanation:
        "Auto T+1 Next-Morning Payout (Pool ≤ R3,000 — funds settle directly to your SA bank account before your event so you can pay the turf or buy braai supplies).",
    };
  }

  return {
    schedule: "manual",
    estimatedPoolZar,
    explanation: isPublicUnverifiedPaid
      ? "Buyer Protection Hold (Public Event — funds settle the first business day after your event and guest check-in to protect attendees against no-shows)."
      : isUncappedPaid
      ? "Protected Post-Event Settlement (Uncapped guest limit requires post-event settlement to protect against card chargebacks)."
      : "Protected Post-Event Settlement (New Host Pool > R3,000 — funds settle the first business day after your event to protect against card chargebacks).",
  };
}

export const BANTER_BADGES: string[] = [
  "🥩 Braai Master Sponsor",
  "⚽ Midfield General (Paid on Time)",
  "🍻 Here for the Gees",
  "💳 Paid Before Payday (Big Flex)",
  "🎾 Padel Court Boss",
  "🧊 Ice & Cooler Box Legend",
  "❤️ Community Blessing",
  "⚡ Early Bird Champ",
];

export function getBanterBadgesForEvent(event?: {
  mode?: string;
  category_vibe?: string;
  title?: string;
  description?: string;
}): string[] {
  const mode = event?.mode || "";
  const title = (event?.title || "").toLowerCase();
  const vibe = (event?.category_vibe || "").toLowerCase();
  const desc = (event?.description || "").toLowerCase();
  const combined = `${title} ${vibe} ${desc}`;

  // Condolence / Bereavement
  if (
    combined.includes("condolence") ||
    combined.includes("funeral") ||
    combined.includes("induduzo") ||
    combined.includes("bereavement") ||
    combined.includes("sympathy")
  ) {
    return [
      "🕊️ With Deepest Sympathy & Love",
      "🤝 Community Pillar (Imali Yenduduzo)",
      "💐 Thinking of the Family",
      "🙏 Siyabonga / Thank You for Standing With Us",
      "❤️ Standing in Solidarity",
      "⭐ Always Remembered",
    ];
  }

  // Gift Pot / Baby Shower / Kitty
  if (
    mode === "pot" ||
    combined.includes("baby shower") ||
    combined.includes("gift") ||
    combined.includes("kitty") ||
    combined.includes("farewell")
  ) {
    return [
      "🍼 With Love & Blessings for Baby",
      "💐 Mom & Baby Blessing",
      "❤️ Community Love & Support",
      "🎁 Gift Pot Contributor",
      "🙏 Siyabonga / Ngiyabonga",
      "⭐ Group Legend",
    ];
  }

  // Sports: 5-a-Side, Padel, Touch Rugby, Golf
  if (
    combined.includes("5-a-side") ||
    combined.includes("soccer") ||
    combined.includes("football") ||
    combined.includes("padel") ||
    combined.includes("rugby") ||
    combined.includes("golf") ||
    combined.includes("fives")
  ) {
    return [
      "⚽ Midfield General (Paid on Time)",
      "🏃‍♂️ Box-to-Box Engine",
      "🧤 Safe Hands in Goal",
      "🎾 Padel Court Boss",
      "⚡ Early Bird Champ",
      "💳 Paid Before Payday (Big Flex)",
      "🍻 Here for the Gees",
    ];
  }

  // Default Braai / Spitbraai / Social
  return [
    "🥩 Braai Master Sponsor",
    "🔥 Sekelbos & Fire Legend",
    "🧊 Ice & Cooler Box Captain",
    "🍻 Here for the Gees",
    "💳 Paid Before Payday (Big Flex)",
    "⚡ Early Bird Champ",
    "👑 Captain's Pick",
    "❤️ Community Blessing",
  ];
}
