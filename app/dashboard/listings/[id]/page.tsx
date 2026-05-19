import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import DeleteListingButton from "./delete-button";

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      seller: { select: { id: true, name: true, trustScore: true } },
      negotiations: {
        include: {
          buyer: { select: { id: true, name: true, trustScore: true } },
          messages: { orderBy: { createdAt: "asc" } },
        },
        orderBy: { startedAt: "desc" },
      },
    },
  });

  if (!listing) notFound();
  if (listing.sellerId !== session.userId) redirect("/dashboard");

  const conditionColors: Record<string, string> = {
    NEW: "bg-green-100 text-green-700",
    LIKE_NEW: "bg-emerald-100 text-emerald-700",
    GOOD: "bg-blue-100 text-blue-700",
    FAIR: "bg-yellow-100 text-yellow-700",
    POOR: "bg-red-100 text-red-700",
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-slate-500 hover:text-slate-900 text-sm">← Dashboard</Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-500">My Listing</span>
      </div>

      <div className="card overflow-hidden mb-6">
        {listing.photoUrl && (
          <div className="aspect-video bg-slate-100">
            <img src={listing.photoUrl} alt={listing.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{listing.title}</h1>
              <div className="flex items-center gap-2 mt-2">
                <span className={`badge ${conditionColors[listing.condition] || "bg-slate-100 text-slate-600"}`}>
                  {listing.condition.replace("_", " ")}
                </span>
                <span className="badge bg-slate-100 text-slate-600">{listing.category}</span>
                {listing.aiGenerated && (
                  <span className="badge bg-brand-100 text-brand-700">✨ AI Generated</span>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-3xl font-bold text-slate-900">${listing.askingPrice}</p>
              {listing.floorPrice && (
                <p className="text-sm text-slate-500 mt-0.5">Floor: ${listing.floorPrice}</p>
              )}
            </div>
          </div>

          <p className="text-slate-600 mt-4 leading-relaxed">{listing.description}</p>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div className="text-center">
              <p className="text-xl font-bold text-slate-900">{listing.viewCount}</p>
              <p className="text-xs text-slate-500">Views</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-slate-900">
                {listing.negotiations.filter((n) => n.status === "ACTIVE").length}
              </p>
              <p className="text-xs text-slate-500">Active Offers</p>
            </div>
            <div className="text-center">
              <span className={`badge text-sm ${listing.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                {listing.status}
              </span>
              <p className="text-xs text-slate-500 mt-1">Status</p>
            </div>
          </div>
        </div>
      </div>

      {/* Negotiations */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-slate-900 mb-4">
          Negotiations ({listing.negotiations.length})
        </h2>
        {listing.negotiations.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">No offers yet. Your agent is watching!</p>
        ) : (
          <div className="space-y-3">
            {listing.negotiations.map((n) => {
              const lastMsg = n.messages[n.messages.length - 1];
              return (
                <Link
                  key={n.id}
                  href={`/dashboard/negotiations/${n.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-brand-200 hover:bg-brand-50 transition-all"
                >
                  <div className={`w-3 h-3 rounded-full shrink-0 ${
                    n.status === "DEAL_REACHED" ? "bg-green-500" :
                    n.status === "ACTIVE" ? "bg-yellow-400" : "bg-slate-300"
                  }`} />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{n.buyer.name}</p>
                    <p className="text-sm text-slate-500">
                      {lastMsg ? `${lastMsg.messageType}: $${lastMsg.price}` : "Negotiating"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`badge ${
                      n.status === "DEAL_REACHED" ? "bg-green-100 text-green-700" :
                      n.status === "ACTIVE" ? "bg-yellow-100 text-yellow-700" :
                      "bg-slate-100 text-slate-600"
                    }`}>
                      {n.status.replace("_", " ")}
                    </span>
                    <p className="text-xs text-slate-400 mt-1">⭐ {n.buyer.trustScore.toFixed(1)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <DeleteListingButton listingId={listing.id} />
      </div>
    </div>
  );
}
