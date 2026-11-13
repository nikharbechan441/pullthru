import type { Metadata } from "next";
import { getEventBySlug } from "@/lib/store";
import { formatZar } from "@/lib/fees";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams?.slug || "";
  const data = slug ? await getEventBySlug(slug) : null;
  const event = data?.event;
  const rsvps = data?.rsvps || [];

  const confirmed = rsvps.filter(
    (r) =>
      r.status === "locked_paid" ||
      r.status === "cash_logged" ||
      r.status === "going_free"
  );
  const lockedSpots = confirmed.reduce((sum, r) => sum + (r.spots_locked || 1), 0);
  const totalRaisedZar = confirmed.reduce(
    (sum, r) => sum + (r.amount_contributed_zar || 0),
    0
  );

  const minTierPrice =
    event?.mode === "tiered" && Array.isArray(event.tiers) && event.tiers.length > 0
      ? Math.min(...event.tiers.map((t) => Number(t.price_zar) || 0))
      : event?.price_zar || 100;

  const baseTitle = event?.title || "PullThru — Group Event & Kitty";
  const priceTag =
    !event || event.mode === "free" || event.price_zar === 0
      ? "Free RSVP"
      : event.mode === "pot"
      ? `From ${formatZar(event.min_pot_contribution_zar || 15)}`
      : event.mode === "tiered"
      ? `From ${formatZar(minTierPrice)}`
      : formatZar(event.price_zar);

  const statusTag = !event
    ? "Lock in your spot"
    : event.mode === "pot"
    ? event.hide_amounts_on_wall
      ? `${lockedSpots} Contributed • Dignity Pot`
      : `${formatZar(totalRaisedZar)}${
          event.target_pot_zar ? ` / ${formatZar(event.target_pot_zar)}` : ""
        } Raised`
    : event.max_spots
    ? `${lockedSpots}/${event.max_spots} Spots Locked`
    : `${lockedSpots} Going`;

  const ogTitle = `${baseTitle} (${statusTag} • ${priceTag})`;
  const ogDescription = event
    ? `Hosted by ${event.host_name} • ${event.event_date} • ${event.location_name}. Lock in your spot in 25s via Direct PayShap or Capitec PayMe (R0 Guest Fee).`
    : "Lock in your spot in 25 seconds via Direct PayShap or Capitec PayMe (R0 Guest Fee) on PullThru.";

  return {
    title: `${baseTitle} — PullThru`,
    description: ogDescription,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: `https://pullthru.co.za/e/${slug}`,
      siteName: "PullThru",
      locale: "en_ZA",
      type: "website",
      images: [
        {
          url: "/feature-graphic.png",
          width: 1024,
          height: 500,
          type: "image/png",
          alt: ogTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: ["/feature-graphic.png"],
    },
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
  };
}

export default function EventPrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
