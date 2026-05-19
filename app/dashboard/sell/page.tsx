"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CONDITIONS = ["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"];
const CATEGORIES = [
  "Electronics", "Furniture", "Clothing", "Toys & Kids", "Tools",
  "Appliances", "Sports", "Books", "Home & Garden", "Other",
];

export default function SellPage() {
  const router = useRouter();
  const [step, setStep] = useState<"input" | "review">("input");
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [generating, setGenerating] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    condition: "",
    askingPrice: "",
    floorPrice: "",
    photoUrl: "",
    city: "",
  });

  const [pricing, setPricing] = useState<{
    suggestedPrice: number;
    fastSellPrice: number;
    premiumPrice: number;
    priceRationale: string;
  } | null>(null);

  function updateForm(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleGenerate() {
    if (!description && !photoUrl) {
      setError("Please describe your item or provide a photo URL.");
      return;
    }
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/agent/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, photoUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const g = data.listing;
      setForm({
        title: g.title,
        description: g.description,
        category: g.category,
        condition: g.condition,
        askingPrice: String(g.suggestedPrice),
        floorPrice: String(Math.round(g.suggestedPrice * 0.8)),
        photoUrl: photoUrl,
        city: "",
      });
      setPricing({
        suggestedPrice: g.suggestedPrice,
        fastSellPrice: g.fastSellPrice,
        premiumPrice: g.premiumPrice,
        priceRationale: g.priceRationale,
      });
      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function handlePost() {
    if (!form.title || !form.askingPrice) {
      setError("Title and price are required.");
      return;
    }
    setPosting(true);
    setError("");
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, aiGenerated: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/dashboard/listings/${data.listing.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post listing");
    } finally {
      setPosting(false);
    }
  }

  if (step === "input") {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Sell Something</h1>
          <p className="text-slate-500 mt-1">Describe your item and your agent will handle the rest</p>
        </div>

        <div className="card p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
          )}

          <div>
            <label className="label">Photo URL (optional)</label>
            <input
              className="input"
              placeholder="https://... paste a link to a photo of your item"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
            />
            <p className="text-xs text-slate-400 mt-1">Paste any publicly accessible image URL</p>
          </div>

          <div>
            <label className="label">Describe your item</label>
            <textarea
              className="input h-32 resize-none"
              placeholder='e.g. "KitchenAid stand mixer, red, barely used, all original attachments included"'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-primary w-full text-base py-3"
          >
            {generating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                AI is generating your listing...
              </span>
            ) : (
              "✨ Generate Listing with AI"
            )}
          </button>
        </div>

        <div className="mt-4 card p-4 bg-brand-50 border-brand-100">
          <p className="text-sm text-brand-700 font-medium">💡 How it works</p>
          <p className="text-sm text-brand-600 mt-1">
            Your AI agent identifies the item, researches market prices, writes a compelling
            description, and sets the optimal price — in seconds.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => setStep("input")} className="text-slate-500 hover:text-slate-900">← Back</button>
        <h1 className="text-2xl font-bold text-slate-900">Review Your Listing</h1>
      </div>

      <div className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
        )}

        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="badge bg-green-100 text-green-700">✨ AI Generated</span>
            <span className="text-slate-400 text-sm">Review and edit before posting</span>
          </div>

          <div>
            <label className="label">Title</label>
            <input className="input" value={form.title} onChange={(e) => updateForm("title", e.target.value)} />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input h-40 resize-none"
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={(e) => updateForm("category", e.target.value)}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Condition</label>
              <select className="input" value={form.condition} onChange={(e) => updateForm("condition", e.target.value)}>
                {CONDITIONS.map((c) => <option key={c}>{c.replace("_", " ")}</option>)}
              </select>
            </div>
          </div>

          {/* Pricing */}
          {pricing && (
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm font-medium text-slate-700 mb-3">💰 AI Price Recommendation</p>
              <div className="grid grid-cols-3 gap-3 mb-3">
                {[
                  { label: "Fast Sale", price: pricing.fastSellPrice, key: "fastSellPrice" },
                  { label: "Recommended", price: pricing.suggestedPrice, key: "suggestedPrice", highlight: true },
                  { label: "Premium", price: pricing.premiumPrice, key: "premiumPrice" },
                ].map(({ label, price, key, highlight }) => (
                  <button
                    key={key}
                    onClick={() => updateForm("askingPrice", String(price))}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      form.askingPrice === String(price)
                        ? "border-brand-500 bg-brand-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className={`font-bold ${highlight ? "text-brand-500" : "text-slate-900"}`}>${price}</p>
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500">{pricing.priceRationale}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Asking Price ($)</label>
              <input
                type="number"
                className="input"
                value={form.askingPrice}
                onChange={(e) => updateForm("askingPrice", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Minimum Price ($)</label>
              <input
                type="number"
                className="input"
                value={form.floorPrice}
                onChange={(e) => updateForm("floorPrice", e.target.value)}
              />
              <p className="text-xs text-slate-400 mt-1">Private — agent won&apos;t go below this</p>
            </div>
          </div>

          <div>
            <label className="label">City (optional)</label>
            <input
              className="input"
              placeholder="e.g. Atlanta, GA"
              value={form.city}
              onChange={(e) => updateForm("city", e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => setStep("input")} className="btn-secondary flex-1">Edit Description</button>
          <button onClick={handlePost} disabled={posting} className="btn-primary flex-1 text-base py-3">
            {posting ? "Posting..." : "🚀 Post Listing"}
          </button>
        </div>
      </div>
    </div>
  );
}
