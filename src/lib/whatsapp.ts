// Parses WhatsApp 1-line commands like:
// "/pullthru 5aside R100 10spots"
// "/pullthru braai R150 20spots"
// "/pullthru padel R200 8spots"
// "/pullthru golf R1800 24spots"
export function parseWhatsAppCommand(text: string) {
  const clean = text.trim();
  const match = clean.match(
    /^\/?pullthru\s+([a-zA-Z0-9_\-]+)\s+R?(\d+)(?:\s+(\d+)\s*(?:spots|people|pax|heads)?)?/i
  );

  if (!match) {
    return null;
  }

  const [, rawVibe, rawPrice, rawSpots] = match;
  const priceZar = Math.max(0, parseInt(rawPrice, 10));
  const maxSpots = rawSpots ? Math.max(1, parseInt(rawSpots, 10)) : 10;

  const vibeMap: Record<string, { title: string; category_vibe: string }> = {
    "5aside": { title: "Thursday Night 5-a-Side Soccer", category_vibe: "⚽ 5-a-Side Soccer" },
    fives: { title: "Social 5-a-Side Match", category_vibe: "⚽ 5-a-Side Soccer" },
    soccer: { title: "Weekend Soccer Match", category_vibe: "⚽ 5-a-Side Soccer" },
    padel: { title: "Friday Afternoon Padel Social", category_vibe: "🎾 Padel & Social" },
    braai: { title: "Bring & Braai Squad", category_vibe: "🥩 Braai & Potjie" },
    potjie: { title: "Championship Potjie & Spitbraai", category_vibe: "🥩 Braai & Potjie" },
    golf: { title: "Alumni & Friends 18-Hole Golf Day", category_vibe: "🏌️‍♂️ Golf Day" },
    trip: { title: "Weekend Away & Mountain Lodge", category_vibe: "🏔️ Weekend Away" },
  };

  const matched = vibeMap[rawVibe.toLowerCase()] || {
    title: `${rawVibe.charAt(0).toUpperCase() + rawVibe.slice(1)} Event`,
    category_vibe: "⚡ Squad Gathering",
  };

  return {
    vibe: rawVibe,
    title: matched.title,
    category_vibe: matched.category_vibe,
    price_zar: priceZar,
    max_spots: maxSpots,
  };
}
