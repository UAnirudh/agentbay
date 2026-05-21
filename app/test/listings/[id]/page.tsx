import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { listings, users } from "@/lib/schema";
import { eq, and, ne, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import ListingActions from "./ListingActions";

export const dynamic = "force-dynamic";

const CATEGORY_ICONS: Record<string, string> = {
  electronics: "📱", furniture: "🛋️", clothing: "👕", books: "📚",
  vehicles: "🚗", appliances: "🔌", tools: "🔧", sports: "🏀",
  toys: "🧸", other: "📦",
};

const CONDITION_COLORS: Record<string, string> = {
  new: "green", like_new: "cyan", good: "brand", fair: "amber",
};

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const listing = db.select().from(listings).where(eq(listings.id, id)).get();
  if (!listing) notFound();

  db.update(listings).set({ views: listing.views + 1 }).where(eq(listings.id, id)).run();

  const seller = db.select({ name: users.name, email: users.email, createdAt: users.createdAt }).from(users).where(eq(users.id, listing.sellerId)).get();
  const isMyListing = session?.userId === listing.sellerId;
  const tags: string[] = listing.tags ? JSON.parse(listing.tags) : [];
  const icon = CATEGORY_ICONS[listing.category] || "📦";
  const condColor = CONDITION_COLORS[listing.condition] || "slate";

  const related = db.select().from(listings)
    .where(and(eq(listings.category, listing.category), eq(listings.status, "active"), ne(listings.id, listing.id)))
    .orderBy(desc(listings.createdAt))
    .limit(4)
    .all();

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="text-sm text-slate-500 mb-6 flex items-center gap-2">
        <Link href="/test/marketplace" className="hover:text-white transition">Marketplace</Link>
        <span>›</span>
        <Link href={`/test/marketplace?category=${listing.category}`} className="hover:text-white transition capitalize">{listing.category}</Link>
        <span>›</span>
        <span className="text-slate-400 truncate">{listing.title}</span>
      </div>

      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-6 mb-8">
        <div className="card overflow-hidden">
          <div className="aspect-[5/4] relative bg-gradient-to-br from-white/[0.04] to-white/[0.01] flex items-center justify-center">
            <div className="absolute inset-0 grid-bg opacity-30" />
            <div className="relative text-[10rem] leading-none drop-shadow-2xl">{icon}</div>
            {listing.aiGenerated && (
              <span className="absolute top-4 right-4 badge bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs uppercase tracking-wider">
                ✨ AI-written listing
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="badge bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 text-xs">AgentBay</span>
            <span className="badge bg-white/[0.04] border border-white/[0.08] text-slate-400 text-xs capitalize">{listing.category}</span>
            <span className={`badge bg-${condColor}-500/15 text-${condColor}-300 border border-${condColor}-500/40 text-xs capitalize`}>
              {listing.condition.replace("_", " ")}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-white mb-3 leading-tight">{listing.title}</h1>

          <div className="flex items-baseline gap-3 mb-5">
            <p className="text-5xl font-black text-white tracking-tight">${(listing.priceCents / 100).toFixed(0)}</p>
            <p className="text-sm text-slate-500">.{((listing.priceCents % 100)).toString().padStart(2, "0")}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="card p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-1">Seller</p>
              <p className="text-sm font-semibold text-white truncate">{seller?.name || seller?.email?.split("@")[0] || "Anonymous"}</p>
            </div>
            <div className="card p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-1">Location</p>
              <p className="text-sm font-semibold text-white truncate">{listing.location || "Online · ships"}</p>
            </div>
            <div className="card p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-1">Views</p>
              <p className="text-sm font-semibold text-white">{listing.views}</p>
            </div>
            <div className="card p-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-1">Listed</p>
              <p className="text-sm font-semibold text-white">{new Date(listing.createdAt as Date).toLocaleDateString()}</p>
            </div>
          </div>

          {isMyListing ? (
            <div className="card p-5 bg-purple-500/5 border-purple-500/20">
              <p className="text-purple-300 font-semibold mb-1 flex items-center gap-2"><span>🛡️</span> This is your listing</p>
              <p className="text-sm text-slate-400">Your AI seller agent will field offers and negotiate on your behalf.</p>
              <div className="flex gap-2 mt-4">
                <Link href="/test/my-listings" className="btn-secondary text-sm">Manage shop</Link>
                <Link href="/test/negotiations" className="btn-secondary text-sm">View offers</Link>
              </div>
            </div>
          ) : (
            <ListingActions listingId={listing.id} askingPriceCents={listing.priceCents} />
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-6">
        <div className="card p-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Description</h2>
          <p className="text-slate-300 whitespace-pre-wrap leading-relaxed text-[15px]">{listing.description}</p>
          {tags.length > 0 && (
            <div className="mt-5 pt-5 border-t border-white/[0.06]">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span key={t} className="badge bg-white/[0.04] border border-white/[0.08] text-slate-400 text-xs">#{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          {related.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-3">Similar items</h2>
              <div className="space-y-2">
                {related.map((r) => {
                  const rIcon = CATEGORY_ICONS[r.category] || "📦";
                  return (
                    <Link key={r.id} href={`/test/listings/${r.id}`} className="card-hover flex items-center gap-3 p-3">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] flex items-center justify-center text-3xl shrink-0">
                        {rIcon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{r.title}</p>
                        <p className="text-xs text-slate-500 capitalize">{r.condition.replace("_", " ")}</p>
                      </div>
                      <p className="font-bold text-white shrink-0">${(r.priceCents / 100).toFixed(0)}</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
