import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "fcprop — AI Proposal Builder",
  description: "Upload client info + a benefit illustration, generate a personalized proposal in minutes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-neutral-50 text-neutral-900">{children}</body>
    </html>
  );
}
