/**
 * PullThru RAG-Ready Knowledge Base & Deterministic Troubleshooting Engine
 * Strictly adheres to rag-knowledge-base-architect:
 * - One user problem per entry
 * - Deterministic numbered 1-2-3 steps naming exact UI buttons in **bold**
 * - Self-contained 100–250 word modular chunks for zero-hallucination AI/human retrieval
 */

export interface KnowledgeArticle {
  id: string;
  question: string;
  category: "guest_payment" | "gate_pass" | "host_tools" | "billing_club_pass";
  tags: string[];
  applicableRoutes: string[]; // e.g. ["/create", "/e/", "/help", "/"]
  summary: string;
  steps: string[];
  directActionLabel?: string;
  directActionUrl?: string;
}

export const PULLTHRU_KNOWLEDGE_BASE: KnowledgeArticle[] = [
  {
    id: "payshap-how-to-pay",
    question: "How do I lock in my spot via Direct PayShap with R0 guest fees?",
    category: "guest_payment",
    tags: ["payshap", "payment", "checkout", "guest fee", "bank"],
    applicableRoutes: ["/e/"],
    summary:
      "PullThru charges guests R0.00 platform fees. You pay the host directly from your banking app in real-time using their PayShap ID or cell number.",
    steps: [
      "On the event page, tap **Lock In Spot** and choose your ticket tier.",
      "Select **Direct PayShap / Capitec PayMe** and tap **Copy Host PayShap ID** (their cell number).",
      "Open your banking app (Capitec, FNB, Nedbank, Standard Bank, Absa, Discovery, or TymeBank).",
      "Go to **PayShap / Instant Payment**, enter the host's cell number, and transfer the exact ticket amount.",
      "Copy your bank's instant confirmation SMS and paste it into the **Bank SMS Confirmation** field in PullThru, or upload your PDF/screenshot.",
      "Your spot is verified in 2 seconds and your 4-digit **Secret Gate PIN** unlocks immediately.",
    ],
  },
  {
    id: "pop-sms-missing",
    question: "What if my banking app didn't send an SMS confirmation for my payment?",
    category: "guest_payment",
    tags: ["sms", "pop", "proof of payment", "capitec", "missing sms", "pdf"],
    applicableRoutes: ["/e/"],
    summary:
      "If you receive in-app push notifications instead of SMS, you can easily verify your spot using your bank's official Proof of Payment (POP) PDF or screenshot.",
    steps: [
      "In your banking app, open your **Transaction History** or **Sent Payments**.",
      "Tap the transfer to the host and select **Share Proof of Payment (PDF or Image)**.",
      "Save the PDF or screenshot to your phone.",
      "In PullThru's spot-locking drawer, tap **Upload PDF or Screenshot Slip**.",
      "Select your file. The cryptographic POP engine extracts the amount and unlocks your pass in volatile memory with zero storage of personal banking data.",
    ],
  },
  {
    id: "gate-pin-lookup",
    question: "Where do I find my 4-digit Secret Gate Check-In PIN?",
    category: "gate_pass",
    tags: ["pin", "gate", "ticket", "check in", "secret code"],
    applicableRoutes: ["/e/", "/e/[slug]/success"],
    summary:
      "Every paid and confirmed spot receives a unique 4-digit Gate PIN. It is kept secret until payment is verified to prevent uninvited chancers from entering.",
    steps: [
      "If you just locked in: Your 4-digit PIN is displayed in green on your digital pass with a flashing **Verified** badge.",
      "If you're returning to the event page: Tap the green banner **'🎟️ You're Locked In! • Gate PIN: #XXXX'** at the top of the event page.",
      "If you closed your browser: Tap the **🛡️ Help / Pass** button in the header, select **Recover My Pass**, enter your WhatsApp number, and your PIN will reappear instantly.",
    ],
    directActionLabel: "Lookup My Pass",
    directActionUrl: "#recover-pass",
  },
  {
    id: "spot-swap-friend",
    question: "Can I transfer my spot to a friend if I can no longer attend?",
    category: "gate_pass",
    tags: ["spot swap", "transfer", "refund", "cant make it", "plus one"],
    applicableRoutes: ["/e/", "/e/[slug]/success"],
    summary:
      "PullThru includes a 1-Tap Cryptographic Spot-Swap so you never lose your money if work or life gets in the way.",
    steps: [
      "Open your digital pass or tap **Open My Pass & Spot-Swap** on the event page.",
      "Tap the yellow button **⚡ Transfer / Swap Spot to a Friend**.",
      "Enter your friend's first name and WhatsApp number.",
      "Tap **Confirm Spot-Swap**. PullThru immediately revokes your old Gate PIN and generates a brand-new Gate PIN for your friend.",
      "Share the auto-generated WhatsApp transfer receipt with your friend so they can check in at the gate.",
    ],
  },
  {
    id: "pro-boost-squad-cover",
    question: "How does the '+R2/spot squad covers it' feature work for hosts?",
    category: "host_tools",
    tags: ["r29", "pro boost", "squad cover", "pricing", "free"],
    applicableRoutes: ["/create", "/e/"],
    summary:
      "Organising shouldn't cost you money. For squad events with 7+ spots, checking 'Bake +R2/spot' adds R2 to the ticket price so your squad reimburses your R29 software fee 100%.",
    steps: [
      "When creating a 7+ spot event on **/create**, tick the box **'Bake +R2/spot into ticket price'**.",
      "For a R100 5-a-side pitch fee, your link asks guests for R102. Guests pay R0 checkout fees directly to your bank via PayShap.",
      "With 15 players, you collect R1,530. You settle PullThru's flat R29.00 Pro software pass via Yoco or PayShap.",
      "You have R1,501 in your bank—your pitch fee is paid and your net software fee was **R0.00**.",
    ],
  },
  {
    id: "host-checkin-gate",
    question: "How do I check in players at the gate or pitch as they arrive?",
    category: "host_tools",
    tags: ["host", "check in", "gate", "organizer", "pitch"],
    applicableRoutes: ["/e/"],
    summary:
      "Hosts can check guests in with zero special hardware from any phone browser with offline-safe memory.",
    steps: [
      "Open your event link and ensure **👑 Host View** is active in the top bar.",
      "Scroll to the **Squad Wall** tab.",
      "As each player arrives, either ask for their **4-digit Gate PIN** or their name.",
      "Type their PIN or name into the instant search bar **'🔍 Search guest name, +1, or Gate PIN'**.",
      "Tap the green **Check In** button. Their badge turns to a green checkmark **✅ Checked In** in real time.",
    ],
  },
  {
    id: "host-log-cash",
    question: "How do I log a player who paid me in cash or direct bank EFT?",
    category: "host_tools",
    tags: ["cash", "eft", "manual rsvp", "host control", "squad wall"],
    applicableRoutes: ["/e/"],
    summary:
      "If a teammate hands you physical cash or pays you outside PullThru, you can log them instantly so the spot counter stays accurate.",
    steps: [
      "In **👑 Host View**, tap the **+ Cash** button in the floating host toolbar.",
      "Enter the player's first name, number of spots, and amount settled.",
      "Tap **Log Cash Guest**. Their spot is locked on the Squad Wall with a **💵 Cash / Direct EFT Legend** badge.",
    ],
  },
  {
    id: "cancel-rain-postpone",
    question: "How do I postpone or cancel an event if it rains or the pitch is flooded?",
    category: "host_tools",
    tags: ["rain", "cancel", "postpone", "refund", "weather"],
    applicableRoutes: ["/e/"],
    summary:
      "PullThru provides instant rain-out and postponement controls with direct guest refund ledgers.",
    steps: [
      "In **👑 Host View**, tap the **🌧️ Date** button in the host action bar.",
      "To reschedule: Pick a new date/time and tap **Update Date & Notify Squad**. The Squad Wall remains locked and an updated WhatsApp hype link is generated.",
      "To cancel: Tap **Cancel Event & Freeze Check-In**. Check-in is paused, and a direct refund ledger is logged with the host's direct PayShap details for easy guest reversals.",
    ],
  },
  {
    id: "pause-cancel-club-pass",
    question: "How do I pause or cancel my R79/month Organiser Club Pass?",
    category: "billing_club_pass",
    tags: ["club pass", "cancel", "pause", "r79", "subscription", "holiday"],
    applicableRoutes: ["/", "/help", "/terms"],
    summary:
      "Organisers can pause their pass for off-season breaks (e.g., December holidays) for R0/mo to keep saved rosters, or cancel self-serve in 1 click under ECTA Section 42.",
    steps: [
      "Open the **Instant Help & Support Drawer** (tap the **?** button or press **Shift+?**).",
      "Tap **Manage Club Pass / Cancel**.",
      "If taking an off-season break: Tap **Pause Club Pass for 2 Months (R0/mo)** to keep your squad rosters, previous lineups, and 1-tap clones intact.",
      "If canceling permanently: Tap **Confirm 1-Click Cancellation**. Your subscription stops immediately with zero penalty fees or phone calls required.",
    ],
  },
];

export function searchKnowledgeBase(query: string, currentRoute?: string): KnowledgeArticle[] {
  const cleanQuery = query.trim().toLowerCase();
  
  // If no query, prioritize articles matching current route
  if (!cleanQuery) {
    if (currentRoute) {
      return [...PULLTHRU_KNOWLEDGE_BASE].sort((a, b) => {
        const aMatches = a.applicableRoutes.some((r) => currentRoute.startsWith(r));
        const bMatches = b.applicableRoutes.some((r) => currentRoute.startsWith(r));
        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;
        return 0;
      });
    }
    return PULLTHRU_KNOWLEDGE_BASE;
  }

  return PULLTHRU_KNOWLEDGE_BASE.filter((article) => {
    const matchQuestion = article.question.toLowerCase().includes(cleanQuery);
    const matchSummary = article.summary.toLowerCase().includes(cleanQuery);
    const matchTags = article.tags.some((t) => t.toLowerCase().includes(cleanQuery));
    const matchSteps = article.steps.some((s) => s.toLowerCase().includes(cleanQuery));
    return matchQuestion || matchSummary || matchTags || matchSteps;
  });
}
