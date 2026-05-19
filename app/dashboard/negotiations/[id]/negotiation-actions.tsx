"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NegotiationActions({
  negotiationId,
  isBuyer,
  isSeller,
  lastPrice,
  lastFromRole,
  myLastOffer,
  floorPrice,
  askingPrice,
}: {
  negotiationId: string;
  isBuyer: boolean;
  isSeller: boolean;
  lastPrice: number;
  lastFromRole: string;
  myLastOffer?: number;
  floorPrice?: number;
  askingPrice: number;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"agent" | "manual">("agent");
  const [maxBudget, setMaxBudget] = useState("");
  const [counterPrice, setCounterPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Is it my turn to respond?
  const myTurn =
    (isBuyer && lastFromRole === "SELLER") || (isSeller && lastFromRole === "BUYER");

  if (!myTurn) {
    return (
      <div className="p-4 bg-yellow-50 rounded-xl text-center text-yellow-700 text-sm">
        🤖 Waiting for {isBuyer ? "seller" : "buyer"}&apos;s response...
      </div>
    );
  }

  async function respond(action: string, price?: number, useAgent = false, budget?: number) {
    setLoading(true);
    setError("");
    try {
      const body: Record<string, unknown> = { action, useAgent };
      if (price) body.price = price;
      if (budget) body.maxBudget = budget;
      const res = await fetch(`/api/negotiations/${negotiationId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to respond");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
      )}

      <div className="text-sm text-slate-500">
        Their offer: <span className="font-semibold text-slate-900">${lastPrice}</span>
      </div>

      {/* Mode toggle */}
      <div className="flex rounded-xl border border-slate-200 p-1 gap-1">
        <button
          onClick={() => setMode("agent")}
          className={`flex-1 text-sm py-2 rounded-lg font-medium transition-all ${
            mode === "agent" ? "bg-brand-500 text-white" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          🤖 Let Agent Decide
        </button>
        <button
          onClick={() => setMode("manual")}
          className={`flex-1 text-sm py-2 rounded-lg font-medium transition-all ${
            mode === "manual" ? "bg-brand-500 text-white" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          ✋ Manual
        </button>
      </div>

      {mode === "agent" ? (
        <div className="space-y-3">
          {isBuyer && (
            <div>
              <label className="label">Your max budget (agent won&apos;t exceed this)</label>
              <input
                type="number"
                className="input"
                placeholder="e.g. 250"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
              />
            </div>
          )}
          <button
            disabled={loading || (isBuyer && !maxBudget)}
            onClick={() => respond("", undefined, true, maxBudget ? parseFloat(maxBudget) : undefined)}
            className="btn-primary w-full"
          >
            {loading ? "Agent deciding..." : "🤖 Let My Agent Respond"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => respond("ACCEPT", lastPrice)}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
            >
              ✅ Accept ${lastPrice}
            </button>
            <button
              onClick={() => {
                if (!counterPrice) { setError("Enter a counter price"); return; }
                respond("COUNTER", parseFloat(counterPrice));
              }}
              disabled={loading}
              className="btn-secondary text-sm"
            >
              Counter
            </button>
            <button
              onClick={() => respond("DECLINE")}
              disabled={loading}
              className="btn-danger text-sm"
            >
              ❌ Decline
            </button>
          </div>
          <div>
            <label className="label">Counter price ($)</label>
            <input
              type="number"
              className="input"
              placeholder={isSeller ? `Above ${floorPrice ?? askingPrice * 0.8}` : `Below ${askingPrice}`}
              value={counterPrice}
              onChange={(e) => setCounterPrice(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
