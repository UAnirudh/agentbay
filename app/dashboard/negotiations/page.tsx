import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function NegotiationsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const negotiations = await prisma.negotiation.findMany({
    where: { OR: [{ buyerId: session.userId }, { sellerId: session.userId }] },
    include: {
      listing: { select: { id: true, title: true, askingPrice: true, photoUrl: true } },
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      transaction: { select: { status: true } },
    },
    orderBy: { startedAt: "desc" },
  });

  const active = negotiations.filter((n) => n.status === "ACTIVE");
  const deals = negotiations.filter((n) => n.status === "DEAL_REACHED");
  const closed = negotiations.filter((n) => !["ACTIVE", "DEAL_REACHED"].includes(n.status));

  function NegCard({ n }: { n: (typeof negotiations)[0] }) {
    const isBuyer = n.buyerId === session!.userId;
    const other = isBuyer ? n.seller : n.buyer;
    const lastMsg = n.messages[0];
    const statusColors: Record<string, string> = {
      ACTIVE: "bg-yellow-100 text-yellow-700",
      DEAL_REACHED: "bg-green-100 text-green-700",
      DECLINED: "bg-red-100 text-red-700",
      EXPIRED: "bg-slate-100 text-slate-500",
    };

    return (
      <Link
        href={`/dashboard/negotiations/${n.id}`}
        className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-brand-200 hover:bg-brand-50 transition-all"
      >
        <div className="w-12 h-12 bg-slate-100 rounded-xl shrink-0 flex items-center justify-center overflow-hidden">
          {n.listing.photoUrl ? (
            <img src={n.listing.photoUrl} alt="" className="w-full h-full object-cover" />
          ) : "🏷️"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-900 truncate">{n.listing.title}</p>
          <p className="text-sm text-slate-500">
            {isBuyer ? "Buying from" : "Selling to"} {other.name}
          </p>
          {lastMsg && (
            <p className="text-xs text-slate-400 mt-0.5">
              {lastMsg.fromRole === "BUYER" ? "You" : other.name} offered ${lastMsg.price}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <span className={`badge text-xs ${statusColors[n.status] || "bg-slate-100 text-slate-600"}`}>
            {n.status.replace("_", " ")}
          </span>
          {n.finalPrice && (
            <p className="text-sm font-bold text-slate-900 mt-1">${n.finalPrice}</p>
          )}
          {n.transaction && (
            <p className="text-xs text-slate-400">{n.transaction.status}</p>
          )}
        </div>
      </Link>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">My Deals</h1>

      {negotiations.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">🤝</div>
          <p className="text-slate-500 mb-4">No negotiations yet</p>
          <Link href="/dashboard/buy" className="btn-primary">Browse Items to Buy</Link>
        </div>
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Active ({active.length})
              </h2>
              <div className="space-y-2">
                {active.map((n) => <NegCard key={n.id} n={n} />)}
              </div>
            </section>
          )}
          {deals.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-green-600 uppercase tracking-wider mb-3">
                Deal Reached ({deals.length})
              </h2>
              <div className="space-y-2">
                {deals.map((n) => <NegCard key={n.id} n={n} />)}
              </div>
            </section>
          )}
          {closed.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Closed ({closed.length})
              </h2>
              <div className="space-y-2">
                {closed.map((n) => <NegCard key={n.id} n={n} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
