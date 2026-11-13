import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "UI Design Prototypes (Internal)",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RedesignsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
