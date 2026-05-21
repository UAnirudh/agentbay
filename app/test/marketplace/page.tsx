import Link from "next/link";
import { db } from "@/lib/db";
import { listings, users } from "@/lib/schema";
import { eq, desc, like, and, or, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

const CATEGORY_ICONS: Record<string, string> = {
  electronics: "📱",
  furniture: "🛋️",
  clothing: "👕",
  books: "📚",
  vehicles: "🚗",
  appliances: "🔌",
  tools: "🔧",
  sports: "🏀",
  toys: "🧸",
  other: "📦",
};

const CONDITION_COLORS: Record<string, string> = {
  new: "green",
  like_new: "cyan",
  good: "brand",
  fair: "amber",
};

export default async function MarketplacePage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const params = await searchParams;
  const q = params.q?.trim();
  const cat = params.category?.trim();

  const where: ReturnType<typeof and>[] = [eq(listings.status, "active")];
  if (q) {
    where.push(or(like(listings.title, `%${q}%`), like(listings.description, `%${q}%`)) as ReturnType<typeof and>);
  }
  if (cat) {
    where.push(eq(listings.category, cat));
  }

  const items = await db.select().from(listings)
    .where(and(...where))
    .orderBy(desc(listings.createdAt))
    .limit(60);

  const sellerIds = Array.from(new Set(items.map((i) => i.sellerId)));
  const sellers = sellerIds.length > 0
    ? await db.select({ id: users.id, name: users.name, email: users.email }).from(users)
        .where(inArray(users.id, sellerIds))
    : [];
  const sellerMap = new Map(sellers.map((s) => [s.id, s.name || s.email.split("@")[0]]));

  const allActive = await db.select({ category: listings.category }).from(listings).where(eq(listings.status, "active"));
  const categoryCounts = new Map<string, number>();
  for (const a of allActive) categoryCounts.set(a.category, (categoryCounts.get(a.category) || 0) + 1);
  const categories = Array.from(categoryCounts.entries()).sort((a, b) => b[1] - a[1]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-8 flex items-end justify-between flex-wrap gap-4">
        <div>
          <span className="text-cyan-400 text-sm font-semibold uppercase tracking-widest block mb-2">Marketplace</span>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-1">Browse listings</h1>
          <p className="text-slate-400">{items.length} {items.length === 1 ? "item" : "items"} {cat ? `in ${cat}` : ""}{q ? ` matching "${q}"` : ""}</p>
        </div>
        <Link href="/test/sell" className="btn-primary text-sm">+ New listing</Link>
      </div>

      <form action="/test/marketplace" className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search listings..."
            className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition"
          />
          <button type="submit" className="btn-primary px-5">Search</button>
        </div>
      </form>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <Link
            href="/test/marketplace"
            className={`badge text-xs border ${!cat ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" : "bg-white/[0.04] text-slate-400 border-white/[0.08] hover:bg-white/[0.08]"}`}
          >
            All ({allActive.length})
          </Link>
          {categories.map(([c, n]) => (
            <Link
              key={c}
              href={`/test/marketplace?category=${c}`}
              className={`badge text-xs border capitalize ${cat === c ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" : "bg-white/[0.04] text-slate-400 border-white/[0.08] hover:bg-white/[0.08]"}`}
            >
              {CATEGORY_ICONS[c] || "📦"} {c} ({n})
            </Link>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-6xl mb-4">🏪</p>
          <p className="text-white text-xl font-semibold mb-2">Nothing here yet</p>
          <p className="text-slate-400 mb-6">{q ? "Try a different search." : "Be the first to list something."}</p>
          <Link href="/test/sell" className="btn-primary">List an item →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => {
            const condColor = CONDITION_COLORS[item.condition] || "slate";
            const icon = CATEGORY_ICONS[item.category] || "📦";
            const sellerName = sellerMap.get(item.sellerId) || "Seller";

            return (
              <Link
                key={item.id}
                href={`/test/listings/${item.id}`}
                className="group block card-hover overflow-hidden"
              >
                <div className="aspect-[5/4] relative bg-gradient-to-br from-white/[0.04] to-white/[0.01] flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 grid-bg opacity-30" />
                  <div className="relative text-7xl group-hover:scale-110 transition-transform duration-300">{icon}</div>
                  {item.aiGenerated && (
                    <span className="absolute top-3 right-3 badge bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] uppercase tracking-wider">
                      ✨ AI
                    </span>
                  )}
                  <span className={`absolute top-3 left-3 badge bg-${condColor}-500/20 text-${condColor}-300 border border-${condColor}-500/40 text-[10px] uppercase tracking-wider`}>
                    {item.condition.replace("_", " ")}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-white mb-1 line-clamp-2 group-hover:text-brand-300 transition-colors">{item.title}</h3>
                  <p className="text-xs text-slate-500 mb-3 line-clamp-1">by {sellerName}{item.location ? ` · ${item.location}` : ""}</p>
                  <div className="flex items-baseline justify-between">
                    <p className="text-2xl font-black text-white">${(item.priceCents / 100).toFixed(0)}</p>
                    <p className="text-xs text-slate-500">{item.views} views</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
