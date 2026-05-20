"use client";

import { useState } from "react";
import Link from "next/link";

interface HistoryEntry { role: string; offerCents: number; message: string }

export default function ListingActions({ listingId, askingPriceCents }: { listingId: string; askingPriceCents: number }) {
  const [offer, setOffer] = useState(((askingPriceCents * 0.85) / 100).toFixed(0));
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [negotiationId, setNegotiationId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [status, setStatus] = useState<string>("active");
  const [error, setError] = useState<string | null>(null);

  async function sendOffer() {
    const cents = Math.round(parseFloat(offer) * 100);
    if (!cents || cents < 1) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/test/negotiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          offerCents: cents,
          message: message || undefined,
          negotiationId,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setNegotiationId(data.negotiation.id);
      setHistory(JSON.parse(data.negotiation.history));
      setStatus(data.negotiation.status);
      setMessage("");
      if (data.negotiation.status === "accepted") {
        setOffer((data.negotiation.finalPriceCents / 100).toFixed(2));
      } else {
        setOffer((data.agentResponse.offerCents / 100).toFixed(2));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Negotiation failed");
    } finally {
      setLoading(false);
    }
  }

  if (status === "accepted") {
    return (
      <div className="card p-6 bg-green-500/5 border-green-500/30">
        <p className="text-2xl mb-2">🎉</p>
        <p className="text-green-400 font-bold text-lg mb-1">Deal accepted!</p>
        <p className="text-slate-300 mb-4">The seller agent accepted your offer of ${offer}. (Payment flow is mocked for this preview.)</p>
        <Link href="/test/negotiations" className="btn-primary text-sm">View all negotiations →</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.length > 0 && (
        <div className="card p-5 bg-white/[0.02]">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Negotiation in progress</p>
          <div className="space-y-3">
            {history.map((h, i) => (
              <div key={i} className={`p-3 rounded-xl text-sm ${h.role === "buyer" ? "bg-brand-500/10 border border-brand-500/20" : "bg-purple-500/10 border border-purple-500/20"}`}>
                <p className={`text-xs font-semibold mb-1 ${h.role === "buyer" ? "text-brand-300" : "text-purple-300"}`}>
                  {h.role === "buyer" ? "🙋 You" : "🤖 Seller agent"} · ${(h.offerCents / 100).toFixed(2)}
                </p>
                <p className="text-slate-300">{h.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card p-5">
        <p className="text-sm font-semibold text-white mb-3">
          {history.length === 0 ? "Make an offer" : "Counter the seller's offer"}
        </p>
        <div className="grid sm:grid-cols-[160px_1fr] gap-3 mb-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Your offer ($)</label>
            <input
              type="number"
              value={offer}
              onChange={(e) => setOffer(e.target.value)}
              step="0.01"
              min={1}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500/50 transition"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Message to seller (optional)</label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Can do cash pickup today"
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50 transition"
              disabled={loading}
            />
          </div>
        </div>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <button onClick={sendOffer} disabled={loading} className="btn-primary w-full disabled:opacity-50">
          {loading ? "Negotiating with AI seller..." : history.length === 0 ? "Send offer to AI agent" : "Counter-offer"}
        </button>
      </div>
    </div>
  );
}
