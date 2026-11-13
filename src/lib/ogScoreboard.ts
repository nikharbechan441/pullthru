import { getEventBySlug } from "@/lib/store";
import { formatZar } from "@/lib/fees";

export async function buildOgScoreboardData(slug: string) {
  const data = slug ? await getEventBySlug(slug) : null;
  const event = data?.event;
  const rsvps = data?.rsvps || [];

  const confirmed = rsvps.filter(
    (r) =>
      r.status === "locked_paid" ||
      r.status === "cash_logged" ||
      r.status === "going_free"
  );

  const lockedSpots = confirmed.reduce(
    (sum, r) => sum + (r.spots_locked || 1),
    0
  );
  const totalRaisedZar = confirmed.reduce(
    (sum, r) => sum + (r.amount_contributed_zar || 0),
    0
  );

  const title = event?.title || "PullThru Squad Session";
  const hostName = event?.host_name || "Squad Organiser";
  const eventDate = event?.event_date || "Upcoming Session";
  const locationName = event?.location_name || "South Africa";

  const minTierPrice =
    event?.mode === "tiered" && Array.isArray(event.tiers) && event.tiers.length > 0
      ? Math.min(...event.tiers.map((t) => Number(t.price_zar) || 0))
      : event?.price_zar || 100;

  const priceLabel =
    !event || event.mode === "free" || event.price_zar === 0
      ? "FREE RSVP"
      : event.mode === "pot"
      ? `CHIP-IN POT (FROM ${formatZar(event.min_pot_contribution_zar || 50)})`
      : event.mode === "tiered"
      ? `FROM ${formatZar(minTierPrice)}`
      : `${formatZar(event.price_zar)} / SPOT`;

  const maxSpots = event?.max_spots || null;
  const spotsLeft =
    maxSpots !== null ? Math.max(0, maxSpots - lockedSpots) : null;

  const scoreboardBadge = !event
    ? "LOCK IN YOUR SPOT IN 15s"
    : event.mode === "pot"
    ? event.hide_amounts_on_wall
      ? `${lockedSpots} CONTRIBUTION${lockedSpots === 1 ? "" : "S"} LOCKED • DIGNITY POT`
      : `${formatZar(totalRaisedZar)}${
          event.target_pot_zar ? ` / ${formatZar(event.target_pot_zar)}` : ""
        } RAISED`
    : maxSpots
    ? spotsLeft === 0
      ? `SOLD OUT (${lockedSpots}/${maxSpots} LOCKED)`
      : `${lockedSpots} / ${maxSpots} LOCKED • ONLY ${spotsLeft} LEFT`
    : `${lockedSpots} LOCKED ON THE WALL`;

  // Strictly filter out POPIA anonymous guests from the public WhatsApp OG scoreboard
  const publicNamedConfirmed = confirmed.filter((r) => !r.is_anonymous_on_wall);
  const recentNames = publicNamedConfirmed
    .slice(0, 4)
    .map((r) => (r.guest_name || "Guest").split(" ")[0])
    .filter(Boolean);

  const extraCount = Math.max(0, confirmed.length - recentNames.length);
  const namesLine =
    recentNames.length > 0
      ? `Locked in: ${recentNames.join(", ")}${
          extraCount > 0 ? ` + ${extraCount} more` : ""
        }`
      : confirmed.length > 0
      ? `${confirmed.length} squad member${confirmed.length === 1 ? "" : "s"} locked in on the wall`
      : "Be the first to lock in your spot on the Squad Wall";

  return {
    title,
    hostName,
    eventDate,
    locationName,
    priceLabel,
    spotsLeft,
    scoreboardBadge,
    namesLine,
    lockedSpots,
    totalRaisedZar,
  };
}
