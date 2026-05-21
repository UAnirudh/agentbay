import Link from "next/link";
import { db } from "@/lib/db";
import { negotiations, listings } from "@/lib/schema";
import { getSession } from "@/lib/auth";
import { eq, or, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function NegotiationsPage() {
  const session = await getSession();
  const rows = await db.select().from(negotiations)
    .where(or(eq(negotiations.buyerId, session!.userId), eq(negotiations.sellerId, session!.userId)))
    .orderBy(desc(negotiations.updatedAt));

  const enriched = await Promise.all(rows.map(async (n) => {
    const l = (await db.select().from(listings).where(eq(listings.id, n.listingId)))[0];
    return { ...n, listing: l, history: JSON.parse(n.history) as { role: string; offerCents: number; message: string }[] };
  }));

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-8">
        <span className="text-amber-400 text-sm font-semibold uppercase tracking-widest block mb-2">Active deals</span>
        <h1 className="text-3xl md:text-4xl font-black text-white">Negotiations</h1>
        <p className="text-slate-400 mt-1">Every offer your agent has made or fielded.</p>
      </div>

      {enriched.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-5xl mb-4">🤝</p>
          <p className="text-white text-lg font-semibold mb-2">No negotiations yet</p>
          <p className="text-slate-400 mb-6">Find something on the marketplace and make an offer.</p>
          <Link href="/test/marketplace" className="btn-primary">Browse marketplace →</Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {enriched.map((n) => {
            const lastMsg = n.history[n.history.length - 1];
            const isBuyer = n.buyerId === session!.userId;
            return (
              <div key={n.id} className="card p-5">
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge text-xs ${n.status === "accepted" ? "bg-green-500/20 text-green-400 border border-green-500/30" : n.status === "active" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-white/10 text-slate-400 border border-white/10"}`}>
                        {n.status}
                      </span>
                      <span className="badge bg-white/[0.04] border border-white/[0.08] text-slate-400 text-xs">
                        {isBuyer ? "Buying" : "Selling"}
                      </span>
                    </div>
                    <Link href={`/test/listings/${n.listingId}`} className="font-bold text-white hover:text-brand-300 transition">
                      {n.listing?.title || "Listing removed"}
                    </Link>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Asked → Current</p>
                    <p className="text-sm">
                      <span className="text-slate-400">${(n.initialPriceCents / 100).toFixed(0)}</span>
                      {" → "}
                      <span className="text-white font-bold">${(n.currentOfferCents / 100).toFixed(0)}</span>
                    </p>
                  </div>
                </div>
                {lastMsg && (
                  <div className={`p-3 rounded-xl text-sm ${lastMsg.role === "buyer" ? "bg-brand-500/5 border border-brand-500/20" : "bg-purple-500/5 border border-purple-500/20"}`}>
                    <p className={`text-xs font-semibold mb-1 ${lastMsg.role === "buyer" ? "text-brand-300" : "text-purple-300"}`}>
                      {lastMsg.role === "buyer" ? "🙋 Buyer" : "🤖 Seller agent"}
                    </p>
                    <p className="text-slate-300">{lastMsg.message}</p>
                  </div>
                )}
                <div className="flex justify-end mt-3">
                  <Link href={`/test/listings/${n.listingId}`} className="text-sm text-brand-400 hover:text-brand-300 transition">
                    Continue negotiating →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
