"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Prefs {
  location?: string;
  maxBudgetDollars?: number;
  minBudgetDollars?: number;
  preferredConditions?: string[];
  preferredCategories?: string[];
  negotiationStyle?: "aggressive" | "moderate" | "fair";
  shippingOk?: boolean;
  notes?: string;
}

const CONDITIONS = ["new", "like_new", "good", "fair"];
const CATEGORIES = ["electronics", "furniture", "clothing", "books", "vehicles", "appliances", "tools", "sports", "toys", "other"];
const CONDITION_LABELS: Record<string, string> = { new: "New", like_new: "Like New", good: "Good", fair: "Fair" };

export default function PreferencesPage() {
  const [prefs, setPrefs] = useState<Prefs>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/test/preferences")
      .then((r) => r.json())
      .then((d) => { setPrefs(d.preferences || {}); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function toggleCondition(c: string) {
    const cur = prefs.preferredConditions || [];
    setPrefs({ ...prefs, preferredConditions: cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c] });
  }

  function toggleCategory(c: string) {
    const cur = prefs.preferredCategories || [];
    setPrefs({ ...prefs, preferredCategories: cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c] });
  }

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/test/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="mb-8">
        <Link href="/test/chat" className="text-sm text-slate-500 hover:text-white transition mb-4 inline-block">← Back to agent</Link>
        <span className="text-brand-400 text-sm font-semibold uppercase tracking-widest block mb-2">Agent settings</span>
        <h1 className="text-3xl font-black text-white mb-2">Your preferences</h1>
        <p className="text-slate-400 text-sm">Your agent uses these automatically every time you search or negotiate — no need to repeat yourself.</p>
      </div>

      <div className="space-y-5">
        {/* Location */}
        <div className="card p-5">
          <label className="block text-sm font-semibold text-white mb-3">📍 Location</label>
          <input
            type="text"
            value={prefs.location || ""}
            onChange={(e) => setPrefs({ ...prefs, location: e.target.value })}
            placeholder="e.g. Brooklyn, NY"
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50 transition"
          />
          <p className="text-xs text-slate-500 mt-2">Used to prioritise local listings and filter shipping preferences.</p>
        </div>

        {/* Budget */}
        <div className="card p-5">
          <label className="block text-sm font-semibold text-white mb-3">💰 Budget range (USD)</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-500 mb-1.5">Min</p>
              <input
                type="number"
                value={prefs.minBudgetDollars || ""}
                onChange={(e) => setPrefs({ ...prefs, minBudgetDollars: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="$0"
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50 transition"
              />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1.5">Max</p>
              <input
                type="number"
                value={prefs.maxBudgetDollars || ""}
                onChange={(e) => setPrefs({ ...prefs, maxBudgetDollars: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="No limit"
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50 transition"
              />
            </div>
          </div>
        </div>

        {/* Condition */}
        <div className="card p-5">
          <label className="block text-sm font-semibold text-white mb-3">✨ Acceptable conditions</label>
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map((c) => {
              const active = (prefs.preferredConditions || []).includes(c);
              return (
                <button
                  key={c}
                  onClick={() => toggleCondition(c)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                    active
                      ? "bg-brand-500/20 border-brand-500/50 text-brand-300"
                      : "bg-white/[0.04] border-white/[0.08] text-slate-400 hover:text-white"
                  }`}
                >
                  {CONDITION_LABELS[c]}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-slate-500 mt-2">Leave empty to accept all conditions.</p>
        </div>

        {/* Categories */}
        <div className="card p-5">
          <label className="block text-sm font-semibold text-white mb-3">🏷️ Preferred categories</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const active = (prefs.preferredCategories || []).includes(c);
              return (
                <button
                  key={c}
                  onClick={() => toggleCategory(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all border ${
                    active
                      ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                      : "bg-white/[0.04] border-white/[0.08] text-slate-400 hover:text-white"
                  }`}
                >
                  {c.replace("_", " ")}
                </button>
              );
            })}
          </div>
        </div>

        {/* Negotiation style */}
        <div className="card p-5">
          <label className="block text-sm font-semibold text-white mb-3">🤝 Negotiation style</label>
          <div className="grid grid-cols-3 gap-3">
            {(["aggressive", "moderate", "fair"] as const).map((style) => (
              <button
                key={style}
                onClick={() => setPrefs({ ...prefs, negotiationStyle: style })}
                className={`p-3 rounded-xl text-sm font-semibold capitalize transition-all border ${
                  prefs.negotiationStyle === style
                    ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                    : "bg-white/[0.04] border-white/[0.08] text-slate-400 hover:text-white"
                }`}
              >
                {style}
                <p className="text-[10px] font-normal mt-1 opacity-70">
                  {style === "aggressive" ? "Push hard for lowest price" : style === "moderate" ? "Balanced give-and-take" : "Fair offer, close fast"}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Shipping */}
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">📦 Shipping OK</p>
              <p className="text-xs text-slate-500 mt-0.5">Accept listings that require shipping, not just local pickup</p>
            </div>
            <button
              onClick={() => setPrefs({ ...prefs, shippingOk: prefs.shippingOk === false ? true : false })}
              className={`w-12 h-6 rounded-full transition-all relative ${prefs.shippingOk === false ? "bg-white/10" : "bg-brand-500"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${prefs.shippingOk === false ? "left-0.5" : "left-6"}`} />
            </button>
          </div>
        </div>

        {/* Notes */}
        <div className="card p-5">
          <label className="block text-sm font-semibold text-white mb-3">📝 Additional notes for your agent</label>
          <textarea
            value={prefs.notes || ""}
            onChange={(e) => setPrefs({ ...prefs, notes: e.target.value })}
            placeholder="e.g. 'I only want Apple products', 'Never used condition only', 'I have a truck so I can pick up large items'..."
            rows={3}
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50 transition resize-none"
          />
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="btn-primary w-full text-base py-4 disabled:opacity-50"
        >
          {saving ? "Saving..." : saved ? "✓ Preferences saved!" : "Save preferences"}
        </button>

        {saved && (
          <p className="text-center text-sm text-green-400">Your agent will use these from now on.</p>
        )}
      </div>
    </div>
  );
}
