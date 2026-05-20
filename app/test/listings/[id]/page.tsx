import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { listings, users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import ListingActions from "./ListingActions";

export const dynamic = "force-dynamic";

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const listing = db.select().from(listings).where(eq(listings.id, id)).get();
  if (!listing) notFound();

  db.update(listings).set({ views: listing.views + 1 }).where(eq(listings.id, id)).run();

  const seller = db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, listing.sellerId)).get();
  const isMyListing = session?.userId === listing.sellerId;
  const tags: string[] = listing.tags ? JSON.parse(listing.tags) : [];

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <Link href="/test/marketplace" className="text-sm text-slate-500 hover:text-white transition mb-6 inline-block">← Back to marketplace</Link>

      <div className="card p-8">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="badge bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 text-xs">AgentBay</span>
          <span className="badge bg-white/[0.04] border border-white/[0.08] text-slate-400 text-xs capitalize">{listing.category}</span>
          <span className="badge bg-white/[0.04] border border-white/[0.08] text-slate-400 text-xs capitalize">{listing.condition.replace("_", " ")}</span>
          {listing.aiGenerated && <span className="badge bg-purple-500/15 text-purple-400 border border-purple-500/30 text-xs">✨ AI-written</span>}
          {listing.location && <span className="text-xs text-slate-500">📍 {listing.location}</span>}
        </div>

        <h1 className="text-3xl md:text-4xl font-black text-white mb-3">{listing.title}</h1>

        <div className="flex items-baseline gap-3 mb-6">
          <p className="text-4xl font-black text-white">${(listing.priceCents / 100).toFixed(2)}</p>
          <p className="text-sm text-slate-500">listed by {seller?.name || "AgentBay user"}</p>
        </div>

        <div className="prose prose-invert max-w-none mb-6">
          <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{listing.description}</p>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {tags.map((t) => (
              <span key={t} className="badge bg-white/[0.04] border border-white/[0.08] text-slate-400 text-xs">#{t}</span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-slate-500 mb-6 pt-6 border-t border-white/[0.06]">
          <span>{listing.views} views</span>
          <span>·</span>
          <span>listed {new Date(listing.createdAt as Date).toLocaleDateString()}</span>
        </div>

        {isMyListing ? (
          <div className="card p-4 bg-purple-500/5 border-purple-500/20 text-sm">
            <p className="text-purple-300 font-semibold mb-1">This is your listing</p>
            <p className="text-slate-400">Your AI seller agent will negotiate with any buyer that makes an offer.</p>
          </div>
        ) : (
          <ListingActions listingId={listing.id} askingPriceCents={listing.priceCents} />
        )}
      </div>
    </div>
  );
}
