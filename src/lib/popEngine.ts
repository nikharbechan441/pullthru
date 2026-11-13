/**
 * PullThru South African Bank Proof-of-Payment (POP) Verification Engine
 *
 * Deterministic parsing, fraud classification, underpayment guard, and SHA-256 deduplication
 * for South African peer-to-peer banking rails:
 * - Capitec Bank & Capitec PayMe
 * - First National Bank (FNB) & FNB PayShap
 * - Standard Bank (Stanbic) & Instant Money
 * - Nedbank & Nedbank PayShap
 * - Absa Bank & Absa PayShap
 * - TymeBank & SendMoney
 * - Discovery Bank & Discovery Pay
 * - Bank Zero, Investec, African Bank, Sasfin
 * - Direct SARB PayShap instant clearing
 *
 * Detects & Rejects Fakes:
 * - Airtime / mobile data recharges
 * - ATM cash withdrawals & cardless cash-out
 * - Retail in-store POS card swipes (Checkers, Pick n Pay, Woolworths, etc.)
 * - Bank debit orders & recurring subscription deductions
 * - Prepaid electricity & municipal utility purchases
 * - Casino / sports betting vouchers (Hollywoodbets, Betway, etc.)
 * - Incoming salary/deposits (wrong direction)
 * - Underpayment / partial amount tampering
 * - Casual chat / social engineering ("paid bro", "trust me")
 * - 0-byte or corrupted POP screenshot/PDF files
 * - Re-used duplicate POP slips / SMSes via canonical SHA-256 deduplication
 */

export type SaBankId =
  | "capitec"
  | "fnb"
  | "standard_bank"
  | "nedbank"
  | "absa"
  | "tymebank"
  | "discovery"
  | "payshap"
  | "other_sa_bank";

export type PopPaymentRail = "instant_payshap" | "capitec_payme" | "standard_eft";

export interface PopSmsParseResult {
  isValid: boolean;
  isFake: boolean;
  bankId: SaBankId | null;
  bankName: string | null;
  paymentRail: PopPaymentRail;
  detectedAmountZar: number | null;
  expectedAmountZar: number | null;
  isUnderpaid: boolean;
  reference: string | null;
  recipient: string | null;
  confidence: number; // 0 - 100
  rejectionReason: string | null;
  canonicalHash: string; // "pop_sms_<sha256>"
  rawCleanedText: string;
}

export interface PopFileValidationResult {
  isValid: boolean;
  rejectionReason: string | null;
}

// ---------------------------------------------------------------------------
// Pure TypeScript Synchronous SHA-256 (Isomorphic: Node, Browser, Edge, Tests)
// ---------------------------------------------------------------------------
function sha256Sync(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = "length";
  let i = 0;
  let j = 0;
  let result = "";

  const words: number[] = [];
  const asciiBitLength = ascii[lengthProperty] * 8;

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
    0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
    0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
    0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
    0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) {
      // utf-8 multi-byte sequence
      words[i >> 2] |= (j & 0xff) << ((3 - (i % 4)) * 8);
    } else {
      words[i >> 2] |= j << ((3 - (i % 4)) * 8);
    }
  }

  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  const w: number[] = new Array(64);
  const wordsLength = words[lengthProperty];

  for (i = 0; i < wordsLength; i += 16) {
    const oldHash = hash.slice(0);

    for (j = 0; j < 64; j++) {
      if (j < 16) {
        w[j] = words[i + j] | 0;
      } else {
        const s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        const s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }

      const s1 = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 = (hash[7] + s1 + ch + k[j] + w[j]) | 0;
      const s0 = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = (s0 + maj) | 0;

      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (temp1 + temp2) | 0;
    }

    for (j = 0; j < 8; j++) {
      hash[j] = (hash[j] + oldHash[j]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? "0" : "") + b.toString(16);
    }
  }

  return result;
}

/**
 * Normalizes South African bank SMS text into a canonical format
 * by stripping carrier headers, timestamps, and whitespace variance.
 */
export function normalizeBankSmsText(smsText: string): string {
  return smsText
    .trim()
    .replace(/^sms:\s*/i, "")
    .replace(/^from:\s*[^;\n\r]+[;\n\r]+/i, "")
    .replace(/^(?:date|time):\s*[^;\n\r]+[;\n\r]+/i, "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

/**
 * Computes a deterministic canonical SHA-256 hash for an SMS proof-of-payment.
 */
export function computeCanonicalSmsHash(smsText: string): string {
  const norm = normalizeBankSmsText(smsText);
  return `pop_sms_${sha256Sync(norm)}`;
}

/**
 * Known South African Bank Identification Signatures
 */
interface BankSignature {
  id: SaBankId;
  name: string;
  defaultRail: PopPaymentRail;
  matches: (text: string) => boolean;
}

const SA_BANK_SIGNATURES: BankSignature[] = [
  {
    id: "capitec",
    name: "Capitec PayMe",
    defaultRail: "capitec_payme",
    matches: (t) => /capitec\s*payme/i.test(t),
  },
  {
    id: "capitec",
    name: "Capitec Bank",
    defaultRail: "capitec_payme",
    matches: (t) => /capitec/i.test(t),
  },
  {
    id: "fnb",
    name: "FNB (First National Bank)",
    defaultRail: "standard_eft",
    matches: (t) => /fnb\s*[:\-\)]|fnb|first\s*national\s*bank|firstrand/i.test(t),
  },
  {
    id: "standard_bank",
    name: "Standard Bank",
    defaultRail: "standard_eft",
    matches: (t) => /standard\s*bank|stdbank|standardbank|sbza/i.test(t),
  },
  {
    id: "nedbank",
    name: "Nedbank",
    defaultRail: "standard_eft",
    matches: (t) => /nedbank|ned\s*app/i.test(t),
  },
  {
    id: "absa",
    name: "Absa Bank",
    defaultRail: "standard_eft",
    matches: (t) => /absa/i.test(t),
  },
  {
    id: "tymebank",
    name: "TymeBank",
    defaultRail: "standard_eft",
    matches: (t) => /tymebank|tyme\b/i.test(t),
  },
  {
    id: "discovery",
    name: "Discovery Bank",
    defaultRail: "standard_eft",
    matches: (t) => /discovery\s*bank|discovery\s*pay/i.test(t),
  },
  {
    id: "payshap",
    name: "PayShap Instant Transfer",
    defaultRail: "instant_payshap",
    matches: (t) => /payshap|shapid|@payshap/i.test(t),
  },
  {
    id: "other_sa_bank",
    name: "Bank Zero / SA Bank",
    defaultRail: "standard_eft",
    matches: (t) => /bank\s*zero|investec|sasfin|african\s*bank|bidvest\s*bank/i.test(t),
  },
];

/**
 * Extracts the ZAR payment amount from a South African bank SMS.
 * Accurately isolates the transaction amount while ignoring account balances or fees.
 */
export function extractZarAmountFromSms(text: string): number | null {
  // First, strip out available balance clauses to avoid confusing balances with payment amounts
  // e.g., "Avail R1,200.00", "Available Bal: R3,410.00", "Bal R10,000", "Fee R1.50"
  const textWithoutBalances = text
    .replace(/(?:avail(?:able)?|bal(?:ance)?)\s*(?:bal:?|is:?)?\s*(?:r|zar)\s*[0-9]{1,3}(?:[,\s][0-9]{3})*(?:\.[0-9]{2})?/gi, " ")
    .replace(/(?:fee:?)\s*(?:r|zar)\s*[0-9]+(?:\.[0-9]{2})?/gi, " ");

  // High-confidence Pattern 1: Verb then Amount
  // e.g. "payment of R220.00", "paid R150", "transfer of R1,500.00", "Notice of Payment: R220.00", "PayMe: R250.00"
  const verbThenAmountRegex = /(?:payment\s+of|paid|transfer\s+of|sent|payshap\s+payment\s+of|notice\s+of\s+payment:?|payme:?|payme\s+payment\s+of)\s*(?:of\s*)?(?:r|zar)\s*([0-9]{1,3}(?:[,\s][0-9]{3})*(?:\.[0-9]{2})?|[0-9]+(?:\.[0-9]{2})?)/i;
  const match1 = textWithoutBalances.match(verbThenAmountRegex);
  if (match1 && match1[1]) {
    const rawNum = match1[1].replace(/,/g, "").replace(/\s+/g, "");
    const val = parseFloat(rawNum);
    if (!isNaN(val) && val > 0) return Math.round(val * 100) / 100;
  }

  // High-confidence Pattern 2: Amount then Verb
  // e.g. "R250.00 paid from a/c", "R150.00 sent to", "R222.00 transferred", "R220.00 has been paid"
  const amountThenVerbRegex = /(?:r|zar)\s*([0-9]{1,3}(?:[,\s][0-9]{3})*(?:\.[0-9]{2})?|[0-9]+(?:\.[0-9]{2})?)\s+(?:paid|sent|transferred|has\s+been\s+paid)/i;
  const match2 = textWithoutBalances.match(amountThenVerbRegex);
  if (match2 && match2[1]) {
    const rawNum = match2[1].replace(/,/g, "").replace(/\s+/g, "");
    const val = parseFloat(rawNum);
    if (!isNaN(val) && val > 0) return Math.round(val * 100) / 100;
  }

  // Fallback Pattern 3: Any remaining explicit R/ZAR amount in cleaned text
  const genericAmountRegex = /(?:r|zar)\s*([0-9]{1,3}(?:[,\s][0-9]{3})*(?:\.[0-9]{2})?|[0-9]+(?:\.[0-9]{2})?)/i;
  const match3 = textWithoutBalances.match(genericAmountRegex);
  if (match3 && match3[1]) {
    const rawNum = match3[1].replace(/,/g, "").replace(/\s+/g, "");
    const val = parseFloat(rawNum);
    if (!isNaN(val) && val > 0) return Math.round(val * 100) / 100;
  }

  return null;
}

/**
 * Extracts transaction reference code from SMS if present (e.g., PT-JABU, Ref 9921, Ref. PT-...)
 */
export function extractReferenceFromSms(text: string): string | null {
  // PullThru explicit reference code: PT-XXXX
  const ptMatch = text.match(/\b(PT-[A-Za-z0-9_-]{2,20})\b/i);
  if (ptMatch) return ptMatch[1].toUpperCase();

  // Bank standard reference: Ref: XXXXX or Ref. XXXXX
  const refMatch = text.match(/\b(?:ref|reference)[:.]?\s*([A-Za-z0-9_-]{3,24})/i);
  if (refMatch) return refMatch[1];

  return null;
}

/**
 * Extracts recipient or ShapID if present
 */
export function extractRecipientFromSms(text: string): string | null {
  const toMatch = text.match(/(?:paid\s+to|sent\s+to|transfer\s+to|payment\s+to)\s+([A-Za-z0-9\s.@_#-]{2,30}?)(?:\s+from|\s+on|\s+ref|\.|\s+using|$)/i);
  if (toMatch) {
    const recipient = toMatch[1].trim();
    if (recipient && !/^(?:a\/c|account|savings|current)/i.test(recipient)) {
      return recipient;
    }
  }
  return null;
}

/**
 * Comprehensive Parser & Anti-Fraud Engine for South African Bank POP SMS
 */
export function parseSaBankSms(
  smsText: string,
  expectedAmountZar?: number | null,
  expectedHostName?: string | null
): PopSmsParseResult {
  const rawText = String(smsText || "").trim();
  const canonicalHash = computeCanonicalSmsHash(rawText);

  // Default invalid baseline
  const baseResult: PopSmsParseResult = {
    isValid: false,
    isFake: false,
    bankId: null,
    bankName: null,
    paymentRail: "instant_payshap",
    detectedAmountZar: null,
    expectedAmountZar: expectedAmountZar ? Math.round(expectedAmountZar * 100) / 100 : null,
    isUnderpaid: false,
    reference: null,
    recipient: null,
    confidence: 0,
    rejectionReason: null,
    canonicalHash,
    rawCleanedText: rawText,
  };

  // 1. Minimum sanity length check
  if (!rawText || rawText.length < 12) {
    return {
      ...baseResult,
      isFake: true,
      rejectionReason:
        "Please paste your complete South African bank payment confirmation SMS (must include bank name, amount, or payment reference).",
    };
  }

  // 2. Anti-Fraud Vector: Airtime & Mobile Data Recharges
  if (
    /(?:airtime|data bundle|recharge|vodacom airtime|mtn airtime|cell c airtime|telkom mobile airtime)/i.test(
      rawText
    )
  ) {
    return {
      ...baseResult,
      isFake: true,
      confidence: 95,
      rejectionReason:
        "Invalid POP: This appears to be an airtime or mobile data recharge, not an EFT or PayShap transfer to the host.",
    };
  }

  // 3. Anti-Fraud Vector: Cash / ATM / Cardless Withdrawals
  if (
    /(?:cash withdrawal|atm withdrawal|cardless cash|cardless withdrawal|withdrawn at atm|cash out|branch cash)/i.test(
      rawText
    )
  ) {
    return {
      ...baseResult,
      isFake: true,
      confidence: 95,
      rejectionReason:
        "Invalid POP: This is a cash or ATM withdrawal, not an EFT or PayShap payment to the host.",
    };
  }

  // 4. Anti-Fraud Vector: Retail In-Store POS Card Swipes & Supermarket Purchases
  if (
    /(?:purchase at|card swipe|pos purchase|pos transaction|swiped at|(?:paid|purchased)\s+(?:at|to)\s+(?:checkers|pick\s*n\s*pay|woolworths|spar|shoprite|shell|engen|sasol|total|uber|takealot|mcdonalds|kfc|debonairs|steers|nandos))/i.test(
      rawText
    )
  ) {
    return {
      ...baseResult,
      isFake: true,
      confidence: 90,
      rejectionReason:
        "Invalid POP: This is a retail store card swipe or merchant purchase, not a transfer to the host.",
    };
  }

  // 5. Anti-Fraud Vector: Bank Debit Orders & Recurring Deductions
  if (
    /(?:debit order|stop order|mandate deduction|insurance debit|loan deduction)/i.test(
      rawText
    )
  ) {
    return {
      ...baseResult,
      isFake: true,
      confidence: 95,
      rejectionReason:
        "Invalid POP: This is a bank debit order or monthly subscription deduction, not a transfer to the host.",
    };
  }

  // 6. Anti-Fraud Vector: Prepaid Electricity & Municipal Utilities
  if (
    /(?:prepaid electricity|eskom|city power|municipality token|water token|meter token)/i.test(
      rawText
    )
  ) {
    return {
      ...baseResult,
      isFake: true,
      confidence: 95,
      rejectionReason:
        "Invalid POP: This is a prepaid electricity or municipal utility purchase, not a transfer to the host.",
    };
  }

  // 7. Anti-Fraud Vector: Casino / Sports Betting Vouchers
  if (
    /(?:hollywoodbets|betway|supabets|betting|lotto|powerball|1voucher|ott voucher|blu voucher)/i.test(
      rawText
    )
  ) {
    return {
      ...baseResult,
      isFake: true,
      confidence: 95,
      rejectionReason:
        "Invalid POP: This is a betting voucher or gambling deposit, not a transfer to the host.",
    };
  }

  // 8. Anti-Fraud Vector: Incoming Money / Deposits (Wrong Direction)
  // Check if guest received money rather than paid out (excluding Capitec PayMe receipts which hosts receive or display)
  const isIncomingMoney =
    /(?:money in|credited with|salary deposit|deposit of (?:r|zar)|received from)/i.test(
      rawText
    ) &&
    !/(?:paid to|sent to|payment of|capitec payme:)/i.test(rawText);

  if (isIncomingMoney) {
    return {
      ...baseResult,
      isFake: true,
      confidence: 85,
      rejectionReason:
        "Invalid POP: This SMS indicates an incoming deposit or salary credited to your account, not an outbound payment to the host.",
    };
  }

  // 9. Bank Identification
  let detectedBank: BankSignature | null = null;
  for (const sig of SA_BANK_SIGNATURES) {
    if (sig.matches(rawText)) {
      detectedBank = sig;
      break;
    }
  }

  // 10. Extract Amount
  const detectedAmountZar = extractZarAmountFromSms(rawText);

  // 11. Extract Reference & Recipient
  const reference = extractReferenceFromSms(rawText);
  const recipient = extractRecipientFromSms(rawText);

  // 12. Check for Casual Chat / Kansvatter Texts
  // If there's no bank identified AND no valid currency amount, it's casual chat / fake
  const hasPaymentIndicator = /(?:paid|payment|transfer|payshap|payme|sent|notice of payment)/i.test(
    rawText
  );

  if (!detectedBank && (!detectedAmountZar || !hasPaymentIndicator)) {
    return {
      ...baseResult,
      isFake: true,
      confidence: 95,
      rejectionReason:
        "Unrecognized POP format: No South African bank payment confirmation detected. Please paste the exact confirmation SMS received from your bank.",
    };
  }

  if (!detectedAmountZar) {
    return {
      ...baseResult,
      isFake: true,
      bankId: detectedBank ? detectedBank.id : null,
      bankName: detectedBank ? detectedBank.name : null,
      confidence: 80,
      rejectionReason:
        "Could not detect the ZAR payment amount in this SMS. Please ensure the 'R' amount is visible in the text.",
    };
  }

  // Determine Payment Rail
  let rail: PopPaymentRail = detectedBank ? detectedBank.defaultRail : "standard_eft";
  if (/payshap|shapid|@payshap/i.test(rawText)) {
    rail = "instant_payshap";
  } else if (/capitec\s*payme/i.test(rawText)) {
    rail = "capitec_payme";
  }

  // 13. Underpayment Verification
  let isUnderpaid = false;
  if (expectedAmountZar !== undefined && expectedAmountZar !== null && expectedAmountZar > 0) {
    // Round to 2 decimal places to avoid floating point anomalies
    const expected = Math.round(expectedAmountZar * 100) / 100;
    if (detectedAmountZar < expected) {
      isUnderpaid = true;
      return {
        ...baseResult,
        isValid: false,
        isFake: true,
        bankId: detectedBank ? detectedBank.id : "other_sa_bank",
        bankName: detectedBank ? detectedBank.name : "South African Bank",
        paymentRail: rail,
        detectedAmountZar,
        isUnderpaid: true,
        reference,
        recipient,
        confidence: 90,
        rejectionReason: `Underpaid amount: The SMS shows a payment of R${detectedAmountZar.toFixed(
          2
        )}, but locking your spot(s) requires R${expected.toFixed(2)}. Please pay the difference to the host.`,
      };
    }
  }

  // Calculate Confidence Score
  let confidence = 70;
  if (detectedBank) confidence += 15;
  if (detectedAmountZar) confidence += 10;
  if (reference) confidence += 5;

  return {
    isValid: true,
    isFake: false,
    bankId: detectedBank ? detectedBank.id : "other_sa_bank",
    bankName: detectedBank ? detectedBank.name : "Verified SA Bank Transfer",
    paymentRail: rail,
    detectedAmountZar,
    expectedAmountZar: expectedAmountZar || null,
    isUnderpaid: false,
    reference,
    recipient,
    confidence: Math.min(100, confidence),
    rejectionReason: null,
    canonicalHash,
    rawCleanedText: rawText,
  };
}

/**
 * Validates uploaded Proof-of-Payment file metadata (size, format, mime)
 */
export function validatePopFile(fileMeta: {
  name: string;
  size: number;
  type?: string;
}): PopFileValidationResult {
  const { name, size, type } = fileMeta;

  if (size < 1024) {
    return {
      isValid: false,
      rejectionReason:
        "The uploaded file is empty or corrupted (< 1 KB). Please upload a valid bank POP screenshot or PDF slip.",
    };
  }

  if (size > 15 * 1024 * 1024) {
    return {
      isValid: false,
      rejectionReason:
        "The uploaded file is too large (> 15 MB). Please upload a standard mobile screenshot or PDF slip.",
    };
  }

  const ext = (name.split(".").pop() || "").toLowerCase();
  const allowedExtensions = new Set(["png", "jpg", "jpeg", "webp", "pdf"]);
  if (!allowedExtensions.has(ext)) {
    return {
      isValid: false,
      rejectionReason:
        "Unsupported file format. Please upload an image (.png, .jpg, .webp) or PDF bank receipt.",
    };
  }

  const suspiciousExtensions = new Set(["exe", "bat", "sh", "txt", "csv", "zip", "tar"]);
  if (suspiciousExtensions.has(ext)) {
    return {
      isValid: false,
      rejectionReason:
        "Invalid file type. Executables, scripts, and archives are strictly prohibited.",
    };
  }

  return {
    isValid: true,
    rejectionReason: null,
  };
}

/**
 * Authentic South African Bank POP SMS Test Fixtures
 */
export const SAMPLE_REAL_POPS = {
  capitec_standard:
    "Capitec: R150.00 paid to Tariq from savings a/c ..1234. Avail R2,450.00. Ref PT-JABU 28/10/2026",
  capitec_payme:
    "Capitec PayMe: Payment of R222.00 to S DLAMINI was successful on 28/10/2026. Ref PT-JABU",
  fnb_standard:
    "FNB :-) R250.00 paid from a/c..5678 to T KHUMALO. Ref. PT-JABU 28Oct 21:14. Avail Bal R1,200.00.",
  fnb_payshap:
    "FNB :-) R150.00 sent to 0821234567 using PayShap. Ref PT-SIPHO. 28Oct 18:30.",
  standard_bank:
    "Standard Bank: Your payment of R250.00 to Tariq on 28-10-2026 was successful. Ref: PT-JABU. Avail Bal: R3,410.00.",
  nedbank:
    "Nedbank: You have paid R220.00 to Tariq on 28/10. Ref: PT-JABU. Avail balance R4,300.00.",
  absa:
    "Absa: Notice of Payment: R220.00 has been paid to Tariq. Ref: PT-JABU on 28/10/2026. Available Bal R2,150.00.",
  tymebank:
    "TymeBank: You paid R220.00 to Tariq. Ref: PT-JABU on 28 Oct 2026. Avail bal R800.00.",
  discovery:
    "Discovery Bank: Payment of R220.00 to Tariq was successful. Ref: PT-JABU. Avail Bal: R5,600.00.",
  payshap_direct:
    "PayShap payment of R220.00 to 0829991234@payshap successful. Ref: PT-JABU.",
};

/**
 * Fake & Hostile POP Test Fixtures (Must All Be Detected & Rejected)
 */
export const SAMPLE_FAKE_POPS = {
  airtime:
    "Airtime purchase of R50.00 successful on 28/10. Avail R120.00.",
  atm_withdrawal:
    "Capitec: Cash withdrawal of R500.00 at Sandton City ATM. Avail R1,200.00.",
  retail_swipe:
    "FNB :-) R349.50 paid to Checkers Sandton. Avail Bal R1,200.00.",
  debit_order:
    "Nedbank: Debit order of R250.00 to Planet Fitness successful. Ref #9921.",
  prepaid_electricity:
    "Standard Bank: Prepaid electricity purchase of R200.00 successful. Meter 041928491.",
  inward_deposit:
    "Capitec: Money in: R500.00 received from Sipho. Avail R2,500.00.",
  betting_voucher:
    "Absa: Payment of R200.00 to Hollywoodbets successful. Ref: Bet123.",
  casual_chat_1:
    "I paid bro trust me Tariq",
  casual_chat_2:
    "sent on whatsapp 0821234567",
  underpaid_capitec:
    "Capitec: R20.00 paid to Tariq from savings a/c ..1234. Avail R2,450.00. Ref PT-JABU",
};
