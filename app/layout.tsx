import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentBay — Your AI Commerce Agent",
  description: "The AI-native marketplace where your personal agent buys, sells, negotiates, and handles everything. Stop browsing. Start delegating.",
  metadataBase: new URL((() => { const u = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"; return u.startsWith("http") ? u : `https://${u}`; })()),
  openGraph: {
    title: "AgentBay — Your AI Commerce Agent",
    description: "Your personal AI agent handles buying, selling, and negotiating. Join the waitlist.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentBay — Your AI Commerce Agent",
    description: "Your personal AI agent handles buying, selling, and negotiating. Join the waitlist.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
