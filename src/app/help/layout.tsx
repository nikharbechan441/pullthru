import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help Centre, Buyer Protection & Spot-Swap Guide",
  description:
    "How PullThru protects South African event hosts and guests: Direct PayShap & Capitec PayMe zero-custody clearing (R0 guest fees), 1-tap WhatsApp Spot-Swaps, Pass Recovery, and rain-out refund rules.",
  alternates: {
    canonical: "/help",
  },
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
