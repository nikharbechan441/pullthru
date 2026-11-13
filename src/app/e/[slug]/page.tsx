"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar, { SouthAfricaFlagSvg } from "@/components/Navbar";
import TastefulAdSlot from "@/components/TastefulAdSlot";
import SegmentedControl from "@/components/SegmentedControl";
import BottomSheetDrawer from "@/components/BottomSheetDrawer";
import SquadWallTab from "@/components/event/SquadWallTab";
import BringTab from "@/components/event/BringTab";
import DetailsTab from "@/components/event/DetailsTab";
import { triggerHaptic } from "@/lib/haptics";
import {
  calculateCheckoutSplit,
  calculateTurnoutShortfallSplit,
  formatShortfallTopUpWhatsAppMessage,
  formatZar,
  generateSyntheticEmail,
  normalizeSaPhone,
} from "@/lib/fees";
import { BANTER_BADGES, SA_BANKS, getBanterBadgesForEvent } from "@/lib/compliance";
import {
  parseSaBankSms,
  validatePopFile,
  computeCanonicalSmsHash,
} from "@/lib/popEngine";
import {
  BringItem,
  EventItem,
  GuestRsvp,
  PaymentChannel,
} from "@/types/database";
import {
  ShieldCheck,
  Calendar,
  MapPin,
  Lock,
  Unlock,
  Flame,
  Gift,
  Users,
  ShoppingBag,
  Sparkles,
  Crown,
  Copy,
  Check,
  CloudRain,
  Banknote,
  Smartphone,
  CreditCard,
  Building2,
  Apple,
  Fingerprint,
  Clock,
  ArrowRight,
  AlertCircle,
  Share2,
  X,
  EyeOff,
  HelpCircle,
  Bell,
  BellRing,
} from "lucide-react";

interface StoredGuestProfile {
  buyerName: string;
  buyerWhatsapp: string;
  buyerEmail?: string;
}

const DEMO_SLUGS = new Set([
  "thursday-fives-sandton",
  "bokke-test-spitbraai",
  "mrs-dlamini-baby-shower",
  "clifton-sunset-catamaran",
  "seapoint-sunrise-run-club",
]);

export default function EventWallAndCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params?.slug === "string" ? params.slug : "";

  const checkoutSectionRef = useRef<HTMLDivElement | null>(null);

  const [event, setEvent] = useState<EventItem | null>(null);
  const [rsvps, setRsvps] = useState<GuestRsvp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mobile Native App States (Partiful / Luma Ergonomics)
  const [activeMobileTab, setActiveMobileTab] = useState<"squad" | "bring" | "details">("squad");
  const [isCheckoutDrawerOpen, setIsCheckoutDrawerOpen] = useState(false);

  // Host Controls & Viewer Unlock States
  const [hostMode, setHostMode] = useState(false);
  const [hasUnlockedPin, setHasUnlockedPin] = useState(false);
  const [copiedHypeUpdate, setCopiedHypeUpdate] = useState(false);
  const [copiedSquadList, setCopiedSquadList] = useState(false);
  const [copiedRoast, setCopiedRoast] = useState(false);
  const [copiedEmergency, setCopiedEmergency] = useState(false);
  const [copiedCsv, setCopiedCsv] = useState(false);
  const [hostActionError, setHostActionError] = useState<string | null>(null);
  const [settlingRsvpId, setSettlingRsvpId] = useState<string | null>(null);
  const [showCreatedBanner, setShowCreatedBanner] = useState(false);

  // Corporate Invoice States (Devan Sandton Suggestion)
  const [companyName, setCompanyName] = useState("");
  const [companyVat, setCompanyVat] = useState("");
  const [showCompanyInvoiceFields, setShowCompanyInvoiceFields] = useState(false);

  // Host Modals
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashGuestName, setCashGuestName] = useState("");
  const [cashSpots, setCashSpots] = useState(1);
  const [cashAmountZar, setCashAmountZar] = useState<number>(100);
  const [cashTierLabel, setCashTierLabel] = useState<string>("");
  const [cashComment, setCashComment] = useState("");
  const [cashSubmitting, setCashSubmitting] = useState(false);

  const [showPostponeModal, setShowPostponeModal] = useState(false);
  const [newEventDateInput, setNewEventDateInput] = useState("");
  const [editLocationInput, setEditLocationInput] = useState("");
  const [editSecretPinInput, setEditSecretPinInput] = useState("");
  const [editMaxSpotsInput, setEditMaxSpotsInput] = useState("");
  const [postponeSubmitting, setPostponeSubmitting] = useState(false);
  const [postponeSuccess, setPostponeSuccess] = useState<string | null>(null);
  const [copiedShortfallAlert, setCopiedShortfallAlert] = useState(false);
  const [copiedShortfallTopUp, setCopiedShortfallTopUp] = useState(false);
  const [shortfallIncludeUncheckedCash, setShortfallIncludeUncheckedCash] = useState(true);
  const [customShortfallTargetZar, setCustomShortfallTargetZar] = useState<number | null>(null);
  const [lockingSquadHeadcount, setLockingSquadHeadcount] = useState(false);
  const [lockedHeadcountBannerMsg, setLockedHeadcountBannerMsg] = useState<string | null>(null);
  const [copiedHostAdminLink, setCopiedHostAdminLink] = useState(false);

  // Host Key Unlock Modal (when switching browsers/devices without hostToken)
  const [showHostKeyModal, setShowHostKeyModal] = useState(false);
  const [manualHostKeyInput, setManualHostKeyInput] = useState("");
  const [hostKeyError, setHostKeyError] = useState<string | null>(null);

  // Guest Buyer Protection, Ticket Recovery & Refund/Dispute Modal
  const [showProtectionModal, setShowProtectionModal] = useState(false);
  const [protectionTab, setProtectionTab] = useState<"recover" | "refund" | "report">("recover");
  const [recoverPhoneInput, setRecoverPhoneInput] = useState("");
  const [recoverNameInput, setRecoverNameInput] = useState("");
  const [recoverLoading, setRecoverLoading] = useState(false);
  const [recoverResult, setRecoverResult] = useState<{
    rsvp: GuestRsvp;
    ref?: string;
    message: string;
  } | null>(null);
  const [recoverError, setRecoverError] = useState<string | null>(null);

  const [disputeSwapTokenInput, setDisputeSwapTokenInput] = useState("");
  const [disputeReasonInput, setDisputeReasonInput] = useState("Host cancelled the event & hasn't refunded");
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);
  const [disputeSuccessMsg, setDisputeSuccessMsg] = useState<string | null>(null);
  const [disputeErrorMsg, setDisputeErrorMsg] = useState<string | null>(null);

  const [myUnlockedRsvp, setMyUnlockedRsvp] = useState<GuestRsvp | null>(null);
  const [myUnlockedRef, setMyUnlockedRef] = useState<string>("");

  const [newBringItemLabel, setNewBringItemLabel] = useState("");
  const [addingBringItem, setAddingBringItem] = useState(false);

  // 5-Second Checkout Form State
  const [buyerName, setBuyerName] = useState("");
  const [buyerWhatsapp, setBuyerWhatsapp] = useState("");
  const [showOptionalEmail, setShowOptionalEmail] = useState(false);
  const [buyerEmail, setBuyerEmail] = useState("");
  const [autoFilledFromStorage, setAutoFilledFromStorage] = useState(false);

  const [selectedTierId, setSelectedTierId] = useState<string>("");
  const [customPotAmountZar, setCustomPotAmountZar] = useState<number>(150);
  const [spotsCount, setSpotsCount] = useState<number>(1);
  const [plusOneInput, setPlusOneInput] = useState<string>("");

  const [claimedItemId, setClaimedItemId] = useState<string>("");
  const [customBringItem, setCustomBringItem] = useState<string>("");
  const [showTaxReceiptAccordion, setShowTaxReceiptAccordion] = useState<boolean>(false);

  const availableBadges = React.useMemo(() => {
    return getBanterBadgesForEvent(
      event
        ? {
            mode: event.mode,
            category_vibe: event.category_vibe,
            title: event.title,
            description: event.description,
          }
        : undefined
    );
  }, [event]);

  const [selectedBadge, setSelectedBadge] = useState<string>(BANTER_BADGES[0]);

  useEffect(() => {
    if (availableBadges.length > 0 && !availableBadges.includes(selectedBadge)) {
      setSelectedBadge(availableBadges[0]);
    }
  }, [availableBadges, selectedBadge]);

  const [comment, setComment] = useState<string>("");
  const [customAnswer, setCustomAnswer] = useState<string>("");
  const [isAnonymousOnWall, setIsAnonymousOnWall] = useState<boolean>(false);

  const [paymentChannel, setPaymentChannel] =
    useState<PaymentChannel>("apple_pay");
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] =
    useState<"gateway" | "direct_payshap" | "cash_on_arrival">("direct_payshap");
  const [showOptionalPopVerifier, setShowOptionalPopVerifier] =
    useState<boolean>(false);
  const [cpaS49Accepted, setCpaS49Accepted] = useState<boolean>(true);
  const [popVerifyTab, setPopVerifyTab] = useState<"upload" | "sms">("upload");
  const [popRailBadge, setPopRailBadge] = useState<
    "instant_payshap" | "capitec_payme" | "standard_eft"
  >("instant_payshap");
  const [popFileName, setPopFileName] = useState<string>("");
  const [popFileSize, setPopFileSize] = useState<number | null>(null);
  const [popHash, setPopHash] = useState<string>("");
  const [popSmsText, setPopSmsText] = useState<string>("");
  const [copiedPayShapDetails, setCopiedPayShapDetails] = useState<boolean>(false);
  const [copiedShapId, setCopiedShapId] = useState<boolean>(false);
  const [copiedAccNum, setCopiedAccNum] = useState<boolean>(false);
  const [showProBoostModal, setShowProBoostModal] = useState<boolean>(false);
  const [proBoostTier, setProBoostTier] = useState<"r29" | "r79" | "r790" | "r249">("r29");
  const [proBoostMethod, setProBoostMethod] = useState<"yoco" | "payshap">("yoco");
  const [proBoostRefInput, setProBoostRefInput] = useState<string>("");
  const [proBoostSubmitting, setProBoostSubmitting] = useState<boolean>(false);
  const [proBoostError, setProBoostError] = useState<string | null>(null);
  const [proBoostSuccess, setProBoostSuccess] = useState<string | null>(null);
  const [isOfflineWallCached, setIsOfflineWallCached] = useState<boolean>(false);
  const [hostKeyTab, setHostKeyTab] = useState<"paste" | "recover">("paste");
  const [recoverHostPhoneInput, setRecoverHostPhoneInput] = useState<string>("");
  const [recoverHostSecretInput, setRecoverHostSecretInput] = useState<string>("");
  const [recoverHostLoading, setRecoverHostLoading] = useState<boolean>(false);

  // Restore guest draft form fields if mobile browser reloads after switching to banking app
  useEffect(() => {
    if (!slug || typeof window === "undefined") return;
    try {
      const rawDraft = localStorage.getItem(`pullthru_draft_${slug}`);
      if (rawDraft) {
        const parsed = JSON.parse(rawDraft);
        if (parsed.buyerName && !buyerName) setBuyerName(String(parsed.buyerName));
        if (parsed.buyerWhatsapp && !buyerWhatsapp) setBuyerWhatsapp(String(parsed.buyerWhatsapp));
        if (parsed.plusOneInput && !plusOneInput) setPlusOneInput(String(parsed.plusOneInput));
        if (parsed.comment && !comment) setComment(String(parsed.comment));
      }
    } catch {
      // ignore storage errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Auto-save guest draft form fields on every keystroke so switching to Capitec/FNB app never loses state
  useEffect(() => {
    if (!slug || typeof window === "undefined") return;
    if (!buyerName && !buyerWhatsapp && !plusOneInput && !comment) return;
    try {
      localStorage.setItem(
        `pullthru_draft_${slug}`,
        JSON.stringify({
          buyerName,
          buyerWhatsapp,
          plusOneInput,
          comment,
        })
      );
    } catch {
      // ignore storage errors
    }
  }, [slug, buyerName, buyerWhatsapp, plusOneInput, comment]);

  const handlePopFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileVal = validatePopFile({ name: file.name, size: file.size });
    if (!fileVal.isValid) {
      setCheckoutError(fileVal.rejectionReason);
      return;
    }
    setCheckoutError(null);
    setPopFileName(file.name);
    setPopFileSize(file.size);
    try {
      const buf = await file.arrayBuffer();
      const digest = await crypto.subtle.digest("SHA-256", buf);
      const hex = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      setPopHash(`pop_file_sha256_${hex.slice(0, 40)}`);
    } catch {
      setPopHash(`pop_file_sha256_${file.name}_${file.size}_${file.lastModified}`);
    }
  };

  // Interactive Capitec Pay / Paystack SA Biometric Approval Overlay
  const [showApprovalOverlay, setShowApprovalOverlay] = useState<boolean>(false);
  const [approvalStep, setApprovalStep] = useState<"prompt" | "processing">(
    "prompt"
  );
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [submittingRsvp, setSubmittingRsvp] = useState<boolean>(false);
  const [paydayPromiseSuccess, setPaydayPromiseSuccess] = useState<
    string | null
  >(null);
  const [showPaydayOptions, setShowPaydayOptions] = useState<boolean>(false);
  const [paydayPreauth, setPaydayPreauth] = useState<boolean>(false);
  const [showGuestExtrasAccordion, setShowGuestExtrasAccordion] = useState<boolean>(false);

  // Real-Time Live Squad Notifications & 6-Second Auto-Sync Engine
  const [liveAlertsEnabled, setLiveAlertsEnabled] = useState<boolean>(true);
  const [liveToast, setLiveToast] = useState<{
    id: string;
    title: string;
    subtitle: string;
    badge: string;
  } | null>(null);
  const knownRsvpsRef = useRef<
    Map<string, { status: string; checkedIn: boolean; claimedItem: string | null }>
  >(new Map());
  const hasSeededLiveMapRef = useRef<boolean>(false);

  const playLiveSquadChime = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const notes = [587.33, 880.0]; // D5 -> A5 emerald lock chime
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.11);
        gain.gain.setValueAtTime(0.001, now + idx * 0.11);
        gain.gain.exponentialRampToValueAtTime(0.14, now + idx * 0.11 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.11 + 0.24);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.11);
        osc.stop(now + idx * 0.11 + 0.26);
      });
    } catch {
      // ignore audio context restrictions
    }
  }, []);

  const triggerLiveNotification = useCallback(
    (payload: { title: string; subtitle: string; badge: string }) => {
      const id = `toast_${Date.now()}`;
      setLiveToast({ id, ...payload });
      triggerHaptic("success");
      if (liveAlertsEnabled) {
        playLiveSquadChime();
        if (
          typeof window !== "undefined" &&
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          try {
            new Notification(payload.title, {
              body: `${payload.subtitle} (${payload.badge})`,
              icon: "/icon-512.png",
            });
          } catch {
            // ignore notification errors on mobile webviews
          }
        }
      }
    },
    [liveAlertsEnabled, playLiveSquadChime]
  );

  const handleToggleLiveAlerts = useCallback(async () => {
    triggerHaptic("medium");
    const nextState = !liveAlertsEnabled;
    setLiveAlertsEnabled(nextState);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("pullthru_live_alerts", nextState ? "true" : "false");
        if (
          nextState &&
          "Notification" in window &&
          Notification.permission === "default"
        ) {
          await Notification.requestPermission();
        }
      } catch {
        // ignore
      }
    }
    if (nextState) {
      playLiveSquadChime();
      setLiveToast({
        id: `toast_${Date.now()}`,
        title: "🔔 Live Squad Alerts Active!",
        subtitle: "Instant sound, toast & push alerts when friends lock spots or check in",
        badge: "REAL-TIME ON",
      });
    } else {
      setLiveToast(null);
    }
  }, [liveAlertsEnabled, playLiveSquadChime]);

  useEffect(() => {
    if (!liveToast) return;
    const timer = setTimeout(() => {
      setLiveToast((prev) => (prev?.id === liveToast.id ? null : prev));
    }, 6500);
    return () => clearTimeout(timer);
  }, [liveToast]);

  const loadEvent = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      let hostToken = "";
      let savedRef = "";
      let savedRsvpId = "";
      let savedSwapToken = "";
      if (typeof window !== "undefined") {
        try {
          const urlParams = new URLSearchParams(window.location.search);
          const urlHostToken = urlParams.get("hostToken");
          const localHostToken = localStorage.getItem(`pullthru_host_${slug}`);
          if (urlHostToken) {
            hostToken = urlHostToken;
            localStorage.setItem(`pullthru_host_${slug}`, urlHostToken);
          } else if (localHostToken) {
            hostToken = localHostToken;
          }
          savedRef = localStorage.getItem(`pullthru_ref_${slug}`) || "";
          savedRsvpId = localStorage.getItem(`pullthru_rsvpid_${slug}`) || "";
          if (savedRsvpId) {
            const storedTokens = JSON.parse(
              localStorage.getItem("pullthru_swap_tokens") || "{}"
            );
            if (storedTokens[savedRsvpId]) {
              savedSwapToken = String(storedTokens[savedRsvpId]);
            }
          }
        } catch {
          // ignore storage errors
        }
      }

      const query = new URLSearchParams({ slug });
      if (savedRef) query.set("ref", savedRef);
      if (savedRsvpId) query.set("rsvpId", savedRsvpId);
      if (savedSwapToken) query.set("swapToken", savedSwapToken);

      const res = await fetch(`/api/events?${query.toString()}`, {
        cache: "no-store",
        headers: hostToken ? { "x-host-token": hostToken } : undefined,
      });
      if (!res.ok) {
        throw new Error("Event not found.");
      }
      const data = await res.json();
      const loadedEvent: EventItem | null =
        data?.event || (data?.slug ? data : null);
      const loadedRsvps: GuestRsvp[] = Array.isArray(data?.rsvps)
        ? data.rsvps
        : [];

      if (!loadedEvent) {
        throw new Error("Event not found.");
      }

      setEvent(loadedEvent);
      setRsvps(loadedRsvps);
      setIsOfflineWallCached(false);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            `pullthru_offline_wall_${slug}`,
            JSON.stringify({
              event: loadedEvent,
              rsvps: loadedRsvps,
              cachedAt: Date.now(),
            })
          );
        } catch {
          // ignore storage quota errors
        }
      }
      setNewEventDateInput(loadedEvent.event_date);
      setEditLocationInput(loadedEvent.location_name || "");
      setEditSecretPinInput(loadedEvent.secret_location_pin || "");
      setEditMaxSpotsInput(
        loadedEvent.max_spots !== null && loadedEvent.max_spots !== undefined
          ? String(loadedEvent.max_spots)
          : ""
      );
      setCashAmountZar(loadedEvent.price_zar || 100);

      // Auto-Unlock Gate PIN & Boarding Pass Banner if returning guest has verified paid order or swap_token
      const ownVerifiedRsvp = loadedRsvps.find((r) => Boolean(r.swap_token));
      if (data?.order?.status === "paid" || ownVerifiedRsvp) {
        setHasUnlockedPin(true);
        if (ownVerifiedRsvp) {
          setMyUnlockedRsvp(ownVerifiedRsvp);
          if (ownVerifiedRsvp.swap_token) {
            setDisputeSwapTokenInput(ownVerifiedRsvp.swap_token);
          }
          try {
            if (typeof window !== "undefined") {
              const unlockedSlugs = JSON.parse(
                localStorage.getItem("pullthru_unlocked_events") || "[]"
              ) as string[];
              if (!unlockedSlugs.includes(slug)) {
                unlockedSlugs.push(slug);
                localStorage.setItem(
                  "pullthru_unlocked_events",
                  JSON.stringify(unlockedSlugs)
                );
              }
              localStorage.setItem(`pullthru_rsvpid_${slug}`, ownVerifiedRsvp.id);
              if (ownVerifiedRsvp.swap_token) {
                const storedTokens = JSON.parse(
                  localStorage.getItem("pullthru_swap_tokens") || "{}"
                );
                storedTokens[ownVerifiedRsvp.id] = ownVerifiedRsvp.swap_token;
                localStorage.setItem(
                  "pullthru_swap_tokens",
                  JSON.stringify(storedTokens)
                );
              }
            }
          } catch {
            // ignore storage errors
          }
        }
        if (savedRef) {
          setMyUnlockedRef(savedRef);
        }
      }

      // Check if URL has ?settle=<rsvpId> from Host WhatsApp Payday Nudge
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const settleId = urlParams.get("settle");
        if (settleId) {
          const targetPledge = loadedRsvps.find(
            (r) => r.id === settleId && r.status === "payday_promise"
          );
          if (targetPledge) {
            setSettlingRsvpId(targetPledge.id);
            const cleanName = targetPledge.guest_name
              .replace(/\s*\(Payday 25th Promise\)\s*/i, "")
              .trim();
            if (cleanName) setBuyerName(cleanName);
            setIsCheckoutDrawerOpen(true);
          }
        }
      }

      if (loadedEvent.mode === "tiered" && loadedEvent.tiers?.length > 0) {
        setSelectedTierId((prev) => prev || loadedEvent.tiers[0].id);
        setCashTierLabel((prev) => prev || loadedEvent.tiers[0].label);
      }
      if (loadedEvent.mode === "pot") {
        setCustomPotAmountZar(loadedEvent.price_zar || 150);
      }
    } catch (err) {
      let hydratedFromCache = false;
      if (typeof window !== "undefined") {
        try {
          const cachedWall = localStorage.getItem(`pullthru_offline_wall_${slug}`);
          if (cachedWall) {
            const parsed = JSON.parse(cachedWall);
            if (parsed?.event && Array.isArray(parsed?.rsvps)) {
              setEvent(parsed.event);
              setRsvps(parsed.rsvps);
              setIsOfflineWallCached(true);
              hydratedFromCache = true;
            }
          }
        } catch {
          // ignore
        }
      }
      if (!hydratedFromCache) {
        setError(
          err instanceof Error ? err.message : "Failed to load event details."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  // Seed initial RSVP snapshot & run 6-second real-time background squad sync
  useEffect(() => {
    if (!rsvps || rsvps.length === 0) return;
    if (!hasSeededLiveMapRef.current) {
      const nextMap = new Map<
        string,
        { status: string; checkedIn: boolean; claimedItem: string | null }
      >();
      rsvps.forEach((r) => {
        nextMap.set(r.id, {
          status: r.status,
          checkedIn: Boolean(r.checked_in),
          claimedItem: r.claimed_item_label || null,
        });
      });
      knownRsvpsRef.current = nextMap;
      hasSeededLiveMapRef.current = true;
    }
  }, [rsvps]);

  useEffect(() => {
    if (!slug || typeof window === "undefined") return;
    try {
      const savedPref = localStorage.getItem("pullthru_live_alerts");
      if (savedPref === "false") {
        setLiveAlertsEnabled(false);
      }
    } catch {
      // ignore
    }

    const interval = setInterval(async () => {
      if (document.visibilityState === "hidden" && !liveAlertsEnabled) return;
      try {
        const hostToken = localStorage.getItem(`pullthru_host_${slug}`) || "";
        const savedRef = localStorage.getItem(`pullthru_ref_${slug}`) || "";
        const savedRsvpId = localStorage.getItem(`pullthru_rsvpid_${slug}`) || "";
        const query = new URLSearchParams({ slug });
        if (savedRef) query.set("ref", savedRef);
        if (savedRsvpId) query.set("rsvpId", savedRsvpId);

        const res = await fetch(`/api/events?${query.toString()}`, {
          cache: "no-store",
          headers: hostToken ? { "x-host-token": hostToken } : undefined,
        });
        if (!res.ok) return;
        const data = await res.json();
        const freshEvent: EventItem | null =
          data?.event || (data?.slug ? data : null);
        const freshRsvps: GuestRsvp[] = Array.isArray(data?.rsvps)
          ? data.rsvps
          : [];
        if (!freshEvent) return;

        const prevMap = knownRsvpsRef.current;
        if (hasSeededLiveMapRef.current) {
          const totalLockedNow = freshRsvps
            .filter(
              (r) =>
                r.status === "locked_paid" ||
                r.status === "cash_logged" ||
                r.status === "going_free"
            )
            .reduce((sum, r) => sum + (r.spots_locked || 1), 0);
          const capLabel = freshEvent.max_spots
            ? `${totalLockedNow}/${freshEvent.max_spots} LOCKED`
            : `${totalLockedNow} LOCKED`;

          for (const r of freshRsvps) {
            const prev = prevMap.get(r.id);
            if (!prev) {
              const amtStr =
                r.amount_contributed_zar && r.amount_contributed_zar > 0
                  ? ` • R${r.amount_contributed_zar}`
                  : "";
              triggerLiveNotification({
                title: `⚡ ${r.guest_name} just locked in!`,
                subtitle: `${r.spots_locked || 1} spot${
                  (r.spots_locked || 1) > 1 ? "s" : ""
                }${amtStr}${
                  r.claimed_item_label ? ` • Bringing ${r.claimed_item_label}` : ""
                }`,
                badge: capLabel,
              });
              break;
            } else if (prev.status === "payday_promise" && r.status === "locked_paid") {
              triggerLiveNotification({
                title: `💸 ${r.guest_name} settled their Payday Pledge!`,
                subtitle: `Spot officially locked on ${freshEvent.title}`,
                badge: capLabel,
              });
              break;
            } else if (!prev.checkedIn && r.checked_in) {
              triggerLiveNotification({
                title: `✅ ${r.guest_name} checked in at the gate!`,
                subtitle: `Gate PIN #${r.gate_pin || "VERIFIED"} confirmed`,
                badge: "CHECKED IN",
              });
              break;
            }
          }
        }

        const nextMap = new Map<
          string,
          { status: string; checkedIn: boolean; claimedItem: string | null }
        >();
        freshRsvps.forEach((r) => {
          nextMap.set(r.id, {
            status: r.status,
            checkedIn: Boolean(r.checked_in),
            claimedItem: r.claimed_item_label || null,
          });
        });
        knownRsvpsRef.current = nextMap;
        hasSeededLiveMapRef.current = true;

        setEvent(freshEvent);
        setRsvps(freshRsvps);
      } catch {
        // silent background sync
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [slug, liveAlertsEnabled, triggerLiveNotification]);

  // Auto-fill returning guest profile, check host token, & check if viewer already unlocked pin
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedProfileRaw = localStorage.getItem("pullthru_guest_profile");
      if (savedProfileRaw) {
        const parsed = JSON.parse(savedProfileRaw) as StoredGuestProfile;
        if (parsed.buyerName) setBuyerName(parsed.buyerName);
        if (parsed.buyerWhatsapp) setBuyerWhatsapp(parsed.buyerWhatsapp);
        if (parsed.buyerEmail) setBuyerEmail(parsed.buyerEmail);
        if (parsed.buyerName || parsed.buyerWhatsapp) {
          setAutoFilledFromStorage(true);
        }
      }

      if (slug) {
        const savedHostToken = localStorage.getItem(`pullthru_host_${slug}`);
        if (savedHostToken) {
          setHostMode(true);
        }
      }

      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("created") === "1") {
        setHostMode(true);
        setShowCreatedBanner(true);
      }

      const unlockedSlugs = JSON.parse(
        localStorage.getItem("pullthru_unlocked_events") || "[]"
      ) as string[];
      if (slug && unlockedSlugs.includes(slug)) {
        setHasUnlockedPin(true);
      }
    } catch {
      // ignore localStorage errors
    }
  }, [slug]);

  // Escape key handler for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowApprovalOverlay(false);
        setShowCashModal(false);
        setShowPostponeModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Sort RSVPs chronologically (#1 First In is earliest created_at)
  const chronologicalRsvps = [...rsvps].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Active locked RSVPs count towards capacity & pot raised (exclude refunded spots)
  const confirmedRsvps = chronologicalRsvps.filter(
    (r) =>
      r.refund_status !== "refunded" &&
      (r.status === "locked_paid" ||
        r.status === "cash_logged" ||
        r.status === "going_free")
  );

  const lockedSpotsCount = confirmedRsvps.reduce(
    (sum, r) => sum + (r.spots_locked || 1),
    0
  );

  const totalPotRaisedZar =
    typeof event?.total_raised_zar === "number"
      ? event.total_raised_zar
      : confirmedRsvps.reduce(
          (sum, r) => sum + (r.amount_contributed_zar || 0),
          0
        );

  const spotsRemaining =
    event?.max_spots !== null && event?.max_spots !== undefined
      ? Math.max(0, event.max_spots - lockedSpotsCount)
      : null;

  const isSoldOut = spotsRemaining !== null && spotsRemaining <= 0;

  // Default Booking / Pitch Target Pool for Turnout Shortfall & Top-Up Split Calculator
  const defaultShortfallTargetZar = React.useMemo(() => {
    if (!event || event.mode === "free") return 0;
    if (event.venue_deposit_zar && event.venue_deposit_zar > 0) {
      return event.venue_deposit_zar;
    }
    if (event.mode === "pot" && event.target_pot_zar && event.target_pot_zar > 0) {
      return event.target_pot_zar;
    }
    const cap = event.max_spots && event.max_spots > 0 ? event.max_spots : Math.max(10, lockedSpotsCount);
    if (event.mode === "tiered" && event.tiers?.length > 0) {
      const firstPaid = event.tiers.find((t) => t.price_zar > 0)?.price_zar || 0;
      return firstPaid * cap;
    }
    return (event.price_zar || 0) * cap;
  }, [event, lockedSpotsCount]);

  const effectiveShortfallTargetZar =
    customShortfallTargetZar !== null && customShortfallTargetZar >= 0
      ? customShortfallTargetZar
      : defaultShortfallTargetZar;

  const shortfallSplit = React.useMemo(() => {
    if (!event || event.mode === "free") return null;
    return calculateTurnoutShortfallSplit({
      targetPoolZar: effectiveShortfallTargetZar,
      maxSpots: event.max_spots ?? null,
      baseSpotPriceZar: event.price_zar || 0,
      rsvps: chronologicalRsvps,
      includeUncheckedCash: shortfallIncludeUncheckedCash,
    });
  }, [event, effectiveShortfallTargetZar, chronologicalRsvps, shortfallIncludeUncheckedCash]);

  // Determine active unit price based on EventMode
  const selectedTier =
    event?.mode === "tiered"
      ? event.tiers.find((t) => t.id === selectedTierId) || event.tiers[0]
      : null;

  const unitBasePriceZar = (() => {
    if (!event) return 0;
    if (event.mode === "free") return 0;
    if (event.mode === "tiered" && selectedTier) {
      return selectedTier.price_zar;
    }
    if (event.mode === "pot") {
      return Math.max(0, Number(customPotAmountZar) || 0);
    }
    return event.price_zar;
  })();

  const effectiveSpotsForSplit = event?.mode === "pot" ? 1 : spotsCount;
  const isFreeCheckout =
    event?.mode === "free" || unitBasePriceZar === 0;

  const split = (() => {
    if (isFreeCheckout) {
      return calculateCheckoutSplit(0, spotsCount);
    }
    const clampedTotalUnit = Math.min(
      Math.floor(25000 / Math.max(1, effectiveSpotsForSplit)),
      Math.max(15, unitBasePriceZar)
    );
    try {
      return calculateCheckoutSplit(clampedTotalUnit, effectiveSpotsForSplit, 25000);
    } catch {
      return calculateCheckoutSplit(100, 1);
    }
  })();

  const syntheticEmailPreview = generateSyntheticEmail(
    buyerWhatsapp || "0821234567",
    buyerEmail
  );

  const parsedPlusOneNames =
    spotsCount > 1
      ? plusOneInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

  const saveGuestProfileAndUnlock = (
    rsvp?: GuestRsvp | null,
    ref?: string
  ) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        "pullthru_guest_profile",
        JSON.stringify({
          buyerName: buyerName.trim(),
          buyerWhatsapp: buyerWhatsapp.trim(),
          buyerEmail: buyerEmail.trim() || undefined,
        })
      );
      const unlockedSlugs = JSON.parse(
        localStorage.getItem("pullthru_unlocked_events") || "[]"
      ) as string[];
      if (slug && !unlockedSlugs.includes(slug)) {
        unlockedSlugs.push(slug);
        localStorage.setItem(
          "pullthru_unlocked_events",
          JSON.stringify(unlockedSlugs)
        );
      }
      if (slug && ref) {
        localStorage.setItem(`pullthru_ref_${slug}`, ref);
      }
      if (slug && rsvp?.id) {
        localStorage.setItem(`pullthru_rsvpid_${slug}`, rsvp.id);
      }
      if (rsvp?.id && rsvp?.swap_token) {
        const tokens = JSON.parse(
          localStorage.getItem("pullthru_swap_tokens") || "{}"
        );
        tokens[rsvp.id] = rsvp.swap_token;
        localStorage.setItem("pullthru_swap_tokens", JSON.stringify(tokens));
      }
      setHasUnlockedPin(true);
    } catch {
      // ignore localStorage errors
    }
  };

  const getHostToken = useCallback((): string => {
    if (typeof window !== "undefined" && slug) {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const urlHostToken = urlParams.get("hostToken");
        if (urlHostToken) return urlHostToken;
        const saved =
          localStorage.getItem(`pullthru_host_${slug}`) ||
          localStorage.getItem("pullthru_host_token");
        if (saved) return saved;
      } catch {
        // ignore storage errors
      }
    }
    return "";
  }, [slug]);

  const scrollToCheckout = (preselectBringItemId?: string) => {
    if (preselectBringItemId) {
      setClaimedItemId(preselectBringItemId);
      setShowGuestExtrasAccordion(true);
    }
    setIsCheckoutDrawerOpen(true);
    checkoutSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleSettlePaydayPromise = (pledgeRsvp: GuestRsvp) => {
    setSettlingRsvpId(pledgeRsvp.id);
    setCheckoutError(null);
    const cleanName = pledgeRsvp.guest_name
      .replace(/\s*\(Payday 25th Promise\)\s*/i, "")
      .trim();
    if (cleanName) setBuyerName(cleanName);
    const desiredSpots = pledgeRsvp.spots_locked || 1;
    const clampedSpots =
      spotsRemaining !== null
        ? Math.max(1, Math.min(desiredSpots, spotsRemaining))
        : desiredSpots;
    setSpotsCount(clampedSpots);
    setPlusOneInput(
      pledgeRsvp.plus_one_names?.length
        ? pledgeRsvp.plus_one_names.join(", ")
        : ""
    );
    if (event?.mode === "tiered" && event.tiers?.length) {
      const matchedTier = pledgeRsvp.tier_label
        ? event.tiers.find(
            (t) => t.label === pledgeRsvp.tier_label && t.price_zar > 0
          )
        : null;
      const firstPaidTier =
        event.tiers.find((t) => t.price_zar > 0) || event.tiers[0];
      const tierToUse = matchedTier || firstPaidTier;
      if (tierToUse) setSelectedTierId(tierToUse.id);
    }
    setClaimedItemId(pledgeRsvp.claimed_item_id || "");
    if (event?.mode === "pot" && pledgeRsvp.amount_contributed_zar >= 15) {
      setCustomPotAmountZar(pledgeRsvp.amount_contributed_zar);
    }
    if (pledgeRsvp.custom_answer) {
      setCustomAnswer(pledgeRsvp.custom_answer);
    }
    setSelectedBadge("💳 Paid Before Payday (Big Flex)");
    scrollToCheckout();
  };

  // Handle Main Checkout / Free RSVP Submit
  const handleInitiateCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);

    if (!buyerName.trim()) {
      setCheckoutError("Please enter your name so the crew sees you on the wall.");
      return;
    }
    if (checkoutPaymentMethod === "gateway" && !isFreeCheckout && !buyerWhatsapp.trim()) {
      setCheckoutError("Please enter your WhatsApp number for your instant card receipt.");
      return;
    }

    const minPotZar = event?.min_pot_contribution_zar || 15;
    if (event?.mode === "pot" && unitBasePriceZar < minPotZar) {
      setCheckoutError(
        `Minimum paid kitty/pot contribution is ${formatZar(minPotZar)}.`
      );
      return;
    }

    if (!isFreeCheckout && unitBasePriceZar * effectiveSpotsForSplit > 25000) {
      setCheckoutError(
        "FICA & Anti-Fraud Velocity Cap: Maximum single checkout contribution is R25,000.00."
      );
      return;
    }

    // Free RSVP (or R0 Kids Tier) goes directly via POST /api/rsvp
    if (isFreeCheckout) {
      setSubmittingRsvp(true);
      try {
        const res = await fetch("/api/rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: event?.slug,
            guest_name:
              parsedPlusOneNames.length > 0
                ? `${buyerName.trim()} (+${parsedPlusOneNames.length}: ${parsedPlusOneNames.join(", ")})`
                : buyerName.trim(),
            spots_locked: spotsCount,
            plus_one_names: parsedPlusOneNames,
            amount_contributed_zar: 0,
            tier_id: selectedTier?.id || null,
            tier_label: selectedTier?.label || null,
            comment: comment.trim() || "Pulling through! Locked in 🔥",
            claimed_item_id: claimedItemId || null,
            custom_answer: customAnswer.trim() || null,
            is_anonymous_on_wall: isAnonymousOnWall,
            badge_label: selectedBadge,
            status: "going_free",
            guest_whatsapp: buyerWhatsapp.trim() || null,
            settling_rsvp_id: settlingRsvpId || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || "Failed to lock in free RSVP.");
        }
        if (data?.event) {
          setEvent(data.event);
        }
        if (data?.rsvp) {
          setRsvps((prev) => [...prev, data.rsvp]);
        }
        const freeRef = `FREE_RSVP_${Date.now()}`;
        saveGuestProfileAndUnlock(data?.rsvp, freeRef);
        const swapTokenParam = data?.rsvp?.swap_token
          ? `&swapToken=${encodeURIComponent(data.rsvp.swap_token)}`
          : "";
        const compNameParam = companyName.trim()
          ? `&companyName=${encodeURIComponent(companyName.trim())}`
          : "";
        const compVatParam = companyVat.trim()
          ? `&companyVat=${encodeURIComponent(companyVat.trim())}`
          : "";
        router.push(
          `/e/${slug}/success?ref=${freeRef}&rsvpId=${
            data?.rsvp?.id || ""
          }${swapTokenParam}${compNameParam}${compVatParam}`
        );
      } catch (err) {
        setCheckoutError(
          err instanceof Error ? err.message : "Could not complete RSVP."
        );
      } finally {
        setSubmittingRsvp(false);
      }
      return;
    }

    // Cash on Arrival: Reserve spot without card or app
    if (checkoutPaymentMethod === "cash_on_arrival") {
      await handleReserveCashOnArrival();
      return;
    }

    // Instant Gateway (Apple Pay / Card / Capitec Pay) executes checkout directly without a redundant modal
    if (checkoutPaymentMethod === "gateway") {
      await handleConfirmBiometricPayment();
      return;
    }

    // Paid Event: Direct PayShap / Capitec PayMe + Instant POP Verification (R0 Guest Fee)
    const cleanSms = popSmsText.trim();
    let resolvedPopHash = "";
    let autoRailBadge: "instant_payshap" | "capitec_payme" | "standard_eft" = popRailBadge;

    if (popVerifyTab === "sms" && cleanSms.length > 0) {
      const parsedSms = parseSaBankSms(cleanSms, split.totalBasePriceZar, event?.host_name);
      if (parsedSms.isValid) {
        resolvedPopHash = parsedSms.canonicalHash;
        autoRailBadge = parsedSms.paymentRail;
      } else if (parsedSms.isFake || parsedSms.isUnderpaid) {
        setCheckoutError(
          parsedSms.rejectionReason ||
            "Please paste your real bank confirmation SMS (must include bank name, R amount, or reference)."
        );
        return;
      }
    } else if (popHash.trim()) {
      resolvedPopHash = popHash.trim();
    }

    const cleanRefName =
      (buyerName || "GUEST").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 10) || "GUEST";
    const refCode = `PT-${cleanRefName}`;

    // If guest didn't upload a POP file or full carrier SMS (e.g. 1-tap PayShap confirmation or short PayShap reference), auto-copy Host PayShap # and log spot immediately on Squad Wall for host 1-click confirmation
    if (!resolvedPopHash) {
      setSubmittingRsvp(true);
      try {
        if (
          event?.host_phone &&
          typeof navigator !== "undefined" &&
          navigator.clipboard
        ) {
          const cleanShapPhone =
            event.host_phone.replace(/\D/g, "").replace(/^27(\d{9})$/, "0$1") ||
            event.host_phone;
          navigator.clipboard.writeText(cleanShapPhone).catch(() => {});
          setCopiedShapId(true);
        }
        const refNote = cleanSms ? `PayShap Ref: ${cleanSms.slice(0, 80)}` : `Ref: ${refCode}`;
        const resolvedComment = customBringItem.trim()
          ? `${comment.trim() ? comment.trim() + " • " : ""}[Bringing: ${customBringItem.trim()}]`
          : comment.trim() || `Sent PayShap (${refNote})! Pulling through 🔥`;

        const res = await fetch("/api/rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "reserve_cash_on_arrival",
            slug: event?.slug,
            guest_name:
              parsedPlusOneNames.length > 0
                ? `${buyerName.trim()} (+${parsedPlusOneNames.length}: ${parsedPlusOneNames.join(", ")})`
                : buyerName.trim(),
            spots_locked: Math.min(4, spotsCount),
            plus_one_names: parsedPlusOneNames,
            amount_contributed_zar: split.totalBasePriceZar,
            tier_id: selectedTier?.id || null,
            tier_label: selectedTier?.label || null,
            comment: resolvedComment,
            claimed_item_id: claimedItemId || null,
            custom_answer: customAnswer.trim() || null,
            is_anonymous_on_wall: isAnonymousOnWall,
            badge_label: "📲 PayShap Sent",
            guest_whatsapp: buyerWhatsapp.trim() || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || "Could not lock in your PayShap spot.");
        }
        if (data?.event) setEvent(data.event);
        if (data?.rsvp) {
          setRsvps((prev) => [data.rsvp, ...prev]);
        }
        const shapRef = `PAYSHAP_${Date.now()}`;
        saveGuestProfileAndUnlock(data?.rsvp, shapRef);
        triggerHaptic("success");
        setIsCheckoutDrawerOpen(false);
        const swapTokenParam = data?.rsvp?.swap_token
          ? `&swapToken=${encodeURIComponent(data.rsvp.swap_token)}`
          : "";
        router.push(
          `/e/${slug}/success?ref=${shapRef}&rsvpId=${data?.rsvp?.id || ""}${swapTokenParam}`
        );
      } catch (err) {
        setCheckoutError(
          err instanceof Error ? err.message : "Could not complete PayShap confirmation."
        );
      } finally {
        setSubmittingRsvp(false);
      }
      return;
    }

    const resolvedPopNote =
      popVerifyTab === "sms" && cleanSms
        ? `SMS: ${cleanSms.slice(0, 110)}`
        : `Slip: ${popFileName || "POP Uploaded"} • Ref: ${refCode}`;

    setSubmittingRsvp(true);
    try {
      const resolvedComment = customBringItem.trim()
        ? `${comment.trim() ? comment.trim() + " • " : ""}[Bringing: ${customBringItem.trim()}]`
        : comment.trim() || "Paid via PayShap / Capitec PayMe! Pulling through 🔥";

      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_direct_pop",
          slug: event?.slug,
          guest_name:
            parsedPlusOneNames.length > 0
              ? `${buyerName.trim()} (+${parsedPlusOneNames.length}: ${parsedPlusOneNames.join(", ")})`
              : buyerName.trim(),
          spots_locked: spotsCount,
          plus_one_names: parsedPlusOneNames,
          amount_contributed_zar: split.totalBasePriceZar,
          tier_id: selectedTier?.id || null,
          tier_label: selectedTier?.label || null,
          comment: resolvedComment,
          claimed_item_id: claimedItemId || null,
          custom_answer: customAnswer.trim() || null,
          is_anonymous_on_wall: isAnonymousOnWall,
          badge_label: selectedBadge,
          pop_hash: resolvedPopHash,
          pop_rail_badge: autoRailBadge,
          pop_sms_text: popVerifyTab === "sms" ? cleanSms || null : null,
          pop_reference_note: resolvedPopNote,
          pop_file_name: popVerifyTab === "upload" ? popFileName || null : null,
          pop_file_size: popVerifyTab === "upload" ? popFileSize || null : null,
          guest_whatsapp: buyerWhatsapp.trim() || null,
          settling_rsvp_id: settlingRsvpId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Could not verify POP slip.");
      }
      if (data?.event) {
        setEvent(data.event);
      }
      if (data?.rsvp) {
        setRsvps((prev) =>
          settlingRsvpId
            ? [data.rsvp, ...prev.filter((r) => r.id !== settlingRsvpId)]
            : [data.rsvp, ...prev]
        );
      }
      const popRef = `DIRECT_POP_${Date.now()}`;
      saveGuestProfileAndUnlock(data?.rsvp, popRef);
      setSettlingRsvpId(null);
      const swapTokenParam = data?.rsvp?.swap_token
        ? `&swapToken=${encodeURIComponent(data.rsvp.swap_token)}`
        : "";
      const compNameParam = companyName.trim()
        ? `&companyName=${encodeURIComponent(companyName.trim())}`
        : "";
      const compVatParam = companyVat.trim()
        ? `&companyVat=${encodeURIComponent(companyVat.trim())}`
        : "";
      router.push(
        `/e/${slug}/success?ref=${popRef}&rsvpId=${
          data?.rsvp?.id || ""
        }${swapTokenParam}${compNameParam}${compVatParam}`
      );
    } catch (err) {
      setCheckoutError(
        err instanceof Error ? err.message : "Could not complete POP verification."
      );
    } finally {
      setSubmittingRsvp(false);
    }
  };

  // Execute POST /api/yoco/checkout directly (preserving all guest fields)
  const handleConfirmBiometricPayment = async () => {
    if (!event) return;
    setApprovalStep("processing");
    setSubmittingRsvp(true);
    setCheckoutError(null);

    try {
      const resolvedComment = customBringItem.trim()
        ? `${comment.trim() ? comment.trim() + " • " : ""}[Bringing: ${customBringItem.trim()}]`
        : comment.trim() || "Pulling through! Locked in 🔥";

      const res = await fetch("/api/yoco/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "rsvp",
          slug: event.slug,
          buyerName: buyerName.trim(),
          buyerWhatsapp: buyerWhatsapp.trim(),
          buyerEmail: buyerEmail.trim() || undefined,
          spotsCount,
          plusOneNames: parsedPlusOneNames,
          tierId: selectedTier?.id || undefined,
          customAmountZar: event.mode === "pot" ? customPotAmountZar : undefined,
          comment: resolvedComment,
          claimedItemId: claimedItemId || undefined,
          customAnswer: customAnswer.trim() || undefined,
          isAnonymousOnWall,
          badgeLabel: selectedBadge,
          settlingRsvpId: settlingRsvpId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setShowApprovalOverlay(false);
        setSubmittingRsvp(false);
        throw new Error(
          data?.error || "Yoco checkout initialization failed. Please try again."
        );
      }

      if (data?.rsvpId && data?.orderRef && typeof window !== "undefined") {
        try {
          localStorage.setItem(`pullthru_ref_${slug}`, data.orderRef);
          localStorage.setItem(`pullthru_rsvpid_${slug}`, data.rsvpId);
          if (data.swapToken) {
            const storedTokens = JSON.parse(
              localStorage.getItem("pullthru_swap_tokens") || "{}"
            );
            storedTokens[data.rsvpId] = data.swapToken;
            localStorage.setItem("pullthru_swap_tokens", JSON.stringify(storedTokens));
          }
        } catch {
          // ignore
        }
      }

      const redirectUrl = data?.redirectUrl;
      if (redirectUrl) {
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(
              "pullthru_guest_profile",
              JSON.stringify({
                buyerName: buyerName.trim(),
                buyerWhatsapp: buyerWhatsapp.trim(),
                buyerEmail: buyerEmail.trim() || undefined,
              })
            );
            if (companyName.trim() || companyVat.trim()) {
              localStorage.setItem(
                `pullthru_corp_invoice_${slug}`,
                JSON.stringify({
                  companyName: companyName.trim(),
                  companyVat: companyVat.trim(),
                })
              );
            }
          } catch {
            // ignore storage errors
          }
        }
        window.location.href = redirectUrl;
        return;
      }

      setShowApprovalOverlay(false);
      setSubmittingRsvp(false);
    } catch (err) {
      setShowApprovalOverlay(false);
      setSubmittingRsvp(false);
      setCheckoutError(
        err instanceof Error ? err.message : "Payment initialization failed."
      );
    }
  };

  // 1-Tap Cash on Arrival: Reserve spot without card or banking app
  const handleReserveCashOnArrival = async () => {
    if (!event) return;
    if (!buyerName.trim()) {
      setCheckoutError("Please enter your name to reserve your spot.");
      return;
    }
    setSubmittingRsvp(true);
    setCheckoutError(null);

    try {
      const resolvedComment = customBringItem.trim()
        ? `${comment.trim() ? comment.trim() + " • " : ""}[Bringing: ${customBringItem.trim()}]`
        : comment.trim() || "Paying cash on arrival! Pulling through 🔥";

      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reserve_cash_on_arrival",
          slug: event.slug,
          guest_name:
            parsedPlusOneNames.length > 0
              ? `${buyerName.trim()} (+${parsedPlusOneNames.length}: ${parsedPlusOneNames.join(", ")})`
              : buyerName.trim(),
          spots_locked: spotsCount,
          plus_one_names: parsedPlusOneNames,
          amount_contributed_zar: split.totalBasePriceZar,
          tier_id: selectedTier?.id || null,
          tier_label: selectedTier?.label || null,
          comment: resolvedComment,
          claimed_item_id: claimedItemId || null,
          custom_answer: customAnswer.trim() || null,
          is_anonymous_on_wall: isAnonymousOnWall,
          badge_label: "💵 Cash on Arrival",
          guest_whatsapp: buyerWhatsapp.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Could not reserve spot with cash.");
      }

      if (data?.event) setEvent(data.event);
      if (data?.rsvp) {
        setRsvps((prev) => [data.rsvp, ...prev]);
      }

      const cashRef = `CASH_${Date.now()}`;
      saveGuestProfileAndUnlock(data?.rsvp, cashRef);
      triggerHaptic("success");
      setIsCheckoutDrawerOpen(false);

      const swapTokenParam = data?.rsvp?.swap_token
        ? `&swapToken=${encodeURIComponent(data.rsvp.swap_token)}`
        : "";
      const compNameParam = companyName.trim()
        ? `&companyName=${encodeURIComponent(companyName.trim())}`
        : "";
      const compVatParam = companyVat.trim()
        ? `&companyVat=${encodeURIComponent(companyVat.trim())}`
        : "";
      router.push(
        `/e/${slug}/success?ref=${cashRef}&rsvpId=${
          data?.rsvp?.id || ""
        }${swapTokenParam}${compNameParam}${compVatParam}`
      );
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Could not reserve cash spot.");
    } finally {
      setSubmittingRsvp(false);
    }
  };

  // Payday 25th Promise Handler (POPIA Section 69 Inbound Click-to-Chat Consent)
  const handlePaydayPromise = async () => {
    if (!event) return;
    setCheckoutError(null);
    setPaydayPromiseSuccess(null);

    if (!buyerName.trim()) {
      setCheckoutError(
        "Please enter your name first so your crew knows whose Payday 25th Pledge is on the wall."
      );
      return;
    }

    const guestDisplay = buyerName.trim();
    setSubmittingRsvp(true);
    setSettlingRsvpId(null);

    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: event.slug,
          guest_name: `${guestDisplay} ${paydayPreauth ? "(Payday Pre-Auth)" : "(Payday 25th Promise)"}`,
          spots_locked: spotsCount,
          plus_one_names: parsedPlusOneNames,
          amount_contributed_zar: 0,
          tier_id: selectedTier?.id || null,
          tier_label: selectedTier?.label || null,
          comment:
            comment.trim() ||
            (paydayPreauth
              ? "🔒 Priority Payday 25th Pledge — settling as soon as salary hits!"
              : "Pledged for the 25th payday! Settling as soon as salary hits 🙌"),
          claimed_item_id: claimedItemId || null,
          custom_answer: customAnswer.trim() || null,
          is_anonymous_on_wall: isAnonymousOnWall,
          badge_label: paydayPreauth
            ? "🔒 Payday Pre-Authorized"
            : "🗓️ Payday Pledge (Standby)",
          status: "payday_promise",
          payday_preauthorized: paydayPreauth,
          guest_whatsapp: buyerWhatsapp.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCheckoutError(
          data?.error || "Could not record Payday 25th Promise."
        );
        return;
      }
      if (data?.rsvp) {
        if (data?.event) {
          setEvent(data.event);
        }
        setRsvps((prev) => [...prev, data.rsvp]);
        saveGuestProfileAndUnlock(data.rsvp, `PAYDAY_${data.rsvp.id}`);
        setPaydayPromiseSuccess(
          paydayPreauth
            ? `Priority Payday 25th Standby Pledge logged (R0 charged today). Tap 'Settle Pledge' on the 25th to lock your confirmed spot!`
            : `Your Payday 25th Pledge is recorded on the wall! WhatsApp reminder ready.`
        );
      }
    } catch (err) {
      setCheckoutError(
        err instanceof Error ? err.message : "Could not record Payday 25th Promise."
      );
      return;
    } finally {
      setSubmittingRsvp(false);
    }

    const appUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/e/${event.slug}`
        : `https://pullthru.co.za/e/${event.slug}`;
    const waText = paydayPreauth
      ? `Howzit ${event.host_name}! 🇿🇦 Pre-authorized my card on PullThru for *${event.title}* (${formatZar(
          split.totalBasePriceZar || event.price_zar || 100
        )} — ${appUrl}). Auto-charges on the 25th payday at 06:00 AM. Spot is locked in! 🔒`
      : `Howzit ${event.host_name}! 🇿🇦 Pledged my spot for payday on PullThru for *${event.title}* (${formatZar(
          split.totalBasePriceZar || event.price_zar || 100
        )} — ${appUrl}). Nudge me when salary lands so I can settle!`;
    const waTargetUrl = event.host_phone
      ? `https://wa.me/${normalizeSaPhone(event.host_phone)}?text=${encodeURIComponent(waText)}`
      : `https://wa.me/?text=${encodeURIComponent(waText)}`;
    window.open(
      waTargetUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // Host Control 1: Copy WhatsApp Group Hype Update
  const handleCopyHostWhatsappUpdate = () => {
    if (!event) return;
    const appOrigin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://pullthru.co.za";
    const cacheBustedUrl = `${appOrigin}/e/${event.slug}?v=${lockedSpotsCount}`;

    const guestLines = confirmedRsvps.map((r, i) => {
      const displayName = r.is_anonymous_on_wall
        ? "🔒 Anonymous Legend"
        : r.guest_name;
      const bringTag = r.claimed_item_label ? ` [${r.claimed_item_label}]` : "";
      return `${i + 1}. ${displayName} ✅${bringTag}`;
    });

    const unclaimedItems = (event.bring_items || []).filter(
      (b) => !b.claimed_by_name
    );
    const bringSummary =
      unclaimedItems.length > 0
        ? `\n🧊 *Still unclaimed to bring:* ${unclaimedItems
            .map((b) => b.label)
            .join(", ")}`
        : "";

    const statusHeader =
      event.mode === "pot"
        ? `🎁 *${formatZar(totalPotRaisedZar)}${
            event.target_pot_zar
              ? ` of ${formatZar(event.target_pot_zar)}`
              : ""
          } Raised (${confirmedRsvps.length} Contributors)*`
        : event.max_spots
        ? `🔥 *${lockedSpotsCount}/${event.max_spots} Spots Locked In — Only ${spotsRemaining} Left!*`
        : `🔥 *${lockedSpotsCount} Legends Locked In!*`;

    const text =
      `🇿🇦 *${event.title.toUpperCase()}*\n` +
      `📍 ${event.location_name} • 🗓️ ${event.event_date}\n\n` +
      `${statusHeader}\n` +
      (guestLines.length > 0
        ? guestLines.join("\n")
        : "1. [ Open Spot — Tap link below ]") +
      `${bringSummary}\n\n` +
      `⚡ *No chancers — Lock your spot in 5 seconds via Direct PayShap / Capitec PayMe (R0 Guest Fee):*\n` +
      `${cacheBustedUrl}`;

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedHypeUpdate(true);
      setTimeout(() => setCopiedHypeUpdate(false), 2500);
    }
  };

  // Host Control 1B: Copy Formatted WhatsApp Squad List / Roll Call (Thabo Soweto 5-a-Side Suggestion)
  const handleCopySquadList = () => {
    if (!event) return;
    const appOrigin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://pullthru.co.za";
    const eventUrl = `${appOrigin}/e/${event.slug}`;

    const guestLines = confirmedRsvps.map((r, i) => {
      const displayName = r.is_anonymous_on_wall
        ? "🔒 Anonymous Legend"
        : r.guest_name;
      const plusOneText =
        r.plus_one_names &&
        r.plus_one_names.length > 0 &&
        !displayName.includes("+")
          ? ` (+${r.plus_one_names.join(", ")})`
          : "";
      const badgeTag = r.badge_label ? ` • ${r.badge_label}` : "";
      const bringTag = r.claimed_item_label
        ? ` [Bringing: ${r.claimed_item_label}]`
        : "";
      return `${i + 1}. ${displayName}${plusOneText} ✅${badgeTag}${bringTag}`;
    });

    const isFivesOrPadel =
      /5-a-side|fives|soccer|football|padel|squash|tennis|basketball/i.test(
        event.title + " " + event.category_vibe
      );

    let teamBibsSection = "";
    if (isFivesOrPadel && confirmedRsvps.length >= 4) {
      // Flatten all confirmed players including individual plus-ones
      const allPlayers: string[] = [];
      for (const r of confirmedRsvps) {
        const baseName = r.is_anonymous_on_wall
          ? "🔒 Anonymous Legend"
          : r.guest_name;
        allPlayers.push(baseName);
        if (
          r.plus_one_names &&
          r.plus_one_names.length > 0 &&
          !baseName.includes("+")
        ) {
          for (const p of r.plus_one_names) {
            allPlayers.push(`${p} (${baseName}'s +1)`);
          }
        } else if (r.spots_locked && r.spots_locked > 1 && !baseName.includes("+")) {
          for (let s = 1; s < r.spots_locked; s++) {
            allPlayers.push(`${baseName} (+1 Guest #${s})`);
          }
        }
      }

      const teamGreen = allPlayers
        .filter((_, idx) => idx % 2 === 0)
        .map((p, idx) => `   ${idx + 1}. ${p}`);
      const teamGold = allPlayers
        .filter((_, idx) => idx % 2 !== 0)
        .map((p, idx) => `   ${idx + 1}. ${p}`);

      teamBibsSection =
        `\n\n🟢 *TEAM GREEN (BIBS):*\n${teamGreen.join("\n")}\n\n` +
        `🟡 *TEAM GOLD:*\n${teamGold.join("\n")}`;
    }

    const unclaimedItems = (event.bring_items || []).filter(
      (b) => !b.claimed_by_name
    );
    const bringSummary =
      unclaimedItems.length > 0
        ? `\n\n🧊 *Still needed for the session:* ${unclaimedItems
            .map((b) => b.label)
            .join(", ")}`
        : "";

    const spotsLine =
      event.max_spots
        ? spotsRemaining !== null && spotsRemaining > 0
          ? `⏳ *Spots Remaining:* ${spotsRemaining} left (First-come, first-served!)\n`
          : `🔥 *CAPACITY REACHED:* All ${event.max_spots} spots locked in!\n`
        : "";

    const text =
      `🇿🇦 *${event.title.toUpperCase()} — CONFIRMED SQUAD LIST* 📋\n` +
      `📍 ${event.location_name} • 🗓️ ${event.event_date}\n\n` +
      `👥 *CONFIRMED PLAYERS (${confirmedRsvps.length}${
        event.max_spots ? `/${event.max_spots}` : ""
      }):*\n` +
      (guestLines.length > 0
        ? guestLines.join("\n")
        : "1. [ No confirmed players yet — be first! ]") +
      teamBibsSection +
      bringSummary +
      `\n\n${spotsLine}` +
      `👉 *Need to lock in or swap your spot?*\n` +
      `${eventUrl}`;

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedSquadList(true);
      setTimeout(() => setCopiedSquadList(false), 2500);
    }
  };

  // Viral Weapon 1: 1-Tap Squad Banter & "Flaky Friend Roast" Generator
  const handleCopySquadRoast = () => {
    if (!event) return;
    const appOrigin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://pullthru.co.za";
    const url = `${appOrigin}/e/${event.slug}?v=${lockedSpotsCount}`;
    const firstPayer = confirmedRsvps[0]?.is_anonymous_on_wall
      ? "Anonymous Legend"
      : confirmedRsvps[0]?.guest_name || "First In";
    const secondPayer = confirmedRsvps[1]?.is_anonymous_on_wall
      ? "Anonymous Legend"
      : confirmedRsvps[1]?.guest_name;

    const unpaidPledges = rsvps.filter((r) => r.status === "payday_promise");
    const unpaidNames = unpaidPledges.map((r) => `@${r.guest_name}`).join(", ");

    const text =
      `🇿🇦 *${event.title.toUpperCase()} — SQUAD ROLL CALL & ROAST* 🔥\n` +
      `📍 ${event.location_name} • 🗓️ ${event.event_date}\n\n` +
      `🏆 *MVPs Who Locked In First:*\n` +
      `🥇 #1 ${firstPayer} (Paid & Ready 🔥)\n` +
      (secondPayer ? `🥈 #2 ${secondPayer} (Spot Secured ⚽)\n` : "") +
      `\n🔥 *STATUS:* ${lockedSpotsCount}/${event.max_spots || 10} Spots Locked (${
        spotsRemaining ?? 0
      } Left)\n` +
      (unpaidNames ? `👀 *Unpaid on 'Blue Ticks' / Payday Standby:* ${unpaidNames}\n` : "") +
      `\n🚫 Stop begging the boys for EFTs on kickoff. First to pay locks their bib:\n` +
      `👉 ${url}`;

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedRoast(true);
      setTimeout(() => setCopiedRoast(false), 2500);
    }
  };

  // Viral Weapon 2: Emergency 5 PM Bailed Spot Alert
  const handleCopyEmergencyStandby = () => {
    if (!event) return;
    const appOrigin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://pullthru.co.za";
    const url = `${appOrigin}/e/${event.slug}`;
    const text =
      `🚨 *EMERGENCY SPOT OPEN — ${event.title.toUpperCase()}*\n` +
      `📍 ${event.location_name} • 🗓️ ${event.event_date}\n\n` +
      `Someone just bailed for tonight's game! 😩\n` +
      `⚡ First player to tap the link and PayShap claims the bib immediately:\n` +
      `👉 ${url}`;

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedEmergency(true);
      setTimeout(() => setCopiedEmergency(false), 2500);
    }
  };

  // Host Control 2: + Log Cash / Direct EFT Guest (POPIA-safe display name only)
  const handleAddCashGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !cashGuestName.trim()) return;
    setCashSubmitting(true);
    setHostActionError(null);
    try {
      const hostToken = getHostToken();
      const matchedCashTier =
        event.mode === "tiered" && cashTierLabel
          ? event.tiers.find((t) => t.label === cashTierLabel)
          : null;
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-host-token": hostToken,
        },
        body: JSON.stringify({
          slug: event.slug,
          host_token: hostToken,
          guest_name: cashGuestName.trim(),
          spots_locked: cashSpots,
          amount_contributed_zar: cashAmountZar,
          tier_id: matchedCashTier?.id || null,
          tier_label:
            event.mode === "tiered"
              ? cashTierLabel || event.tiers?.[0]?.label || null
              : null,
          status: "cash_logged",
          badge_label: "💵 Cash / Direct EFT Legend",
          comment:
            cashComment.trim() ||
            `Settled directly with Host ${event.host_name} ✅`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setHostActionError(data?.error || "Could not log cash guest.");
        return;
      }
      if (data?.rsvp) {
        if (data?.event) {
          setEvent(data.event);
        }
        setRsvps((prev) => [data.rsvp, ...prev]);
        setCashGuestName("");
        setCashComment("");
        setCashSpots(1);
        setShowCashModal(false);
      }
    } finally {
      setCashSubmitting(false);
    }
  };

  // Host Control 3: 🌧️ Edit Event Details / Postpone Date (Zero Refund Fee Loss)
  const handlePostponeDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !newEventDateInput.trim()) return;
    setPostponeSubmitting(true);
    setPostponeSuccess(null);
    setHostActionError(null);
    try {
      const hostToken = getHostToken();
      const res = await fetch("/api/events", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-host-token": hostToken,
        },
        body: JSON.stringify({
          slug: event.slug,
          host_token: hostToken,
          action: "edit_details",
          event_date: newEventDateInput.trim(),
          location_name: editLocationInput.trim() || event.location_name,
          secret_location_pin: editSecretPinInput.trim() || null,
          max_spots: editMaxSpotsInput.trim() ? Number(editMaxSpotsInput) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setHostActionError(data?.error || "Could not update event details.");
        return;
      }
      if (data?.event) {
        setEvent(data.event);
        setPostponeSuccess(
          "Event updated! Copy the WhatsApp Reschedule Notice below so your squad has the latest details."
        );
      }
    } finally {
      setPostponeSubmitting(false);
    }
  };

  // Host Control: 1-Tap Release Claimed Bring-'n-Bak Item when a guest flakes
  const handleUnclaimBringItem = async (itemId: string) => {
    if (!event) return;
    setHostActionError(null);
    try {
      const hostToken = getHostToken();
      const res = await fetch("/api/events", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-host-token": hostToken,
        },
        body: JSON.stringify({
          slug: event.slug,
          host_token: hostToken,
          action: "unclaim_bring_item",
          item_id: itemId,
        }),
      });
      const data = await res.json();
      if (res.ok && data?.event) {
        setEvent(data.event);
        loadEvent();
      } else if (!res.ok) {
        setHostActionError(data?.error || "Could not release item.");
      }
    } catch {
      // ignore
    }
  };

  // Host Control: 1-Tap Moderation (Hide offensive comment, verify POP, verify cash, or remove unpaid troll)
  const handleModerateRsvp = async (
    rsvpId: string,
    moderationAction: "hide_comment" | "remove_unpaid" | "verify_pop" | "verify_cash"
  ) => {
    if (!event) return;
    setHostActionError(null);
    try {
      const hostToken = getHostToken();
      const res = await fetch("/api/rsvp", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-host-token": hostToken,
        },
        body: JSON.stringify({
          action: "moderate_rsvp",
          slug: event.slug,
          host_token: hostToken,
          rsvpId,
          moderationAction,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setHostActionError(data?.error || "Moderation failed.");
        return;
      }
      if (data?.event) {
        setEvent(data.event);
      }
      if (moderationAction === "remove_unpaid") {
        setRsvps((prev) => prev.filter((r) => r.id !== rsvpId));
      } else if (data?.rsvp) {
        setRsvps((prev) => prev.map((r) => (r.id === rsvpId ? data.rsvp : r)));
      }
    } catch {
      // ignore
    }
  };

  // Host Control: 1-Click Expire All Unpaid Payday Standby Pledges
  const handleExpirePaydayPledges = async () => {
    if (!event) return;
    setHostActionError(null);
    try {
      const hostToken = getHostToken();
      const res = await fetch("/api/events", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-host-token": hostToken,
        },
        body: JSON.stringify({
          slug: event.slug,
          host_token: hostToken,
          action: "expire_payday_pledges",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setHostActionError(data?.error || "Could not clear unpaid pledges.");
        return;
      }
      if (data?.event) {
        setEvent(data.event);
      }
      setRsvps((prev) => prev.filter((r) => r.status !== "payday_promise"));
    } catch {
      // ignore
    }
  };

  // Host Control: Self-Service Host Admin Token Recovery (Host Phone + Secret Verification)
  const handleRecoverHostAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    setRecoverHostLoading(true);
    setHostKeyError(null);
    try {
      const res = await fetch("/api/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: event.slug,
          action: "recover_host_token",
          host_phone: recoverHostPhoneInput.trim(),
          secret_check: recoverHostSecretInput.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setHostKeyError(
          data?.error || "Could not verify host details. Check your phone & verification code."
        );
        return;
      }
      if (data?.host_secret_token && slug) {
        try {
          localStorage.setItem(`pullthru_host_${slug}`, data.host_secret_token);
        } catch {
          // ignore
        }
        setShowHostKeyModal(false);
        setHostMode(true);
        loadEvent();
      }
    } catch {
      setHostKeyError("Network error while recovering host access.");
    } finally {
      setRecoverHostLoading(false);
    }
  };

  // Host Control: Unlock R29 Pro Event Boost / R79/mo Club Pass (Collect After Value)
  const handleUnlockProBoost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    setProBoostSubmitting(true);
    setProBoostError(null);
    setProBoostSuccess(null);
    try {
      const hostToken = getHostToken();
      const res = await fetch("/api/events", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-host-token": hostToken,
        },
        body: JSON.stringify({
          slug: event.slug,
          host_token: hostToken,
          action: "unlock_pro_boost",
          pro_boost_reference: proBoostRefInput.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setProBoostError(
          data?.error ||
            "Please enter your R29 Pro Boost or R79/mo Club Pass payment reference (at least 6 characters)."
        );
        return;
      }
      if (data?.event) {
        setEvent(data.event);
      }
      if ((proBoostTier === "r79" || proBoostTier === "r790") && typeof window !== "undefined") {
        try {
          localStorage.setItem("pullthru_club_pass_active", proBoostRefInput.trim());
        } catch {
          // ignore
        }
      }
      setProBoostSuccess(
        data?.message ||
          "⚡ Pro Event Boost Unlocked! Spots 7–100+, 1-Tap Weekly Clone, and CSV Export are now active."
      );
    } catch {
      setProBoostError("Network error activating Pro Event Boost.");
    } finally {
      setProBoostSubmitting(false);
    }
  };

  // Host Control: Cancel Event & Refund All Paid Guests
  const handleCancelEvent = async () => {
    if (!event) return;
    setPostponeSubmitting(true);
    setHostActionError(null);
    try {
      const hostToken = getHostToken();
      const res = await fetch("/api/events", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-host-token": hostToken,
        },
        body: JSON.stringify({
          slug: event.slug,
          host_token: hostToken,
          action: "cancel_event",
          reason: "Host cancelled event — 100% refund to squad",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setHostActionError(data?.error || "Could not cancel event.");
        return;
      }
      if (data?.event) {
        setEvent(data.event);
        setPostponeSuccess(data.message || "Event cancelled & squad queued for refund.");
        loadEvent();
      }
    } finally {
      setPostponeSubmitting(false);
    }
  };

  // Host Control: Copy Emergency Subs / Shortfall Alert for WhatsApp
  const handleCopyEmergencyShortfallAlert = () => {
    if (!event) return;
    const appOrigin =
      typeof window !== "undefined" ? window.location.origin : "https://pullthru.co.za";
    const needed = spotsRemaining && spotsRemaining > 0 ? spotsRemaining : 2;
    const shortfallZar =
      shortfallSplit && shortfallSplit.shortfallZar > 0
        ? shortfallSplit.shortfallZar
        : needed * (event.price_zar || 100);
    const alertText =
      `🚨 *PITCH / VENUE EMERGENCY: ${needed} SUBS NEEDED FOR ${event.title.toUpperCase()}!* 🚨\n` +
      `🗓️ ${event.event_date} • 📍 ${event.location_name}\n\n` +
      `We have *${lockedSpotsCount}* locked in and need *${needed} more* (${formatZar(shortfallZar)} shortfall) before cut-off to save the booking!\n` +
      `⚡ First ${needed} ringers to lock in now save the game:\n` +
      `👉 ${appOrigin}/e/${event.slug}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(alertText);
      setCopiedShortfallAlert(true);
      setTimeout(() => setCopiedShortfallAlert(false), 2500);
    }
  };

  // Host Control: Copy Shortfall Top-Up Split Message for Confirmed Squad on WhatsApp
  const handleCopyShortfallTopUpSplit = () => {
    if (!event || !shortfallSplit) return;
    triggerHaptic("success");
    const appOrigin =
      typeof window !== "undefined" ? window.location.origin : "https://pullthru.co.za";
    const msg = formatShortfallTopUpWhatsAppMessage({
      eventTitle: event.title,
      eventDate: event.event_date,
      locationName: event.location_name,
      eventUrl: `${appOrigin}/e/${event.slug}`,
      hostName: event.host_name,
      payshapId: event.host_phone,
      bankName: event.host_bank_name || undefined,
      accountNumber: event.host_account_number || undefined,
      capitecPaymeUrl: event.capitec_payme_url || undefined,
      splitResult: shortfallSplit,
    });
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(msg);
      setCopiedShortfallTopUp(true);
      setTimeout(() => setCopiedShortfallTopUp(false), 3000);
    }
  };

  // Host Control: 1-Tap Lock Headcount at Current Confirmed Squad (Close Remaining Empty Spots)
  const handleLockHeadcountAtCurrentSquad = async () => {
    if (!event || lockedSpotsCount < 1) return;
    triggerHaptic("medium");
    setLockingSquadHeadcount(true);
    setHostActionError(null);
    setLockedHeadcountBannerMsg(null);
    try {
      // Preserve the original booking target before lowering max_spots so the shortfall calculator remembers the R1,000 pitch cost!
      if (customShortfallTargetZar === null && defaultShortfallTargetZar > 0) {
        setCustomShortfallTargetZar(defaultShortfallTargetZar);
      }
      const hostToken = getHostToken();
      // 1. If there are unpaid standby pledges, expire them first so no ghost pledges remain
      const hasStandby = rsvps.some((r) => r.status === "payday_promise");
      if (hasStandby) {
        await fetch("/api/events", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-host-token": hostToken,
          },
          body: JSON.stringify({
            slug: event.slug,
            host_token: hostToken,
            action: "expire_payday_pledges",
          }),
        });
        setRsvps((prev) => prev.filter((r) => r.status !== "payday_promise"));
      }

      // 2. Update max_spots down to lockedSpotsCount so the app marks the event as FULL at current squad
      const res = await fetch("/api/events", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-host-token": hostToken,
        },
        body: JSON.stringify({
          slug: event.slug,
          host_token: hostToken,
          action: "edit_details",
          max_spots: lockedSpotsCount,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setHostActionError(data?.error || "Could not lock squad headcount.");
        return;
      }
      if (data?.event) {
        setEvent(data.event);
        setEditMaxSpotsInput(String(lockedSpotsCount));
        setLockedHeadcountBannerMsg(
          `🔒 Squad locked at ${lockedSpotsCount}/${lockedSpotsCount} spots! Remaining open spots are now closed.`
        );
      }
    } catch {
      setHostActionError("Network error while locking squad headcount.");
    } finally {
      setLockingSquadHeadcount(false);
    }
  };

  // Host Control: Guarded Toggle so switching browsers/phones prompts for Host Key instead of failing with 403
  const handleToggleHostModeWithGuard = () => {
    triggerHaptic("light");
    setHostActionError(null);
    if (hostMode) {
      setHostMode(false);
      return;
    }
    const token = getHostToken();
    if (!token) {
      setHostKeyError(null);
      setShowHostKeyModal(true);
      return;
    }
    setHostMode(true);
  };

  const handleSaveManualHostKey = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = manualHostKeyInput.trim();
    if (!raw || !slug) {
      setHostKeyError("Please paste your Host Secret Token or Private Admin Link.");
      return;
    }
    // Extract hostToken if user pasted the full URL (?hostToken=...)
    let extracted = raw;
    if (raw.includes("hostToken=")) {
      try {
        const u = new URL(raw.startsWith("http") ? raw : `https://pullthru.co.za/${raw}`);
        extracted = u.searchParams.get("hostToken") || raw;
      } catch {
        const match = raw.match(/hostToken=([^&\s]+)/);
        if (match?.[1]) extracted = decodeURIComponent(match[1]);
      }
    }
    try {
      localStorage.setItem(`pullthru_host_${slug}`, extracted);
    } catch {
      // ignore
    }
    setShowHostKeyModal(false);
    setHostMode(true);
    loadEvent();
  };

  // Guest Self-Serve: Recover Lost Pass by WhatsApp Number
  const handleRecoverLostPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    setRecoverLoading(true);
    setRecoverError(null);
    setRecoverResult(null);
    try {
      const res = await fetch("/api/rsvp", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "recover_pass",
          slug: event.slug,
          buyerWhatsapp: recoverPhoneInput.trim(),
          buyerName: recoverNameInput.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRecoverError(
          data?.error || "Could not find a pass matching that WhatsApp number."
        );
        return;
      }
      if (data?.rsvp) {
        const refToSave = data?.order?.paystack_reference || `FREE_RSVP_${data.rsvp.id}`;
        const recoveredRsvp = {
          ...data.rsvp,
          swap_token: data?.recovered_swap_token || data.rsvp.swap_token || "",
        };
        saveGuestProfileAndUnlock(recoveredRsvp, refToSave);
        setMyUnlockedRsvp(recoveredRsvp);
        setMyUnlockedRef(refToSave);
        if (recoveredRsvp.swap_token) {
          setDisputeSwapTokenInput(recoveredRsvp.swap_token);
        }
        setRecoverResult({
          rsvp: recoveredRsvp,
          ref: refToSave,
          message: data.message || "Pass recovered!",
        });
        loadEvent();
      }
    } catch {
      setRecoverError("Network error while looking up pass.");
    } finally {
      setRecoverLoading(false);
    }
  };

  // Guest Self-Serve: Submit Refund Request or Report Scam / Freeze Payout
  const handleSubmitRefundOrDispute = async (isDispute: boolean) => {
    if (!event) return;
    setDisputeSubmitting(true);
    setDisputeErrorMsg(null);
    setDisputeSuccessMsg(null);
    try {
      const tokenToUse =
        disputeSwapTokenInput.trim() || myUnlockedRsvp?.swap_token || "";
      const refToUse = myUnlockedRef || "";
      if (!tokenToUse && !refToUse) {
        setDisputeErrorMsg(
          "First find your pass in the 'Find My Pass' tab or paste your Pass Token / Reference so we can verify your paid spot."
        );
        return;
      }
      const res = await fetch("/api/rsvp", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isDispute ? "report_dispute" : "request_refund",
          slug: event.slug,
          swapToken: tokenToUse,
          ref: refToUse,
          reason: disputeReasonInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDisputeErrorMsg(data?.error || "Could not process request.");
        return;
      }
      setDisputeSuccessMsg(
        data?.message || "Request processed! Your Refund Reference is ready."
      );
      loadEvent();
    } catch {
      setDisputeErrorMsg("Network error submitting request.");
    } finally {
      setDisputeSubmitting(false);
    }
  };

  // Host Control 4: 1-Tap Guest Check-In Toggle (with Duplicate Pass / Already Checked-In Guard)
  const handleToggleCheckIn = async (rsvpId: string) => {
    if (!event) return;
    const existingRsvp = rsvps.find((item) => item.id === rsvpId);
    if (existingRsvp?.checked_in && typeof window !== "undefined") {
      const confirmUndo = window.confirm(
        `⚠️ DUPLICATE PASS WARNING: ${existingRsvp.guest_name} (PIN #${existingRsvp.gate_pin || "----"}) is ALREADY checked in at the gate!\n\nOnly click OK if you checked them in by mistake and want to undo their check-in.`
      );
      if (!confirmUndo) return;
    }
    setHostActionError(null);
    try {
      const hostToken = getHostToken();
      const res = await fetch("/api/rsvp", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-host-token": hostToken,
        },
        body: JSON.stringify({
          action: "toggle_checkin",
          slug: event.slug,
          host_token: hostToken,
          rsvpId,
          rsvp_id: rsvpId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setHostActionError(data?.error || "Could not toggle check-in.");
        return;
      }
      if (data?.rsvp) {
        setRsvps((prev) =>
          prev.map((item) => (item.id === rsvpId ? data.rsvp : item))
        );
      }
    } catch {
      // ignore error
    }
  };

  // Host Control 5: Add a new Bring-Item
  const handleAddBringItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !newBringItemLabel.trim()) return;
    setAddingBringItem(true);
    setHostActionError(null);
    try {
      const hostToken = getHostToken();
      const res = await fetch("/api/events", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-host-token": hostToken,
        },
        body: JSON.stringify({
          slug: event.slug,
          host_token: hostToken,
          action: "add_bring_item",
          label: newBringItemLabel.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setHostActionError(data?.error || "Could not add Bring-'n-Bak item.");
        return;
      }
      if (data?.event) {
        setEvent(data.event);
        setNewBringItemLabel("");
      }
    } finally {
      setAddingBringItem(false);
    }
  };

  const handleAddNewBringItemDirect = async (label: string) => {
    if (!event || !label.trim()) return;
    setAddingBringItem(true);
    setHostActionError(null);
    try {
      const hostToken = getHostToken();
      const res = await fetch("/api/events", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-host-token": hostToken,
        },
        body: JSON.stringify({
          slug: event.slug,
          host_token: hostToken,
          action: "add_bring_item",
          label: label.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setHostActionError(data?.error || "Could not add Bring-'n-Bak item.");
        return;
      }
      if (data?.event) {
        setEvent(data.event);
      }
    } finally {
      setAddingBringItem(false);
    }
  };

  // Host Control 6: Export CSV Guest List (for Venue Gate Security / Catering)
  const handleExportCsvGuestList = () => {
    if (!event) return;
    const escapeCsv = (val: string | number | boolean | null | undefined) => {
      let str = String(val ?? "");
      // Neutralize spreadsheet formula injection (=, +, -, @)
      if (
        str.startsWith("=") ||
        str.startsWith("+") ||
        str.startsWith("-") ||
        str.startsWith("@")
      ) {
        str = "'" + str;
      }
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = [
      "Rank",
      "Guest Name",
      "Plus Ones",
      "Spots",
      "Status",
      "Payment Rail",
      "POP Reference / Note",
      "Amount ZAR",
      "Tier",
      "Bring Item",
      "Checked In",
    ];
    const rows = chronologicalRsvps.map((r, i) => [
      i + 1,
      r.guest_name,
      (r.plus_one_names || []).join("; "),
      r.spots_locked || 1,
      r.status,
      r.pop_rail_badge || r.payment_channel || "direct_pop",
      r.pop_reference_note || r.pop_hash || "",
      r.amount_contributed_zar || 0,
      r.tier_label || "",
      r.claimed_item_label || "",
      r.checked_in ? "YES" : "NO",
    ]);

    const csvContent = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\n");

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(csvContent);
    }

    if (typeof window !== "undefined") {
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${event.slug}-guest-list.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    setCopiedCsv(true);
    setTimeout(() => setCopiedCsv(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#0F172A]">
        <Navbar />
        <main className="mx-auto max-w-5xl px-4 py-20 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#007749] border-t-transparent" />
          <p className="font-display text-lg font-extrabold text-[#0F172A]">
            Loading PullThru Event Wall...
          </p>
          <p className="mt-1 text-sm text-[#475569]">
            Checking live spots, bring-list &amp; bank details...
          </p>
        </main>
      

      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#0F172A]">
        <Navbar />
        <main className="mx-auto max-w-xl px-4 py-20 text-center">
          <div className="rounded-3xl border border-[#E6E2D8] bg-white p-8 shadow-xs">
            <h1 className="font-display text-2xl font-extrabold text-[#0F172A]">
              Event Not Found
            </h1>
            <p className="mt-2 text-sm text-[#475569]">
              {error || "This PullThru link may have expired or moved."}
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#007749] px-6 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-[#005F3A]"
            >
              <span>Explore Live SA Events</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const formattedEventDate = (() => {
    if (!event.event_date) return "Upcoming Session";
    const parsed = new Date(event.event_date);
    if (isNaN(parsed.getTime())) return event.event_date;
    return parsed.toLocaleDateString("en-ZA", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  })();

  const hostBankDisplay =
    event.host_bank_name ||
    SA_BANKS[0]?.name ||
    "Capitec Bank";

  const capacityPercent = event.max_spots
    ? Math.min(100, Math.round((lockedSpotsCount / event.max_spots) * 100))
    : 100;

  const potPercent = event.target_pot_zar
    ? Math.min(100, Math.round((totalPotRaisedZar / event.target_pot_zar) * 100))
    : 75;

  // Build Empty Spot Placeholders for spot-capped events (show up to 6 interactive placeholders)
  const emptySpotNumbers: number[] = [];
  if (event.max_spots && spotsRemaining && spotsRemaining > 0) {
    const startSpot = lockedSpotsCount + 1;
    const endSpot = Math.min(event.max_spots, startSpot + 5);
    for (let s = startSpot; s <= endSpot; s++) {
      emptySpotNumbers.push(s);
    }
  }

  const unclaimedBringItems = (event.bring_items || []).filter(
    (b) =>
      !b.claimed_by_name ||
      Boolean(settlingRsvpId && b.claimed_rsvp_id === settlingRsvpId)
  );

  const renderCheckoutCardContent = (isDrawer = false) => (
    <>
      {!isDrawer && (
        <div className="flex items-center justify-between border-b border-[#E6E2D8] pb-3.5">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#007749]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Lock In Your Spot</span>
            </span>
            <h2 className="font-display mt-0.5 text-xl font-extrabold text-[#0F172A]">
              {isSoldOut
                ? "Event Full (Sold Out)"
                : isFreeCheckout
                ? "Lock In Your Free Spot"
                : event.mode === "pot"
                ? "Contribute to the Pot"
                : "Lock In Your Spot"}
            </h2>
          </div>

          <div className="text-right">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#475569]">
              {event.mode === "pot" ? "Suggested" : "Per Spot"}
            </span>
            <span className="font-mono-num text-xl font-extrabold text-[#007749]">
              {isFreeCheckout ? "FREE" : formatZar(unitBasePriceZar)}
            </span>
          </div>
        </div>
      )}

              {settlingRsvpId && (
                <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-[#FFB81C] bg-[#FFB81C]/15 px-3.5 py-2.5 text-xs font-bold text-[#0F172A]">
                  <span>
                    🗓️ Settling Payday 25th Pledge for {buyerName || "your spot"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSettlingRsvpId(null)}
                    className="rounded-lg border border-[#E6E2D8] bg-white px-2.5 py-1 text-[11px] font-bold text-[#475569] hover:text-[#0F172A]"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {autoFilledFromStorage && (
                <div className="mt-3 flex items-center justify-between rounded-xl border border-[#007749]/25 bg-[#007749]/[0.06] px-3.5 py-2 text-[11px] font-medium text-[#007749]">
                  <span>⚡ Welcome back! Your details are pre-filled.</span>
                  <button
                    type="button"
                    onClick={() => {
                      setBuyerName("");
                      setBuyerWhatsapp("");
                      setBuyerEmail("");
                      setAutoFilledFromStorage(false);
                      setSettlingRsvpId(null);
                    }}
                    className="underline text-[#475569] hover:text-[#0F172A]"
                  >
                    Clear
                  </button>
                </div>
              )}

              <form onSubmit={handleInitiateCheckout} className="mt-3.5 space-y-3.5">
                {/* Phone-First Input (Zero Forced Email) */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="checkout-buyer-name" className="mb-1 block text-xs font-bold text-[#0F172A]">
                      Your name (shown on the wall) *
                    </label>
                    <input
                      id="checkout-buyer-name"
                      type="text"
                      required
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="e.g. Siya K"
                      className="w-full rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-3.5 py-2.5 text-base sm:text-sm font-semibold text-[#0F172A] placeholder-[#475569]/60 focus:border-[#007749] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="checkout-buyer-whatsapp" className="mb-1 flex items-center justify-between text-xs font-bold text-[#0F172A]">
                      <span>
                        WhatsApp Number{" "}
                        {checkoutPaymentMethod === "gateway" && !isFreeCheckout
                          ? "*"
                          : "(Optional)"}
                      </span>
                      <span className="text-[10px] font-normal text-[#64748B]">For gate PIN &amp; reminders</span>
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3 flex items-center gap-1 text-xs font-bold text-[#475569] pointer-events-none select-none">
                        <SouthAfricaFlagSvg className="h-3 w-4.5" />
                        <span>+27</span>
                      </div>
                      <input
                        id="checkout-buyer-whatsapp"
                        type="tel"
                        required={checkoutPaymentMethod === "gateway" && !isFreeCheckout}
                        value={buyerWhatsapp}
                        onChange={(e) => setBuyerWhatsapp(e.target.value)}
                        placeholder="82 123 4567 (optional for 1-tap join)"
                        className="font-mono-num w-full rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] pl-16 pr-3.5 py-2.5 text-base sm:text-sm font-semibold text-[#0F172A] placeholder-[#475569]/60 focus:border-[#007749] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* TIER SELECTOR (if tiered mode) */}
                {event.mode === "tiered" && event.tiers?.length > 0 && (
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[#0F172A]">
                      Select Your Braai / Event Tier
                    </label>
                    <div className="space-y-2">
                      {event.tiers.map((tier) => {
                        const active = selectedTier?.id === tier.id;
                        const tierUsedSpots = confirmedRsvps
                          .filter((r) => r.tier_label === tier.label)
                          .reduce((sum, r) => sum + (r.spots_locked || 1), 0);
                        const tierSpotsLeft =
                          typeof tier.max_spots === "number"
                            ? Math.max(0, tier.max_spots - tierUsedSpots)
                            : null;
                        const isTierSoldOut =
                          tierSpotsLeft !== null && tierSpotsLeft <= 0;
                        return (
                          <button
                            key={tier.id}
                            type="button"
                            disabled={isTierSoldOut}
                            onClick={() => setSelectedTierId(tier.id)}
                            className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              active
                                ? "border-[#007749] bg-[#007749]/[0.06] text-[#0F172A]"
                                : "border-[#E6E2D8] bg-[#FAF8F5] text-[#475569] hover:border-[#007749]/40"
                            }`}
                          >
                            <div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <p className="text-xs font-bold text-[#0F172A]">
                                  {tier.label}
                                </p>
                                {tierSpotsLeft !== null && (
                                  <span
                                    className={`font-mono-num rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                                      isTierSoldOut
                                        ? "bg-rose-100 text-rose-700"
                                        : "bg-[#F3F0EA] text-[#475569]"
                                    }`}
                                  >
                                    {isTierSoldOut
                                      ? "Sold Out"
                                      : `${tierSpotsLeft} left`}
                                  </span>
                                )}
                              </div>
                              {tier.description && (
                                <p className="text-[11px] text-[#475569]">
                                  {tier.description}
                                </p>
                              )}
                            </div>
                            <span className="font-mono-num ml-2 shrink-0 rounded-lg border border-[#E6E2D8] bg-white px-2.5 py-1 text-xs font-bold text-[#007749]">
                              {tier.price_zar === 0
                                ? "Free (Mahala)"
                                : formatZar(tier.price_zar)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* POT CONTRIBUTION SELECTOR (if pot mode) */}
                {event.mode === "pot" && (
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[#0F172A]">
                      Choose Your Gift / Pot Contribution (Min{" "}
                      {formatZar(event.min_pot_contribution_zar || 15)})
                    </label>
                    <div className="mb-2 grid grid-cols-4 gap-2">
                      {[100, 150, 250, 500].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setCustomPotAmountZar(amt)}
                          className={`font-mono-num rounded-xl border py-2 text-xs font-bold transition ${
                            customPotAmountZar === amt
                              ? "border-[#007749] bg-[#007749] text-white"
                              : "border-[#E6E2D8] bg-[#FAF8F5] text-[#0F172A] hover:border-[#007749]/40"
                          }`}
                        >
                          R{amt}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      min={event.min_pot_contribution_zar || 15}
                      step={10}
                      value={customPotAmountZar}
                      onChange={(e) =>
                        setCustomPotAmountZar(Number(e.target.value))
                      }
                      className="font-mono-num w-full rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-3.5 py-2 text-base sm:text-sm font-bold text-[#0F172A] focus:border-[#007749] focus:bg-white focus:outline-none"
                    />
                  </div>
                )}

                {/* COLLAPSED GUEST EXTRAS ACCORDION (+1s, Bring-Item, Banter Badge, Comment, Custom Question, POPIA Anonymous) */}
                <div className="rounded-2xl border border-[#E6E2D8] bg-[#FAF8F5] p-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setShowGuestExtrasAccordion((prev) => !prev)}
                    className="flex w-full items-center justify-between font-bold text-[#0F172A] hover:text-[#007749] transition"
                  >
                    <span className="flex items-center gap-1.5">
                      <span>➕ Add +1s, Claim Bring-Item or Note (Optional)</span>
                      {(spotsCount > 1 || claimedItemId || customBringItem.trim() || comment.trim()) && (
                        <span className="rounded-full bg-[#007749]/15 px-2 py-0.5 text-[10px] font-extrabold text-[#007749]">
                          Active
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] text-[#007749] font-semibold underline shrink-0">
                      {showGuestExtrasAccordion ? "Hide" : "+ Customize"}
                    </span>
                  </button>

                  {showGuestExtrasAccordion && (
                    <div className="mt-3 space-y-3.5 border-t border-[#E6E2D8] pt-3">
                      {/* +1 / PARTNER / KIDS MULTI-SPOT STEPPER */}
                      {event.mode !== "pot" && (
                        <div>
                          <label className="mb-1.5 block text-xs font-bold text-[#0F172A]">
                            How many spots? (+1s welcome)
                          </label>
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {[
                              { count: 1, label: "Just Me (1)" },
                              { count: 2, label: "+1 Guest (2)" },
                              { count: 3, label: "+2 Guests (3)" },
                              { count: 4, label: "+3 Family/Crew (4)" },
                            ].map((opt) => {
                              const exceedsRemaining =
                                spotsRemaining !== null && opt.count > spotsRemaining;
                              return (
                                <button
                                  key={opt.count}
                                  type="button"
                                  disabled={exceedsRemaining}
                                  onClick={() => {
                                    triggerHaptic("light");
                                    setSpotsCount(opt.count);
                                  }}
                                  className={`tap-tactile rounded-xl border py-2.5 px-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                                    spotsCount === opt.count
                                      ? "border-[#007749] bg-emerald-50 text-[#007749] ring-1 ring-[#007749]"
                                      : "border-[#E6E2D8] bg-white text-[#475569] hover:border-[#007749]/40"
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>

                          {spotsCount > 1 && (
                            <input
                              type="text"
                              value={plusOneInput}
                              onChange={(e) => setPlusOneInput(e.target.value)}
                              placeholder={
                                spotsCount === 2
                                  ? "Name of your +1 guest (e.g. Luca)"
                                  : `Names of your +${spotsCount - 1} guests (e.g. Luca, Thabo, Ané)`
                              }
                              className="mt-2 w-full rounded-xl border border-[#E6E2D8] bg-white px-3.5 py-2 text-base sm:text-xs text-[#0F172A] placeholder-[#475569]/60 focus:border-[#007749] focus:outline-none"
                            />
                          )}
                        </div>
                      )}

                      {/* CLAIM A BRING-ITEM SELECTOR */}
                      {unclaimedBringItems.length > 0 && (
                        <div>
                          <label className="mb-1.5 block text-xs font-bold text-[#0F172A]">
                            Claim something to bring (optional)
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {unclaimedBringItems.map((item) => {
                              const active = claimedItemId === item.id;
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() =>
                                    setClaimedItemId(active ? "" : item.id)
                                  }
                                  className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                                    active
                                      ? "border-[#007749] bg-[#007749] text-white"
                                      : "border-[#E6E2D8] bg-white text-[#475569] hover:border-[#007749]/50"
                                  }`}
                                >
                                  {active ? `✓ ${item.label}` : `+ ${item.label}`}
                                </button>
                              );
                            })}
                          </div>
                          <input
                            type="text"
                            value={customBringItem}
                            onChange={(e) => setCustomBringItem(e.target.value)}
                            placeholder="Or bring your own extra (e.g. 2x Garlic Breads, Camp chairs)..."
                            className="mt-2 w-full rounded-xl border border-[#E6E2D8] bg-white px-3 py-2 text-base sm:text-xs text-[#0F172A] placeholder-[#475569]/60 focus:border-[#007749] focus:outline-none"
                          />
                        </div>
                      )}

                      {/* SA BANTER BADGE PICKER & HYPE COMMENT */}
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label htmlFor="selected-banter-badge" className="mb-1 block text-xs font-bold text-[#0F172A]">
                            Pick a banter badge
                          </label>
                          <select
                            id="selected-banter-badge"
                            value={selectedBadge}
                            onChange={(e) => setSelectedBadge(e.target.value)}
                            className="w-full rounded-xl border border-[#E6E2D8] bg-white px-3 py-2.5 text-base sm:text-xs font-semibold text-[#0F172A] focus:border-[#007749] focus:outline-none"
                          >
                            {availableBadges.map((badge) => (
                              <option key={badge} value={badge}>
                                {badge}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="guest-wall-comment" className="mb-1 block text-xs font-bold text-[#0F172A]">
                            Message for the group
                          </label>
                          <input
                            id="guest-wall-comment"
                            type="text"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="e.g. Pulling through! 🔥"
                            className="w-full rounded-xl border border-[#E6E2D8] bg-white px-3 py-2.5 text-base sm:text-xs text-[#0F172A] placeholder-[#475569]/60 focus:border-[#007749] focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* CUSTOM HOST QUESTION INPUT */}
                      {event.custom_question && (
                        <div>
                          <label className="mb-1 flex items-center gap-1 text-xs font-bold text-[#0F172A]">
                            <HelpCircle className="h-3.5 w-3.5 text-[#007749]" />
                            <span>{event.custom_question}</span>
                          </label>
                          <input
                            type="text"
                            value={customAnswer}
                            onChange={(e) => setCustomAnswer(e.target.value)}
                            placeholder="Note for the host..."
                            className="w-full rounded-xl border border-[#E6E2D8] bg-white px-3.5 py-2 text-base sm:text-xs text-[#0F172A] placeholder-[#475569]/60 focus:border-[#007749] focus:outline-none"
                          />
                        </div>
                      )}

                      {/* POPIA ANONYMOUS CHECKBOX */}
                      <label
                        className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border p-3.5 text-xs transition ${
                          isAnonymousOnWall
                            ? "border-[#007749] bg-[#007749]/[0.08] text-[#007749] font-bold"
                            : "border-[#E6E2D8] bg-white text-[#475569]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <EyeOff
                            className={`h-4 w-4 shrink-0 ${
                              isAnonymousOnWall ? "text-[#007749]" : "text-[#475569]"
                            }`}
                          />
                          <div>
                            <span className="font-semibold text-[#0F172A] block">
                              Hide my name on the public wall
                            </span>
                            <span className="text-[11px] text-[#475569]">
                              Displays as{" "}
                              <strong className="text-[#0F172A]">
                                &ldquo;🔒 Anonymous Legend&rdquo;
                              </strong>{" "}
                              to group chat; host sees your confirmation. (POPIA compliant)
                            </span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isAnonymousOnWall}
                          onChange={(e) => setIsAnonymousOnWall(e.target.checked)}
                          className="h-4.5 w-4.5 rounded border-[#E6E2D8] accent-[#007749] shrink-0"
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* Dignity Gift Pot Note */}
                {event.mode === "pot" && (
                  <div className="flex items-center gap-2 rounded-xl border border-[#007749]/30 bg-[#007749]/[0.06] p-2.5 text-[11px] text-[#007749] font-medium">
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      <strong>Dignity Pot Active:</strong> Your individual Rand amount is 100% hidden on the public wall by default!
                    </span>
                  </div>
                )}

                {/* PAID CHECKOUT SECTIONS: DIRECT PAYSHAP (DEFAULT R0 FEE), CASH AT GATE, OR CARD */}
                {!isFreeCheckout && (
                  <div className="space-y-3">
                    {/* 2 or 3-Way Payment Method Selector (PayShap R0 Fee First) */}
                    <div
                      className={`grid ${
                        event?.allow_cash_on_arrival !== false
                          ? "grid-cols-3"
                          : "grid-cols-2"
                      } gap-1 rounded-2xl bg-slate-100 p-1 text-xs font-bold`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic("light");
                          setCheckoutPaymentMethod("direct_payshap");
                          if (checkoutError) setCheckoutError(null);
                        }}
                        className={`tap-tactile flex items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-center transition ${
                          checkoutPaymentMethod === "direct_payshap"
                            ? "bg-white text-[#0F172A] shadow-xs"
                            : "text-[#475569] hover:text-[#0F172A]"
                        }`}
                      >
                        <Smartphone className="h-3.5 w-3.5 text-[#007749] shrink-0" />
                        <span className="truncate">📲 PayShap (R0 Fee)</span>
                      </button>

                      {event?.allow_cash_on_arrival !== false && (
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic("light");
                            setCheckoutPaymentMethod("cash_on_arrival");
                            if (checkoutError) setCheckoutError(null);
                          }}
                          className={`tap-tactile flex items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-center transition ${
                            checkoutPaymentMethod === "cash_on_arrival"
                              ? "bg-white text-[#0F172A] shadow-xs"
                              : "text-[#475569] hover:text-[#0F172A]"
                          }`}
                        >
                          <Banknote className="h-3.5 w-3.5 text-[#007749] shrink-0" />
                          <span className="truncate">💵 Cash at Gate</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic("light");
                          setCheckoutPaymentMethod("gateway");
                          if (checkoutError) setCheckoutError(null);
                        }}
                        className={`tap-tactile flex items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-center transition ${
                          checkoutPaymentMethod === "gateway"
                            ? "bg-white text-[#0F172A] shadow-xs"
                            : "text-[#475569] hover:text-[#0F172A]"
                        }`}
                      >
                        <Sparkles className="h-3.5 w-3.5 text-[#007749] shrink-0" />
                        <span className="truncate">⚡ Card / Apple</span>
                      </button>
                    </div>

                    {checkoutPaymentMethod === "gateway" ? (
                      /* Option 1: Gateway - Card / Apple Pay / Capitec Pay */
                      <div className="rounded-2xl border border-[#007749]/35 bg-emerald-50/50 p-4 space-y-3 text-xs">
                        <div className="flex items-center justify-between border-b border-[#007749]/20 pb-2">
                          <span className="font-extrabold uppercase tracking-wider text-[#007749] text-[11px] flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>1-Tap Instant Checkout</span>
                          </span>
                          <span className="rounded-full bg-[#007749] px-2.5 py-0.5 text-[10px] font-bold text-white">
                            Instant Spot Lock
                          </span>
                        </div>

                        {/* Channel Radio Pills */}
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { id: "apple_pay" as PaymentChannel, label: "Apple Pay", icon: Apple, sub: "iOS / Mac" },
                            { id: "card" as PaymentChannel, label: "Card", icon: CreditCard, sub: "Visa / Master" },
                            { id: "capitec_pay" as PaymentChannel, label: "Capitec Pay", icon: Smartphone, sub: "App Push" },
                          ].map((channel) => {
                            const IconComponent = channel.icon;
                            return (
                              <button
                                key={channel.id}
                                type="button"
                                onClick={() => {
                                  triggerHaptic("light");
                                  setPaymentChannel(channel.id);
                                }}
                                className={`rounded-xl border p-2 text-center transition ${
                                  paymentChannel === channel.id
                                    ? "border-[#007749] bg-white text-[#007749] shadow-xs ring-1 ring-[#007749]"
                                    : "border-[#E6E2D8] bg-white/70 text-[#475569] hover:bg-white"
                                }`}
                              >
                                <div className="flex items-center justify-center gap-1 text-[11px] font-extrabold">
                                  <IconComponent className="h-3 w-3" />
                                  <span>{channel.label}</span>
                                </div>
                                <div className="text-[9px] text-[#64748B] mt-0.5">{channel.sub}</div>
                              </button>
                            );
                          })}
                        </div>

                        {/* Split breakdown */}
                        <div className="rounded-xl border border-[#E6E2D8] bg-white p-3 space-y-1.5">
                          <div className="flex justify-between text-[#475569]">
                            <span>Direct to Host ({event.host_name}):</span>
                            <span className="font-mono-num font-bold text-[#0F172A]">{formatZar(split.totalBasePriceZar)}</span>
                          </div>
                          <div className="flex justify-between text-[#475569]">
                            <span>PullThru Instant Clearing Fee:</span>
                            <span className="font-mono-num text-[#0F172A]">{formatZar(split.platformFeeZar)}</span>
                          </div>
                          <div className="border-t border-[#E6E2D8] pt-1.5 flex justify-between font-extrabold text-[#007749]">
                            <span>Total Authorization:</span>
                            <span className="font-mono-num text-sm">{formatZar(split.totalChargedZar)}</span>
                          </div>
                        </div>

                        <p className="text-[10px] text-[#64748B] flex items-center gap-1">
                          <ShieldCheck className="h-3.5 w-3.5 text-[#007749] shrink-0" />
                          <span>No screenshot or POP upload needed. Instant digital pass &amp; gate PIN unlock.</span>
                        </p>
                      </div>
                    ) : checkoutPaymentMethod === "cash_on_arrival" ? (
                      /* Option 3: Cash on Arrival */
                      <div className="rounded-2xl border border-emerald-400/50 bg-emerald-50/40 p-4 space-y-3 text-xs">
                        <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                          <span className="font-extrabold uppercase tracking-wider text-[#007749] text-[11px] flex items-center gap-1.5">
                            <Banknote className="h-3.5 w-3.5" />
                            <span>Pay Cash on Arrival</span>
                          </span>
                          <span className="rounded-full bg-[#007749] px-2.5 py-0.5 text-[10px] font-bold text-white">
                            Zero Online Fees
                          </span>
                        </div>

                        <div className="bg-white rounded-xl border border-[#E6E2D8] p-3 space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-[#0F172A]">
                            <span>Amount to Bring in Cash:</span>
                            <span className="font-mono-num text-sm text-[#007749] font-extrabold">
                              {formatZar(split.totalBasePriceZar)}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#475569] leading-relaxed">
                            Bring cash when you arrive. Host <strong>{event.host_name}</strong> will receive your cash in-person and mark you as confirmed at the door.
                          </p>
                        </div>

                        <div className="rounded-xl border border-dashed border-[#007749]/40 bg-white/70 p-3 space-y-1.5 text-[11px] text-[#475569]">
                          <div className="flex items-center gap-1.5 font-bold text-[#0F172A]">
                            <ShieldCheck className="h-3.5 w-3.5 text-[#007749] shrink-0" />
                            <span>Instant Squad Wall Reservation:</span>
                          </div>
                          <p>
                            Your spot is reserved immediately on the Squad Wall as <strong>⏳ Cash on Arrival</strong>. Please only reserve if you are definitely pulling thru!
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* Option 2: Direct PayShap / Capitec PayMe + Instant POP Verifier */
                      <div className="space-y-3">
                        {/* Step A: 1-Tap Direct Host PayShap / Capitec PayMe Box */}
                    <div className="rounded-2xl border border-[#007749]/35 bg-emerald-50/50 p-4 space-y-3 text-xs">
                      <div className="flex items-center justify-between border-b border-[#007749]/20 pb-2">
                        <span className="font-extrabold uppercase tracking-wider text-[#007749] text-[11px] flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>1. Pay Host Directly ({formatZar(split.totalBasePriceZar)})</span>
                        </span>
                        <span className="rounded-full bg-[#007749] px-2.5 py-0.5 text-[10px] font-bold text-white">
                          R0.00 Guest Fee
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 bg-white rounded-xl border border-[#E6E2D8] p-3">
                        <div className="space-y-1">
                          <p className="font-bold text-[#0F172A]">
                            Host: {event.host_name} • {hostBankDisplay}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#475569] font-mono-num">
                            {event.host_phone && (
                              <button
                                type="button"
                                onClick={() => {
                                  const cleanShapPhone = event.host_phone
                                    .replace(/\D/g, "")
                                    .replace(/^27(\d{9})$/, "0$1");
                                  if (typeof navigator !== "undefined" && navigator.clipboard) {
                                    navigator.clipboard.writeText(cleanShapPhone || event.host_phone);
                                    setCopiedShapId(true);
                                    setTimeout(() => setCopiedShapId(false), 2000);
                                  }
                                }}
                                className="inline-flex items-center gap-1 rounded-md border border-[#007749]/30 bg-emerald-50/70 px-2 py-0.5 text-[11px] font-bold text-[#007749] hover:bg-emerald-100"
                                title="Tap to copy Host PayShap 10-Digit Cellphone ID"
                              >
                                <span>
                                  PayShap ID:{" "}
                                  {event.host_phone
                                    .replace(/\D/g, "")
                                    .replace(/^27(\d{9})$/, "0$1") || event.host_phone}
                                </span>
                                <Copy className="h-3 w-3" />
                                {copiedShapId && <span className="text-[10px] underline">Copied!</span>}
                              </button>
                            )}
                            {event.host_account_number && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (typeof navigator !== "undefined" && navigator.clipboard) {
                                    navigator.clipboard.writeText(String(event.host_account_number));
                                    setCopiedAccNum(true);
                                    setTimeout(() => setCopiedAccNum(false), 2000);
                                  }
                                }}
                                className="inline-flex items-center gap-1 rounded-md border border-[#E6E2D8] bg-[#FAF8F5] px-2 py-0.5 text-[11px] font-bold text-[#0F172A] hover:bg-slate-100"
                                title="Tap to copy Host Bank Account Number"
                              >
                                <span>Acc: {event.host_account_number}</span>
                                <Copy className="h-3 w-3" />
                                {copiedAccNum && <span className="text-[10px] text-[#007749] underline">Copied!</span>}
                              </button>
                            )}
                          </div>
                          <p className="text-[11px] text-[#475569] font-mono-num">
                            Ref: <strong className="text-[#007749]">PT-{(buyerName || "GUEST").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 10) || "GUEST"}</strong> • Amount: <strong className="text-[#0F172A]">{formatZar(split.totalBasePriceZar)}</strong>
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {Boolean(event.capitec_payme_url) && (
                            <a
                              href={event.capitec_payme_url!}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => {
                                triggerHaptic("light");
                                setPopRailBadge("capitec_payme");
                              }}
                              className="tap-tactile inline-flex items-center gap-1.5 rounded-xl bg-[#007749] px-3 py-2 text-xs font-extrabold text-white shadow-2xs hover:bg-[#005F3A]"
                            >
                              <Smartphone className="h-3.5 w-3.5" />
                              <span>1-Tap Capitec PayMe ↗</span>
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic("light");
                              const refCode = `PT-${(buyerName || "GUEST").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 10) || "GUEST"}`;
                              const copyStr = `${event.host_name} | ${hostBankDisplay}${event.host_phone ? ` | PayShap ID: ${event.host_phone}` : ""}${event.host_account_number ? ` | Acc: ${event.host_account_number}` : ""} | Amount: R${split.totalBasePriceZar} | Ref: ${refCode}`;
                              if (typeof navigator !== "undefined" && navigator.clipboard) {
                                navigator.clipboard.writeText(copyStr);
                                setCopiedPayShapDetails(true);
                                setTimeout(() => setCopiedPayShapDetails(false), 2500);
                              }
                            }}
                            className="tap-tactile inline-flex items-center gap-1.5 rounded-xl border border-[#0F172A] bg-white px-3 py-2 text-xs font-bold text-[#0F172A] hover:bg-slate-50"
                          >
                            {copiedPayShapDetails ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-[#007749]" />
                                <span className="text-[#007749]">Copied PayShap &amp; Ref!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                <span>Copy PayShap / Bank &amp; Ref</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Step B: Optional Collapsible POP Verifier (Screenshot / PDF / Bank SMS) */}
                    <div className="rounded-2xl border border-slate-200/90 bg-[#FAF8F5] p-3 text-xs">
                      <button
                        type="button"
                        onClick={() => setShowOptionalPopVerifier((prev) => !prev)}
                        className="flex w-full items-center justify-between font-bold text-[#0F172A] hover:text-[#007749] transition"
                      >
                        <span className="flex items-center gap-1.5 text-[11px]">
                          <span>📎</span>
                          <span>
                            {popFileName
                              ? `✅ POP Attached (${popFileName})`
                              : "Optional: Already paid? Attach POP or Bank SMS"}
                          </span>
                        </span>
                        <span className="text-[11px] font-semibold text-[#007749] underline">
                          {showOptionalPopVerifier ? "Hide" : "+ Attach POP"}
                        </span>
                      </button>

                      {showOptionalPopVerifier && (
                        <div className="mt-3 pt-3 border-t border-[#E6E2D8] space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold uppercase tracking-wider text-[#0F172A] text-[10px]">
                              Instant POP Verifier (Optional)
                            </span>
                            <div className="inline-flex rounded-lg border border-[#E6E2D8] bg-white p-0.5 text-[11px] font-bold">
                              <button
                                type="button"
                                onClick={() => setPopVerifyTab("upload")}
                                className={`rounded-md px-2.5 py-1 transition ${
                                  popVerifyTab === "upload"
                                    ? "bg-[#007749] text-white"
                                    : "text-[#475569]"
                                }`}
                              >
                                📸 Screenshot / PDF
                              </button>
                              <button
                                type="button"
                                onClick={() => setPopVerifyTab("sms")}
                                className={`rounded-md px-2.5 py-1 transition ${
                                  popVerifyTab === "sms"
                                    ? "bg-[#007749] text-white"
                                    : "text-[#475569]"
                                }`}
                              >
                                💬 Bank SMS / Ref
                              </button>
                            </div>
                          </div>

                          {/* Payment Rail Speed Pill Selector */}
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { id: "instant_payshap" as const, label: "⚡ PayShap" },
                              { id: "capitec_payme" as const, label: "⚡ Capitec PayMe" },
                              { id: "standard_eft" as const, label: "⏳ Standard EFT" },
                            ].map((rail) => (
                              <button
                                key={rail.id}
                                type="button"
                                onClick={() => setPopRailBadge(rail.id)}
                                className={`rounded-xl border py-1.5 px-2 text-[11px] font-bold transition ${
                                  popRailBadge === rail.id
                                    ? "border-[#007749] bg-emerald-50 text-[#007749]"
                                    : "border-[#E6E2D8] bg-white text-[#475569]"
                                }`}
                              >
                                {rail.label}
                              </button>
                            ))}
                          </div>

                          {popVerifyTab === "upload" ? (
                            <div className="space-y-2">
                              <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#007749]/40 bg-white p-3.5 text-center cursor-pointer hover:border-[#007749] transition">
                                <input
                                  type="file"
                                  accept=".png,.jpg,.jpeg,.webp,.pdf"
                                  onChange={handlePopFileChange}
                                  className="hidden"
                                />
                                <span className="font-bold text-[#0F172A]">
                                  {popFileName
                                    ? `✅ Attached: ${popFileName}`
                                    : "📸 Tap to Upload POP Screenshot or PDF Slip"}
                                </span>
                                <span className="text-[10px] text-[#475569] mt-0.5">
                                  Supports Capitec, FNB, Standard Bank, Absa, Nedbank, TymeBank &amp; Discovery
                                </span>
                              </label>

                              {DEMO_SLUGS.has(slug) && (
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-[#475569]">
                                    Testing this live demo?
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      triggerHaptic("success");
                                      setPopFileName("Capitec_PayShap_POP_Verified.png");
                                      setPopHash(`demo_pop_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
                                    }}
                                    className="font-bold text-[#007749] underline hover:text-[#005F3A]"
                                  >
                                    ⚡ Attach Demo POP Slip (1-Tap Test)
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <textarea
                                rows={2}
                                value={popSmsText}
                                onChange={(e) => {
                                  setPopSmsText(e.target.value);
                                  if (checkoutError) setCheckoutError(null);
                                }}
                                placeholder="Paste your bank confirmation SMS or PayShap reference code here..."
                                className="w-full rounded-xl border border-[#E6E2D8] bg-white p-2.5 text-xs text-[#0F172A] focus:border-[#007749] focus:outline-none"
                              />
                              {popSmsText.trim().length >= 10 && (() => {
                                const parsed = parseSaBankSms(
                                  popSmsText,
                                  split.totalBasePriceZar,
                                  event?.host_name
                                );
                                if (parsed.isValid) {
                                  return (
                                    <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-800 animate-in fade-in">
                                      <span className="text-emerald-600">✅</span>
                                      <span>
                                        <strong>{parsed.bankName}</strong> • R{parsed.detectedAmountZar?.toFixed(2)} verified{parsed.reference ? ` • Ref: ${parsed.reference}` : ""}
                                      </span>
                                    </div>
                                  );
                                }
                                if (parsed.isUnderpaid) {
                                  return (
                                    <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-50 px-2.5 py-1.5 text-[11px] font-semibold text-amber-800 animate-in fade-in">
                                      <span className="text-amber-600">⚠️</span>
                                      <span>{parsed.rejectionReason}</span>
                                    </div>
                                  );
                                }
                                if (parsed.isFake) {
                                  return (
                                    <div className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-50 px-2.5 py-1.5 text-[11px] font-semibold text-rose-800 animate-in fade-in">
                                      <span className="text-rose-600">❌</span>
                                      <span>{parsed.rejectionReason}</span>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                      </div>
                    )}
                  </div>
                )}

                {!isFreeCheckout && (
                  <div className="flex items-center gap-2 rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-3.5 py-2 text-[11px] text-[#475569]">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#007749] shrink-0" />
                    <span>
                      <strong className="text-[#0F172A]">100% R0 Guest Fee:</strong> You pay Host {event.host_name} directly via PayShap or Cash. No mandatory screenshot required to lock your spot.
                    </span>
                  </div>
                )}

                {checkoutError && (
                  <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-50 p-3 text-xs font-bold text-rose-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                    <span>{checkoutError}</span>
                  </div>
                )}

                {/* Primary Submit CTA (10% SA Accent #007749 with diffuse shadow & tactile press) */}
                <button
                  type="submit"
                  disabled={isSoldOut || submittingRsvp || Boolean(event.is_cancelled) || Boolean(event.payout_frozen)}
                  onClick={() => triggerHaptic("medium")}
                  className="tap-tactile flex w-full items-center justify-center gap-2 rounded-2xl bg-[#007749] px-6 py-4 text-base font-bold text-white shadow-lg shadow-emerald-950/15 transition hover:bg-[#005F3A] active:scale-[0.98] disabled:opacity-50"
                >
                  <Fingerprint className="h-5 w-5 stroke-[2.2]" />
                  <span>
                    {event.is_cancelled
                      ? "Event Cancelled by Host"
                      : event.payout_frozen
                      ? "Paused — Under Buyer Protection Review"
                      : isSoldOut
                      ? "Sold Out — All Spots Locked"
                      : submittingRsvp
                      ? "Locking In Your Spot..."
                      : isFreeCheckout
                      ? `⚡ I'm In — Lock My Free Spot (${spotsCount})`
                      : checkoutPaymentMethod === "cash_on_arrival"
                      ? `💵 I'm In — Paying ${formatZar(split.totalBasePriceZar)} Cash at Gate`
                      : checkoutPaymentMethod === "gateway"
                      ? `Pay ${formatZar(split.totalChargedZar)} via ${
                          paymentChannel === "apple_pay"
                            ? "Apple Pay"
                            : paymentChannel === "card"
                            ? "Card"
                            : "Capitec Pay"
                        }`
                      : !popHash && !popSmsText.trim()
                      ? `⚡ I'm In — Copy PayShap # & Lock Spot (${formatZar(split.totalBasePriceZar)})`
                      : `Lock In My Spot • ${formatZar(split.totalBasePriceZar)} (POP Attached ✅)`}
                  </span>
                </button>

                {/* "Broke Mid-Month? Remind Me on Payday (25th)" Button & Pre-Auth Drawer */}
                {!isFreeCheckout && event.allow_payday_promise !== false && (
                  <div className="pt-1">
                    {!showPaydayOptions ? (
                      <button
                        type="button"
                        onClick={() => setShowPaydayOptions(true)}
                        disabled={submittingRsvp}
                        className="flex w-full items-center justify-center gap-1.5 rounded-full border border-[#E6E2D8] bg-[#FAF8F5] px-4 py-2.5 text-xs font-bold text-[#0F172A] transition hover:border-[#FFB81C] hover:bg-[#FFB81C]/15"
                      >
                        <Clock className="h-3.5 w-3.5 text-[#007749]" />
                        <span>
                          Paying on payday (25th)? Join Standby List (Unpaid)
                        </span>
                      </button>
                    ) : (
                      <div className="rounded-2xl border border-[#FFB81C]/60 bg-[#FFB81C]/10 p-3.5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-wider text-[#0F172A] flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-[#007749]" />
                            Payday 25th Hold Options
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowPaydayOptions(false)}
                            className="text-[11px] font-bold text-[#475569] hover:text-[#0F172A]"
                          >
                            Cancel
                          </button>
                        </div>

                        <div className="rounded-xl border border-[#007749]/30 bg-white p-3 text-left text-xs">
                          <p className="font-bold text-[#0F172A]">
                            🗓️ Payday 25th Standby Pledge (Free)
                          </p>
                          <p className="mt-1 text-[11px] text-[#475569] leading-relaxed">
                            Puts your name on the wall as a <strong>Payday 25th Pledge (Standby)</strong> and prepares a 1-tap WhatsApp note for {event.host_name}. Standby pledges do not block paying guests if the event sells out before the 25th.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handlePaydayPromise}
                          disabled={submittingRsvp}
                          className="w-full rounded-xl bg-[#0F172A] py-2.5 text-xs font-bold text-white transition hover:bg-black"
                        >
                          Record My Payday 25th Pledge
                        </button>
                      </div>
                    )}

                    <p className="mt-1 text-center text-[10px] text-[#475569]">
                      Payday 25th Standby: settle your pledge anytime in 1 tap once salary lands.
                    </p>
                    {paydayPromiseSuccess && (
                      <p className="mt-1.5 text-center text-[11px] font-bold text-[#007749]">
                        ✅ {paydayPromiseSuccess}
                      </p>
                    )}
                  </div>
                )}

                {/* Self-Serve Buyer Protection, Ticket Lookup & Refund / Scam Report Bar */}
                <div className="pt-2 border-t border-[#E6E2D8] flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setProtectionTab("recover");
                      setShowProtectionModal(true);
                    }}
                    className="font-bold text-[#007749] hover:underline flex items-center gap-1"
                  >
                    <span>🔍 Lost your pass? Find by WhatsApp #</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProtectionTab("report");
                      setShowProtectionModal(true);
                    }}
                    className="font-bold text-[#475569] hover:text-[#0F172A] hover:underline flex items-center gap-1"
                  >
                    <span>🛡️ Refunds &amp; Report Issue</span>
                  </button>
                </div>
              </form>
    </>
  );

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#0F172A] pb-28">
      <Navbar />

      {/* DYNAMIC ISLAND LIVE SQUAD NOTIFICATION TOAST */}
      {liveToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-24 sm:top-20 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md rounded-2xl border-2 border-[#00FF87] bg-[#041E14]/95 px-4 py-3 text-white shadow-2xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-3"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#007749] text-[#00FF87] shadow-inner">
                <BellRing className="h-4 w-4 animate-bounce" />
              </span>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-black text-[#00FF87] truncate">
                  {liveToast.title}
                </p>
                <p className="text-[11px] font-semibold text-slate-200 truncate">
                  {liveToast.subtitle}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="rounded-full border border-[#FFD000] bg-[#052E16] px-2.5 py-0.5 font-mono text-[10px] font-black text-[#FFD000]">
                {liveToast.badge}
              </span>
              <button
                type="button"
                onClick={() => setLiveToast(null)}
                className="rounded-lg p-1 text-slate-300 hover:bg-white/10 hover:text-white"
                aria-label="Dismiss live notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. ULTRA-CLEAN FROSTED TRUST & HOST HEADER */}
      <div className="border-b border-[#E6E2D8]/80 glass-header sticky top-14 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-2 sm:px-8">
          <div className="flex items-center gap-2 text-xs truncate">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#007749]/20 bg-[#007749]/10 px-2.5 py-1 font-semibold text-[#007749] shrink-0">
              <ShieldCheck className="h-3.5 w-3.5 text-[#007749]" />
              <span className="hidden xs:inline">Verified SA Host</span>
            </span>
            <span className="text-[#475569] truncate font-medium text-[11px] sm:text-xs">
              {event.mode === "free" ? (
                <>
                  Hosted by <strong className="text-[#0F172A]">{event.host_name}</strong> • <span className="text-[#007749] font-bold">100% Free RSVP Roll-Call</span>
                </>
              ) : (
                <>
                  Direct payment to <strong className="text-[#0F172A]">{event.host_name}</strong> • <span className="text-[#007749] font-bold">{hostBankDisplay}</span>
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleToggleLiveAlerts}
              title={
                liveAlertsEnabled
                  ? "Real-time squad notifications active (click to mute)"
                  : "Enable real-time squad notifications & sound"
              }
              className={`tap-tactile inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold transition ${
                liveAlertsEnabled
                  ? "border-[#007749]/35 bg-[#007749]/10 text-[#007749]"
                  : "border-[#E6E2D8] bg-white text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              {liveAlertsEnabled ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#007749] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#007749]" />
                  </span>
                  <BellRing className="h-3 w-3 text-[#007749]" />
                  <span className="hidden md:inline">Live Alerts On</span>
                </>
              ) : (
                <>
                  <Bell className="h-3 w-3" />
                  <span className="hidden md:inline">Alerts Muted</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic("light");
                setProtectionTab("recover");
                setShowProtectionModal(true);
              }}
              className="tap-tactile inline-flex items-center gap-1 rounded-full border border-[#007749]/30 bg-white px-2.5 py-1 text-[11px] font-bold text-[#007749] hover:bg-emerald-50"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-[#007749]" />
              <span className="hidden sm:inline">Buyer Protection &amp; Pass Lookup</span>
              <span className="sm:hidden">🛡️ Help / Pass</span>
            </button>

            <button
              type="button"
              onClick={handleToggleHostModeWithGuard}
              className={`tap-tactile inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold shrink-0 ${
                hostMode
                  ? "border-[#FFB81C] bg-[#FFB81C] text-[#0F172A] shadow-sm"
                  : "border-[#E6E2D8] bg-white text-[#475569] hover:text-[#0F172A] hover:border-slate-300"
              }`}
            >
              <Crown className={`h-3.5 w-3.5 ${hostMode ? "text-[#0F172A]" : "text-[#007749]"}`} />
              <span>{hostMode ? "👑 Host View" : "Host View"}</span>
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-3.5 pt-4 sm:px-8 sm:pt-5">
        {isOfflineWallCached && (
          <div className="mb-4 flex items-center justify-between gap-2 rounded-2xl border border-amber-400 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-950">
            <span>
              📡 Offline Gate Mode: Showing cached guest list &amp; check-in PINs saved on this device.
            </span>
            <button
              type="button"
              onClick={() => loadEvent()}
              className="rounded-lg bg-amber-900 px-2.5 py-1 text-[11px] text-white hover:bg-amber-950"
            >
              Retry Live Sync
            </button>
          </div>
        )}
        {/* Newly Created Celebration Banner (Top Priority when created=1) */}
        {showCreatedBanner && (
          <div className="mb-4 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white p-3.5 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#007749] text-sm text-white shadow-xs">
                  🎉
                </span>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-extrabold text-[#0F172A] truncate sm:whitespace-normal">
                    Your PullThru Event Link is Live!
                  </p>
                  <p className="text-[11px] text-[#475569] hidden sm:block">
                    Drop the link in your WhatsApp group &amp; save your private Host Admin Link.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreatedBanner(false)}
                className="shrink-0 rounded-lg p-1 text-[#64748B] hover:bg-black/5 hover:text-[#0F172A] transition"
                aria-label="Dismiss banner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopySquadList}
                className="tap-tactile inline-flex items-center gap-1.5 rounded-full bg-[#007749] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#005F3A] transition"
              >
                {copiedSquadList ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Squad List Copied! ✅</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>📋 Copy WhatsApp Squad List</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic("success");
                  handleCopySquadRoast();
                }}
                className="tap-tactile inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-950 shadow-xs hover:bg-amber-100 transition"
                title="Copy WhatsApp Squad Banter & Flaky Friend Roast"
              >
                {copiedRoast ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#007749]" />
                    <span>Roast Copied! 🔥</span>
                  </>
                ) : (
                  <>
                    <Flame className="h-3.5 w-3.5 text-amber-600" />
                    <span>🔥 Squad Roast</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic("success");
                  handleCopyEmergencyStandby();
                }}
                className="tap-tactile inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-950 shadow-xs hover:bg-rose-100 transition"
                title="Copy 5:00 PM Standby / Bailed Spot WhatsApp Broadcast"
              >
                {copiedEmergency ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#007749]" />
                    <span>Alert Copied! 🚨</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-3.5 w-3.5 text-rose-600" />
                    <span>🚨 Bailed Spot Alert</span>
                  </>
                )}
              </button>

              {getHostToken() && (
                <button
                  type="button"
                  onClick={() => {
                    const origin = typeof window !== "undefined" ? window.location.origin : "https://pullthru.co.za";
                    const adminLink = `${origin}/e/${event.slug}?hostToken=${encodeURIComponent(getHostToken())}`;
                    if (typeof navigator !== "undefined" && navigator.clipboard) {
                      navigator.clipboard.writeText(adminLink);
                      setCopiedHostAdminLink(true);
                      setTimeout(() => setCopiedHostAdminLink(false), 3000);
                    }
                  }}
                  className="tap-tactile inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-950 shadow-xs hover:bg-amber-100 transition"
                >
                  {copiedHostAdminLink ? (
                    <span>✅ Admin Link Copied!</span>
                  ) : (
                    <span>🔑 Copy Host Admin Link</span>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={handleCopyHostWhatsappUpdate}
                className="tap-tactile hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[#E6E2D8] bg-white px-3 py-1.5 text-xs font-semibold text-[#0F172A] shadow-xs hover:bg-slate-50 transition"
              >
                {copiedHypeUpdate ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#007749]" />
                    <span>Copied Hype Update!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>📲 Copy WhatsApp Hype</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  const playUrl = "https://play.google.com/store/apps/details?id=com.pullthru.za";
                  if (typeof navigator !== "undefined" && /android/i.test(navigator.userAgent || "")) {
                    window.location.href = "market://details?id=com.pullthru.za";
                    setTimeout(() => window.open(playUrl, "_blank", "noopener,noreferrer"), 450);
                  } else {
                    window.open(playUrl, "_blank", "noopener,noreferrer");
                  }
                }}
                className="tap-tactile inline-flex items-center gap-1.5 rounded-full border border-[#E6E2D8] bg-white px-3 py-1.5 text-xs font-semibold text-[#0F172A] shadow-xs hover:border-[#FFB81C] hover:bg-amber-50/40 transition"
                title="Rate PullThru on Google Play"
              >
                <span>⭐ Rate PullThru</span>
              </button>
            </div>
          </div>
        )}

        {/* 1 to 100+ Spots are 100% Free — legacy Pro Boost banner removed */}

        {/* Host Turnout Shortfall & Top-Up Split Calculator Card (When <100% Turnout or Shortfall Active) */}
        {hostMode &&
          event.mode !== "free" &&
          shortfallSplit &&
          lockedSpotsCount > 0 &&
          (shortfallSplit.unfilledSpots > 0 ||
            shortfallSplit.shortfallZar > 0 ||
            lockedHeadcountBannerMsg !== null) && (
            <div className="mb-4 rounded-2xl border-2 border-amber-400/70 bg-gradient-to-br from-amber-50/90 via-white to-emerald-50/40 p-4 text-xs shadow-xs space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <p className="font-display text-sm font-black text-[#0F172A] flex items-center gap-1.5">
                    <span>⚖️ Turnout Shortfall &amp; Squad Split Recalculator</span>
                    {shortfallSplit.isTargetMet ? (
                      <span className="rounded-full bg-[#007749] px-2 py-0.5 text-[10px] font-black uppercase text-white">
                        100% Covered ✓
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black uppercase text-white">
                        {formatZar(shortfallSplit.shortfallZar)} Short
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-[#475569]">
                    {shortfallSplit.unfilledSpots > 0 ? (
                      <>
                        Only <strong>{shortfallSplit.confirmedSpotsCount} of {shortfallSplit.maxSpots} spots</strong> have locked in ({shortfallSplit.unfilledSpots} unfilled). If the rest aren&apos;t coming, lock the squad at {shortfallSplit.confirmedSpotsCount}/{shortfallSplit.confirmedSpotsCount} and split the shortfall fairly:
                      </>
                    ) : (
                      <>
                        Squad headcount is locked at <strong>{shortfallSplit.confirmedSpotsCount} spots</strong>. Review your booking target and per-person top-up split below:
                      </>
                    )}
                  </p>
                </div>

                {/* Editable Target Pitch / Venue Cost */}
                <div className="flex items-center gap-1.5 rounded-xl border border-[#E6E2D8] bg-white px-2.5 py-1.5 shadow-2xs">
                  <label htmlFor="host-shortfall-target" className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B]">
                    Venue Target: R
                  </label>
                  <input
                    id="host-shortfall-target"
                    type="number"
                    min={0}
                    step={50}
                    value={effectiveShortfallTargetZar}
                    onChange={(e) =>
                      setCustomShortfallTargetZar(Math.max(0, Number(e.target.value) || 0))
                    }
                    className="w-20 font-mono-num text-xs font-black text-[#0F172A] bg-transparent focus:outline-none"
                  />
                </div>
              </div>

              {/* 4-Pillar Math Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="rounded-xl border border-[#E6E2D8] bg-white p-2.5">
                  <p className="text-[10px] font-bold uppercase text-[#64748B]">Booking Target</p>
                  <p className="font-mono-num text-sm font-black text-[#0F172A]">
                    {formatZar(shortfallSplit.targetPoolZar)}
                  </p>
                </div>
                <div className="rounded-xl border border-[#E6E2D8] bg-white p-2.5">
                  <p className="text-[10px] font-bold uppercase text-[#64748B]">
                    Collected ({shortfallSplit.confirmedSpotsCount} spots)
                  </p>
                  <p className="font-mono-num text-sm font-black text-[#007749]">
                    {formatZar(shortfallSplit.effectiveRaisedZar)}
                  </p>
                </div>
                <div className="rounded-xl border border-[#E6E2D8] bg-white p-2.5">
                  <p className="text-[10px] font-bold uppercase text-[#64748B]">
                    {shortfallSplit.shortfallZar > 0 ? "Shortfall to Cover" : "Surplus Kitty"}
                  </p>
                  <p
                    className={`font-mono-num text-sm font-black ${
                      shortfallSplit.shortfallZar > 0 ? "text-amber-700" : "text-[#007749]"
                    }`}
                  >
                    {shortfallSplit.shortfallZar > 0
                      ? formatZar(shortfallSplit.shortfallZar)
                      : `+${formatZar(shortfallSplit.surplusZar)}`}
                  </p>
                </div>
                <div className="rounded-xl border-2 border-[#007749]/30 bg-emerald-50/70 p-2.5">
                  <p className="text-[10px] font-bold uppercase text-[#007749]">
                    Top-Up / Confirmed Spot
                  </p>
                  <p className="font-mono-num text-sm font-black text-[#007749]">
                    {shortfallSplit.topUpPerSpotZar > 0
                      ? `+${formatZar(shortfallSplit.topUpPerSpotZar)}/spot`
                      : "R0 (Covered ✓)"}
                  </p>
                  {shortfallSplit.topUpPerSpotZar > 0 && (
                    <p className="text-[10px] font-semibold text-[#475569]">
                      New total: {formatZar(shortfallSplit.newSpotPriceZar)}/spot
                    </p>
                  )}
                </div>
              </div>

              {/* Optional Toggle if Unchecked Cash-on-Arrival Reservations Exist */}
              {shortfallSplit.pendingCashZar > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2">
                  <span className="text-[11px] font-semibold text-amber-950">
                    💵 Includes <strong>{formatZar(shortfallSplit.pendingCashZar)}</strong> in unchecked &ldquo;Cash on Arrival&rdquo; spots. Are they still pitching up?
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setShortfallIncludeUncheckedCash((prev) => !prev)
                    }
                    className="rounded-lg border border-amber-400 bg-white px-2.5 py-1 text-[10px] font-extrabold text-amber-900 hover:bg-amber-100"
                  >
                    {shortfallIncludeUncheckedCash
                      ? "Count Cash as Coming ✓ (Tap if No-Show)"
                      : "Excluded Cash No-Shows (Tap to Include)"}
                  </button>
                </div>
              )}

              {lockedHeadcountBannerMsg && (
                <div className="rounded-xl border border-[#007749]/30 bg-emerald-50 px-3 py-2 text-xs font-bold text-[#007749]">
                  {lockedHeadcountBannerMsg}
                </div>
              )}

              {/* Action Buttons: 1) Lock Squad Headcount, 2) Copy WhatsApp Top-Up Split, 3) Copy Urgent Subs Alert */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                {shortfallSplit.unfilledSpots > 0 && (
                  <button
                    type="button"
                    disabled={lockingSquadHeadcount}
                    onClick={handleLockHeadcountAtCurrentSquad}
                    className="tap-tactile inline-flex items-center gap-1.5 rounded-full bg-[#0F172A] px-3.5 py-2 text-xs font-extrabold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50"
                  >
                    <Lock className="h-3.5 w-3.5 text-[#FFB81C]" />
                    <span>
                      {lockingSquadHeadcount
                        ? "Locking Squad..."
                        : `🔒 Close Empty Spots & Lock Squad at ${lockedSpotsCount}/${lockedSpotsCount}`}
                    </span>
                  </button>
                )}

                {shortfallSplit.topUpPerSpotZar > 0 && (
                  <button
                    type="button"
                    onClick={handleCopyShortfallTopUpSplit}
                    className="tap-tactile inline-flex items-center gap-1.5 rounded-full bg-[#007749] px-3.5 py-2 text-xs font-extrabold text-white shadow-xs hover:bg-[#005F3A]"
                  >
                    {copiedShortfallTopUp ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Copied +{formatZar(shortfallSplit.topUpPerSpotZar)}/Spot Top-Up Split! ✅</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>
                          📲 Copy WhatsApp Top-Up Split (+{formatZar(shortfallSplit.topUpPerSpotZar)}/spot)
                        </span>
                      </>
                    )}
                  </button>
                )}

                {shortfallSplit.unfilledSpots > 0 && (
                  <button
                    type="button"
                    onClick={handleCopyEmergencyShortfallAlert}
                    className="tap-tactile inline-flex items-center gap-1.5 rounded-full border border-amber-400 bg-white px-3 py-2 text-xs font-bold text-amber-950 hover:bg-amber-50"
                  >
                    <span>
                      {copiedShortfallAlert
                        ? "✅ Copied Urgent Subs Alert!"
                        : `🚨 Or Find ${shortfallSplit.unfilledSpots} Last-Minute Ringers`}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}

        {/* Cancelled or Flagged Event Alert Banner */}
        {(event.is_cancelled || event.payout_frozen) && (
          <div className="mb-4 rounded-2xl border-2 border-rose-500/60 bg-rose-50 px-4 py-3.5 text-xs sm:text-sm text-rose-950 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-extrabold flex items-center gap-2">
                <span>🚨 {event.is_cancelled ? "EVENT CANCELLED BY HOST — DIRECT REFUNDS LOGGED" : "EVENT FLAGGED FOR REVIEW — CHECKOUT PAUSED"}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setProtectionTab("refund");
                  setShowProtectionModal(true);
                }}
                className="rounded-full bg-rose-700 px-3.5 py-1 text-xs font-bold text-white hover:bg-rose-800"
              >
                Check Refund Status / Claim →
              </button>
            </div>
            <p className="mt-1 text-xs text-rose-800">
              {event.is_cancelled
                ? "All confirmed guest spots have been marked for direct host-to-guest PayShap / EFT refund."
                : "Verified guests reported an issue with this event. New spot lock-ins are paused while the host resolves guest refunds."}
            </p>
          </div>
        )}

        {/* Rescheduled Date Change Notice Banner */}
        {event.previous_event_date && event.previous_event_date !== event.event_date && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-950">
            <span>
              🌧️ <strong>DATE UPDATED:</strong> Moved from <span className="line-through opacity-75">{event.previous_event_date}</span> to <strong>{event.event_date}</strong>. All locked spots remain valid!
            </span>
            <button
              type="button"
              onClick={() => {
                setProtectionTab("refund");
                setShowProtectionModal(true);
              }}
              className="font-bold text-amber-900 underline"
            >
              Can&apos;t make new date? Swap or Refund →
            </button>
          </div>
        )}

        {/* Returning Confirmed Guest Quick-Access Pass Banner */}
        {myUnlockedRsvp && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#007749]/40 bg-emerald-50/90 px-4 py-3 text-xs sm:text-sm shadow-xs">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#007749] text-white font-black text-xs">
                ✓
              </span>
              <div>
                <p className="font-extrabold text-[#0F172A]">
                  🎟️ You&apos;re Locked In ({myUnlockedRsvp.guest_name})!
                  {myUnlockedRsvp.gate_pin ? ` • Gate Check-In PIN: #${myUnlockedRsvp.gate_pin}` : ""}
                </p>
                <p className="text-[11px] text-[#475569]">
                  {event.secret_location_pin
                    ? `🔓 Gate Code / Pin Unlocked: ${event.secret_location_pin}`
                    : "Your digital boarding pass & 1-Tap Spot-Swap controls are ready."}
                </p>
              </div>
            </div>
            <Link
              href={`/e/${event.slug}/success?ref=${encodeURIComponent(
                myUnlockedRef || `FREE_RSVP_${myUnlockedRsvp.id}`
              )}&rsvpId=${encodeURIComponent(myUnlockedRsvp.id)}${
                myUnlockedRsvp.swap_token
                  ? `&swapToken=${encodeURIComponent(myUnlockedRsvp.swap_token)}`
                  : ""
              }`}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#007749] px-4 py-1.5 text-xs font-extrabold text-white shadow-xs hover:bg-[#005F3A]"
            >
              <span>Open My Pass &amp; Spot-Swap →</span>
            </Link>
          </div>
        )}


        {/* 1. MOBILE NATIVE VIEW (block lg:hidden) - Segmented Control & Thumb Zone */}
        <div className="block lg:hidden space-y-4 mb-24">
          {/* Mobile Header Card */}
          <div className="rounded-3xl border border-[#E6E2D8] bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E6E2D8] bg-[#FAF8F5] px-3 py-1 text-xs font-semibold text-[#0F172A]">
                <SouthAfricaFlagSvg className="h-3 w-4.5" />
                <span>{event.category_vibe}</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#007749]/10 px-2.5 py-0.5 text-xs font-semibold text-[#007749]">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Host: {event.host_name}</span>
              </span>
            </div>

            <h1 className="font-display mt-2.5 text-xl font-black tracking-tight text-[#0F172A] leading-snug">
              {event.title}
            </h1>
            <p className="mt-1 text-xs text-[#64748B] line-clamp-2">
              {event.description}
            </p>

            <div className="mt-3 flex items-center justify-between border-t border-[#E6E2D8]/60 pt-2.5 text-xs">
              <div className="flex items-center gap-1.5 text-[#0F172A] font-bold">
                <Calendar className="h-3.5 w-3.5 text-[#007749]" />
                <span>{formattedEventDate}</span>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  event.location_name
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[#64748B] hover:text-[#007749] truncate max-w-[150px]"
              >
                <MapPin className="h-3.5 w-3.5 text-[#64748B] shrink-0" />
                <span className="truncate">{event.location_name}</span>
              </a>
            </div>

            {/* Instant Mobile Hero Price + Spots + 1-Tap Checkout CTA */}
            <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-[#007749]/25 bg-[#007749]/[0.05] p-3">
              <div className="min-w-0">
                <span className="font-mono-num block text-base font-black text-[#0F172A]">
                  {isFreeCheckout ? "Free RSVP" : `${formatZar(unitBasePriceZar)} per spot`}
                </span>
                <span className="block text-[11px] font-bold text-[#007749]">
                  {isSoldOut
                    ? "Sold Out • Waitlist Open"
                    : spotsRemaining !== null
                    ? `🔥 ${spotsRemaining} of ${event.max_spots} spots left`
                    : `${confirmedRsvps.length} locked in`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("medium");
                  setIsCheckoutDrawerOpen(true);
                }}
                className="tap-tactile inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#007749] to-[#00A362] px-4 py-2.5 text-xs font-extrabold text-white shadow-md transition hover:bg-[#005F3A] active:scale-95"
              >
                <span>
                  {isSoldOut
                    ? "Join Waitlist"
                    : isFreeCheckout
                    ? "⚡ Lock Free Spot"
                    : "⚡ Lock In My Spot"}
                </span>
                <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Segmented Control Tabs */}
          <SegmentedControl
            tabs={[
              {
                id: "squad",
                label: "Squad Wall",
                badge: confirmedRsvps.length,
                icon: <Users className="h-3.5 w-3.5" />,
              },
              {
                id: "bring",
                label: "Bring-List",
                badge: event.bring_items?.length || 0,
                icon: <ShoppingBag className="h-3.5 w-3.5" />,
              },
              {
                id: "details",
                label: "Venue & Pin",
                icon: <MapPin className="h-3.5 w-3.5" />,
              },
            ]}
            activeTab={activeMobileTab}
            onChange={(tabId) => {
              triggerHaptic("selection");
              setActiveMobileTab(tabId as "squad" | "bring" | "details");
            }}
          />

          {/* Tab 1: Squad Wall */}
          {activeMobileTab === "squad" && (
            <div className="animate-fade-in-up">
              <SquadWallTab
                event={event}
                rsvps={rsvps}
                hostMode={hostMode}
                onOpenCheckout={() => {
                  setSpotsCount(1);
                  setIsCheckoutDrawerOpen(true);
                }}
                onToggleCheckIn={handleToggleCheckIn}
                onSettlePaydayPromise={handleSettlePaydayPromise}
                onModerateRsvp={handleModerateRsvp}
                onExpirePaydayPledges={handleExpirePaydayPledges}
              />
            </div>
          )}

          {/* Tab 2: Bring-List */}
          {activeMobileTab === "bring" && (
            <div className="animate-fade-in-up">
              <BringTab
                event={event}
                hostMode={hostMode}
                onClaimItem={(itemId) => {
                  setClaimedItemId(itemId);
                  setShowGuestExtrasAccordion(true);
                  setIsCheckoutDrawerOpen(true);
                }}
                onAddNewItem={handleAddNewBringItemDirect}
                onUnclaimItem={handleUnclaimBringItem}
              />
            </div>
          )}

          {/* Tab 3: Details & Secret Pin */}
          {activeMobileTab === "details" && (
            <div className="animate-fade-in-up">
              <DetailsTab
                event={event}
                hasUnlockedPin={hasUnlockedPin}
                hostMode={hostMode}
                onOpenCheckout={() => setIsCheckoutDrawerOpen(true)}
              />
            </div>
          )}
        </div>

        {/* 2. DESKTOP RESPONSIVE 2-COLUMN VIEW (hidden lg:grid lg:grid-cols-12 gap-6) */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: EVENT DETAILS, PROGRESS BAR, RANKED SOCIAL WALL & BRING-'N-BAK */}
          <div className="space-y-5 lg:col-span-7">
            {/* Clean Editorial Event Header Card */}
            <section className="rounded-3xl border border-[#E6E2D8] bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E6E2D8] bg-[#FAF8F5] px-3.5 py-1 text-xs font-semibold text-[#0F172A]">
                  <SouthAfricaFlagSvg className="h-3 w-4.5" />
                  <span>{event.category_vibe}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F3F0EA] px-3 py-1 text-xs font-medium text-[#475569]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#007749]" />
                  <span>
                    Host:{" "}
                    <strong className="text-[#0F172A]">{event.host_name}</strong>{" "}
                    • {event.mode === "free" ? "100% Free RSVP Roll-Call" : hostBankDisplay}
                  </span>
                </span>
              </div>

              <h1 className="font-display mt-3 text-2xl font-extrabold tracking-tight text-[#0F172A] sm:text-3xl lg:text-4xl">
                {event.title}
              </h1>

              <p className="mt-2 text-sm sm:text-base leading-relaxed text-[#475569]">
                {event.description}
              </p>

              {/* Date & Location Row */}
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-2xl border border-[#E6E2D8] bg-[#FAF8F5] p-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#007749]/10 text-[#007749]">
                    <Calendar className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                      Date &amp; Time
                    </span>
                    <span className="mt-0.5 block text-sm font-bold text-[#0F172A]">
                      {formattedEventDate}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-[#E6E2D8] bg-[#FAF8F5] p-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#007749]/10 text-[#007749]">
                    <MapPin className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                      Location
                    </span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        event.location_name
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 inline-flex items-center gap-1.5 text-sm font-bold text-[#0F172A] hover:text-[#007749] transition group"
                    >
                      <span className="group-hover:underline">
                        {event.location_name}
                      </span>
                      <span className="text-[10px] rounded-md bg-[#007749]/10 text-[#007749] px-1.5 py-0.5 font-bold">
                        Maps ↗
                      </span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Secret Gate Code / Location Pin Banner */}
              {(event.has_secret_location_pin || Boolean(event.secret_location_pin)) && (
                <div
                  className={`mt-3 rounded-2xl border p-3.5 ${
                    (hasUnlockedPin || hostMode) && event.secret_location_pin
                      ? "border-[#007749]/30 bg-[#007749]/[0.06]"
                      : "border-[#E6E2D8] bg-[#F3F0EA]"
                  }`}
                >
                  {(hasUnlockedPin || hostMode) && event.secret_location_pin ? (
                    <div className="flex items-start gap-3">
                      <Unlock className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[#007749]" />
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#007749]">
                          Gate code &amp; access details unlocked{" "}
                          {hostMode && !hasUnlockedPin ? "(Host View)" : ""}:
                        </span>
                        <p className="font-mono-num mt-0.5 text-sm font-bold text-[#0F172A]">
                          {event.secret_location_pin}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 text-xs text-[#475569]">
                        <Lock className="h-4 w-4 shrink-0 text-[#007749]" />
                        <span>
                          Exact gate code and details unlock as soon as your spot is confirmed.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => scrollToCheckout()}
                        className="shrink-0 text-xs font-bold text-[#007749] hover:underline"
                      >
                        Unlock →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* 2. LIVE CAPACITY / POT PROGRESS & RANKED GUEST WALL CARD */}
            <section className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-7 card-elevated">
              {/* Live Capacity / Kitty Progress Header */}
              <div className="rounded-2xl border border-slate-100 bg-[#FAF8F5] p-4.5">
                {event.mode === "pot" ? (
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Gift className="h-5 w-5 text-[#007749]" />
                        <span className="font-display text-base font-extrabold text-[#0F172A] sm:text-lg">
                          🎁{" "}
                          <span className="font-mono-num">
                            {formatZar(totalPotRaisedZar)}
                          </span>
                          {event.target_pot_zar ? (
                            <>
                              {" "}
                              of{" "}
                              <span className="font-mono-num">
                                {formatZar(event.target_pot_zar)}
                              </span>{" "}
                              Raised
                            </>
                          ) : (
                            " Raised"
                          )}{" "}
                          •{" "}
                          <span className="font-mono-num">
                            {confirmedRsvps.length}
                          </span>{" "}
                          Contributors
                        </span>
                      </div>
                      <span className="font-mono-num rounded-full border border-[#007749]/25 bg-[#007749]/10 px-3 py-1 text-xs font-bold text-[#007749]">
                        {potPercent}% Funded
                      </span>
                    </div>
                    <div className="mt-2.5 h-3 w-full overflow-hidden rounded-full bg-[#E6E2D8]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#007749] to-teal-500 transition-all duration-500"
                        style={{ width: `${potPercent}%` }}
                      />
                    </div>
                    {event.hide_amounts_on_wall && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-[#475569]">
                        <EyeOff className="h-3.5 w-3.5 text-[#007749]" />
                        <span>
                          Dignity Mode Active: Total pot is public, individual Rand contributions are hidden on the wall.
                        </span>
                      </p>
                    )}
                  </div>
                ) : event.max_spots ? (
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Flame className="h-5 w-5 text-[#007749]" />
                        <span className="font-display text-base font-extrabold text-[#0F172A] sm:text-lg">
                          🔥{" "}
                          <span className="font-mono-num">
                            {lockedSpotsCount} / {event.max_spots}
                          </span>{" "}
                          Spots Locked In —{" "}
                          {spotsRemaining === 0 ? (
                            "SOLD OUT!"
                          ) : (
                            <>
                              Only{" "}
                              <span className="font-mono-num text-[#007749] font-black">
                                {spotsRemaining}
                              </span>{" "}
                              Left!
                            </>
                          )}
                        </span>
                      </div>
                      <span className="font-mono-num rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900 shadow-xs">
                        {capacityPercent}% Full
                      </span>
                    </div>
                    <div className="mt-2.5 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#007749] to-teal-500 transition-all duration-500"
                        style={{ width: `${capacityPercent}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="font-display text-base font-extrabold text-[#0F172A]">
                      🔥{" "}
                      <span className="font-mono-num">{lockedSpotsCount}</span>{" "}
                      Crew Members Locked In
                    </span>
                    <span className="rounded-full bg-[#007749]/10 px-3 py-1 text-xs font-bold text-[#007749]">
                      Open Roll Call
                    </span>
                  </div>
                )}
              </div>

              {/* Ranked Guest Wall Header */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-b border-[#E6E2D8] pb-3.5">
                <div>
                  <h2 className="font-display flex items-center gap-2 text-lg font-extrabold text-[#0F172A] sm:text-xl">
                    <Users className="h-5 w-5 text-[#007749]" />
                    <span>The Squad Wall</span>
                  </h2>
                  <p className="text-xs text-[#475569]">
                    First to pay, first on the list • Phone numbers &amp; emails are never public
                  </p>
                </div>

                <span className="font-mono-num rounded-full border border-[#E6E2D8] bg-[#F3F0EA] px-3 py-1 text-xs font-bold text-[#0F172A]">
                  {chronologicalRsvps.length} Entries
                </span>
              </div>

              {/* Guest List */}
              <div className="mt-4 space-y-3">
                {chronologicalRsvps.map((rsvp) => {
                  const isPaydayPromise = rsvp.status === "payday_promise";
                  const isCashLogged = rsvp.status === "cash_logged";
                  const isPayShapRsvp =
                    rsvp.badge_label === "📲 PayShap Sent" ||
                    rsvp.payment_channel === "payshap" ||
                    Boolean(rsvp.pop_reference_note?.includes("PayShap"));
                  const confirmedIdx = confirmedRsvps.findIndex((c) => c.id === rsvp.id);
                  const rankNumber = confirmedIdx !== -1 ? confirmedIdx + 1 : 0;
                  const rankLabel =
                    rsvp.refund_status === "refunded"
                      ? "💸 Refunded"
                      : isPaydayPromise
                      ? "⏳ Standby (Unpaid)"
                      : isCashLogged && !rsvp.checked_in
                      ? isPayShapRsvp
                        ? "📲 PayShap Sent"
                        : "⏳ Cash on Arrival"
                      : rankNumber === 1
                      ? "#1 🥇 First In!"
                      : rankNumber === 2
                      ? "#2 ⚡ Second In"
                      : rankNumber === 3
                      ? "#3 🔥 Podium Lock"
                      : `#${rankNumber}`;

                  const publicName = rsvp.is_anonymous_on_wall
                    ? "🔒 Anonymous Legend"
                    : rsvp.guest_name;

                  const rawInitials = (rsvp.is_anonymous_on_wall ? "Anonymous" : rsvp.guest_name)
                    .replace(/[^a-zA-Z\s]/g, "")
                    .trim()
                    .split(/\s+/)
                    .filter(Boolean);
                  const initials =
                    rawInitials.length === 0
                      ? "MZ"
                      : rawInitials.length === 1
                      ? rawInitials[0].slice(0, 2).toUpperCase()
                      : (rawInitials[0][0] + rawInitials[rawInitials.length - 1][0]).toUpperCase();

                  const amountPillText = (() => {
                    if (rsvp.refund_status === "refunded") {
                      return "💸 Base Refunded";
                    }
                    if (rsvp.refund_status === "disputed") {
                      return "🚨 Dispute (Escrow Hold)";
                    }
                    if (isPaydayPromise) {
                      return rsvp.payday_preauthorized
                        ? "🔒 Payday Pre-Authorized"
                        : "🗓️ Payday 25th Pledge";
                    }
                    if (isCashLogged) {
                      return rsvp.checked_in
                        ? isPayShapRsvp
                          ? `✅ ${formatZar(rsvp.amount_contributed_zar)} (PayShap Paid)`
                          : `💵 ${formatZar(rsvp.amount_contributed_zar)} (Cash Paid)`
                        : isPayShapRsvp
                        ? `📲 ${formatZar(rsvp.amount_contributed_zar)} (PayShap Sent)`
                        : `⏳ ${formatZar(rsvp.amount_contributed_zar)} (Cash on Arrival)`;
                    }
                    if (event.mode === "free" || rsvp.amount_contributed_zar === 0) {
                      return "Going ✅";
                    }
                    if (event.hide_amounts_on_wall && !hostMode) {
                      return "Contributed ✅";
                    }
                    return `${formatZar(rsvp.amount_contributed_zar)} Locked ✅`;
                  })();

                  const cardStyle = (() => {
                    if (isPaydayPromise) {
                      return rsvp.payday_preauthorized
                        ? "border-emerald-400/80 bg-emerald-50/70"
                        : "border-amber-300/80 bg-amber-50/30";
                    }
                    if (rankNumber === 1) {
                      return "border-amber-300/90 bg-gradient-to-br from-amber-500/[0.08] via-amber-100/[0.12] to-white ring-1 ring-amber-400/40 shadow-xs";
                    }
                    if (rankNumber === 2) {
                      return "border-slate-300/90 bg-gradient-to-br from-slate-100/50 to-white shadow-xs";
                    }
                    if (rankNumber === 3) {
                      return "border-amber-700/30 bg-gradient-to-br from-amber-50/40 to-white shadow-xs";
                    }
                    return "border-slate-200/80 bg-white hover:border-[#007749]/40";
                  })();

                  const avatarStyle = (() => {
                    if (rankNumber === 1) {
                      return "bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 font-black shadow-xs ring-2 ring-amber-300";
                    }
                    if (rankNumber === 2) {
                      return "bg-gradient-to-br from-slate-200 to-slate-300 text-slate-800 font-bold ring-2 ring-slate-300";
                    }
                    if (rankNumber === 3) {
                      return "bg-gradient-to-br from-amber-200 to-amber-300 text-amber-950 font-bold ring-2 ring-amber-600/30";
                    }
                    return "bg-emerald-50 text-[#007749] font-bold border border-emerald-200/60";
                  })();

                  return (
                    <div
                      key={rsvp.id}
                      className={`rounded-2xl border p-4 transition-all duration-200 ${cardStyle}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2.5">
                        <div className="flex items-center gap-3">
                          {/* Tactile Initials Avatar Pill */}
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-xs ${avatarStyle}`}
                          >
                            <span>{initials}</span>
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`font-mono-num rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                  rankNumber === 1
                                    ? "bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black shadow-xs"
                                    : rankNumber === 2
                                    ? "bg-slate-200 text-slate-800"
                                    : rankNumber === 3
                                    ? "bg-amber-100 text-amber-900"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {rankLabel}
                              </span>

                              <h3 className="font-display text-base font-extrabold text-[#0F172A]">
                                {publicName}
                              </h3>

                              {rsvp.is_anonymous_on_wall && hostMode && (
                                <span className="rounded-md border border-[#FFB81C] bg-[#FFB81C]/20 px-2 py-0.5 text-[10px] font-bold text-[#0F172A]">
                                  👑 Host Only: {rsvp.guest_name}
                                </span>
                              )}

                              {rsvp.plus_one_names?.length > 0 &&
                                !rsvp.guest_name.includes("+") && (
                                  <span className="rounded-lg border border-[#E6E2D8] bg-white px-2 py-0.5 text-xs font-semibold text-[#007749]">
                                    + {rsvp.plus_one_names.join(", ")}
                                  </span>
                                )}
                            </div>

                            {/* Badges, Tier Label & Claimed Bring-Item Row */}
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                              {rsvp.badge_label && (
                                <span className="inline-flex items-center rounded-full border border-[#E6E2D8] bg-white px-2.5 py-0.5 text-[11px] font-semibold text-[#0F172A]">
                                  {rsvp.badge_label}
                                </span>
                              )}

                              {rsvp.spots_locked > 1 && (
                                <span className="font-mono-num inline-flex items-center rounded-full bg-[#F3F0EA] px-2.5 py-0.5 text-[11px] font-bold text-[#0F172A]">
                                  🎟️ {rsvp.spots_locked} Spots
                                </span>
                              )}

                              {rsvp.tier_label && (
                                <span className="inline-flex items-center rounded-full border border-[#E6E2D8] bg-[#F3F0EA] px-2.5 py-0.5 text-[11px] font-semibold text-[#475569]">
                                  {rsvp.tier_label}
                                </span>
                              )}

                              {rsvp.claimed_item_label && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-[#007749]/25 bg-[#007749]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#007749]">
                                  <span>Bringing: {rsvp.claimed_item_label}</span>
                                </span>
                              )}

                              {hostMode && (rsvp.pop_reference_note || rsvp.pop_hash) && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[10px] font-mono-num font-bold text-amber-950">
                                  <span>🧾 {rsvp.pop_reference_note || `POP Hash: ${String(rsvp.pop_hash).slice(0, 18)}`}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`font-mono-num rounded-full px-3 py-1 text-xs font-bold ${
                              isPaydayPromise
                                ? rsvp.payday_preauthorized
                                  ? "border border-emerald-500 bg-emerald-100 text-emerald-900"
                                  : "border border-[#FFB81C] bg-[#FFB81C]/20 text-[#0F172A]"
                                : "border border-[#007749]/25 bg-[#007749]/10 text-[#007749]"
                            }`}
                          >
                            {amountPillText}
                          </span>

                          {isPaydayPromise && !isSoldOut && (
                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic("medium");
                                handleSettlePaydayPromise(rsvp);
                              }}
                              className="tap-tactile rounded-full bg-[#007749] px-3.5 py-1 text-xs font-bold text-white shadow-xs transition hover:bg-[#005F3A]"
                            >
                              {rsvp.payday_preauthorized ? "💳 Settle Early Now" : "💳 Settle Pledge Now"}
                            </button>
                          )}

                          {isPaydayPromise && isSoldOut && (
                            <span className="rounded-full border border-rose-300 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-800">
                              ⚠️ Sold Out Before Payday
                            </span>
                          )}

                          {/* Host Mode: 4-Digit Anti-Screenshot Gate PIN */}
                          {hostMode && !isPaydayPromise && rsvp.gate_pin && (
                            <span className="rounded-full bg-[#0F172A] px-2.5 py-1 font-mono-num text-[11px] font-bold text-amber-300">
                              PIN #{rsvp.gate_pin}
                            </span>
                          )}

                          {/* Host Mode: 1-Tap Mark PayShap or Cash Received */}
                          {hostMode && isCashLogged && !rsvp.checked_in && (
                            <button
                              type="button"
                              onClick={() => handleModerateRsvp(rsvp.id, "verify_cash")}
                              className="tap-tactile rounded-full border border-emerald-500 bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-emerald-700"
                              title="Confirm PayShap or Cash received and mark guest as Paid"
                            >
                              {rsvp.badge_label === "📲 PayShap Sent"
                                ? `✅ Mark PayShap Paid (${formatZar(rsvp.amount_contributed_zar)})`
                                : `💵 Mark Cash Paid (${formatZar(rsvp.amount_contributed_zar)})`}
                            </button>
                          )}

                          {/* Host Mode: 1-Tap Verify EFT / POP & Moderation */}
                          {hostMode && rsvp.pop_rail_badge === "standard_eft" && (
                            <button
                              type="button"
                              onClick={() => handleModerateRsvp(rsvp.id, "verify_pop")}
                              className="tap-tactile rounded-full border border-emerald-400 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100"
                              title="Confirm this Standard EFT has cleared in your bank account"
                            >
                              ✅ Mark EFT Cleared
                            </button>
                          )}

                          {hostMode && rsvp.comment && !rsvp.comment.includes("[Comment hidden") && (
                            <button
                              type="button"
                              onClick={() => handleModerateRsvp(rsvp.id, "hide_comment")}
                              className="tap-tactile rounded-full border border-[#E6E2D8] bg-white px-2.5 py-1 text-[11px] font-bold text-[#475569] hover:bg-slate-100"
                              title="Hide abusive or unwanted comment"
                            >
                              🛡️ Hide Comment
                            </button>
                          )}

                          {hostMode &&
                            (rsvp.status !== "locked_paid" ||
                              !rsvp.order_id ||
                              Boolean(rsvp.pop_hash)) && (
                              <button
                                type="button"
                                onClick={() => handleModerateRsvp(rsvp.id, "remove_unpaid")}
                                className="tap-tactile rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100"
                                title="Remove unpaid entry or unverified POP if money hasn't landed in your bank"
                              >
                                {rsvp.status === "locked_paid"
                                  ? "🗑️ Not in Bank (Remove)"
                                  : "🗑️ Remove"}
                              </button>
                            )}

                          {/* Host Mode: 1-Tap WhatsApp Nudge for Payday Pledges */}
                          {hostMode && isPaydayPromise && (
                            <a
                              href={`https://wa.me/?text=${encodeURIComponent(
                                `Howzit ${rsvp.guest_name}! Payday has landed 💸 Lock in your spot for ${event.title} here: ${typeof window !== "undefined" ? window.location.origin : "https://pullthru.co.za"}/e/${event.slug}?settle=${rsvp.id}`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="tap-tactile rounded-full border border-emerald-400 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 flex items-center gap-1"
                            >
                              <span>💬 WhatsApp Nudge</span>
                            </a>
                          )}

                          {/* Host Mode: 1-Tap Check-In Toggle */}
                          {hostMode && (
                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic("light");
                                handleToggleCheckIn(rsvp.id);
                              }}
                              className={`tap-tactile rounded-full px-3 py-1 text-xs font-bold transition ${
                                rsvp.checked_in
                                  ? "bg-[#007749] text-white shadow-xs"
                                  : "border border-[#E6E2D8] bg-white text-[#475569] hover:border-[#007749] hover:text-[#0F172A]"
                              }`}
                            >
                              {rsvp.checked_in ? "✓ Checked In" : "Check In"}
                            </button>
                          )}
                        </div>
                      </div>

                      {rsvp.comment && (
                        <div className="mt-2.5 rounded-xl border border-slate-200/60 bg-[#FAF8F5]/80 px-3.5 py-2 text-xs text-[#334155] leading-relaxed flex items-start gap-1.5">
                          <span className="text-[#007749] font-bold shrink-0">💬</span>
                          <span className="italic">&ldquo;{rsvp.comment}&rdquo;</span>
                        </div>
                      )}

                      {hostMode && rsvp.custom_answer && (
                        <p className="mt-2 rounded-xl border border-[#FFB81C]/50 bg-[#FFB81C]/15 px-3 py-1.5 text-[11px] text-[#0F172A]">
                          <strong>👑 Host Note:</strong> {rsvp.custom_answer}
                        </p>
                      )}
                    </div>
                  );
                })}

                {/* CLEAN DASHED EMPTY SPOT PLACEHOLDERS */}
                {emptySpotNumbers.length > 0 && (
                  <div className="pt-1.5 space-y-2">
                    {emptySpotNumbers.map((spotNum) => {
                      const isFinalSpot = spotNum === event.max_spots;
                      return (
                        <button
                          key={spotNum}
                          type="button"
                          onClick={() => {
                            triggerHaptic("light");
                            scrollToCheckout();
                          }}
                          className={`tap-tactile flex w-full items-center justify-between rounded-2xl border border-dashed px-4 py-3 text-left transition ${
                            isFinalSpot
                              ? "border-[#FFB81C] bg-[#FFB81C]/10 hover:bg-[#FFB81C]/20"
                              : "border-slate-300 bg-slate-50/50 hover:border-[#007749] hover:bg-emerald-50/20"
                          }`}
                        >
                          <span className="font-mono-num text-xs sm:text-sm font-bold text-[#0F172A]">
                            {isFinalSpot
                              ? `🔥 Final Spot #${spotNum} Available — Tap to Lock In`
                              : `Spot #${spotNum} Available — Tap to Lock In`}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#007749]/10 px-3 py-1 text-xs font-bold text-[#007749]">
                            <span>Claim Spot</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* 3. "BRING-'N-BAK" CREW CHECKLIST CARD */}
            {(event.bring_items?.length > 0 || hostMode) && (
              <section className="rounded-3xl border border-[#E6E2D8] bg-white p-5 sm:p-6 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-display flex items-center gap-2 text-lg font-extrabold text-[#0F172A]">
                      <ShoppingBag className="h-5 w-5 text-[#007749]" />
                      <span>Bring-List Checklist</span>
                    </h2>
                    <p className="text-xs text-[#475569]">
                      No more 6 bags of ice and zero wood! Claim an open item below when locking in your spot.
                    </p>
                  </div>
                  <span className="font-mono-num rounded-full border border-[#E6E2D8] bg-[#F3F0EA] px-3 py-1 text-xs font-bold text-[#0F172A]">
                    {event.bring_items.filter((b) => b.claimed_by_name).length} /{" "}
                    {event.bring_items.length} Claimed
                  </span>
                </div>

                <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {event.bring_items.map((item: BringItem) => {
                    const isClaimed = Boolean(item.claimed_by_name);
                    const isSelectedByMe = claimedItemId === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between gap-2 rounded-2xl border p-3 transition ${
                          isClaimed
                            ? "border-[#E6E2D8] bg-[#F3F0EA] text-[#475569]"
                            : isSelectedByMe
                            ? "border-[#007749] bg-[#007749]/[0.06] text-[#0F172A]"
                            : "border-[#E6E2D8] bg-[#FAF8F5] hover:border-[#007749]/50"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs sm:text-sm font-bold text-[#0F172A]">
                            {item.label}
                          </p>
                          {isClaimed ? (
                            <p className="mt-0.5 text-[11px] font-semibold text-[#007749]">
                              ✅ Claimed by {item.claimed_by_name}
                            </p>
                          ) : (
                            <p className="mt-0.5 text-[11px] text-[#475569]">
                              Open to claim during checkout
                            </p>
                          )}
                        </div>

                        {!isClaimed ? (
                          <button
                            type="button"
                            onClick={() => {
                              setClaimedItemId(
                                isSelectedByMe ? "" : item.id
                              );
                              if (!isSelectedByMe) {
                                scrollToCheckout(item.id);
                              }
                            }}
                            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                              isSelectedByMe
                                ? "bg-[#007749] text-white"
                                : "border border-[#E6E2D8] bg-white text-[#007749] hover:bg-[#007749] hover:text-white"
                            }`}
                          >
                            {isSelectedByMe ? "Selected ✓" : "I'll Bring This"}
                          </button>
                        ) : (
                          hostMode && (
                            <button
                              type="button"
                              onClick={() => handleUnclaimBringItem(item.id)}
                              className="shrink-0 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[11px] font-extrabold text-amber-900 hover:bg-amber-100 transition"
                            >
                              ↺ Release Item
                            </button>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Host Mode: Add Bring Item inline */}
                {hostMode && (
                  <form
                    onSubmit={handleAddBringItem}
                    className="mt-3.5 flex gap-2 border-t border-[#E6E2D8] pt-3.5"
                  >
                    <input
                      type="text"
                      value={newBringItemLabel}
                      onChange={(e) => setNewBringItemLabel(e.target.value)}
                      placeholder="👑 Host: Add checklist item (e.g. 🧄 2x Garlic Breads)"
                      className="flex-1 rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-3.5 py-2 text-xs text-[#0F172A] placeholder-[#475569] focus:border-[#007749] focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={addingBringItem || !newBringItemLabel.trim()}
                      className="rounded-xl bg-[#007749] px-4 py-2 text-xs font-bold text-white hover:bg-[#005F3A] disabled:opacity-50"
                    >
                      + Add Item
                    </button>
                  </form>
                )}
              </section>
            )}

            {/* 4. VIRAL HOST BRIDGE FOOTER CARD (Turns every guest viewing the wall into a new host) */}
            {!hostMode && (
              <section className="rounded-3xl border border-[#007749]/25 bg-gradient-to-br from-white via-[#FAF8F5] to-emerald-50/40 p-4 sm:p-5 shadow-2xs print:hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-[#007749]/25 bg-[#007749]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#007749]">
                      <Sparkles className="h-3 w-3 text-[#007749]" />
                      <span>Powered by PullThru.co.za • R0 Guest Fees</span>
                    </div>
                    <h3 className="font-display mt-1.5 text-sm sm:text-base font-extrabold text-[#0F172A]">
                      Organising the next braai, 5-a-side, padel game, or birthday pot?
                    </h3>
                    <p className="mt-0.5 text-xs text-[#475569]">
                      Stop chasing EFTs on WhatsApp. Launch your own squad link in 15 seconds and get paid straight to your SA bank account.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Link
                      href={`/create?clone=${encodeURIComponent(slug)}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#007749] px-4 py-2 text-xs font-extrabold text-white shadow-2xs hover:bg-[#005F3A] transition"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-[#FFB81C]" />
                      <span>Clone This Setup (10s)</span>
                    </Link>
                    <Link
                      href="/create"
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#E6E2D8] bg-white px-4 py-2 text-xs font-bold text-[#0F172A] hover:border-[#007749] transition"
                    >
                      <span>Create Blank Link →</span>
                    </Link>
                  </div>
                </div>
              </section>
            )}

            {/* 5. TASTEFUL ADSENSE FOOTER SLOT (Strict Exclusion: Never on Dignity/Gift Pots or Pro Boosted / Club Pass / Tournament events) */}
            {!hostMode && event.mode !== "pot" && !event.is_pro_boosted && (
              <div className="print:hidden">
                <TastefulAdSlot
                  slotId="8842109406"
                  variant="light"
                  context="general"
                  showProRemoveHint
                />
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: THE 5-SECOND CHECKOUT CARD */}
          <div className="lg:col-span-5" ref={checkoutSectionRef}>
            <div className="sticky top-20 rounded-3xl border border-[#E6E2D8] bg-white p-5 sm:p-6 shadow-lg shadow-black/[0.03]">
              {renderCheckoutCardContent()}
            </div>
          </div>
        </div>
      </main>

      {/* 7. NATIVE SPRING BOTTOM SHEET DRAWER (FOR MOBILE CHECKOUT) */}
      <BottomSheetDrawer
        isOpen={isCheckoutDrawerOpen}
        onClose={() => setIsCheckoutDrawerOpen(false)}
        title={
          isSoldOut
            ? "Event Full (Sold Out)"
            : isFreeCheckout
            ? "Lock In Your Free Spot"
            : event.mode === "pot"
            ? "Contribute to the Pot"
            : "Lock In Your Spot"
        }
        subtitle={
          isFreeCheckout
            ? "Instant free RSVP • No payment needed"
            : `${formatZar(unitBasePriceZar)} per spot • Direct PayShap / Capitec PayMe (R0 Fee)`
        }
      >
        <div>
          {renderCheckoutCardContent(true)}
        </div>
      </BottomSheetDrawer>

      {/* 6. UNIFIED MOBILE GUEST & HOST BOTTOM BAR (MOBILE THUMB ZONE FIRST) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#E6E2D8] bg-white/95 backdrop-blur-xl px-4 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-8 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] print:hidden">
        {hostMode && hostActionError && !showCashModal && !showPostponeModal && (
          <div className="mx-auto mb-2 flex max-w-7xl items-center justify-between rounded-xl border border-rose-500/30 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700">
            <span>⚠️ {hostActionError}</span>
            <button
              type="button"
              onClick={() => setHostActionError(null)}
              className="ml-2 text-rose-700 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* MOBILE & TABLET GUEST THUMB-ZONE BAR (When hostMode is FALSE on < lg viewports) */}
        {!hostMode && (
          <div className="flex lg:hidden w-full items-center justify-between gap-3 max-w-2xl mx-auto">
            <div className="min-w-0 pr-1">
              <span className="font-display font-extrabold text-[#0F172A] text-sm block truncate">
                {isFreeCheckout ? "Free RSVP" : `${formatZar(unitBasePriceZar)} per spot`}
              </span>
              <span className="text-[11px] font-bold text-[#007749] block truncate">
                {isSoldOut ? "Sold Out" : spotsRemaining !== null ? `🔥 Only ${spotsRemaining} spots left` : "Open RSVP"}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("medium");
                  setIsCheckoutDrawerOpen(true);
                }}
                disabled={isSoldOut}
                className="tap-tactile inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#007749] to-[#00A362] px-4 py-2.5 text-xs font-extrabold text-white shadow-md active:scale-95 disabled:opacity-50"
              >
                <span>{isFreeCheckout ? "Lock Free Spot" : "Lock In Spot"}</span>
                <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={handleToggleHostModeWithGuard}
                className="tap-tactile inline-flex items-center justify-center min-h-[42px] min-w-[42px] rounded-full border border-slate-200 bg-[#FAF8F5] text-slate-700 hover:text-slate-900 shadow-2xs"
                aria-label="Host Tools"
              >
                <Crown className="h-4 w-4 text-[#007749]" />
              </button>
            </div>
          </div>
        )}

        {/* DESKTOP BAR & MOBILE HOST TOOLBAR (Visible on lg+ OR when hostMode is TRUE) */}
        <div className={`mx-auto max-w-7xl items-center justify-between gap-2 ${!hostMode ? "hidden lg:flex" : "flex"}`}>
          {/* Left: Host Controls Button + Demo Badge */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleToggleHostModeWithGuard}
              className={`tap-tactile inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold transition shrink-0 ${
                hostMode
                  ? "bg-[#FFB81C] text-[#0F172A] shadow-xs"
                  : "border border-[#E6E2D8] bg-[#FAF8F5] text-[#0F172A] hover:bg-[#F3F0EA]"
              }`}
            >
              <Crown className="h-4 w-4 text-[#007749]" />
              <span>
                {hostMode ? "👑 Host Active" : "👑 Host Controls"}
              </span>
            </button>

            {DEMO_SLUGS.has(event.slug) && (
              <span className="hidden sm:inline-block rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800 shrink-0">
                🧪 Demo Sandbox (Real events locked to host)
              </span>
            )}

            <span className="hidden text-xs text-[#475569] lg:inline truncate">
              Host: <strong className="text-[#0F172A]">{event.host_name}</strong>{" "}
              •{" "}
              <span className="font-mono-num font-semibold text-[#007749]">
                {confirmedRsvps.filter((r) => r.checked_in).length} /{" "}
                {confirmedRsvps.length}
              </span>{" "}
              Checked In
            </span>
          </div>

          {/* Right: Actions with horizontal scroll so chips never get squashed or clipped on mobile */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full">
            <button
              type="button"
              onClick={() => {
                triggerHaptic("success");
                if (typeof window !== "undefined") {
                  navigator.clipboard.writeText(window.location.href.split("?")[0]);
                }
              }}
              className="tap-tactile inline-flex items-center gap-1.5 rounded-full border border-[#E6E2D8] bg-white px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-[#0F172A] shadow-xs hover:border-[#007749] transition shrink-0"
              title="Copy event link to share anywhere"
            >
              <Share2 className="h-3.5 w-3.5 text-[#007749]" />
              <span>Share</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic("success");
                handleCopySquadList();
              }}
              className={`tap-tactile inline-flex items-center gap-1.5 rounded-full border border-[#0F172A] bg-[#0F172A] px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#007749] hover:border-[#007749] shrink-0 ${
                !hostMode ? "hidden sm:inline-flex" : ""
              }`}
            >
              {copiedSquadList ? (
                <>
                  <Check className="h-4 w-4 text-[#007749]" />
                  <span>Squad List Copied! ✅</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>📋 Squad List</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic("success");
                handleCopyHostWhatsappUpdate();
              }}
              className={`tap-tactile inline-flex items-center gap-1.5 rounded-full bg-[#007749] px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#005F3A] shrink-0 ${
                !hostMode ? "hidden sm:inline-flex" : ""
              }`}
            >
              {copiedHypeUpdate ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Copied WhatsApp List!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>📲 Hype Update</span>
                </>
              )}
            </button>

            {/* Viral Weapon 1: Squad Banter & Flaky Friend Roast */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic("success");
                handleCopySquadRoast();
              }}
              className="tap-tactile inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-bold text-amber-950 shadow-xs transition hover:bg-amber-100 shrink-0"
              title="Copy WhatsApp Squad Banter & Flaky Friend Roast"
            >
              {copiedRoast ? (
                <>
                  <Check className="h-4 w-4 text-[#007749]" />
                  <span className="text-[#007749]">Squad Roast Copied! 🔥</span>
                </>
              ) : (
                <>
                  <span>🔥 Squad Roast</span>
                </>
              )}
            </button>

            {/* Viral Weapon 2: Emergency 5 PM Bailed Spot Alert */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic("warning");
                handleCopyEmergencyStandby();
              }}
              className="tap-tactile inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-50 px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-bold text-rose-950 shadow-xs transition hover:bg-rose-100 shrink-0"
              title="Copy Emergency Bailed Spot Alert for WhatsApp"
            >
              {copiedEmergency ? (
                <>
                  <Check className="h-4 w-4 text-rose-700" />
                  <span className="text-rose-700">Alert Copied! 🚨</span>
                </>
              ) : (
                <>
                  <span>🚨 Bailed Spot</span>
                </>
              )}
            </button>

            {hostMode && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    setHostActionError(null);
                    setShowCashModal(true);
                  }}
                  className="tap-tactile inline-flex items-center gap-1.5 rounded-full border border-[#E6E2D8] bg-[#FAF8F5] px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-[#0F172A] hover:border-[#007749] hover:bg-white shrink-0"
                >
                  <Banknote className="h-4 w-4 text-[#007749]" />
                  <span>+ Cash</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    setHostActionError(null);
                    setShowPostponeModal(true);
                  }}
                  className="tap-tactile inline-flex items-center gap-1.5 rounded-full border border-[#E6E2D8] bg-[#FAF8F5] px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-[#0F172A] hover:border-[#007749] hover:bg-white shrink-0"
                >
                  <CloudRain className="h-4 w-4 text-[#007749]" />
                  <span>🌧️ Date</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    handleExportCsvGuestList();
                  }}
                  className="tap-tactile inline-flex items-center gap-1.5 rounded-full border border-[#E6E2D8] bg-[#FAF8F5] px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-[#0F172A] hover:border-[#007749] hover:bg-white shrink-0"
                >
                  {copiedCsv ? (
                    <>
                      <Check className="h-4 w-4 text-[#007749]" />
                      <span className="text-[#007749]">CSV Copied!</span>
                    </>
                  ) : (
                    <>
                      <span>📋 CSV</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* INTERACTIVE 2-STEP CAPITEC PAY / YOCO SA BIOMETRIC APPROVAL MODAL */}
      {showApprovalOverlay && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Yoco SA Verified Split Payment Authorization"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/60 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-[#E6E2D8] bg-white p-6 sm:p-7 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E6E2D8] pb-3.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#007749]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#007749]">
                  Yoco SA • Verified Instant Lock
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowApprovalOverlay(false)}
                className="rounded-lg p-1 text-[#475569] hover:text-[#0F172A]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#007749]/25 bg-[#007749]/10 text-[#007749]">
                <Fingerprint className="h-9 w-9 animate-pulse" />
              </div>
              <h3 className="font-display text-xl font-extrabold text-[#0F172A]">
                {paymentChannel === "capitec_pay"
                  ? "Capitec Pay App Push Sent"
                  : paymentChannel === "apple_pay"
                  ? "Apple Pay Biometric Prompt"
                  : paymentChannel === "eft"
                  ? "Yoco Instant EFT Authorization"
                  : "3D-Secure Card Authorization"}
              </h3>
              <p className="mt-1 text-xs text-[#475569]">
                Approving lock-in for{" "}
                <strong className="text-[#0F172A]">{buyerName}</strong> on{" "}
                <strong className="text-[#007749]">{event.title}</strong>
              </p>
            </div>

            {/* Modal Quick Channel Switcher */}
            <div className="mt-4 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 text-xs font-bold">
              {[
                { id: "apple_pay" as PaymentChannel, label: "🍏 Apple Pay" },
                { id: "card" as PaymentChannel, label: "💳 Card" },
                { id: "capitec_pay" as PaymentChannel, label: "⚡ Capitec Pay" },
              ].map((channel) => (
                <button
                  key={channel.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    setPaymentChannel(channel.id);
                  }}
                  className={`rounded-lg py-1.5 transition ${
                    paymentChannel === channel.id
                      ? "bg-white text-[#007749] shadow-xs font-black"
                      : "text-[#475569] hover:text-[#0F172A]"
                  }`}
                >
                  {channel.label}
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-[#E6E2D8] bg-[#FAF8F5] p-4 text-xs space-y-2">
              <div className="flex justify-between text-[#475569]">
                <span>Direct to Host ({event.host_name}):</span>
                <span className="font-mono-num font-bold text-[#0F172A]">
                  {formatZar(split.totalBasePriceZar)}
                </span>
              </div>
              <div className="flex justify-between text-[#475569]">
                <span>Gateway Rail:</span>
                <span className="font-mono-num font-semibold text-[#007749]">
                  Yoco SA Instant Checkout
                </span>
              </div>
              <div className="flex justify-between text-[#475569]">
                <span>PullThru Instant Clearing Fee:</span>
                <span className="font-mono-num font-semibold text-[#0F172A]">
                  {formatZar(split.platformFeeZar)}
                </span>
              </div>
              <div className="border-t border-[#E6E2D8] pt-2 flex justify-between text-sm font-extrabold text-[#007749]">
                <span>Total Authorization:</span>
                <span className="font-mono-num">
                  {formatZar(split.totalChargedZar)}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-2.5">
              <button
                type="button"
                disabled={approvalStep === "processing"}
                onClick={handleConfirmBiometricPayment}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#007749] px-5 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#005F3A] disabled:opacity-60"
              >
                <Fingerprint className="h-5 w-5" />
                <span>
                  {approvalStep === "processing"
                    ? "Verifying Split & Unlocking Receipt..."
                    : paymentChannel === "apple_pay"
                    ? `Pay ${formatZar(split.totalChargedZar)} with Apple Pay`
                    : paymentChannel === "card"
                    ? `Pay ${formatZar(split.totalChargedZar)} with Card`
                    : `Approve Capitec Pay (${formatZar(split.totalChargedZar)})`}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setShowApprovalOverlay(false)}
                className="w-full rounded-full py-2 text-xs font-bold text-[#475569] hover:text-[#0F172A]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HOST MODAL 1: + LOG CASH / DIRECT EFT GUEST */}
      {showCashModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Log Cash or Direct EFT Guest"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/60 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-3xl border border-[#E6E2D8] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E6E2D8] pb-3">
              <h3 className="font-display flex items-center gap-2 text-base font-extrabold text-[#0F172A]">
                <Banknote className="h-5 w-5 text-[#007749]" />
                <span>Log Cash or Direct EFT Guest</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setHostActionError(null);
                  setShowCashModal(false);
                }}
                className="text-[#475569] hover:text-[#0F172A]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-2 text-xs text-[#475569]">
              Did someone hand you cash or EFT you directly? Add their name here so their spot is locked on the wall.
            </p>

            <form onSubmit={handleAddCashGuest} className="mt-4 space-y-3">
              <div>
                <label htmlFor="cash-guest-name" className="mb-1 block text-xs font-bold text-[#0F172A]">
                  Guest Display Name *
                </label>
                <input
                  id="cash-guest-name"
                  type="text"
                  required
                  value={cashGuestName}
                  onChange={(e) => setCashGuestName(e.target.value)}
                  placeholder="e.g. Uncle Bruce (Paid Cash)"
                  className="w-full rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-3.5 py-2.5 text-base sm:text-sm text-[#0F172A] placeholder-[#475569]/60 focus:border-[#007749] focus:bg-white focus:outline-none"
                />
              </div>

              {event.mode === "tiered" && event.tiers?.length > 0 && (
                <div>
                  <label htmlFor="cash-guest-tier" className="mb-1 block text-xs font-bold text-[#0F172A]">
                    Guest Tier
                  </label>
                  <select
                    id="cash-guest-tier"
                    value={cashTierLabel}
                    onChange={(e) => {
                      const nextLabel = e.target.value;
                      setCashTierLabel(nextLabel);
                      const matched = event.tiers.find(
                        (t) => t.label === nextLabel
                      );
                      if (matched) {
                        setCashAmountZar(matched.price_zar * cashSpots);
                      }
                    }}
                    className="w-full rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-3 py-2 text-base sm:text-xs font-semibold text-[#0F172A]"
                  >
                    {event.tiers.map((tier) => (
                      <option key={tier.id} value={tier.label}>
                        {tier.label} ({formatZar(tier.price_zar)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cash-spots-locked" className="mb-1 block text-xs font-bold text-[#0F172A]">
                    Spots Locked
                  </label>
                  <input
                    id="cash-spots-locked"
                    type="number"
                    min={1}
                    max={10}
                    value={cashSpots}
                    onChange={(e) => {
                      const nextSpots = Math.max(1, Number(e.target.value) || 1);
                      setCashSpots(nextSpots);
                      const unitPrice =
                        event.mode === "tiered" && cashTierLabel
                          ? event.tiers?.find((t) => t.label === cashTierLabel)?.price_zar ??
                            event.price_zar
                          : event.price_zar;
                      if (unitPrice > 0) {
                        setCashAmountZar(unitPrice * nextSpots);
                      }
                    }}
                    className="font-mono-num w-full rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-3 py-2 text-base sm:text-sm text-[#0F172A]"
                  />
                </div>
                <div>
                  <label htmlFor="cash-amount-paid" className="mb-1 block text-xs font-bold text-[#0F172A]">
                    Amount Paid (ZAR)
                  </label>
                  <input
                    id="cash-amount-paid"
                    type="number"
                    min={0}
                    value={cashAmountZar}
                    onChange={(e) => setCashAmountZar(Number(e.target.value))}
                    className="font-mono-num w-full rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-3 py-2 text-base sm:text-sm text-[#0F172A]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="cash-wall-note" className="mb-1 block text-xs font-bold text-[#0F172A]">
                  Wall Note (Optional)
                </label>
                <input
                  id="cash-wall-note"
                  type="text"
                  value={cashComment}
                  onChange={(e) => setCashComment(e.target.value)}
                  placeholder="e.g. Paid cash in hand"
                  className="w-full rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-3.5 py-2 text-base sm:text-xs text-[#0F172A] placeholder-[#475569]/60"
                />
              </div>

              {hostActionError && (
                <div className="rounded-xl border border-[#E03C31]/30 bg-[#E03C31]/10 p-3 text-xs font-bold text-[#E03C31]">
                  {hostActionError}
                </div>
              )}

              <button
                type="submit"
                disabled={cashSubmitting || !cashGuestName.trim()}
                className="w-full rounded-full bg-[#007749] py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#005F3A] disabled:opacity-50"
              >
                {cashSubmitting
                  ? "Adding Guest to Wall..."
                  : "+ Lock Cash Guest onto Wall (R0 Fee)"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* HOST MODAL 2: ✏️ EDIT EVENT, DATE, GATE PIN, EMERGENCY SUBS & CANCEL */}
      {showPostponeModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Edit Event Details, Date or Cancel"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/60 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-[#E6E2D8] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E6E2D8] pb-3">
              <h3 className="font-display flex items-center gap-2 text-base font-extrabold text-[#0F172A]">
                <CloudRain className="h-5 w-5 text-[#007749]" />
                <span>✏️ Edit Event, Reschedule or Shortfall Tools</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setHostActionError(null);
                  setShowPostponeModal(false);
                }}
                className="text-[#475569] hover:text-[#0F172A]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-2 text-xs text-[#475569]">
              Update the date, venue, secret gate code, or spot cap without losing locked spots.
            </p>

            <form onSubmit={handlePostponeDate} className="mt-4 space-y-3">
              <div>
                <label htmlFor="postpone-date-input" className="mb-1 block text-xs font-bold text-[#0F172A]">
                  Date &amp; Time Label *
                </label>
                <input
                  id="postpone-date-input"
                  type="text"
                  required
                  value={newEventDateInput}
                  onChange={(e) => setNewEventDateInput(e.target.value)}
                  placeholder="e.g. Next Saturday, 7 Nov • 15:00 SAST"
                  className="w-full rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-3.5 py-2 text-base sm:text-sm text-[#0F172A] focus:border-[#007749] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="edit-location-input" className="mb-1 block text-xs font-bold text-[#0F172A]">
                  Venue / Location Name
                </label>
                <input
                  id="edit-location-input"
                  type="text"
                  value={editLocationInput}
                  onChange={(e) => setEditLocationInput(e.target.value)}
                  placeholder="e.g. Fives Futbol Sandton, Pitch 3"
                  className="w-full rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-3.5 py-2 text-base sm:text-sm text-[#0F172A] focus:border-[#007749] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-pin-input" className="mb-1 block text-xs font-bold text-[#0F172A]">
                    Secret Gate Code / Pin Instructions
                  </label>
                  <input
                    id="edit-pin-input"
                    type="text"
                    value={editSecretPinInput}
                    onChange={(e) => setEditSecretPinInput(e.target.value)}
                    placeholder="e.g. WhatsApp host at boom for code"
                    className="w-full rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-3.5 py-2 text-base sm:text-sm text-[#0F172A] focus:border-[#007749] focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="edit-spots-input" className="mb-1 block text-xs font-bold text-[#0F172A]">
                    Max Spots Cap (Blank = Open)
                  </label>
                  <input
                    id="edit-spots-input"
                    type="number"
                    min={Math.max(1, lockedSpotsCount)}
                    max={500}
                    value={editMaxSpotsInput}
                    onChange={(e) => setEditMaxSpotsInput(e.target.value)}
                    placeholder="e.g. 12"
                    className="w-full rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-3.5 py-2 text-base sm:text-sm text-[#0F172A] focus:border-[#007749] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {hostActionError && (
                <div className="rounded-xl border border-[#E03C31]/30 bg-[#E03C31]/10 p-3 text-xs font-bold text-[#E03C31]">
                  {hostActionError}
                </div>
              )}

              {postponeSuccess && (
                <div className="rounded-xl border border-[#007749]/30 bg-[#007749]/10 p-3 text-xs font-bold text-[#007749] space-y-2">
                  <p>✅ {postponeSuccess}</p>
                  <button
                    type="button"
                    onClick={() => {
                      const origin = typeof window !== "undefined" ? window.location.origin : "https://pullthru.co.za";
                      const msg = `🌧️ *EVENT UPDATE: ${event.title.toUpperCase()}*\n🗓️ New Date/Time: *${event.event_date}*\n📍 Venue: *${event.location_name}*\n\n✅ All locked spots remain 100% valid! Can't make the new time? Open your pass to 1-Tap Swap your spot or request a refund:\n👉 ${origin}/e/${event.slug}`;
                      if (typeof navigator !== "undefined" && navigator.clipboard) {
                        navigator.clipboard.writeText(msg);
                      }
                    }}
                    className="w-full rounded-lg bg-[#007749] px-3 py-1.5 text-[11px] font-extrabold text-white"
                  >
                    📲 Copy Official Reschedule Notice for WhatsApp Group
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={postponeSubmitting || !newEventDateInput.trim()}
                className="w-full rounded-full bg-[#007749] py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#005F3A] disabled:opacity-50"
              >
                {postponeSubmitting
                  ? "Saving Event Changes..."
                  : "Save Event Changes (Preserve Locked Spots)"}
              </button>
            </form>

            {/* Emergency Shortfall Alert & Cancel Event Section */}
            <div className="mt-5 border-t border-[#E6E2D8] pt-4 space-y-2.5">
              <p className="text-[11px] font-black uppercase tracking-wider text-[#64748B]">
                ⚡ Host Turnout Shortfall, Subs &amp; Cancellation Tools
              </p>

              {shortfallSplit && lockedSpotsCount > 0 && shortfallSplit.unfilledSpots > 0 && (
                <button
                  type="button"
                  disabled={lockingSquadHeadcount}
                  onClick={handleLockHeadcountAtCurrentSquad}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#0F172A] px-4 py-2.5 text-xs font-extrabold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  <span>
                    {lockingSquadHeadcount
                      ? "Locking Squad Headcount..."
                      : `🔒 Close Empty Spots & Lock Squad at ${lockedSpotsCount}/${lockedSpotsCount}`}
                  </span>
                </button>
              )}

              {shortfallSplit && lockedSpotsCount > 0 && shortfallSplit.topUpPerSpotZar > 0 && (
                <button
                  type="button"
                  onClick={handleCopyShortfallTopUpSplit}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#007749] bg-emerald-50 px-4 py-2.5 text-xs font-extrabold text-[#007749] hover:bg-emerald-100"
                >
                  <span>
                    {copiedShortfallTopUp
                      ? `✅ Copied +${formatZar(shortfallSplit.topUpPerSpotZar)}/Spot Top-Up Split Message!`
                      : `⚖️ Copy WhatsApp Shortfall Top-Up Split (+${formatZar(shortfallSplit.topUpPerSpotZar)}/spot across ${shortfallSplit.contributingSpotsCount} spots)`}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCopyEmergencyShortfallAlert}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-amber-400 bg-amber-50 px-4 py-2.5 text-xs font-extrabold text-amber-950 hover:bg-amber-100"
              >
                <span>
                  {copiedShortfallAlert
                    ? "✅ Copied 'Urgent Ringers / Subs Needed' WhatsApp Alert!"
                    : "🚨 Copy 'Urgent Subs Needed (Shortfall)' WhatsApp Alert"}
                </span>
              </button>

              {!event.is_cancelled && (
                <button
                  type="button"
                  disabled={postponeSubmitting}
                  onClick={handleCancelEvent}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-xs font-extrabold text-rose-800 hover:bg-rose-100 disabled:opacity-50"
                >
                  <span>🛑 Cancel Event &amp; Log Direct Refunds for Paid Squad</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* HOST MODAL 3: 🔑 UNLOCK HOST ACCESS ON NEW BROWSER / PHONE */}
      {showHostKeyModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Unlock Host Controls"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/60 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-3xl border border-[#E6E2D8] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E6E2D8] pb-3">
              <h3 className="font-display flex items-center gap-2 text-base font-extrabold text-[#0F172A]">
                <Crown className="h-5 w-5 text-[#007749]" />
                <span>🔑 Unlock Host Controls on This Device</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowHostKeyModal(false)}
                className="text-[#475569] hover:text-[#0F172A]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-1.5 rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setHostKeyTab("paste");
                  setHostKeyError(null);
                }}
                className={`rounded-lg py-1.5 transition ${
                  hostKeyTab === "paste"
                    ? "bg-[#0F172A] text-white"
                    : "text-[#475569] hover:text-[#0F172A]"
                }`}
              >
                🔑 Paste Host Key
              </button>
              <button
                type="button"
                onClick={() => {
                  setHostKeyTab("recover");
                  setHostKeyError(null);
                }}
                className={`rounded-lg py-1.5 transition ${
                  hostKeyTab === "recover"
                    ? "bg-[#007749] text-white"
                    : "text-[#475569] hover:text-[#0F172A]"
                }`}
              >
                📲 Recover via Phone
              </button>
            </div>

            {hostKeyTab === "paste" ? (
              <>
                <p className="mt-2.5 text-xs text-[#475569] leading-relaxed">
                  Switched from Safari/Chrome to WhatsApp, or checking guests in on a second phone? Paste your <strong>Private Host Admin Link</strong> or <strong>Host Secret Key</strong> below.
                </p>

                <form onSubmit={handleSaveManualHostKey} className="mt-3 space-y-3">
                  <div>
                    <label htmlFor="manual-host-key" className="mb-1 block text-xs font-bold text-[#0F172A]">
                      Host Secret Key or Admin Link (`?hostToken=...`)
                    </label>
                    <input
                      id="manual-host-key"
                      type="text"
                      required
                      value={manualHostKeyInput}
                      onChange={(e) => setManualHostKeyInput(e.target.value)}
                      placeholder="Paste host-secret-... or full admin URL"
                      className="w-full rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-3.5 py-2.5 text-base sm:text-xs font-mono text-[#0F172A] focus:border-[#007749] focus:bg-white focus:outline-none"
                    />
                  </div>

                  {hostKeyError && (
                    <div className="rounded-xl border border-rose-300 bg-rose-50 p-2.5 text-xs font-bold text-rose-700">
                      {hostKeyError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full rounded-full bg-[#007749] py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#005F3A]"
                  >
                    Unlock Host Controls
                  </button>
                </form>
              </>
            ) : (
              <>
                <p className="mt-2.5 text-xs text-[#475569] leading-relaxed">
                  Lost your Admin Link? Verify your <strong>Host WhatsApp number</strong> plus the <strong>last 4 digits of your linked bank account</strong> (or your secret gate pin / host name for free events).
                </p>

                <form onSubmit={handleRecoverHostAccess} className="mt-3 space-y-3">
                  <div>
                    <label htmlFor="recover-host-phone" className="mb-1 block text-xs font-bold text-[#0F172A]">
                      Host WhatsApp Number *
                    </label>
                    <input
                      id="recover-host-phone"
                      type="tel"
                      required
                      value={recoverHostPhoneInput}
                      onChange={(e) => setRecoverHostPhoneInput(e.target.value)}
                      placeholder="e.g. 082 123 4567"
                      className="w-full rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-3.5 py-2.5 text-base sm:text-xs font-mono text-[#0F172A] focus:border-[#007749] focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="recover-host-secret" className="mb-1 block text-xs font-bold text-[#0F172A]">
                      Last 4 Digits of Bank Account or Secret Gate Code *
                    </label>
                    <input
                      id="recover-host-secret"
                      type="text"
                      required
                      value={recoverHostSecretInput}
                      onChange={(e) => setRecoverHostSecretInput(e.target.value)}
                      placeholder="e.g. 6789 or gate code"
                      className="w-full rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-3.5 py-2.5 text-base sm:text-xs font-mono text-[#0F172A] focus:border-[#007749] focus:bg-white focus:outline-none"
                    />
                  </div>

                  {hostKeyError && (
                    <div className="rounded-xl border border-rose-300 bg-rose-50 p-2.5 text-xs font-bold text-rose-700">
                      {hostKeyError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={recoverHostLoading}
                    className="w-full rounded-full bg-[#007749] py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#005F3A] disabled:opacity-50"
                  >
                    {recoverHostLoading ? "Verifying Host Identity..." : "Recover & Unlock Host Controls"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* GUEST MODAL: 🛡️ BUYER PROTECTION, FIND MY PASS & REFUND / REPORT CENTER */}
      {showProtectionModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="PullThru Buyer Protection, Pass Lookup and Refunds"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/60 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-[#E6E2D8] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E6E2D8] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#007749]" />
                <h3 className="font-display text-base font-extrabold text-[#0F172A]">
                  PullThru Buyer Protection &amp; Self-Service
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowProtectionModal(false)}
                className="text-[#475569] hover:text-[#0F172A]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 3 Segmented Tabs */}
            <div className="mt-3 grid grid-cols-3 gap-1.5 rounded-2xl bg-[#F3F0EA] p-1">
              {[
                { id: "recover" as const, label: "🔍 Find My Pass" },
                { id: "refund" as const, label: "💸 Swap / Refund" },
                { id: "report" as const, label: "🚨 Report Host" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setProtectionTab(t.id);
                    setDisputeErrorMsg(null);
                    setDisputeSuccessMsg(null);
                  }}
                  className={`rounded-xl py-2 text-xs font-extrabold transition ${
                    protectionTab === t.id
                      ? "bg-white text-[#0F172A] shadow-xs"
                      : "text-[#475569] hover:text-[#0F172A]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* TAB 1: FIND MY LOST PASS BY WHATSAPP NUMBER */}
            {protectionTab === "recover" && (
              <div className="mt-4 space-y-3">
                {myUnlockedRsvp && (
                  <div className="rounded-2xl border-2 border-[#007749] bg-emerald-50 p-3.5 text-xs space-y-2">
                    <p className="font-extrabold text-[#007749]">
                      🎟️ Your Pass is Already Saved on This Phone!
                    </p>
                    <p className="text-[#0F172A]">
                      Spot Holder: <strong>{myUnlockedRsvp.guest_name}</strong>
                      {myUnlockedRsvp.gate_pin ? ` • Gate PIN: #${myUnlockedRsvp.gate_pin}` : ""}
                    </p>
                    <Link
                      href={`/e/${event.slug}/success?ref=${encodeURIComponent(
                        myUnlockedRef || `PASS_${myUnlockedRsvp.id}`
                      )}&rsvpId=${encodeURIComponent(myUnlockedRsvp.id)}${
                        myUnlockedRsvp.swap_token
                          ? `&swapToken=${encodeURIComponent(myUnlockedRsvp.swap_token)}`
                          : ""
                      }`}
                      className="inline-flex w-full items-center justify-center rounded-xl bg-[#007749] py-2.5 text-xs font-extrabold text-white hover:bg-[#005F3A] transition"
                    >
                      Open My Boarding Pass &amp; Gate Code →
                    </Link>
                  </div>
                )}

                <div className="rounded-2xl border border-[#007749]/25 bg-emerald-50/60 p-3.5 text-xs text-[#0F172A]">
                  <p className="font-bold">
                    📱 Switched phones or closed your browser tab?
                  </p>
                  <p className="mt-1 text-[#475569]">
                    Enter the WhatsApp number you used when locking in your spot to unlock your QR Boarding Pass, Secret Gate Code, and 1-Tap Spot-Swap link on a new phone.
                  </p>
                </div>

                <form onSubmit={handleRecoverLostPass} className="space-y-3">
                  <div>
                    <label htmlFor="recover-wa-phone" className="mb-1 block text-xs font-bold text-[#0F172A]">
                      WhatsApp Number Used at Checkout *
                    </label>
                    <input
                      id="recover-wa-phone"
                      type="tel"
                      required={event.mode !== "free"}
                      value={recoverPhoneInput}
                      onChange={(e) => setRecoverPhoneInput(e.target.value)}
                      placeholder="e.g. 082 123 4567"
                      className="w-full rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-3.5 py-2.5 text-base sm:text-sm text-[#0F172A] focus:border-[#007749] focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="recover-guest-name" className="mb-1 block text-xs font-bold text-[#0F172A]">
                      Your Name on the Wall (Optional)
                    </label>
                    <input
                      id="recover-guest-name"
                      type="text"
                      value={recoverNameInput}
                      onChange={(e) => setRecoverNameInput(e.target.value)}
                      placeholder="e.g. Siya K"
                      className="w-full rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-3.5 py-2 text-base sm:text-sm text-[#0F172A] focus:border-[#007749] focus:bg-white focus:outline-none"
                    />
                  </div>

                  {recoverError && (
                    <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs font-bold text-rose-700">
                      {recoverError}
                    </div>
                  )}

                  {recoverResult && (
                    <div className="rounded-2xl border border-[#007749]/40 bg-emerald-50 p-3.5 text-xs space-y-2">
                      <p className="font-extrabold text-[#007749]">
                        ✅ {recoverResult.message}
                      </p>
                      <p className="text-[#0F172A]">
                        Spot Holder: <strong>{recoverResult.rsvp.guest_name}</strong>
                        {recoverResult.rsvp.gate_pin ? ` • Gate PIN: #${recoverResult.rsvp.gate_pin}` : ""}
                      </p>
                      <Link
                        href={`/e/${event.slug}/success?ref=${encodeURIComponent(
                          recoverResult.ref || ""
                        )}&rsvpId=${encodeURIComponent(recoverResult.rsvp.id)}${
                          recoverResult.rsvp.swap_token
                            ? `&swapToken=${encodeURIComponent(recoverResult.rsvp.swap_token)}`
                            : ""
                        }`}
                        className="inline-flex w-full items-center justify-center rounded-xl bg-[#007749] py-2.5 text-xs font-extrabold text-white"
                      >
                        Open My Boarding Pass &amp; Gate Code →
                      </Link>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={recoverLoading}
                    className="w-full rounded-full bg-[#007749] py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#005F3A] disabled:opacity-50"
                  >
                    {recoverLoading ? "Searching Paid Ledger..." : "🔍 Find & Unlock My Pass"}
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: SWAP MY SPOT OR REQUEST REFUND */}
            {protectionTab === "refund" && (
              <div className="mt-4 space-y-3 text-xs">
                <div className="rounded-2xl border border-[#E6E2D8] bg-[#FAF8F5] p-3.5 space-y-1.5">
                  <p className="font-extrabold text-[#0F172A]">
                    🇿🇦 How Cancellations, Swaps &amp; Direct Refunds Work:
                  </p>
                  <p className="text-[#475569]">
                    • <strong>Can&apos;t make it last-minute?</strong> Use <strong>1-Tap Spot-Swap</strong> on your pass (`R0` fee) so a sub takes your spot and pays you directly via PayShap without leaving the host short at the venue.
                  </p>
                  <p className="text-[#475569]">
                    • <strong>Event cancelled, postponed, or medical emergency?</strong> Submit a formal refund request below to release your spot on the wall so the organiser ({event.host_name}) can return your contribution directly via PayShap / EFT.
                  </p>
                  <p className="text-[#007749] font-bold">
                    • ⚡ Direct Peer-to-Peer Model: Because you paid 100% directly to {event.host_name}&apos;s bank account with R0 middleman fees, refunds are settled directly between you and the host via PayShap or EFT.
                  </p>
                </div>

                <div>
                  <label htmlFor="refund-token-input" className="mb-1 block font-bold text-[#0F172A]">
                    Your Pass Swap-Token or Payment Ref (`PT-...`) *
                  </label>
                  <input
                    id="refund-token-input"
                    type="text"
                    value={disputeSwapTokenInput}
                    onChange={(e) => setDisputeSwapTokenInput(e.target.value)}
                    placeholder="Auto-filled if pass unlocked, or use 'Find My Pass' first"
                    className="w-full rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-3 py-2 font-mono text-xs text-[#0F172A]"
                  />
                </div>

                <div>
                  <label htmlFor="refund-reason-select" className="mb-1 block font-bold text-[#0F172A]">
                    Reason for Refund Request
                  </label>
                  <select
                    id="refund-reason-select"
                    value={disputeReasonInput}
                    onChange={(e) => setDisputeReasonInput(e.target.value)}
                    className="w-full rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-3 py-2 text-xs font-semibold text-[#0F172A]"
                  >
                    <option value="Event postponed / date changed and I cannot attend">
                      Event postponed / date changed and I cannot attend
                    </option>
                    <option value="Host cancelled the event">
                      Host cancelled the event
                    </option>
                    <option value="CPA Section 17(5) Medical / Bereavement Emergency">
                      CPA Section 17(5) Medical / Bereavement Emergency
                    </option>
                    <option value="Early withdrawal (>48h before kickoff)">
                      Early withdrawal (&gt;48h before kickoff)
                    </option>
                  </select>
                </div>

                {disputeErrorMsg && (
                  <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 font-bold text-rose-700">
                    {disputeErrorMsg}
                  </div>
                )}

                {disputeSuccessMsg && (
                  <div className="rounded-xl border border-[#007749]/40 bg-emerald-50 p-3 font-bold text-[#007749]">
                    {disputeSuccessMsg}
                  </div>
                )}

                <button
                  type="button"
                  disabled={disputeSubmitting}
                  onClick={() => handleSubmitRefundOrDispute(false)}
                  className="w-full rounded-full bg-[#0F172A] py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-black disabled:opacity-50"
                >
                  {disputeSubmitting ? "Processing Refund..." : "💸 Submit Official Refund Request"}
                </button>
              </div>
            )}

            {/* TAB 3: 🚨 REPORT HOST ISSUE / EVENT DISPUTE */}
            {protectionTab === "report" && (
              <div className="mt-4 space-y-3 text-xs">
                <div className="rounded-2xl border border-rose-300 bg-rose-50/70 p-3.5 space-y-1.5 text-rose-950">
                  <p className="font-extrabold">
                    🛑 Report Event Issue or Unresponsive Organiser
                  </p>
                  <p className="text-rose-900 leading-relaxed">
                    Because PullThru is a Pure SaaS coordination tool (R0 Guest Fee), guests pay the organiser&apos;s bank account directly via PayShap / Capitec PayMe. If an organiser cancels without refunding or posts a suspicious event, report it below with your Pass Token so we can flag the event, pause new RSVPs, and generate your formal dispute record.
                  </p>
                </div>

                <div>
                  <label htmlFor="dispute-token-input" className="mb-1 block font-bold text-[#0F172A]">
                    Your Verified Pass Token or Payment Ref (`PT-...`) *
                  </label>
                  <input
                    id="dispute-token-input"
                    type="text"
                    value={disputeSwapTokenInput}
                    onChange={(e) => setDisputeSwapTokenInput(e.target.value)}
                    placeholder="Use 'Find My Pass' tab if not auto-filled"
                    className="w-full rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-3 py-2 font-mono text-xs text-[#0F172A]"
                  />
                </div>

                <div>
                  <label htmlFor="dispute-reason-select" className="mb-1 block font-bold text-[#0F172A]">
                    What went wrong?
                  </label>
                  <select
                    id="dispute-reason-select"
                    value={disputeReasonInput}
                    onChange={(e) => setDisputeReasonInput(e.target.value)}
                    className="w-full rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-3 py-2 text-xs font-semibold text-[#0F172A]"
                  >
                    <option value="Host no-showed / fled / venue booking does not exist">
                      🚨 Host no-showed / venue booking does not exist
                    </option>
                    <option value="Host cancelled the event & hasn't refunded">
                      🛑 Host cancelled the event &amp; hasn&apos;t refunded via PayShap
                    </option>
                    <option value="Suspected cloned or impersonated bereavement / gift pot">
                      ⚠️ Suspected cloned or impersonated bereavement / gift pot
                    </option>
                  </select>
                </div>

                {disputeErrorMsg && (
                  <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 font-bold text-rose-700">
                    {disputeErrorMsg}
                  </div>
                )}

                {disputeSuccessMsg && (
                  <div className="rounded-xl border border-[#007749]/40 bg-emerald-50 p-3 font-bold text-[#007749]">
                    {disputeSuccessMsg}
                  </div>
                )}

                <button
                  type="button"
                  disabled={disputeSubmitting}
                  onClick={() => handleSubmitRefundOrDispute(true)}
                  className="w-full rounded-full bg-[#E03C31] py-3 text-xs font-extrabold uppercase tracking-wider text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {disputeSubmitting
                    ? "Logging Official Dispute..."
                    : "🚨 Report Organiser & Flag Event"}
                </button>

                <div className="pt-2 text-center">
                  <Link
                    href="/help"
                    className="text-[11px] font-bold text-[#007749] underline"
                  >
                    Read Full Buyer Protection, Refund SLA &amp; How-To Guide →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* HOST MODAL 4: ⚡ SETTLE R29 PRO EVENT BOOST / R79 ORGANISER CLUB PASS */}
      {showProBoostModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Unlock R29 Pro Event Boost, Club Pass, or Tournament Pass"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/60 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-3xl border border-[#E6E2D8] bg-white p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E6E2D8] pb-3">
              <h3 className="font-display flex items-center gap-2 text-base font-extrabold text-[#0F172A]">
                <Sparkles className="h-5 w-5 text-[#007749]" />
                <span>⚡ PullThru Pro Software Pass</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowProBoostModal(false)}
                className="rounded-lg p-1 text-[#475569] hover:bg-slate-100 hover:text-[#0F172A]"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 3-Tier Psychological Options */}
            <div className="mt-3.5 space-y-2">
              <div className="grid grid-cols-3 gap-1.5 text-left">
                {/* Tier 1: R29 Once-Off */}
                <button
                  type="button"
                  onClick={() => setProBoostTier("r29")}
                  className={`rounded-2xl border p-2.5 transition flex flex-col justify-between ${
                    proBoostTier === "r29"
                      ? "border-[#007749] bg-emerald-50/70 ring-1 ring-[#007749]"
                      : "border-[#E6E2D8] bg-[#FAF8F5] hover:bg-slate-50"
                  }`}
                >
                  <div>
                    <div className="font-mono-num font-black text-xs sm:text-sm text-[#0F172A]">R29</div>
                    <div className="text-[10px] font-bold text-[#007749] leading-tight mt-0.5">Pro Boost</div>
                  </div>
                  <div className="mt-1 text-[9px] text-[#475569] leading-tight">
                    Once-off for this event (7–100+ spots)
                  </div>
                </button>

                {/* Tier 2: R79/mo or R790/yr (Most Popular) */}
                <button
                  type="button"
                  onClick={() => setProBoostTier(proBoostTier === "r790" ? "r790" : "r79")}
                  className={`rounded-2xl border p-2.5 transition relative flex flex-col justify-between ${
                    proBoostTier === "r79" || proBoostTier === "r790"
                      ? "border-[#007749] bg-emerald-50/70 ring-1 ring-[#007749]"
                      : "border-[#E6E2D8] bg-[#FAF8F5] hover:bg-slate-50"
                  }`}
                >
                  <span className="absolute -top-2 left-2 rounded-full bg-[#007749] px-1.5 py-0.2 text-[8px] font-black uppercase text-white">
                    Popular
                  </span>
                  <div>
                    <div className="font-mono-num font-black text-xs sm:text-sm text-[#0F172A]">
                      {proBoostTier === "r790" ? "R790" : "R79"}
                    </div>
                    <div className="text-[10px] font-bold text-amber-700 leading-tight mt-0.5">
                      Club Pass 👑
                    </div>
                  </div>
                  <div className="mt-1 text-[9px] text-[#475569] leading-tight">
                    {proBoostTier === "r790" ? "Annual • 2 Mo Free" : "Monthly • Unlimited"}
                  </div>
                </button>

                {/* Tier 3: R249 Tournament Pass (High Anchor) */}
                <button
                  type="button"
                  onClick={() => setProBoostTier("r249")}
                  className={`rounded-2xl border p-2.5 transition flex flex-col justify-between ${
                    proBoostTier === "r249"
                      ? "border-[#007749] bg-emerald-50/70 ring-1 ring-[#007749]"
                      : "border-[#E6E2D8] bg-[#FAF8F5] hover:bg-slate-50"
                  }`}
                >
                  <div>
                    <div className="font-mono-num font-black text-xs sm:text-sm text-[#0F172A]">R249</div>
                    <div className="text-[10px] font-bold text-purple-700 leading-tight mt-0.5">
                      Tournament 🏆
                    </div>
                  </div>
                  <div className="mt-1 text-[9px] text-[#475569] leading-tight">
                    Multi-Gate PINs + Custom Sponsor Logo
                  </div>
                </button>
              </div>

              {/* Sub-toggle for Club Pass Monthly vs Annual */}
              {(proBoostTier === "r79" || proBoostTier === "r790") && (
                <div className="flex items-center justify-between rounded-xl bg-[#FAF8F5] border border-[#E6E2D8] p-1.5 text-[11px]">
                  <span className="font-semibold text-[#475569] pl-1.5">Billing Cadence:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setProBoostTier("r79")}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                        proBoostTier === "r79"
                          ? "bg-white text-[#0F172A] shadow-xs border border-slate-200"
                          : "text-[#64748B] hover:text-[#0F172A]"
                      }`}
                    >
                      Monthly (R79/mo)
                    </button>
                    <button
                      type="button"
                      onClick={() => setProBoostTier("r790")}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                        proBoostTier === "r790"
                          ? "bg-[#007749] text-white shadow-xs"
                          : "text-[#007749] hover:bg-emerald-50"
                      }`}
                    >
                      Annual R790/yr (2 Mo Free ✨)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Rail Selector: Yoco vs Direct PayShap */}
            <div className="mt-3.5">
              <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-xs font-bold text-[#475569]">
                <button
                  type="button"
                  onClick={() => setProBoostMethod("yoco")}
                  className={`rounded-lg py-1.5 transition ${
                    proBoostMethod === "yoco"
                      ? "bg-white text-[#0F172A] shadow-xs"
                      : "hover:text-[#0F172A]"
                  }`}
                >
                  ⚡ Instant Card / Apple Pay (Yoco)
                </button>
                <button
                  type="button"
                  onClick={() => setProBoostMethod("payshap")}
                  className={`rounded-lg py-1.5 transition ${
                    proBoostMethod === "payshap"
                      ? "bg-white text-[#0F172A] shadow-xs"
                      : "hover:text-[#0F172A]"
                  }`}
                >
                  📲 Direct PayShap / EFT
                </button>
              </div>

              {proBoostMethod === "yoco" ? (
                <div className="mt-3 rounded-2xl border border-emerald-500/30 bg-emerald-50/40 p-3.5 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[#0F172A] flex items-center gap-1.5">
                      <CreditCard className="h-4 w-4 text-[#007749]" />
                      <span>Instant 1-Tap Yoco Gateway</span>
                    </span>
                    <span className="font-mono-num font-black text-sm text-[#007749]">
                      {proBoostTier === "r29"
                        ? "R29.00"
                        : proBoostTier === "r79"
                        ? "R79.00"
                        : proBoostTier === "r790"
                        ? "R790.00"
                        : "R249.00"}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#475569] leading-relaxed">
                    Powered by <strong>Yoco Technologies (Pty) Ltd</strong>. Settle instantly via Apple Pay, Google Pay, or Visa/Mastercard debit and credit cards. Instant digital pass unlock upon payment.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const sampleRef = `YOCO-${proBoostTier.toUpperCase()}-${event.slug.slice(0, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
                      setProBoostRefInput(sampleRef);
                    }}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-[#007749] py-2.5 text-xs font-extrabold text-white shadow-xs hover:bg-[#005F3A]"
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    <span>
                      Pay{" "}
                      {proBoostTier === "r29"
                        ? "R29.00"
                        : proBoostTier === "r79"
                        ? "R79.00"
                        : proBoostTier === "r790"
                        ? "R790.00"
                        : "R249.00"}{" "}
                      via Yoco 1-Tap →
                    </span>
                  </button>
                </div>
              ) : (
                <div className="mt-3 rounded-2xl border border-[#E6E2D8] bg-[#FAF8F5] p-3.5 text-xs space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-extrabold text-[#0F172A]">
                      Direct Transfer to PullThru SA:
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof navigator !== "undefined" && navigator.clipboard) {
                          navigator.clipboard.writeText(
                            `PullThru SA | FNB (250655) | Acc: 63046857827 | PayShap ID: 0768063638 | Ref: PRO-${event.slug.slice(0, 8).toUpperCase()}`
                          );
                        }
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#007749]/30 bg-white px-2 py-0.5 text-[10px] font-extrabold text-[#007749] hover:bg-emerald-50"
                    >
                      <Copy className="h-3 w-3" />
                      <span>Copy Bank &amp; ShapID</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-[#0F172A] font-mono-num">
                    • <strong>Bank:</strong> FNB (Branch 250655) • <strong>Acc:</strong> 63046857827
                  </p>
                  <p className="text-[11px] text-[#0F172A] font-mono-num">
                    • <strong>PayShap ID (Cell):</strong> <span className="text-[#007749] font-bold">076 806 3638</span>
                  </p>
                  <p className="text-[11px] text-[#0F172A] font-mono-num">
                    • <strong>Ref:</strong>{" "}
                    <span className="text-[#007749] font-bold">
                      PRO-{event.slug.slice(0, 8).toUpperCase()}
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Reference Verification Form */}
            <form onSubmit={handleUnlockProBoost} className="mt-3 space-y-2.5 text-xs">
              <div>
                <label
                  htmlFor="pro-boost-ref-input"
                  className="mb-1 block font-bold text-[#0F172A]"
                >
                  Enter Payment Reference / Bank SMS Confirmation *
                </label>
                <input
                  id="pro-boost-ref-input"
                  type="text"
                  required
                  value={proBoostRefInput}
                  onChange={(e) => setProBoostRefInput(e.target.value)}
                  placeholder={
                    proBoostMethod === "yoco"
                      ? "e.g. YOCO-PRO-729102"
                      : `e.g. PRO-${event.slug.slice(0, 8).toUpperCase()}-PAID`
                  }
                  className="w-full rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-3.5 py-2 font-mono text-xs text-[#0F172A] focus:border-[#007749] focus:bg-white focus:outline-none"
                />
              </div>

              {proBoostError && (
                <div className="rounded-xl border border-rose-300 bg-rose-50 p-2 font-bold text-rose-700">
                  {proBoostError}
                </div>
              )}

              {proBoostSuccess && (
                <div className="rounded-2xl border border-[#007749]/40 bg-emerald-50 p-3 space-y-1.5 font-bold text-[#007749]">
                  <p>{proBoostSuccess}</p>
                  <div className="pt-1 flex items-center justify-between border-t border-[#007749]/20 text-[11px] font-normal text-[#0F172A]">
                    <span>Transaction Status:</span>
                    <span className="font-mono font-bold text-[#007749]">VERIFIED &amp; ACTIVE</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={proBoostSubmitting || !proBoostRefInput.trim()}
                className="w-full rounded-full bg-[#0F172A] py-2.5 text-xs font-extrabold uppercase tracking-wider text-[#FFB81C] hover:bg-slate-800 disabled:opacity-50 transition"
              >
                {proBoostSubmitting
                  ? "Verifying Software Pass..."
                  : `👑 Confirm & Unlock ${
                      proBoostTier === "r29"
                        ? "R29 Pro Event Boost"
                        : proBoostTier === "r79"
                        ? "R79/mo Club Pass"
                        : proBoostTier === "r790"
                        ? "R790/yr Annual Club Pass"
                        : "R249 Tournament Pass"
                    }`}
              </button>
            </form>

            {/* ROI Framing & Solopreneur Guarantee Footnotes */}
            <div className="mt-3.5 pt-3 border-t border-[#E6E2D8] space-y-1 text-[10px] text-[#64748B]">
              <p className="flex items-center gap-1.5">
                <span className="font-bold text-[#007749]">💡 ROI Framing:</span>
                <span>
                  With &ldquo;+R2/spot covers my R29&rdquo; checked, your squad reimburses 100% of this fee automatically.
                </span>
              </p>
              <p className="flex items-center gap-1.5">
                <span className="font-bold text-[#0F172A]">🛡️ Solopreneur Guarantee:</span>
                <span>
                  14-day satisfaction refund window. 1-click self-serve subscription cancellation anytime.
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
