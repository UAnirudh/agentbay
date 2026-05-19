import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import MakeOfferForm from "./make-offer-form";

export default async function BuyListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      seller: { select: { id: true, name: true, trustScore: true, identityLevel: true, createdAt: true } },
    },
  });

  if (!listing) notFound();

  const isSeller = listing.sellerId === session.userId;

  // Increment views
  await prisma.listing.update({ where: { id }, data: { viewCount: { increment: 1 } } });

  // Check if buyer already has a negotiation
  const existingNeg = !isSeller
    ? await prisma.negotiation.findFirst({
        where: { listingId: id, buyerId: session.userId },
        orderBy: { startedAt: "desc" },
      })
    : null;

  const sellerSince = new Date(listing.seller.createdAt).getFullYear();
  const conditionLabels: Record<string, { label: string; color: string }> = {
    NEW: { label: "New", color: "text-green-700 bg-green-100" },
    LIKE_NEW: { label: "Like New", color: "text-emerald-700 bg-emerald-100" },
    GOOD: { label: "Good", color: "text-blue-700 bg-blue-100" },
    FAIR: { label: "Fair", color: "text-yellow-700 bg-yellow-100" },
    POOR: { label: "Poor", color: "text-red-700 bg-red-100" },
  };
  const cond = conditionLabels[listing.condition] || { label: listing.condition, color: "text-slate-600 bg-slate-100" };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/buy" className="text-slate-500 hover:text-slate-900 text-sm">← Browse</Link>
      </div>

      <div className="grid md:grid-cols-5 gap-6">
        {/* Main content */}
        <div className="md:col-span-3 space-y-4">
          <div className="card overflow-hidden">
            <div className="aspect-video bg-slate-100 flex items-center justify-center">
              {listing.photoUrl ? (
                <img src={listing.photoUrl} alt={listing.title} className="w-full h-full object-cover" />
              ) : (
                <span className="text-6xl">🏷️</span>
              )}
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className={`badge ${cond.color}`}>{cond.label}</span>
                <span className="badge bg-slate-100 text-slate-600">{listing.category}</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">{listing.title}</h1>
              {listing.city && (
                <p className="text-slate-500 text-sm mt-1">📍 {listing.city}</p>
              )}
              <p className="text-slate-600 mt-4 leading-relaxed">{listing.description}</p>
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 text-sm text-slate-500">
                <span>{listing.viewCount} views</span>
                <span>Listed {new Date(listing.createdAt).toLocaleDateString()}</span>
                <span>{listing.fulfillment.includes("LOCAL_PICKUP") ? "📍 Local pickup" : "📦 Ships"}</span>
              </div>
            </div>
          </div>

          {/* Seller info */}
          <div className="card p-5">
            <p className="text-sm font-medium text-slate-700 mb-3">About the seller</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center font-semibold text-brand-700">
                {listing.seller.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-slate-900">{listing.seller.name}</p>
                <p className="text-sm text-slate-500">
                  ⭐ {listing.seller.trustScore.toFixed(1)} · Member since {sellerSince}
                  {listing.seller.identityLevel >= 1 && " · ✅ Verified"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="md:col-span-2 space-y-4">
          <div className="card p-6">
            <p className="text-3xl font-bold text-slate-900 mb-1">${listing.askingPrice}</p>
            <p className="text-sm text-slate-500 mb-4">Asking price · Agent will negotiate</p>

            {listing.status !== "ACTIVE" ? (
              <div className="bg-slate-100 rounded-xl p-4 text-center text-slate-500">
                This item is no longer available
              </div>
            ) : isSeller ? (
              <div className="bg-brand-50 rounded-xl p-4 text-center text-brand-700 text-sm">
                This is your listing
                <br />
                <Link href={`/dashboard/listings/${id}`} className="underline mt-1 inline-block">
                  Manage listing →
                </Link>
              </div>
            ) : existingNeg ? (
              <div>
                <div className={`rounded-xl p-4 text-center text-sm mb-3 ${
                  existingNeg.status === "DEAL_REACHED"
                    ? "bg-green-50 text-green-700"
                    : existingNeg.status === "ACTIVE"
                    ? "bg-yellow-50 text-yellow-700"
                    : "bg-slate-50 text-slate-600"
                }`}>
                  {existingNeg.status === "DEAL_REACHED" && "🎉 Deal reached!"}
                  {existingNeg.status === "ACTIVE" && "🤖 Negotiation in progress"}
                  {existingNeg.status === "DECLINED" && "❌ Negotiation declined"}
                  {existingNeg.status === "EXPIRED" && "⏰ Negotiation expired"}
                </div>
                <Link href={`/dashboard/negotiations/${existingNeg.id}`} className="btn-primary w-full text-center block">
                  View Negotiation →
                </Link>
              </div>
            ) : (
              <MakeOfferForm listingId={id} askingPrice={listing.askingPrice} />
            )}
          </div>

          <div className="card p-4 bg-green-50 border-green-200">
            <p className="text-sm font-medium text-green-800 mb-1">🛡️ Buyer Protection</p>
            <p className="text-xs text-green-700">
              Payment held in escrow until you confirm receipt. Full refund if item is not as described.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
