import Link from "next/link";
import { db } from "@/lib/db";
import { listings, negotiations, agentSessions } from "@/lib/schema";
import { count, eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

const CATEGORY_ICONS: Record<string, string> = {
  electronics: "📱", furniture: "🛋️", clothing: "👕", books: "📚",
  vehicles: "🚗", appliances: "🔌", tools: "🔧", sports: "🏀",
  toys: "🧸", other: "📦",
};

export default async function TestHome() {
  const [
    [{ totalListings }],
    [{ totalNegs }],
    [{ totalSearches }],
    recent,
  ] = await Promise.all([
    db.select({ totalListings: count() }).from(listings).where(eq(listings.status, "active")),
    db.select({ totalNegs: count() }).from(negotiations),
    db.select({ totalSearches: count() }).from(agentSessions).where(eq(agentSessions.mode, "buy")),
    db.select().from(listings).where(eq(listings.status, "active")).orderBy(desc(listings.createdAt)).limit(4),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <section className="card p-8 md:p-10 mb-8 relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="relative grid md:grid-cols-2 gap-8 items-center">
          <div>
            <span className="text-brand-400 text-xs font-semibold uppercase tracking-widest block mb-3">Welcome back</span>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-3 leading-tight">
              What can your agent <span className="gradient-text">do for you</span> today?
            </h1>
            <p className="text-slate-400 text-base mb-6 leading-relaxed">
              Buy, sell, browse, or negotiate — your AI handles the work. Try the new chat mode for a conversational experience.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/test/chat" className="btn-primary">💬 Talk to agent</Link>
              <Link href="/test/buy" className="btn-secondary">🔍 Quick search</Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-5">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-2">Active listings</p>
              <p className="text-3xl font-black text-white">{totalListings.toLocaleString()}</p>
            </div>
            <div className="card p-5">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-2">Searches</p>
              <p className="text-3xl font-black text-white">{totalSearches.toLocaleString()}</p>
            </div>
            <div className="card p-5 col-span-2">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-2">Live negotiations</p>
              <p className="text-3xl font-black text-white">{totalNegs.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { href: "/test/buy", icon: "🛒", title: "Buy", desc: "Search every marketplace at once", color: "brand" },
          { href: "/test/sell", icon: "📦", title: "Sell", desc: "AI writes the listing for you", color: "purple" },
          { href: "/test/marketplace", icon: "🏪", title: "Browse", desc: "All AgentBay listings", color: "cyan" },
          { href: "/test/negotiations", icon: "🤝", title: "Negotiate", desc: "Watch your deals close", color: "amber" },
        ].map((t) => (
          <Link key={t.href} href={t.href} className="card-hover p-6 group relative overflow-hidden">
            <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-${t.color}-500/10 blur-2xl group-hover:bg-${t.color}-500/20 transition-all`} />
            <div className="relative">
              <div className="text-4xl mb-3">{t.icon}</div>
              <h3 className="text-lg font-bold text-white mb-1">{t.title}</h3>
              <p className="text-sm text-slate-400">{t.desc}</p>
            </div>
          </Link>
        ))}
      </section>

      {recent.length > 0 && (
        <section className="mb-8">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-2xl font-black text-white mb-1">Latest listings</h2>
              <p className="text-sm text-slate-400">Fresh items posted on AgentBay</p>
            </div>
            <Link href="/test/marketplace" className="text-sm text-brand-400 hover:text-brand-300 transition">View all →</Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {recent.map((item) => {
              const icon = CATEGORY_ICONS[item.category] || "📦";
              return (
                <Link key={item.id} href={`/test/listings/${item.id}`} className="card-hover overflow-hidden group">
                  <div className="aspect-square bg-gradient-to-br from-white/[0.04] to-white/[0.01] flex items-center justify-center relative">
                    <div className="absolute inset-0 grid-bg opacity-30" />
                    <span className="relative text-6xl group-hover:scale-110 transition-transform duration-300">{icon}</span>
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-white text-sm truncate mb-1 group-hover:text-brand-300 transition">{item.title}</p>
                    <p className="text-lg font-black text-white">${(item.priceCents / 100).toFixed(0)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="card p-6 bg-gradient-to-br from-amber-500/5 to-transparent border-amber-500/20">
        <div className="flex items-start gap-4">
          <div className="text-2xl">💡</div>
          <div>
            <h3 className="font-semibold text-white mb-1">How AgentBay makes money</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Buyers search for free. Revenue comes from clearly-marked sponsored placements and an 8% transaction fee on AgentBay marketplace sales only. External marketplace results (eBay, Facebook, etc.) are surfaced commission-free — pure value to the user.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
