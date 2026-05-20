import Link from "next/link";
import { db } from "@/lib/db";
import { listings } from "@/lib/schema";
import { getSession } from "@/lib/auth";
import { eq, and, ne, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function MyListingsPage() {
  const session = await getSession();
  const items = db.select().from(listings)
    .where(and(eq(listings.sellerId, session!.userId), ne(listings.status, "deleted")))
    .orderBy(desc(listings.createdAt))
    .all();

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <span className="text-purple-400 text-sm font-semibold uppercase tracking-widest block mb-2">Your shop</span>
          <h1 className="text-3xl md:text-4xl font-black text-white">My listings</h1>
        </div>
        <Link href="/test/sell" className="btn-primary">+ New listing</Link>
      </div>

      {items.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-5xl mb-4">📦</p>
          <p className="text-white text-lg font-semibold mb-2">No listings yet</p>
          <p className="text-slate-400 mb-6">Let the AI write your first one.</p>
          <Link href="/test/sell" className="btn-primary">List something →</Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <Link key={item.id} href={`/test/listings/${item.id}`} className="card p-5 group hover:border-purple-500/30 transition-all">
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`badge text-xs ${item.status === "active" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-white/10 text-slate-400 border border-white/10"}`}>
                      {item.status}
                    </span>
                    <span className="text-xs text-slate-600 capitalize">{item.category}</span>
                    {item.aiGenerated && <span className="text-xs text-purple-400">✨ AI</span>}
                  </div>
                  <h3 className="font-bold text-white truncate group-hover:text-purple-300 transition">{item.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{item.views} views · listed {new Date(item.createdAt as Date).toLocaleDateString()}</p>
                </div>
                <p className="text-2xl font-black text-white shrink-0">${(item.priceCents / 100).toFixed(0)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
