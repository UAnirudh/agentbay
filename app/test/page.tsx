import Link from "next/link";
import { db } from "@/lib/db";
import { listings, negotiations, agentSessions } from "@/lib/schema";
import { count, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function TestHome() {
  const [{ totalListings }] = db.select({ totalListings: count() }).from(listings).where(eq(listings.status, "active")).all();
  const [{ totalNegs }] = db.select({ totalNegs: count() }).from(negotiations).all();
  const [{ totalSearches }] = db.select({ totalSearches: count() }).from(agentSessions).where(eq(agentSessions.mode, "buy")).all();

  const tiles = [
    {
      href: "/test/buy",
      icon: "🛒",
      title: "Buyer Agent",
      desc: "Describe what you want. The AI searches AgentBay + eBay + Facebook + Craigslist + more.",
      color: "brand",
      cta: "Start a search",
    },
    {
      href: "/test/sell",
      icon: "📦",
      title: "Seller Agent",
      desc: "Describe your item. The AI writes the listing, prices it, and posts it for you.",
      color: "purple",
      cta: "List something",
    },
    {
      href: "/test/marketplace",
      icon: "🏪",
      title: "AgentBay Marketplace",
      desc: "Browse everything currently listed on AgentBay across all categories.",
      color: "cyan",
      cta: "Browse",
    },
    {
      href: "/test/negotiations",
      icon: "🤝",
      title: "Negotiations",
      desc: "Watch your AI agent negotiate with sellers on your behalf in real-time.",
      color: "amber",
      cta: "View deals",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-10">
        <span className="text-brand-400 text-sm font-semibold uppercase tracking-widest block mb-3">Admin product workspace</span>
        <h1 className="text-4xl md:text-5xl font-black text-white mb-3">Welcome to AgentBay</h1>
        <p className="text-slate-400 text-lg max-w-2xl">
          This is a live working preview of the full product. Buy and sell across the entire web with an AI agent that handles searching, listing, and negotiating.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="card p-5">
          <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold mb-2">Active listings</p>
          <p className="text-3xl font-black text-white">{totalListings.toLocaleString()}</p>
        </div>
        <div className="card p-5">
          <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold mb-2">Searches run</p>
          <p className="text-3xl font-black text-white">{totalSearches.toLocaleString()}</p>
        </div>
        <div className="card p-5">
          <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold mb-2">Negotiations</p>
          <p className="text-3xl font-black text-white">{totalNegs.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {tiles.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`card p-7 group hover:border-${t.color}-500/30 transition-all relative overflow-hidden`}
          >
            <div className={`absolute -top-12 -right-12 w-40 h-40 rounded-full bg-${t.color}-500/10 blur-3xl group-hover:bg-${t.color}-500/20 transition-all`} />
            <div className="relative">
              <div className="text-4xl mb-4">{t.icon}</div>
              <h3 className="text-xl font-bold text-white mb-2">{t.title}</h3>
              <p className="text-slate-400 text-sm mb-5 leading-relaxed">{t.desc}</p>
              <span className={`inline-flex items-center gap-1 text-sm font-semibold text-${t.color}-400 group-hover:gap-2 transition-all`}>
                {t.cta} <span>→</span>
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12 card p-6 bg-gradient-to-br from-amber-500/5 to-transparent border-amber-500/20">
        <div className="flex items-start gap-4">
          <div className="text-2xl">💡</div>
          <div>
            <h3 className="font-semibold text-white mb-1">How AgentBay makes money</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Search results are free for buyers. We earn revenue through sponsored placement ads (clearly marked) and an 8% transaction fee on completed sales through the AgentBay marketplace. External listings (eBay, Facebook, etc.) are surfaced without commission — pure value to the user.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
