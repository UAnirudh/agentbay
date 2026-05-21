"use client";

import { useState } from "react";
import Link from "next/link";

interface Deal {
  title: string;
  description: string;
  priceCents: number;
  source: string;
  url: string;
  condition: string;
  location?: string;
  matchScore: number;
  reasoning: string;
  negotiable: boolean;
  estimatedSavings?: number;
}

import { resolveMarketplace } from "@/lib/marketplaces";

const examples = [
  "MacBook Pro M3 under $1400",
  "Used Peloton Bike+ in good condition",
  "Nintendo Switch OLED with games",
  "IKEA sectional sofa, must pick up in Brooklyn",
  "DJI Mavic 3 drone with extra batteries",
];

export default function BuyAgent() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function runSearch(q: string) {
    setLoading(true);
    setError(null);
    setSearched(true);
    setDeals([]);
    try {
      const res = await fetch("/api/test/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, maxResults: 10 }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setDeals(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-8">
        <span className="text-brand-400 text-sm font-semibold uppercase tracking-widest block mb-2">Buyer Agent</span>
        <h1 className="text-3xl md:text-4xl font-black text-white mb-2">What do you want to buy?</h1>
        <p className="text-slate-400">Describe it in plain English. I'll search AgentBay, eBay, Facebook, Craigslist, OfferUp, and Mercari in one go.</p>
      </div>

      <div className="card p-5 mb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (query.trim()) runSearch(query.trim());
          }}
        >
          <div className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='e.g. "MacBook Pro 14&quot; M3 with 16GB RAM under $1500"'
              className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50 transition"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Searching..." : "Search the web"}
            </button>
          </div>
        </form>
        {!searched && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-xs text-slate-500 mr-1 self-center">Try:</span>
            {examples.map((ex) => (
              <button
                key={ex}
                onClick={() => {
                  setQuery(ex);
                  runSearch(ex);
                }}
                className="text-xs px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:bg-white/[0.08] hover:text-white transition"
              >
                {ex}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && (
        <div className="card p-8 text-center">
          <div className="inline-block w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mb-3" />
          <p className="text-slate-400 text-sm">Agent scanning marketplaces, ranking by match quality, finding the best deals...</p>
        </div>
      )}

      {error && (
        <div className="card p-5 border-red-500/30 bg-red-500/5 text-red-300 text-sm">
          {error}
        </div>
      )}

      {!loading && deals.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-400">
              <strong className="text-white">{deals.length}</strong> matches across{" "}
              <strong className="text-white">{new Set(deals.map((d) => d.source)).size}</strong> sources
            </p>
            <p className="text-xs text-slate-600">Ranked by match score</p>
          </div>
          <div className="grid gap-3">
            {deals.map((d, i) => {
              const src = resolveMarketplace(d.source);
              const price = (d.priceCents / 100).toFixed(2);
              const isAgentBay = d.source === "agentbay";
              return (
                <div key={i} className="card p-5 hover:border-white/[0.12] transition-all">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`badge bg-${src.color}-500/15 text-${src.color}-400 border border-${src.color}-500/30 text-xs`}>
                          {src.name}
                        </span>
                        <span className="badge bg-white/[0.04] border border-white/[0.08] text-slate-400 text-xs">
                          {d.condition.replace("_", " ")}
                        </span>
                        {d.location && (
                          <span className="text-xs text-slate-500">📍 {d.location}</span>
                        )}
                        <div className="ml-auto flex items-center gap-1.5">
                          <div className="w-12 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-brand-500 to-purple-500" style={{ width: `${d.matchScore}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-white">{d.matchScore}%</span>
                        </div>
                      </div>
                      <h3 className="font-bold text-white text-base mb-1">{d.title}</h3>
                      <p className="text-slate-400 text-sm mb-2 line-clamp-2">{d.description}</p>
                      <p className="text-slate-500 text-xs italic">{d.reasoning}</p>
                    </div>
                    <div className="md:w-44 shrink-0 flex md:flex-col items-center md:items-end gap-3">
                      <div className="text-right">
                        <p className="text-2xl font-black text-white">${price}</p>
                        {d.estimatedSavings && d.estimatedSavings > 0 && (
                          <p className="text-xs text-green-400 font-semibold">save ${(d.estimatedSavings / 100).toFixed(0)}</p>
                        )}
                      </div>
                      {isAgentBay ? (
                        <Link href={d.url} className="btn-primary text-sm py-2 px-4 w-full text-center">
                          Buy & Negotiate
                        </Link>
                      ) : (
                        <a href={d.url} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm py-2 px-4 w-full text-center">
                          Search {src.name} ↗
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && searched && deals.length === 0 && !error && (
        <div className="card p-10 text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-slate-400 mb-2">No matches found.</p>
          <p className="text-slate-600 text-sm">Try a different search.</p>
        </div>
      )}
    </div>
  );
}
