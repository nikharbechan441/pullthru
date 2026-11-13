"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar, { SouthAfricaFlagSvg } from "@/components/Navbar";
import TastefulAdSlot from "@/components/TastefulAdSlot";
import { calculateCheckoutSplit, formatZar, normalizeSaPhone } from "@/lib/fees";
import { BANTER_BADGES, deriveGatePin } from "@/lib/compliance";
import { EventItem, GuestRsvp, Order } from "@/types/database";
import {
  CheckCircle2,
  MapPin,
  Calendar,
  Share2,
  Copy,
  Check,
  RefreshCw,
  ArrowLeft,
  Sparkles,
  Lock,
  Unlock,
  Users,
  ShoppingBag,
  Receipt,
  Zap,
  ArrowUpRight,
  Printer,
  QrCode,
  Smartphone,
} from "lucide-react";

function DeterministicPassQrSvg({ seed }: { seed: string }) {
  // Generate a deterministic 11x11 visual QR matrix with 3 standard finder patterns
  const size = 11;
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  const isFinder = (r: number, c: number) =>
    (r < 3 && c < 3) ||
    (r < 3 && c >= size - 3) ||
    (r >= size - 3 && c < 3);

  const cells: { r: number; c: number }[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (isFinder(r, c)) {
        cells.push({ r, c });
      } else {
        const bitIndex = (r * size + c) % 31;
        const mix = (hash >>> bitIndex) ^ ((r * 7 + c * 13) & 1);
        if ((mix & 1) === 1) {
          cells.push({ r, c });
        }
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="h-14 w-14 shrink-0 rounded-lg border border-[#E6E2D8] bg-white p-1"
      aria-label="PullThru Gate Pass QR Code"
    >
      {cells.map(({ r, c }) => (
        <rect
          key={`${r}-${c}`}
          x={c}
          y={r}
          width={0.9}
          height={0.9}
          rx={0.15}
          fill={isFinder(r, c) ? "#007749" : "#0F172A"}
        />
      ))}
    </svg>
  );
}

function SuccessReceiptContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const refParam = searchParams.get("ref") || "";
  const rsvpIdParam = searchParams.get("rsvpId") || "";
  const swapTokenParam = searchParams.get("swapToken") || "";
  const companyNameParam = searchParams.get("companyName") || "";
  const companyVatParam = searchParams.get("companyVat") || "";

  const [storedCorpInvoice, setStoredCorpInvoice] = useState<{
    companyName?: string;
    companyVat?: string;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && slug) {
      try {
        const raw = localStorage.getItem(`pullthru_corp_invoice_${slug}`);
        if (raw) {
          setStoredCorpInvoice(JSON.parse(raw));
        }
      } catch {
        // ignore
      }
    }
  }, [slug]);

  const effectiveCompanyName =
    companyNameParam || storedCorpInvoice?.companyName || "";
  const effectiveCompanyVat =
    companyVatParam || storedCorpInvoice?.companyVat || "";

  const [event, setEvent] = useState<EventItem | null>(null);
  const [rsvps, setRsvps] = useState<GuestRsvp[]>([]);
  const [order, setOrder] = useState<Order | null>(null);
  const [rsvp, setRsvp] = useState<GuestRsvp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Copy states
  const [copiedWhatsappText, setCopiedWhatsappText] = useState(false);
  const [copiedSwapLink, setCopiedSwapLink] = useState(false);

  // Spot-Swap interactive state
  const [newGuestName, setNewGuestName] = useState("");
  const [newBadgeLabel, setNewBadgeLabel] = useState("");
  const [newComment, setNewComment] = useState("");
  const [unclaimItem, setUnclaimItem] = useState(true);
  const [swapTokenInput, setSwapTokenInput] = useState(swapTokenParam);
  const [showManualTokenField, setShowManualTokenField] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [swapSuccessMessage, setSwapSuccessMessage] = useState<string | null>(null);
  const [swapErrorMessage, setSwapErrorMessage] = useState<string | null>(null);

  // Live SAST clock & anti-screenshot verification + POPIA / Refund self-service state
  const [liveSastTime, setLiveSastTime] = useState<string>("");
  const [togglingPrivacy, setTogglingPrivacy] = useState(false);
  const [refundReasonInput, setRefundReasonInput] = useState("");
  const [submittingRefundAction, setSubmittingRefundAction] = useState(false);
  const [refundActionNotice, setRefundActionNotice] = useState<string | null>(null);
  const [refundActionError, setRefundActionError] = useState<string | null>(null);

  useEffect(() => {
    const updateClock = () => {
      setLiveSastTime(
        new Date().toLocaleTimeString("en-ZA", {
          timeZone: "Africa/Johannesburg",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadReceiptData = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const effectiveRef =
        refParam ||
        (typeof window !== "undefined"
          ? localStorage.getItem(`pullthru_ref_${slug}`) || ""
          : "");
      const effectiveRsvpId =
        rsvpIdParam ||
        (typeof window !== "undefined"
          ? localStorage.getItem(`pullthru_rsvpid_${slug}`) || ""
          : "");

      let storedSwapToken = "";
      if (typeof window !== "undefined" && effectiveRsvpId) {
        try {
          const storedTokens = JSON.parse(
            localStorage.getItem("pullthru_swap_tokens") || "{}"
          );
          if (storedTokens[effectiveRsvpId]) {
            storedSwapToken = String(storedTokens[effectiveRsvpId]);
          }
        } catch {
          // ignore storage errors
        }
      }
      const effectiveSwapToken = storedSwapToken || swapTokenParam;

      const query = new URLSearchParams({ slug });
      if (effectiveRef) query.set("ref", effectiveRef);
      if (effectiveRsvpId) query.set("rsvpId", effectiveRsvpId);
      if (effectiveSwapToken) query.set("swapToken", effectiveSwapToken);

      const res = await fetch(`/api/events?${query.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error("Could not load event receipt details.");
      }
      const raw = await res.json();
      const root = raw?.data || raw;
      const loadedEvent: EventItem | null =
        root?.event || (root?.slug ? root : null);
      const loadedRsvps: GuestRsvp[] = Array.isArray(root?.rsvps)
        ? root.rsvps
        : Array.isArray((loadedEvent as unknown as { rsvps?: GuestRsvp[] })?.rsvps)
        ? (loadedEvent as unknown as { rsvps: GuestRsvp[] }).rsvps
        : [];

      const loadedOrder: Order | null =
        root?.order ||
        (Array.isArray(root?.orders) && effectiveRef
          ? root.orders.find(
              (o: Order) =>
                o.paystack_reference === effectiveRef || o.id === effectiveRef
            ) || null
          : null);

      const matchedRsvp: GuestRsvp | null =
        root?.rsvp ||
        (effectiveRsvpId
          ? loadedRsvps.find((r) => r.id === effectiveRsvpId) || null
          : null) ||
        (loadedOrder
          ? loadedRsvps.find((r) => r.order_id === loadedOrder.id) || null
          : null);

      setEvent(loadedEvent);
      setRsvps(loadedRsvps);
      setOrder(loadedOrder);
      setRsvp(matchedRsvp);

      // Persist to offline cache for load-shedding / zero-connectivity passes
      if (typeof window !== "undefined" && loadedEvent) {
        try {
          localStorage.setItem(
            `pullthru_offline_pass_${slug}`,
            JSON.stringify({
              event: loadedEvent,
              rsvps: loadedRsvps,
              order: loadedOrder,
              rsvp: matchedRsvp,
              cachedAt: Date.now(),
            })
          );
        } catch {
          // ignore storage errors
        }
      }

      if (matchedRsvp) {
        setNewBadgeLabel(matchedRsvp.badge_label || BANTER_BADGES[0]);
        let preferredToken = matchedRsvp.swap_token || "";
        if (!preferredToken && typeof window !== "undefined") {
          try {
            const storedTokens = JSON.parse(
              localStorage.getItem("pullthru_swap_tokens") || "{}"
            );
            if (storedTokens[matchedRsvp.id]) {
              preferredToken = String(storedTokens[matchedRsvp.id]);
            }
          } catch {
            // ignore storage errors
          }
        }
        if (!preferredToken && swapTokenParam) {
          preferredToken = swapTokenParam;
        }
        if (preferredToken) {
          setSwapTokenInput(preferredToken);
        }
      }
    } catch (err) {
      // Offline fallback: Check localStorage
      if (typeof window !== "undefined") {
        try {
          const cached = localStorage.getItem(`pullthru_offline_pass_${slug}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed?.event) {
              setEvent(parsed.event);
              setRsvps(parsed.rsvps || []);
              setOrder(parsed.order || null);
              setRsvp(parsed.rsvp || null);
              setLoading(false);
              return;
            }
          }
        } catch {
          // ignore
        }
      }
      setError(
        err instanceof Error ? err.message : "Failed to load receipt details."
      );
    } finally {
      setLoading(false);
    }
  }, [slug, refParam, rsvpIdParam, swapTokenParam]);

  useEffect(() => {
    loadReceiptData();
  }, [loadReceiptData]);

  // Compute live spot totals (sorted chronologically so #1 First In matches Event Wall)
  const activeRsvps = [...rsvps]
    .filter(
      (r) =>
        r.status === "locked_paid" ||
        r.status === "cash_logged" ||
        r.status === "going_free"
    )
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  const totalLockedSpots = activeRsvps.reduce(
    (sum, r) => sum + (r.spots_locked || 1),
    0
  );
  const spotsLeft =
    event?.max_spots !== null && event?.max_spots !== undefined
      ? Math.max(0, event.max_spots - totalLockedSpots)
      : null;

  // Determine rank index of this RSVP on the wall
  const wallRankIndex = rsvp
    ? activeRsvps.findIndex((r) => r.id === rsvp.id) + 1
    : activeRsvps.length || 1;

  // Compute Direct Peer-to-Peer POP Receipt (R0 Guest Fee) or legacy Order breakdown
  const guestSpots = rsvp?.spots_locked || order?.spots_count || 1;
  const baseZar = order
    ? order.base_price_cents / 100
    : rsvp
    ? rsvp.amount_contributed_zar
    : event?.price_zar || 0;

  let splitBaseZar = baseZar;
  let splitFeeZar = 0;
  let splitTotalZar = baseZar;

  if (order) {
    splitBaseZar = order.base_price_cents / 100;
    splitFeeZar = order.platform_fee_cents / 100;
    splitTotalZar = order.total_charged_cents / 100;
  } else {
    // Pure SaaS Direct PayShap / Capitec PayMe / EFT: R0.00 Guest Fee
    splitBaseZar = baseZar;
    splitFeeZar = 0;
    splitTotalZar = baseZar;
  }

  const displayGuestName = rsvp?.guest_name || order?.buyer_name || "Legend";
  const displayBadge =
    rsvp?.badge_label ||
    (rsvp?.status === "going_free" || splitTotalZar === 0
      ? "🎉 Pulling Thru! (Confirmed RSVP)"
      : "💳 Paid Before Payday (Big Flex)");
  const displayBringItem = rsvp?.claimed_item_label || null;
  const displayPaymentChannel = (() => {
    if (rsvp?.status === "going_free" || splitTotalZar === 0) {
      return "Free RSVP";
    }
    if (rsvp?.pop_rail_badge) {
      switch (rsvp.pop_rail_badge) {
        case "instant_payshap":
          return "Instant PayShap";
        case "capitec_payme":
          return "Capitec PayMe";
        case "standard_eft":
          return "Standard EFT";
      }
    }
    const ch = String(
      rsvp?.payment_channel || order?.payment_channel || "capitec_pay"
    );
    if (
      ch === "payshap" ||
      rsvp?.badge_label === "📲 PayShap Sent" ||
      refParam.startsWith("PAYSHAP_")
    ) {
      return "Direct PayShap to Host";
    }
    switch (ch) {
      case "capitec_pay":
        return "Direct PayShap / Capitec PayMe";
      case "eft":
      case "ozow_eft":
        return "Instant EFT / PayShap";
      case "apple_pay":
        return "Apple Pay";
      case "card":
        return "Debit / Credit Card";
      case "cash_manual":
      case "cash":
        return "Cash on Arrival";
      default:
        return ch.replace(/_/g, " ");
    }
  })();
  const isPayShapRsvp = Boolean(
    rsvp?.badge_label === "📲 PayShap Sent" ||
      rsvp?.payment_channel === "payshap" ||
      refParam.startsWith("PAYSHAP_")
  );
  const isPayShapPending = Boolean(
    rsvp?.status === "cash_logged" && !rsvp?.checked_in && isPayShapRsvp
  );
  const isCashPending = Boolean(
    rsvp?.status === "cash_logged" && !rsvp?.checked_in && !isPayShapRsvp
  );
  const cleanHostPayShapPhone = event?.host_phone
    ? event.host_phone.replace(/\D/g, "").replace(/^27(\d{9})$/, "0$1") ||
      event.host_phone
    : "";
  const payShapRefCode = `PT-${
    displayGuestName
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .slice(0, 10) || "GUEST"
  }`;
  const displayPlusOnes =
    rsvp?.plus_one_names?.length
      ? rsvp.plus_one_names
      : order?.plus_one_names || [];
  const receiptRef =
    order?.paystack_reference ||
    refParam ||
    `PT_ZA_${(rsvp?.id || "VERIFIED").slice(0, 8).toUpperCase()}`;

  const appOrigin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://pullthru.co.za";
  const cacheBustedEventUrl = `${appOrigin}/e/${slug}?v=${totalLockedSpots}`;

  const spotsLeftPhrase =
    spotsLeft !== null
      ? spotsLeft === 0
        ? "🔥 FULL CAPACITY LOCKED!"
        : `⚡ Only ${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left!`
      : `🔥 ${totalLockedSpots} locked in so far!`;

  const bringPhrase = displayBringItem
    ? `\n🧊 Bringing: ${displayBringItem}`
    : "";

  const isStandbyPledge = rsvp?.status === "payday_promise";
  const whatsappReceiptMessage = isStandbyPledge
    ? `🗓️ I've logged my Payday Standby pledge for *${
        event?.title || "the session"
      }*!${bringPhrase}\n` +
      `${spotsLeftPhrase} — grab your spot here:\n` +
      `${cacheBustedEventUrl}`
    : `✅ I'm locked in (#${wallRankIndex || 1} on the wall) for *${
        event?.title || "the session"
      }*!${bringPhrase}\n` +
      `${spotsLeftPhrase} — grab your spot here:\n` +
      `${cacheBustedEventUrl}`;

  const whatsappShareHref = `https://wa.me/?text=${encodeURIComponent(
    whatsappReceiptMessage
  )}`;

  const personalPassMessage =
    `🎟️ *MY PRIVATE PULLTHRU PASS — ${(event?.title || "EVENT").toUpperCase()}*\n` +
    `📍 ${event?.location_name || "Venue"} • 🗓️ ${event?.event_date || "Date"}\n` +
    (event?.secret_location_pin
      ? `🔑 *Secret Gate / Boom PIN:* ${event.secret_location_pin}\n`
      : "") +
    `Pass Link: ${appOrigin}/e/${slug}/success?ref=${encodeURIComponent(
      receiptRef
    )}&rsvpId=${encodeURIComponent(rsvp?.id || "")}`;
  // Read stored guest phone for 1-tap WhatsApp "Message Yourself"
  const storedBuyerPhone = typeof window !== "undefined"
    ? (() => {
        try {
          const raw = localStorage.getItem("pullthru_guest_profile");
          return raw ? JSON.parse(raw)?.buyerWhatsapp || "" : "";
        } catch {
          return "";
        }
      })()
    : "";

  const personalPassWhatsappHref = storedBuyerPhone
    ? `https://wa.me/${normalizeSaPhone(storedBuyerPhone)}?text=${encodeURIComponent(
        personalPassMessage
      )}`
    : `https://wa.me/?text=${encodeURIComponent(personalPassMessage)}`;

  const effectiveSwapToken = swapTokenInput || rsvp?.swap_token || "";
  const swapUrl = rsvp
    ? `${appOrigin}/e/${slug}/success?ref=${encodeURIComponent(
        receiptRef
      )}&rsvpId=${encodeURIComponent(rsvp.id)}&swapToken=${encodeURIComponent(
        effectiveSwapToken
      )}`
    : "";

  const spotPriceFormatted =
    order && order.base_price_cents
      ? formatZar(order.base_price_cents / 100)
      : rsvp && typeof rsvp.amount_contributed_zar === "number"
      ? rsvp.amount_contributed_zar > 0
        ? formatZar(rsvp.amount_contributed_zar)
        : "R0.00 (Free Spot)"
      : event?.price_zar
      ? formatZar(event.price_zar)
      : "";

  const gatePinCode = rsvp
    ? rsvp.gate_pin || deriveGatePin(rsvp.swap_token || rsvp.id)
    : null;

  const handleTogglePrivacy = async () => {
    if (!rsvp || !event) return;
    setTogglingPrivacy(true);
    try {
      const tokenToUse = swapTokenInput.trim() || rsvp.swap_token || "";
      const res = await fetch("/api/rsvp", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_privacy",
          slug,
          eventId: event.id,
          rsvpId: rsvp.id,
          swapToken: tokenToUse,
          isAnonymous: !rsvp.is_anonymous_on_wall,
        }),
      });
      const data = await res.json();
      if (res.ok && data?.rsvp) {
        setRsvp(data.rsvp);
      }
    } catch {
      // ignore
    } finally {
      setTogglingPrivacy(false);
    }
  };

  const handleSelfServeRefundOrDispute = async (
    actionType: "request_refund" | "report_dispute"
  ) => {
    if (!rsvp || !event) return;
    setSubmittingRefundAction(true);
    setRefundActionError(null);
    setRefundActionNotice(null);
    try {
      const tokenToUse = swapTokenInput.trim() || rsvp.swap_token || "";
      const res = await fetch("/api/rsvp", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionType,
          slug,
          eventId: event.id,
          rsvpId: rsvp.id,
          swapToken: tokenToUse,
          reason:
            refundReasonInput.trim() ||
            (actionType === "report_dispute"
              ? "Host no-show / venue issue reported from pass"
              : "Guest requested refund from digital pass"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Could not process request.");
      }
      if (data?.rsvp) setRsvp(data.rsvp);
      if (data?.event) setEvent(data.event);
      setRefundActionNotice(
        data?.message ||
          "Logged! Your spot has been released so the host can return your contribution via PayShap / EFT."
      );
      setRefundReasonInput("");
    } catch (err) {
      setRefundActionError(
        err instanceof Error ? err.message : "Failed to submit request."
      );
    } finally {
      setSubmittingRefundAction(false);
    }
  };

  const swapWhatsappMessage =
    `🔄 *Howzit! Take my spot for ${event?.title || "the session"}!* 🇿🇦\n` +
    `I have a locked spot on ${event?.event_date || "the day"} at ${
      event?.location_name || "the venue"
    }, but I can no longer make it.\n\n` +
    (spotPriceFormatted
      ? `💰 *Spot Value:* ${spotPriceFormatted} — Please EFT / Capitec Pay me back directly.\n`
      : "") +
    `👉 Tap this link to transfer my spot to your name on the squad wall (R0 transfer fee):\n` +
    `${swapUrl}`;
  const swapWhatsappHref = `https://wa.me/?text=${encodeURIComponent(
    swapWhatsappMessage
  )}`;

  const handleCopyWhatsappText = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(whatsappReceiptMessage);
      setCopiedWhatsappText(true);
      setTimeout(() => setCopiedWhatsappText(false), 2500);
    }
  };

  const handleCopySwapLink = () => {
    if (!rsvp || typeof window === "undefined") return;
    const token = swapTokenInput || rsvp.swap_token || "";
    const url = `${window.location.origin}/e/${slug}/success?ref=${encodeURIComponent(
      receiptRef
    )}&rsvpId=${encodeURIComponent(rsvp.id)}&swapToken=${encodeURIComponent(
      token
    )}`;
    navigator.clipboard.writeText(url);
    setCopiedSwapLink(true);
    setTimeout(() => setCopiedSwapLink(false), 2500);
  };

  const handleSwapSpot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvp || !newGuestName.trim()) return;

    setSwapping(true);
    setSwapErrorMessage(null);
    setSwapSuccessMessage(null);

    try {
      const tokenToUse = swapTokenInput.trim() || rsvp.swap_token;
      const res = await fetch("/api/rsvp", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "swap_spot",
          slug,
          eventId: event?.id,
          event_id: event?.id,
          rsvpId: rsvp.id,
          rsvp_id: rsvp.id,
          swapToken: tokenToUse,
          swap_token: tokenToUse,
          newGuestName: newGuestName.trim(),
          new_guest_name: newGuestName.trim(),
          guestName: newGuestName.trim(),
          guest_name: newGuestName.trim(),
          newBadgeLabel: newBadgeLabel || rsvp.badge_label,
          new_badge_label: newBadgeLabel || rsvp.badge_label,
          badge_label: newBadgeLabel || rsvp.badge_label,
          newComment: newComment.trim() || rsvp.comment,
          new_comment: newComment.trim() || rsvp.comment,
          comment: newComment.trim() || rsvp.comment,
          unclaimItem,
          unclaim_item: unclaimItem,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data?.error || "Could not swap spot. Check your swap token."
        );
      }

      if (data?.event) {
        setEvent(data.event);
      }

      const updatedRsvp: GuestRsvp = data?.rsvp || {
        ...rsvp,
        guest_name: newGuestName.trim(),
        badge_label: newBadgeLabel || rsvp.badge_label,
        comment: newComment.trim() || rsvp.comment,
        claimed_item_id: unclaimItem ? null : rsvp.claimed_item_id,
        claimed_item_label: unclaimItem ? null : rsvp.claimed_item_label,
      };

      setRsvp(updatedRsvp);
      setRsvps((prev) =>
        prev.map((item) => (item.id === updatedRsvp.id ? updatedRsvp : item))
      );
      if (updatedRsvp.swap_token) {
        setSwapTokenInput(updatedRsvp.swap_token);
        if (typeof window !== "undefined") {
          try {
            const storedTokens = JSON.parse(
              localStorage.getItem("pullthru_swap_tokens") || "{}"
            );
            storedTokens[updatedRsvp.id] = updatedRsvp.swap_token;
            localStorage.setItem(
              "pullthru_swap_tokens",
              JSON.stringify(storedTokens)
            );
            const rawUnlocked = localStorage.getItem(
              "pullthru_unlocked_events"
            );
            const unlockedList: string[] = rawUnlocked
              ? JSON.parse(rawUnlocked)
              : [];
            if (slug && !unlockedList.includes(slug)) {
              unlockedList.push(slug);
              localStorage.setItem(
                "pullthru_unlocked_events",
                JSON.stringify(unlockedList)
              );
            }
            if (slug) {
              localStorage.setItem(`pullthru_rsvpid_${slug}`, updatedRsvp.id);
              if (receiptRef) {
                localStorage.setItem(`pullthru_ref_${slug}`, receiptRef);
              }
            }
            const nextUrl = new URL(window.location.href);
            nextUrl.searchParams.set("rsvpId", updatedRsvp.id);
            nextUrl.searchParams.set("swapToken", updatedRsvp.swap_token);
            window.history.replaceState({}, "", nextUrl.toString());
          } catch {
            // ignore storage errors
          }
        }
      }
      setUnclaimItem(false);
      setSwapSuccessMessage(
        `Spot #${wallRankIndex || 1} officially transferred to ${
          updatedRsvp.guest_name
        }! Zero refund fees lost.`
      );
      setNewGuestName("");
      setNewComment("");
    } catch (err) {
      setSwapErrorMessage(
        err instanceof Error ? err.message : "Spot swap failed."
      );
    } finally {
      setSwapping(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#0F172A]">
        <Navbar />
        <main className="mx-auto max-w-xl px-4 py-20 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#007749] border-t-transparent" />
          <p className="font-display text-lg font-extrabold text-[#0F172A]">
            Generating Certified PullThru Boarding Pass...
          </p>
          <p className="mt-1 text-sm text-[#475569]">
            Verifying your Direct PayShap / POP spot &amp; unlocking secret location pin
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
            <div className="mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
              <Receipt className="h-6 w-6" />
            </div>
            <h1 className="font-display text-xl font-extrabold text-[#0F172A]">
              Pass or Receipt Not Found
            </h1>
            <p className="mt-2 text-sm text-[#475569]">
              {error || "We could not find an active boarding pass with this reference."}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={slug ? `/e/${slug}` : "/"}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#007749] px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#005F3A]"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Event Wall</span>
              </Link>
              <Link
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-[#E6E2D8] bg-[#FAF8F5] px-5 py-2.5 text-sm font-semibold text-[#0F172A] hover:bg-slate-100 transition"
              >
                <span>Browse Live Events</span>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const formattedDate = (() => {
    if (!event.event_date) return "Upcoming Session";
    const parsed = new Date(event.event_date);
    if (isNaN(parsed.getTime())) return event.event_date;
    return parsed.toLocaleDateString("en-ZA", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  })();

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#0F172A] pb-16">
      <Navbar />

      <main className="max-w-7xl mx-auto px-5 sm:px-8 pt-6">
        {/* Back link to Event Wall */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
          <Link
            href={`/e/${slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#475569] transition hover:text-[#007749]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>
              Back to Live Event Wall (
              <span className="font-mono-num">{totalLockedSpots}</span> Locked In)
            </span>
          </Link>
          <span className="font-mono-num rounded-full border border-[#E6E2D8] bg-white px-3 py-1 text-[11px] font-bold text-[#0F172A] shadow-xs">
            Ref: {receiptRef}
          </span>
        </div>

        {/* Spot-Swap Claim Callout Banner when swapToken is in URL */}
        {Boolean(swapTokenParam && rsvp && rsvp.status !== "refunded") && (
          <div className="mb-5 rounded-3xl border-2 border-[#007749] bg-gradient-to-r from-emerald-50 via-teal-50 to-white p-4 sm:p-5 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#007749] text-white text-lg font-black shadow-xs">
                  🔄
                </span>
                <div>
                  <h3 className="font-display text-sm sm:text-base font-black text-[#0F172A]">
                    You have been invited to take {displayGuestName}&apos;s spot!
                  </h3>
                  <p className="text-xs text-[#475569] mt-0.5">
                    Enter your name in the Spot-Swap form below to transfer this official boarding pass into your name.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("swap-transfer-section");
                  el?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="rounded-full bg-[#007749] px-4 py-2 text-xs font-black text-white hover:bg-[#005F3A] transition shadow-xs"
              >
                Claim This Spot Now ↓
              </button>
            </div>
          </div>
        )}

        {/* 2-COLUMN DESKTOP GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN (lg:col-span-7): BOARDING-PASS STYLE CERTIFIED RECEIPT CARD */}
          <section className="lg:col-span-7 print:col-span-12 relative overflow-hidden rounded-3xl border border-[#E6E2D8] bg-white p-5 sm:p-6 shadow-lg shadow-black/[0.03] print:shadow-none">
            {/* Header Stamp */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#007749] text-white shadow-xs">
                  <CheckCircle2 className="h-6 w-6 stroke-[2.4]" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#007749]">
                      {isPayShapPending
                        ? "📲 SPOT LOCKED! SEND PAYSHAP TO HOST"
                        : isCashPending
                        ? "⏳ CASH ON ARRIVAL • PENDING HOST HANDOVER"
                        : rsvp?.status === "payday_promise"
                        ? "🗓️ PAYDAY STANDBY PLEDGE • SETTLE BY 25TH"
                        : "CERTIFIED LOCKED IN • GEEN KANSVATTER"}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#FFB81C] bg-[#FFB81C]/20 px-2 py-0.5 text-[10px] font-bold uppercase text-[#0F172A]">
                      <SouthAfricaFlagSvg className="h-2.5 w-4" />
                      <span>
                        {isPayShapPending
                          ? "PAYSHAP LOCKED"
                          : isCashPending
                          ? "CASH STANDBY"
                          : "OFFICIAL PASS"}
                      </span>
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-[#475569]">
                    {isPayShapPending
                      ? `Your spot is locked on the Squad Wall • Send ${formatZar(splitTotalZar)} via PayShap to ${event.host_name} below`
                      : isCashPending
                      ? "Spot reserved for Cash on Arrival • Host marks paid when you hand over cash at the session"
                      : "Official PullThru.co.za Digital Boarding Pass • Verified Direct Peer-to-Peer Pass"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-2xl border border-[#E6E2D8] bg-[#FAF8F5] px-3.5 py-2">
                <div className="text-right">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-[#475569]">
                    SCAN AT GATE • PASS #{wallRankIndex || 1}
                  </span>
                  <span className="font-mono-num text-base font-extrabold text-[#0F172A]">
                    #{wallRankIndex || 1}{" "}
                    {wallRankIndex === 1 ? "🥇 First In!" : "⚡ Locked"}
                  </span>
                  <span className="font-mono-num block text-[10px] font-semibold text-[#007749]">
                    {receiptRef}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <DeterministicPassQrSvg
                    seed={`${slug}-${receiptRef}-${rsvp?.id || wallRankIndex}`}
                  />
                  <span className="text-[9px] font-semibold text-[#007749] mt-0.5">
                    ✓ Cached offline
                  </span>
                </div>
              </div>
            </div>

            {/* Perforated Boarding-Pass Divider */}
            <div className="my-1 border-t-2 border-dashed border-[#E6E2D8]" />

            {/* Live Anti-Screenshot Gate Verification Banner */}
            <div
              className={`mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-4 py-2.5 text-xs ${
                rsvp?.checked_in
                  ? "border-amber-400 bg-amber-50 text-amber-950"
                  : rsvp?.status === "refunded"
                  ? "border-rose-300 bg-rose-50 text-rose-900"
                  : "border-[#007749]/25 bg-[#007749]/[0.06] text-[#0F172A]"
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${
                    rsvp?.checked_in
                      ? "bg-amber-600"
                      : rsvp?.status === "refunded"
                      ? "bg-rose-600"
                      : "animate-pulse bg-[#007749]"
                  }`}
                />
                <span>
                  {rsvp?.checked_in
                    ? "✅ ALREADY CHECKED IN AT GATE — PASS REDEEMED"
                    : rsvp?.status === "refunded"
                    ? "💸 REFUNDED — PASS CANCELLED"
                    : rsvp?.status === "payday_promise"
                    ? "⏳ STANDBY PLEDGE — UNPAID (SETTLE BEFORE ENTRY)"
                    : "🛡️ LIVE ANTI-SCREENSHOT GATE PASS"}
                </span>
              </div>
              <div className="flex items-center gap-2.5 font-mono-num text-[11px] font-bold">
                {gatePinCode && (
                  <span className="rounded-lg border border-[#007749]/30 bg-white px-2.5 py-0.5 text-[#007749]">
                    🔑 Gate PIN: #{gatePinCode}
                  </span>
                )}
                {liveSastTime && (
                  <span className="text-[#475569]">SAST {liveSastTime}</span>
                )}
              </div>
            </div>

            {/* Guest Identity & Event Summary */}
            <div className="mt-5 space-y-4">
              {isPayShapRsvp && splitTotalZar > 0 && (
                <div className="rounded-2xl border-2 border-[#007749] bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/40 p-4 sm:p-5 shadow-xs space-y-3 print:hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#007749] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                        📲 Step 2: Pay Host Directly via PayShap (R0 Fee)
                      </span>
                      <h3 className="font-display mt-1.5 text-base sm:text-lg font-extrabold text-[#0F172A]">
                        Send {formatZar(splitTotalZar)} to {event.host_name}
                      </h3>
                    </div>
                    <span className="font-mono-num rounded-xl border border-[#007749]/30 bg-white px-3 py-1.5 text-sm font-black text-[#007749]">
                      {formatZar(splitTotalZar)}
                    </span>
                  </div>

                  <div className="rounded-xl border border-[#E6E2D8] bg-white p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <p className="text-[#475569]">
                        PayShap Cell #:{" "}
                        <strong className="font-mono-num text-[#0F172A]">
                          {cleanHostPayShapPhone || "Ask host in WhatsApp"}
                        </strong>
                      </p>
                      <p className="text-[#475569] font-mono-num text-[11px]">
                        Reference:{" "}
                        <strong className="text-[#007749]">{payShapRefCode}</strong>{" "}
                        • Bank: <strong>{event.host_bank_name || "SA Bank"}</strong>
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {cleanHostPayShapPhone && (
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof navigator !== "undefined" && navigator.clipboard) {
                              navigator.clipboard.writeText(cleanHostPayShapPhone);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#007749] px-3.5 py-2 text-xs font-extrabold text-white shadow-2xs hover:bg-[#005F3A] transition"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy PayShap #: {cleanHostPayShapPhone}</span>
                        </button>
                      )}
                      {Boolean(event.capitec_payme_url) && (
                        <a
                          href={event.capitec_payme_url!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[#007749] bg-emerald-50 px-3 py-2 text-xs font-extrabold text-[#007749] hover:bg-emerald-100 transition"
                        >
                          <Smartphone className="h-3.5 w-3.5" />
                          <span>Open Capitec PayMe ↗</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-[#475569]">
                    ⚡ Your spot is already locked on the Squad Wall! Open your banking app, PayShap{" "}
                    <strong>{formatZar(splitTotalZar)}</strong> to{" "}
                    <strong>{cleanHostPayShapPhone || event.host_name}</strong>, and {event.host_name} will tap{" "}
                    <strong className="text-[#007749]">✅ Mark PayShap Paid</strong> (which also unlocks any secret gate PIN).
                  </p>
                </div>
              )}

              <div className="rounded-2xl border border-[#E6E2D8] bg-[#FAF8F5] p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                      Guest Locked On Wall
                    </span>
                    <h1 className="font-display mt-0.5 text-2xl font-extrabold text-[#0F172A] sm:text-3xl">
                      {displayGuestName}
                    </h1>
                    {displayPlusOnes.length > 0 && (
                      <p className="mt-1 text-xs font-semibold text-[#007749]">
                        + Guests: {displayPlusOnes.join(", ")} (
                        <span className="font-mono-num">{guestSpots}</span> spots
                        total)
                      </p>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-1 rounded-full border border-[#E6E2D8] bg-white px-3 py-1.5 text-xs font-bold text-[#0F172A] shadow-xs">
                    {displayBadge}
                  </span>
                </div>

                {rsvp?.comment && (
                  <p className="mt-3 rounded-xl border border-[#E6E2D8] bg-white px-3.5 py-2 text-xs italic text-[#475569]">
                    &ldquo;{rsvp.comment}&rdquo;
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="font-mono-num inline-flex items-center gap-1.5 rounded-full border border-[#E6E2D8] bg-white px-3 py-1 text-xs font-bold text-[#0F172A]">
                    <Users className="h-3.5 w-3.5 text-[#007749]" />
                    {guestSpots} {guestSpots === 1 ? "Spot" : "Spots"} Locked
                  </span>
                  {rsvp?.tier_label && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#E6E2D8] bg-[#F3F0EA] px-3 py-1 text-xs font-semibold text-[#0F172A]">
                      🎟️ {rsvp.tier_label}
                    </span>
                  )}
                  {displayBringItem && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#007749]/25 bg-[#007749]/10 px-3 py-1 text-xs font-bold text-[#007749]">
                      <ShoppingBag className="h-3.5 w-3.5" />
                      <span>Bringing: {displayBringItem}</span>
                    </span>
                  )}
                  {rsvp && (
                    <button
                      type="button"
                      disabled={togglingPrivacy}
                      onClick={handleTogglePrivacy}
                      className="inline-flex items-center gap-1 rounded-full border border-[#E6E2D8] bg-white px-3 py-1 text-xs font-bold text-[#475569] hover:border-[#007749] hover:text-[#007749] transition cursor-pointer"
                    >
                      <Lock className="h-3 w-3" />
                      <span>
                        {rsvp.is_anonymous_on_wall
                          ? "🔒 Hidden on Public Wall (Tap to Show Name)"
                          : "👁️ Visible on Wall (Tap to Hide My Name — POPIA)"}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Event Details & Unlocked Secret Location Pin */}
              <div className="rounded-2xl border border-[#E6E2D8] bg-white p-4 sm:p-5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#007749]">
                    {event.category_vibe}
                  </span>
                  <span className="text-xs text-[#475569]">
                    Host:{" "}
                    <strong className="text-[#0F172A]">{event.host_name}</strong>
                  </span>
                </div>
                <h2 className="font-display text-lg font-extrabold text-[#0F172A]">
                  {event.title}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-[#475569]">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-[#007749]" />
                    <span>{formattedDate}</span>
                  </span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      event.location_name
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 hover:text-[#007749] transition group"
                  >
                    <MapPin className="h-3.5 w-3.5 text-[#007749]" />
                    <span className="group-hover:underline">{event.location_name}</span>
                    <span className="text-[10px] rounded-md bg-[#007749]/10 text-[#007749] px-1 py-0.2 font-bold">
                      Maps ↗
                    </span>
                  </a>
                </div>

                {/* Secret Location Pin Unlocked Box */}
                {event.secret_location_pin && (
                  <div className="mt-2 rounded-xl border border-[#007749]/30 bg-[#007749]/[0.06] p-3.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#007749]">
                      <Unlock className="h-4 w-4 text-[#007749]" />
                      <span>SECRET GATE CODE / EXACT PIN UNLOCKED:</span>
                    </div>
                    <p className="font-mono-num mt-1 text-sm font-bold text-[#0F172A]">
                      {event.secret_location_pin}
                    </p>
                  </div>
                )}
              </div>

              {/* Perforated Boarding-Pass Divider */}
              <div className="my-2 border-t-2 border-dashed border-[#E6E2D8]" />

              {/* Direct Peer-to-Peer POP Receipt Breakdown */}
              <div className="rounded-2xl border border-[#E6E2D8] bg-[#F3F0EA] p-4 sm:p-5">
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                    <Receipt className="h-3.5 w-3.5 text-[#007749]" />
                    <span>Direct Peer-to-Peer POP Receipt</span>
                  </span>
                  <span className="text-[11px] font-bold text-[#007749]">
                    {event.host_bank_name || "SA Bank"} • Direct to Host
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[#475569]">
                    <span>
                      Spot Contribution (100% Direct to Host {event.host_name})
                    </span>
                    <span className="font-mono-num font-bold text-[#0F172A]">
                      {formatZar(splitBaseZar)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#475569]">
                    <span>
                      PullThru Guest Booking Fee
                    </span>
                    <span className="font-mono-num font-bold text-[#007749]">
                      {splitFeeZar === 0 ? "R0.00 (Free)" : formatZar(splitFeeZar)}
                    </span>
                  </div>
                  <div className="my-1.5 border-t border-[#E6E2D8] pt-2 flex items-center justify-between text-sm font-extrabold text-[#007749]">
                    <span>
                      {isPayShapPending || isCashPending
                        ? `Total Due to Host (${displayPaymentChannel})`
                        : `Total Settled (${displayPaymentChannel})`}
                    </span>
                    <span className="font-mono-num">{formatZar(splitTotalZar)}</span>
                  </div>
                </div>

                <p className="mt-2.5 text-[10px] leading-relaxed text-[#475569]">
                  PullThru charges R0.00 guest booking fees on direct PayShap/cash spots and never holds your money — 100% of your contribution goes straight to {event.host_name} ({event.host_bank_name || "SA Bank"}).
                </p>
              </div>
            </div>

            {/* Primary Green Viral CTA: 1-Tap Drop in WhatsApp Group */}
            <div className="mt-5 space-y-2.5 print:hidden">
              <a
                href={whatsappShareHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#007749] px-6 py-4 text-center text-base font-bold text-white shadow-sm transition hover:bg-[#005F3A] active:scale-[0.99]"
              >
                <Share2 className="h-5 w-5 stroke-[2.2]" />
                <span>📲 Tell the Squad You&apos;re In! (Drop in WhatsApp)</span>
              </a>
              <p className="text-center text-[11px] text-[#475569]">
                Fills remaining spots faster &amp; lets the squad know you&apos;ve locked your spot 🔥
              </p>

              {/* Optional Personal Gate Pass WhatsApp Button (Issue 1) */}
              {Boolean(event.secret_location_pin) && (
                <a
                  href={personalPassWhatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-900 transition hover:bg-emerald-100"
                >
                  <Smartphone className="h-4 w-4 text-[#007749]" />
                  <span>📲 Send Secret Gate PIN &amp; Pass to My WhatsApp</span>
                </a>
              )}

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleCopyWhatsappText}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-[#E6E2D8] bg-[#FAF8F5] px-4 py-2.5 text-xs font-bold text-[#0F172A] transition hover:border-[#007749] hover:bg-white"
                >
                  {copiedWhatsappText ? (
                    <>
                      <Check className="h-4 w-4 text-[#007749]" />
                      <span className="text-[#007749]">
                        Copied WhatsApp Hype Text!
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 text-[#475569]" />
                      <span>
                        Copy Hype Text (?v=
                        <span className="font-mono-num">{totalLockedSpots}</span>)
                      </span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined") window.print();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-[#E6E2D8] bg-[#FAF8F5] px-4 py-2.5 text-xs font-bold text-[#0F172A] transition hover:border-[#007749] hover:bg-white"
                >
                  <Printer className="h-4 w-4 text-[#007749]" />
                  <span>🖨️ Print / Save PDF Pass</span>
                </button>
              </div>

              {/* Compact Viral Host Bridge directly below Boarding Pass */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#007749]/25 bg-[#007749]/[0.05] px-3.5 py-2.5 print:hidden">
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-[#0F172A]">
                    ⚡ Organising the next braai, game, or birthday pot?
                  </p>
                  <p className="text-[11px] text-[#475569]">
                    Clone this setup in 10s • R0 guest fees • Instant SA payout
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Link
                    href={`/create?clone=${slug}`}
                    className="inline-flex items-center gap-1 rounded-full bg-[#007749] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#005F3A] transition"
                  >
                    <Zap className="h-3 w-3 text-[#FFB81C]" />
                    <span>Clone (10s)</span>
                  </Link>
                  <Link
                    href="/create"
                    className="inline-flex items-center gap-1 rounded-full border border-[#E6E2D8] bg-white px-3 py-1.5 text-[11px] font-bold text-[#0F172A] hover:border-[#007749] transition"
                  >
                    <span>New Link</span>
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN (lg:col-span-5 space-y-5): SELF-SERVICE SPOT-SWAP + HOST YOUR OWN + LIVE WALL SUMMARY */}
          <div className="lg:col-span-5 space-y-5 print:hidden">
            {/* 🔄 SELF-SERVICE SPOT-SWAP WIDGET */}
            {rsvp && rsvp.status === "payday_promise" && (
              <section className="rounded-3xl border border-amber-300 bg-amber-50 p-5 sm:p-6 shadow-xs">
                <h3 className="font-display text-base font-extrabold text-amber-950">
                  ⏳ Unpaid Payday Standby Pledge
                </h3>
                <p className="mt-1 text-xs text-amber-900 leading-relaxed">
                  Spot-Swap is only available for confirmed spots. Settle your standby pledge first to lock in your spot and unlock peer-to-peer transfers.
                </p>
                <Link
                  href={`/e/${slug}?settle=${encodeURIComponent(rsvp.id)}`}
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#007749] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#005F3A] transition"
                >
                  <span>💳 Settle My Pledge Now →</span>
                </Link>
              </section>
            )}
            {rsvp && rsvp.status !== "payday_promise" && rsvp.status !== "refunded" && (
              <section className="rounded-3xl border border-[#E6E2D8] bg-white p-5 sm:p-6 shadow-xs">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FFB81C] bg-[#FFB81C]/20 px-3 py-0.5 text-[11px] font-bold text-[#0F172A]">
                      <RefreshCw className="h-3 w-3 text-[#007749]" />
                      <span>1-Tap Spot-Swap • R0 Transfer Fee</span>
                    </span>
                    <h3 className="font-display mt-2 text-lg font-extrabold text-[#0F172A]">
                      🔄 Can&apos;t Make It? Swap / Transfer My Spot
                    </h3>
                    <p className="mt-1 text-xs text-[#475569]">
                      Pulled a hamstring or stuck at work? Send your swap link to a chommie or enter their name below to transfer your paid spot on the wall immediately.
                    </p>
                    <div className="mt-2.5 rounded-xl border border-amber-200 bg-amber-50/90 p-2.5 text-[11px] text-amber-900 flex items-start gap-2">
                      <span className="shrink-0 text-xs">🔒</span>
                      <p>
                        <strong>Private DM Advisory:</strong> Only send this secret link in a <em>direct 1-on-1 private WhatsApp message</em> to your replacement friend. Do not post it in the public group chat, or someone else might claim it first!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <a
                      href={swapWhatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-[#25D366] bg-[#25D366]/10 px-4 py-2 text-xs font-bold text-[#075E54] hover:bg-[#25D366] hover:text-white transition"
                    >
                      <Smartphone className="h-3.5 w-3.5" />
                      <span>📱 Send Spot via WhatsApp</span>
                    </a>
                    <button
                      type="button"
                      onClick={handleCopySwapLink}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-[#E6E2D8] bg-[#FAF8F5] px-4 py-2 text-xs font-bold text-[#0F172A] hover:border-[#007749] hover:bg-white transition"
                    >
                      {copiedSwapLink ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-[#007749]" />
                          <span className="text-[#007749]">Secret Link Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-[#007749]" />
                          <span>📋 Copy Secret Link</span>
                        </>
                      )}
                    </button>
                  </div>

                  <form id="swap-transfer-section" onSubmit={handleSwapSpot} className="space-y-3 scroll-mt-20">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-[#0F172A]">
                        Replacement Friend&apos;s Name (New Guest on Wall) *
                      </label>
                      <input
                        type="text"
                        required
                        value={newGuestName}
                        onChange={(e) => setNewGuestName(e.target.value)}
                        placeholder="e.g. Kagiso M (Subbing in for me)"
                        className="w-full rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-3.5 py-2.5 text-sm text-[#0F172A] placeholder-[#475569]/60 focus:border-[#007749] focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-bold text-[#0F172A]">
                          New Guest Banter Badge
                        </label>
                        <select
                          value={newBadgeLabel}
                          onChange={(e) => setNewBadgeLabel(e.target.value)}
                          className="w-full rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-3 py-2.5 text-xs font-semibold text-[#0F172A] focus:border-[#007749] focus:bg-white focus:outline-none"
                        >
                          {BANTER_BADGES.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-bold text-[#0F172A]">
                          Updated Wall Comment (Optional)
                        </label>
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="e.g. Subbing in! Ready to run 🔥"
                          className="w-full rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-3 py-2.5 text-xs text-[#0F172A] placeholder-[#475569]/60 focus:border-[#007749] focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Release Claimed Bring-'n-Bak Item Checkbox */}
                    {rsvp.claimed_item_label && (
                      <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-3.5 py-2.5 text-xs text-[#0F172A]">
                        <input
                          type="checkbox"
                          checked={unclaimItem}
                          onChange={(e) => setUnclaimItem(e.target.checked)}
                          className="h-4 w-4 rounded border-[#E6E2D8] accent-[#007749]"
                        />
                        <span>
                          Release{" "}
                          <strong className="text-[#007749]">
                            &lsquo;{rsvp.claimed_item_label}&rsquo;
                          </strong>{" "}
                          back to the unclaimed crew checklist
                        </span>
                      </label>
                    )}

                    {/* Swap Token Input (shown automatically if empty, or toggleable) */}
                    {(!swapTokenInput || showManualTokenField) ? (
                      <div>
                        <label className="mb-1 block text-xs font-bold text-[#0F172A]">
                          Spot-Swap Security Token
                        </label>
                        <input
                          type="text"
                          value={swapTokenInput}
                          onChange={(e) => setSwapTokenInput(e.target.value)}
                          placeholder="Paste swap token from link..."
                          className="font-mono-num w-full rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-3.5 py-2 text-xs text-[#0F172A] placeholder-[#475569]/60 focus:border-[#007749] focus:bg-white focus:outline-none"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[11px] text-[#475569]">
                        <span className="inline-flex items-center gap-1 font-semibold text-[#007749]">
                          <QrCode className="h-3.5 w-3.5" />
                          <span>Swap token verified from your session</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowManualTokenField(true)}
                          className="underline hover:text-[#0F172A]"
                        >
                          Edit token manually
                        </button>
                      </div>
                    )}

                    {swapSuccessMessage && (
                      <div className="rounded-xl border border-[#007749]/30 bg-[#007749]/10 p-3 text-xs font-bold text-[#007749]">
                        ✅ {swapSuccessMessage}
                      </div>
                    )}

                    {swapErrorMessage && (
                      <div className="rounded-xl border border-rose-500/30 bg-rose-50 p-3 text-xs font-bold text-rose-700">
                        ⚠️ {swapErrorMessage}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={swapping || !newGuestName.trim()}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#0F172A] bg-[#0F172A] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#007749] hover:border-[#007749] disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${swapping ? "animate-spin" : ""}`}
                      />
                      <span>
                        {swapping
                          ? "Transferring Spot on Wall..."
                          : `Transfer Spot #${wallRankIndex || 1} to New Guest`}
                      </span>
                    </button>
                  </form>
                </div>
              </section>
            )}

            {/* 🛡️ BUYER PROTECTION, REFUNDS & HOST ISSUE REPORT CARD */}
            {rsvp && (
              <section className="rounded-3xl border border-[#E6E2D8] bg-white p-5 sm:p-6 shadow-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#007749]/10 px-3 py-1 text-[11px] font-bold text-[#007749]">
                    🛡️ PullThru Buyer Protection
                  </span>
                  <Link
                    href="/help"
                    className="text-[11px] font-bold text-[#007749] underline hover:text-[#005F3A]"
                  >
                    Read Full Refund &amp; Help Guide →
                  </Link>
                </div>

                <h3 className="font-display mt-2.5 text-base font-extrabold text-[#0F172A]">
                  💸 Need a Refund or Host Help?
                </h3>
                <p className="mt-1 text-xs text-[#475569] leading-relaxed">
                  If the event was cancelled, rescheduled to a date you can&apos;t make, or the host is a no-show at the venue, request a refund or flag an issue below.
                </p>

                <div className="mt-2.5 rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] p-3 text-[11px] text-[#475569]">
                  <strong className="text-[#0F172A]">⚡ Direct Host Refund Flow:</strong> Because 100% of your contribution went straight to {event.host_name}&apos;s bank account with R0 middleman fees, requesting a refund below releases your spot on the wall and logs an official refund reference so the host can PayShap or EFT you back directly.
                  {rsvp.refund_reference && (
                    <span className="mt-1 block font-mono-num font-bold text-[#007749]">
                      Refund Ref: {rsvp.refund_reference} ({rsvp.refund_status || "requested"})
                    </span>
                  )}
                </div>

                {rsvp.status !== "refunded" && (
                  <div className="mt-3 space-y-2.5">
                    <input
                      type="text"
                      value={refundReasonInput}
                      onChange={(e) => setRefundReasonInput(e.target.value)}
                      placeholder="Reason (e.g. Can't make rescheduled date / Host no-show)..."
                      className="w-full rounded-xl border border-[#E6E2D8] bg-[#FAF8F5] px-3.5 py-2 text-xs text-[#0F172A] focus:border-[#007749] focus:bg-white focus:outline-none"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={submittingRefundAction}
                        onClick={() => handleSelfServeRefundOrDispute("request_refund")}
                        className="rounded-full border border-[#0F172A] bg-white px-4 py-2 text-xs font-bold text-[#0F172A] hover:bg-[#FAF8F5] disabled:opacity-50 cursor-pointer"
                      >
                        💸 Request Refund
                      </button>
                      <button
                        type="button"
                        disabled={submittingRefundAction}
                        onClick={() => handleSelfServeRefundOrDispute("report_dispute")}
                        className="rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-800 hover:bg-rose-100 disabled:opacity-50 cursor-pointer"
                      >
                        🚨 Report Host No-Show
                      </button>
                    </div>
                  </div>
                )}

                {refundActionNotice && (
                  <div className="mt-2.5 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-bold text-emerald-900">
                    {refundActionNotice}
                  </div>
                )}
                {refundActionError && (
                  <div className="mt-2.5 rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs font-bold text-rose-800">
                    ⚠️ {refundActionError}
                  </div>
                )}
              </section>
            )}

            {/* ⚡ HOST YOUR OWN PULLTHRU EVENT IN 25S + LIVE EVENT WALL QUICK SUMMARY */}
            <section className="rounded-3xl border border-[#E6E2D8] bg-[#F3F0EA] p-5 sm:p-6 shadow-xs">
              {/* Live Event Wall Quick Summary Pill Box */}
              <div className="mb-4 rounded-2xl border border-[#E6E2D8] bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#007749]" />
                    <span className="text-xs font-extrabold text-[#0F172A]">
                      Live Event Wall Summary
                    </span>
                  </div>
                  <span className="font-mono-num rounded-full border border-[#007749]/25 bg-[#007749]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#007749]">
                    {event.max_spots
                      ? `${totalLockedSpots}/${event.max_spots} Locked`
                      : `${totalLockedSpots} Locked`}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-[#475569]">
                  {spotsLeft !== null && spotsLeft > 0
                    ? `Only ${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left for ${event.title}. Share your receipt in the WhatsApp group so the rest of the crew locks in!`
                    : `The wall for ${event.title} is live with ${activeRsvps.length} confirmed crew entries.`}
                </p>
                <Link
                  href={`/e/${slug}`}
                  className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-[#007749] hover:underline"
                >
                  <span>View Full Ranked Guest Wall &amp; Bring-&apos;n-Bak List</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#007749]/25 bg-[#007749]/10 px-3 py-1 text-xs font-bold text-[#007749]">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>1-Tap Clone • Viral Host Bridge</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-[#FFB81C]/40 bg-[#FFB81C]/15 px-2.5 py-1 text-xs font-bold text-[#0F172A]">
                  ⭐ 5.0 Host Trust Rating
                </span>
              </div>
              <h3 className="font-display text-lg font-extrabold text-[#0F172A]">
                ⚡ Loved this? Clone {event.title} in 10s
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[#475569]">
                Running the next game, braai, or trip? Clone this exact event setup with all tiers, Bring-&apos;n-Bak items, and rules already pre-filled. You get 100% payout to your SA bank account with zero shortfall!
              </p>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Link
                  href={`/create?clone=${slug}`}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#007749] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#005F3A]"
                >
                  <Zap className="h-3.5 w-3.5 text-[#FFB81C]" />
                  <span>Clone This Setup (10s)</span>
                </Link>
                <Link
                  href="/create"
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-[#E6E2D8] bg-white px-4 py-2.5 text-xs font-bold text-[#0F172A] hover:border-[#007749] transition"
                >
                  <span>New Blank Event</span>
                </Link>
              </div>
            </section>

            {/* Post-RSVP Tasteful AdSense Slot (Strict Exclusion: Never on Dignity/Gift Pots or Pro Boosted / Club Pass events) */}
            {event.mode !== "pot" && !event.is_pro_boosted && (
              <TastefulAdSlot
                slotId="8842109405"
                variant="light"
                context="general"
                showProRemoveHint
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SuccessReceiptPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8F5] text-[#0F172A]">
          <Navbar />
          <main className="mx-auto max-w-xl px-4 py-20 text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#007749] border-t-transparent" />
            <p className="font-display text-lg font-extrabold text-[#0F172A]">
              Loading Certified PullThru Receipt...
            </p>
          </main>
        </div>
      }
    >
      <SuccessReceiptContent />
    </Suspense>
  );
}
