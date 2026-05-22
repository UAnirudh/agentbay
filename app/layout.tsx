import type { Metadata } from "next";
import "./globals.css";

const APP_URL = (() => {
  const u = process.env.NEXT_PUBLIC_APP_URL || "https://agentbay.com";
  return u.startsWith("http") ? u : `https://${u}`;
})();

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "AgentBay — Your AI Commerce Agent",
    template: "%s | AgentBay",
  },
  description:
    "AgentBay is an AI-native marketplace where your personal AI agent buys, sells, and negotiates on your behalf. Stop browsing marketplaces. Stop writing listings. Describe what you want — your agent handles everything.",
  keywords: [
    "AI commerce agent",
    "AI marketplace",
    "AI buying agent",
    "AI selling agent",
    "automated negotiation",
    "AI negotiation",
    "sell on eBay automatically",
    "AI Facebook Marketplace",
    "automated marketplace",
    "AI agent for buying and selling",
    "hands-free selling",
    "AgentBay",
  ],
  authors: [{ name: "AgentBay" }],
  creator: "AgentBay",
  publisher: "AgentBay",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },
  alternates: {
    canonical: APP_URL,
  },
  openGraph: {
    title: "AgentBay — Your AI Commerce Agent",
    description:
      "Your personal AI agent buys, sells, and negotiates for you. No browsing. No listing. No haggling. Join the waitlist.",
    type: "website",
    url: APP_URL,
    siteName: "AgentBay",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AgentBay — AI Commerce Agent",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentBay — Your AI Commerce Agent",
    description:
      "Your personal AI agent buys, sells, and negotiates for you. No browsing. No listing. No haggling.",
    images: ["/og-image.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${APP_URL}/#website`,
      url: APP_URL,
      name: "AgentBay",
      description: "AI-native marketplace where your personal agent buys, sells, and negotiates for you.",
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${APP_URL}/?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": `${APP_URL}/#organization`,
      name: "AgentBay",
      url: APP_URL,
      logo: {
        "@type": "ImageObject",
        url: `${APP_URL}/og-image.png`,
        width: 1200,
        height: 630,
      },
      description:
        "AgentBay is an AI-native marketplace where a personal AI agent handles all buying, selling, and price negotiation automatically.",
      sameAs: ["https://github.com/UAnirudh/agentbay"],
    },
    {
      "@type": "SoftwareApplication",
      name: "AgentBay",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: APP_URL,
      description:
        "An AI commerce agent that buys, sells, and negotiates on online marketplaces automatically. Supports eBay, Facebook Marketplace, Craigslist, and AgentBay's native marketplace.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Free to join. Sellers pay 8% only on completed transactions.",
      },
      featureList: [
        "AI buyer agent",
        "AI seller agent",
        "Automated price negotiation",
        "AI listing creation",
        "Real-time price intelligence",
        "Fraud protection",
        "Multi-platform support",
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Is AgentBay free to join?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The waitlist is completely free. When we launch, AgentBay is free to use for buying. Sellers pay an 8% platform fee only when a transaction completes.",
          },
        },
        {
          "@type": "Question",
          name: "How does the referral system work?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Each person you refer moves you 10 spots up the waitlist. Share your unique link, and when they sign up, your position improves automatically.",
          },
        },
        {
          "@type": "Question",
          name: "What is an AI commerce agent?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "An AI commerce agent is a software agent that autonomously handles online buying and selling tasks — searching listings, comparing prices, writing product descriptions, negotiating with buyers and sellers, and completing transactions — without requiring manual human input.",
          },
        },
        {
          "@type": "Question",
          name: "What platforms will AgentBay support?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "At launch: Facebook Marketplace, eBay, Craigslist, and AgentBay's own marketplace. More platforms are added in Phase 2.",
          },
        },
        {
          "@type": "Question",
          name: "When does AgentBay launch?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "AgentBay is targeting launch in late 2026. Top 100 waitlist members get early access first, then we expand in waves based on waitlist position.",
          },
        },
      ],
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="canonical" href={APP_URL} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
