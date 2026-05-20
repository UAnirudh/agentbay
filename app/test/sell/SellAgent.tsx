"use client";

import { useState } from "react";
import Link from "next/link";

interface Draft {
  title: string;
  description: string;
  category: string;
  condition: string;
  suggestedPriceCents: number;
  priceFloorCents: number;
  priceCeilingCents: number;
  tags: string[];
  reasoning: string;
}

const examples = [
  "Old Xbox One with 2 controllers and 5 games",
  "Used Herman Miller Aeron chair, size B, gray, slight wear on armrests",
  "iPhone 14 Pro 256GB Deep Purple, unlocked, minor screen scratch",
  "Mountain bike, Trek Marlin 7, size L, 2 years old, well maintained",
];

export default function SellAgent() {
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [posted, setPosted] = useState<{ id: string; title: string } | null>(null);

  async function generateDraft() {
    if (!description.trim()) return;
    setLoading(true);
    setError(null);
    setDraft(null);
    setPosted(null);
    try {
      const res = await fetch("/api/test/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, location, useAI: true, dryRun: true }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (data.draft) {
        setDraft(data.draft);
        setPrice((data.draft.suggestedPriceCents / 100).toFixed(2));
      }
      if (data.listing) {
        setPosted({ id: data.listing.id, title: data.listing.title });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate");
    } finally {
      setLoading(false);
    }
  }

  async function publish() {
    if (!draft || !price) return;
    setLoading(true);
    try {
      const res = await fetch("/api/test/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: draft.description,
          title: draft.title,
          category: draft.category,
          condition: draft.condition,
          priceCents: Math.round(parseFloat(price) * 100),
          priceFloorCents: draft.priceFloorCents,
          tags: draft.tags,
          location,
          useAI: false,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPosted({ id: data.listing.id, title: data.listing.title });
      setDraft(null);
      setDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="mb-8">
        <span className="text-purple-400 text-sm font-semibold uppercase tracking-widest block mb-2">Seller Agent</span>
        <h1 className="text-3xl md:text-4xl font-black text-white mb-2">List something to sell</h1>
        <p className="text-slate-400">Just describe your item. The AI writes the listing, suggests a price, and posts it.</p>
      </div>

      {posted && (
        <div className="card p-5 mb-6 border-green-500/30 bg-green-500/5">
          <p className="text-green-400 font-semibold mb-1">✓ Listing published</p>
          <p className="text-white">{posted.title}</p>
          <div className="mt-3 flex gap-3">
            <Link href={`/test/listings/${posted.id}`} className="btn-primary text-sm py-2">View listing</Link>
            <Link href="/test/my-listings" className="btn-secondary text-sm py-2">My listings</Link>
          </div>
        </div>
      )}

      {!draft && (
        <div className="card p-6">
          <label className="block mb-2 text-sm font-semibold text-slate-300">Describe your item</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="The more detail you give, the better the listing. Brand, model, condition, what's included, any flaws..."
            rows={5}
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 transition mb-4 resize-none"
            disabled={loading}
          />
          <label className="block mb-2 text-sm font-semibold text-slate-300">Location (optional)</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Brooklyn, NY"
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 transition mb-5"
            disabled={loading}
          />
          <button
            onClick={generateDraft}
            disabled={loading || !description.trim()}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "AI is writing your listing..." : "Generate listing with AI"}
          </button>

          {!description && (
            <div className="mt-5">
              <p className="text-xs text-slate-500 mb-2">Try an example:</p>
              <div className="flex flex-wrap gap-2">
                {examples.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setDescription(ex)}
                    className="text-xs px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:bg-white/[0.08] hover:text-white transition text-left"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="card p-5 mt-4 border-red-500/30 bg-red-500/5 text-red-300 text-sm">
          {error}
        </div>
      )}

      {draft && (
        <div className="card p-6 mt-4">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white">Your AI-generated listing</h2>
            <button onClick={() => setDraft(null)} className="text-sm text-slate-500 hover:text-white">Start over</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
            <div className="card p-4 bg-purple-500/5">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Suggested price</p>
              <p className="text-3xl font-black text-white">${(draft.suggestedPriceCents / 100).toFixed(0)}</p>
            </div>
            <div className="card p-4 bg-white/[0.02]">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Range</p>
              <p className="text-sm text-slate-300">${(draft.priceFloorCents / 100).toFixed(0)} <span className="text-slate-600">–</span> ${(draft.priceCeilingCents / 100).toFixed(0)}</p>
            </div>
          </div>

          <label className="block mb-1 text-xs text-slate-500 uppercase tracking-widest font-semibold">Title</label>
          <p className="text-xl font-bold text-white mb-4">{draft.title}</p>

          <label className="block mb-1 text-xs text-slate-500 uppercase tracking-widest font-semibold">Category · Condition</label>
          <p className="text-sm text-slate-300 mb-4">
            <span className="capitalize">{draft.category}</span> · <span className="capitalize">{draft.condition.replace("_", " ")}</span>
          </p>

          <label className="block mb-1 text-xs text-slate-500 uppercase tracking-widest font-semibold">Description</label>
          <p className="text-sm text-slate-300 whitespace-pre-wrap mb-4 leading-relaxed">{draft.description}</p>

          <label className="block mb-1 text-xs text-slate-500 uppercase tracking-widest font-semibold">Tags</label>
          <div className="flex flex-wrap gap-2 mb-5">
            {draft.tags.map((t) => (
              <span key={t} className="badge bg-purple-500/15 text-purple-300 border border-purple-500/30 text-xs">{t}</span>
            ))}
          </div>

          <label className="block mb-2 text-sm font-semibold text-slate-300">Confirm price ($)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            min={draft.priceFloorCents / 100}
            step="0.01"
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition mb-3"
          />

          <p className="text-xs text-slate-500 mb-5 italic">{draft.reasoning}</p>

          <button
            onClick={publish}
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading ? "Publishing..." : "Publish listing →"}
          </button>
        </div>
      )}
    </div>
  );
}
