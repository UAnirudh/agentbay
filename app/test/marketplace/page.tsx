import Link from "next/link";
import { db } from "@/lib/db";
import { listings } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  const items = db.select().from(listings)
    .where(eq(listings.status, "active"))
    .orderBy(desc(listings.createdAt))
    .limit(60)
    .all();

  const categories = Array.from(new Set(items.map((i) => i.category)));

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-8">
        <span className="text-cyan-400 text-sm font-semibold uppercase tracking-widest block mb-2">AgentBay Marketplace</span>
        <h1 className="text-3xl md:text-4xl font-black text-white mb-2">Browse everything for sale</h1>
        <p className="text-slate-400">Real listings posted on AgentBay. Click any to buy or negotiate.</p>
      </div>

      {items.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-5xl mb-4">🏪</p>
          <p className="text-white text-lg font-semibold mb-2">Marketplace is empty</p>
          <p className="text-slate-400 mb-6">Be the first to list something.</p>
          <Link href="/test/sell" className="btn-primary">List an item →</Link>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="badge bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs">All ({items.length})</span>
            {categories.map((c) => (
              <span key={c} className="badge bg-white/[0.04] border border-white/[0.08] text-slate-400 text-xs capitalize">
                {c} ({items.filter((i) => i.category === c).length})
              </span>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/test/listings/${item.id}`}
                className="card p-5 group hover:border-brand-500/30 transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="badge bg-white/[0.04] border border-white/[0.08] text-slate-400 text-xs capitalize">
                    {item.category}
                  </span>
                  {item.aiGenerated && (
                    <span className="badge bg-purple-500/15 text-purple-400 border border-purple-500/30 text-xs">
                      ✨ AI listing
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-white mb-2 group-hover:text-brand-300 transition line-clamp-2">{item.title}</h3>
                <p className="text-slate-500 text-sm mb-4 line-clamp-2">{item.description}</p>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-black text-white">${(item.priceCents / 100).toFixed(0)}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="capitalize">{item.condition.replace("_", " ")}</span>
                    {item.location && <span>· {item.location}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
