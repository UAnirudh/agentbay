import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [user, myListings, myNegotiations, recentListings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, trustScore: true },
    }),
    prisma.listing.findMany({
      where: { sellerId: session.userId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.negotiation.findMany({
      where: {
        OR: [{ buyerId: session.userId }, { sellerId: session.userId }],
        status: { in: ["ACTIVE", "DEAL_REACHED"] },
      },
      include: {
        listing: { select: { title: true, photoUrl: true } },
        buyer: { select: { name: true } },
      },
      orderBy: { startedAt: "desc" },
      take: 5,
    }),
    prisma.listing.findMany({
      where: { status: "ACTIVE", sellerId: { not: session.userId } },
      include: { seller: { select: { name: true, trustScore: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  const totalEarned = await prisma.transaction
    .aggregate({
      where: { sellerId: session.userId, status: "COMPLETED" },
      _sum: { sellerPayout: true },
    })
    .then((r) => r._sum.sellerPayout ?? 0);

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Good morning, {firstName} 👋</h1>
          <p className="text-slate-500 mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
            Your agent is active
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/sell" className="btn-primary">+ Sell Something</Link>
          <Link href="/dashboard/buy" className="btn-secondary">🔍 Buy</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active Listings" value={myListings.length.toString()} icon="📦" />
        <StatCard label="Active Deals" value={myNegotiations.length.toString()} icon="🤝" />
        <StatCard label="Total Earned" value={`$${totalEarned.toFixed(0)}`} icon="💰" />
        <StatCard label="Trust Score" value={`${user?.trustScore?.toFixed(1) ?? "3.0"} ⭐`} icon="🛡️" />
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* My Listings */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">My Listings</h2>
            <Link href="/dashboard/sell" className="text-brand-500 text-sm hover:underline">+ New</Link>
          </div>
          {myListings.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📦</div>
              <p className="text-slate-500 text-sm">No active listings</p>
              <Link href="/dashboard/sell" className="btn-primary text-sm mt-3 inline-block">
                List Your First Item
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myListings.map((l) => (
                <Link
                  key={l.id}
                  href={`/dashboard/listings/${l.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-sm">
                    {l.photoUrl ? (
                      <img src={l.photoUrl} alt={l.title} className="w-full h-full object-cover rounded-lg" />
                    ) : "🏷️"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{l.title}</p>
                    <p className="text-xs text-slate-500">{l.viewCount} views</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">${l.askingPrice}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Active Deals */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Active Deals</h2>
            <Link href="/dashboard/negotiations" className="text-brand-500 text-sm hover:underline">View all</Link>
          </div>
          {myNegotiations.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🤝</div>
              <p className="text-slate-500 text-sm">No active deals</p>
              <Link href="/dashboard/buy" className="btn-secondary text-sm mt-3 inline-block">
                Browse Items
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myNegotiations.map((n) => (
                <Link
                  key={n.id}
                  href={`/dashboard/negotiations/${n.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full ${
                    n.status === "DEAL_REACHED" ? "bg-green-500" : "bg-yellow-400"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{n.listing.title}</p>
                    <p className="text-xs text-slate-500">{n.buyer.name}</p>
                  </div>
                  <span className={`badge text-xs ${
                    n.status === "DEAL_REACHED"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {n.status === "DEAL_REACHED" ? "Deal!" : "Negotiating"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Marketplace */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Fresh listings</h2>
          <Link href="/dashboard/buy" className="text-brand-500 text-sm hover:underline">Browse all →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {recentListings.map((l) => (
            <Link
              key={l.id}
              href={`/dashboard/buy/${l.id}`}
              className="card overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="aspect-video bg-slate-100 flex items-center justify-center">
                {l.photoUrl ? (
                  <img src={l.photoUrl} alt={l.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">🏷️</span>
                )}
              </div>
              <div className="p-4">
                <p className="text-sm font-medium text-slate-900 line-clamp-1">{l.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{l.condition} · {l.seller.name}</p>
                <p className="text-base font-bold text-slate-900 mt-2">${l.askingPrice}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="card p-5">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-sm text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}
