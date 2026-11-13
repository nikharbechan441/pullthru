import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "5-a-Side Soccer & Padel Court Split App — PullThru SA",
  description:
    "Split 5-a-side soccer pitches and Padel 4-ball court bookings on WhatsApp in 15 seconds. R0 guest fees via PayShap & Capitec PayMe plus Team Bib Generator.",
  alternates: {
    canonical: "https://pullthru.co.za/5-a-side-and-padel",
    languages: {
      "en-ZA": "https://pullthru.co.za/5-a-side-and-padel",
      "x-default": "https://pullthru.co.za/5-a-side-and-padel",
    },
  },
  openGraph: {
    title: "5-a-Side Soccer & Padel Court Split Link — PullThru South Africa",
    description:
      "Stop paying for flaky dropouts at Fives Futbol or Padel courts. Collect per-player court shares on WhatsApp in 15s via PayShap or Capitec PayMe (R0 fee).",
    url: "https://pullthru.co.za/5-a-side-and-padel",
    siteName: "PullThru",
    locale: "en_ZA",
    type: "website",
    images: [
      {
        url: "https://pullthru.co.za/feature-graphic.png",
        width: 1024,
        height: 500,
        alt: "PullThru — 5-a-Side Soccer & Padel Court Split App South Africa",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "5-a-Side Soccer & Padel Court Split Link — PullThru SA",
    description:
      "Collect per-player 5-a-side and Padel court fees on WhatsApp with R0 guest fees via PayShap or Capitec PayMe.",
    images: ["https://pullthru.co.za/feature-graphic.png"],
  },
};

export default function FiveASidePadelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
