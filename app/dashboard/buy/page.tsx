"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Listing {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  askingPrice: number;
  photoUrl?: string;
  city?: string;
  viewCount: number;
  seller: { id: string; name: string; trustScore: number };
}

const CATEGORIES = ["All", "Electronics", "Furniture", "Clothing", "Toys & Kids", "Tools", "Appliances", "Sports", "Books", "Other"];
const CONDITIONS = ["Any", "NEW", "LIKE_NEW", "GOOD", "FAIR"];

export default function BuyPage() {
  const [query, setQuery] = useState("");
  const [agentQuery, setAgentQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [condition, setCondition] = useState("Any");
  const [maxPrice, setMaxPrice] = useState("");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [agentSearching, setAgentSearching] = useState(false);
  const [agentSummary, setAgentSummary] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchListings();
  }, [category, condition, maxPrice]);

  async function fetchListings() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (category !== "All") params.set("category", category);
      if (condition !== "Any") params.set("condition", condition);
      if (maxPrice) params.set("maxPrice", maxPrice);

      const res = await fetch(`/api/listings?${params}`);
      const data = await res.json();
      setListings(data.listings || []);
    } catch {
      setError("Failed to load listings");
    } finally {
      setLoading(false);
    }
  }

  async function handleAgentSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!agentQuery.trim()) return;
    setAgentSearching(true);
    setError("");
    setAgentSummary("");
    try {
      const res = await fetch("/api/agent/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: agentQuery }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setListings(data.listings || []);
      setAgentSummary(data.intent?.summary || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setAgentSearching(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Browse & Buy</h1>
        <p className="text-slate-500 mt-1">Tell your agent what you want, or browse below</p>
      </div>

      {/* Agent Search */}
      <div className="card p-5 mb-6 border-brand-200 bg-brand-50">
        <p className="text-sm font-semibold text-brand-700 mb-3">🤖 Ask your agent</p>
        <form onSubmit={handleAgentSearch} className="flex gap-3">
          <input
            className="input flex-1 bg-white"
            placeholder='e.g. "Good laptop under $300 for school"'
            value={agentQuery}
            onChange={(e) => setAgentQuery(e.target.value)}
          />
          <button type="submit" disabled={agentSearching} className="btn-primary whitespace-nowrap">
            {agentSearching ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Searching...
              </span>
            ) : "Find It →"}
          </button>
        </form>
        {agentSummary && (
          <p className="text-sm text-brand-700 mt-3 bg-white rounded-lg p-3 border border-brand-100">
            🤖 {agentSummary}
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2">
          <input
            className="input w-48"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchListings()}
          />
        </div>
        <select className="input w-44" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="input w-36" value={condition} onChange={(e) => setCondition(e.target.value)}>
          {CONDITIONS.map((c) => <option key={c}>{c.replace("_", " ")}</option>)}
        </select>
        <input
          type="number"
          className="input w-36"
          placeholder="Max price"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
        />
        <button onClick={fetchListings} className="btn-secondary">Filter</button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm mb-4">{error}</div>
      )}

      {loading || agentSearching ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mr-3"></div>
          Looking for great deals...
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-slate-500">No listings found. Try adjusting your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {listings.map((l) => (
            <Link
              key={l.id}
              href={`/dashboard/buy/${l.id}`}
              className="card overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              <div className="aspect-video bg-slate-100 flex items-center justify-center">
                {l.photoUrl ? (
                  <img src={l.photoUrl} alt={l.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">🏷️</span>
                )}
              </div>
              <div className="p-4">
                <p className="text-sm font-medium text-slate-900 line-clamp-2 leading-snug">{l.title}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-xs text-slate-500">{l.condition.replace("_", " ")}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-xs text-slate-500">⭐ {l.seller.trustScore.toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-lg font-bold text-slate-900">${l.askingPrice}</p>
                  {l.city && <p className="text-xs text-slate-400">{l.city}</p>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
