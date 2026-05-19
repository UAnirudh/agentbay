import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentBay — Buy and Sell with AI",
  description:
    "The AI-powered marketplace where your agent handles everything — listing, pricing, negotiation, and payment.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
