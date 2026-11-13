import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create an 8-Second WhatsApp Roll-Call & Split Link",
  description:
    "Start a South African WhatsApp roll-call or money split link in 8 seconds for 5-a-side soccer, Padel 4-balls, Saturday braais, Run Clubs, or Group Gift Pots. 100% Free for squads up to 30+ spots with Direct PayShap & R0 guest fees.",
  alternates: {
    canonical: "https://pullthru.co.za/create",
  },
};

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
