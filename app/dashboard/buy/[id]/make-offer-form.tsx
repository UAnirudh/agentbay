"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MakeOfferForm({
  listingId,
  askingPrice,
}: {
  listingId: string;
  askingPrice: number;
}) {
  const router = useRouter();
  const [maxBudget, setMaxBudget] = useState(String(Math.round(askingPrice * 0.9)));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!maxBudget || parseFloat(maxBudget) <= 0) {
      setError("Please enter your max budget");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/negotiations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, maxBudget: parseFloat(maxBudget) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/dashboard/negotiations/${data.negotiation.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start negotiation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
      )}
      <div>
        <label className="label">Your max budget ($)</label>
        <input
          type="number"
          className="input"
          value={maxBudget}
          onChange={(e) => setMaxBudget(e.target.value)}
          min={1}
          step={0.01}
          required
        />
        <p className="text-xs text-slate-400 mt-1">
          Your agent will open below this and negotiate toward the best price
        </p>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full py-3">
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            Agent negotiating...
          </span>
        ) : "🤖 Start Negotiation"}
      </button>
      <p className="text-xs text-slate-400 text-center">
        Your agent opens a lower offer and negotiates on your behalf
      </p>
    </form>
  );
}
