import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import NegotiationActions from "./negotiation-actions";
import PaymentButton from "./payment-button";

export default async function NegotiationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const { id } = await params;
  const { payment } = await searchParams;
  const session = await getSession();
  if (!session) redirect("/login");

  const negotiation = await prisma.negotiation.findUnique({
    where: { id },
    include: {
      listing: true,
      buyer: { select: { id: true, name: true, trustScore: true } },
      seller: { select: { id: true, name: true, trustScore: true } },
      messages: { orderBy: { createdAt: "asc" } },
      transaction: true,
    },
  });

  if (!negotiation) notFound();
  const isBuyer = negotiation.buyerId === session.userId;
  const isSeller = negotiation.sellerId === session.userId;
  if (!isBuyer && !isSeller) redirect("/dashboard");

  const other = isBuyer ? negotiation.seller : negotiation.buyer;
  const lastMsg = negotiation.messages[negotiation.messages.length - 1];
  const myLastOffer = [...negotiation.messages]
    .reverse()
    .find((m) => m.fromRole === (isBuyer ? "BUYER" : "SELLER"))?.price;
  const round = Math.ceil(negotiation.messages.length / 2);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/negotiations" className="text-slate-500 hover:text-slate-900 text-sm">
          ← All Deals
        </Link>
      </div>

      {/* Payment success banner */}
      {payment === "success" && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-700 text-sm font-medium">
          🎉 Payment successful! Funds held in escrow until you confirm receipt.
        </div>
      )}

      {/* Header */}
      <div className="card p-6 mb-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-slate-100 rounded-xl shrink-0 flex items-center justify-center overflow-hidden">
            {negotiation.listing.photoUrl ? (
              <img src={negotiation.listing.photoUrl} alt="" className="w-full h-full object-cover" />
            ) : "🏷️"}
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-slate-900">{negotiation.listing.title}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {isBuyer ? "Buying from" : "Selling to"} {other.name} · ⭐ {other.trustScore.toFixed(1)}
            </p>
            <p className="text-sm text-slate-500">Asking: ${negotiation.listing.askingPrice}</p>
          </div>
          <div className="text-right">
            <span className={`badge ${
              negotiation.status === "DEAL_REACHED" ? "bg-green-100 text-green-700" :
              negotiation.status === "ACTIVE" ? "bg-yellow-100 text-yellow-700" :
              "bg-slate-100 text-slate-500"
            }`}>
              {negotiation.status.replace("_", " ")}
            </span>
            {negotiation.finalPrice && (
              <p className="text-xl font-bold text-green-700 mt-1">${negotiation.finalPrice}</p>
            )}
          </div>
        </div>
      </div>

      {/* Negotiation Log */}
      <div className="card p-6 mb-4">
        <h2 className="font-semibold text-slate-900 mb-4">
          Negotiation Log · Round {round}/4
        </h2>
        <div className="space-y-3">
          {negotiation.messages.map((msg) => {
            const isMe = (msg.fromRole === "BUYER" && isBuyer) || (msg.fromRole === "SELLER" && isSeller);
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs rounded-2xl px-4 py-3 ${
                  isMe ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-900"
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs opacity-70">
                      🤖 {isMe ? "Your" : other.name + "'s"} agent
                    </span>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                      isMe ? "bg-white/20" : "bg-slate-200"
                    }`}>
                      {msg.messageType}
                    </span>
                  </div>
                  <p className="text-lg font-bold">${msg.price}</p>
                  {msg.agentReasoning && (
                    <p className={`text-xs mt-1 opacity-80`}>{msg.agentReasoning}</p>
                  )}
                  <p className={`text-xs mt-1 opacity-50`}>
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {negotiation.status === "DEAL_REACHED" && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl text-center">
            <p className="font-semibold text-green-700">🎉 Deal reached at ${negotiation.finalPrice}!</p>
            {isBuyer && negotiation.listing.askingPrice > negotiation.finalPrice! && (
              <p className="text-sm text-green-600 mt-1">
                You saved ${(negotiation.listing.askingPrice - negotiation.finalPrice!).toFixed(2)} vs asking price
              </p>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {negotiation.status === "ACTIVE" && lastMsg && (
        <div className="card p-6 mb-4">
          <h2 className="font-semibold text-slate-900 mb-4">Your Response</h2>
          <NegotiationActions
            negotiationId={id}
            isBuyer={isBuyer}
            isSeller={isSeller}
            lastPrice={lastMsg.price}
            lastFromRole={lastMsg.fromRole}
            myLastOffer={myLastOffer}
            floorPrice={negotiation.listing.floorPrice ?? undefined}
            askingPrice={negotiation.listing.askingPrice}
          />
        </div>
      )}

      {/* Payment */}
      {negotiation.status === "DEAL_REACHED" && isBuyer && (
        <div className="card p-6">
          {negotiation.transaction ? (
            <div>
              <p className="font-semibold text-slate-900 mb-2">Payment Status</p>
              <div className={`p-4 rounded-xl text-center ${
                negotiation.transaction.status === "COMPLETED" ? "bg-green-50 text-green-700" :
                negotiation.transaction.status === "IN_ESCROW" ? "bg-blue-50 text-blue-700" :
                "bg-yellow-50 text-yellow-700"
              }`}>
                {negotiation.transaction.status === "COMPLETED" && "✅ Payment complete — enjoy your item!"}
                {negotiation.transaction.status === "IN_ESCROW" && "💳 Paid — funds in escrow. Confirm receipt when item arrives."}
                {negotiation.transaction.status === "PENDING" && "⏳ Payment pending"}
              </div>
              {negotiation.transaction.status === "IN_ESCROW" && (
                <PaymentButton mode="confirm" negotiationId={id} label="✅ Confirm Receipt — Release Payment" />
              )}
            </div>
          ) : (
            <div>
              <p className="font-semibold text-slate-900 mb-1">Complete Your Purchase</p>
              <p className="text-sm text-slate-500 mb-4">
                Payment held securely until you confirm delivery
              </p>
              <PaymentButton mode="checkout" negotiationId={id} label={`Pay $${negotiation.finalPrice} →`} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
