"use client";

import { useEffect, useState } from "react";

interface AgentConfig {
  autonomyLevel: number;
  seller: {
    autoAcceptAbovePercent: number;
    autoDeclineBelowPercent: number;
    preferLocalPickup: boolean;
  };
  buyer: {
    conditionMinimum: string;
    maxDistanceMiles: number;
  };
  notifications: {
    offerReceived: boolean;
    dealClosed: boolean;
    weeklyDigest: boolean;
  };
}

const DEFAULT_CONFIG: AgentConfig = {
  autonomyLevel: 2,
  seller: { autoAcceptAbovePercent: 95, autoDeclineBelowPercent: 80, preferLocalPickup: false },
  buyer: { conditionMinimum: "GOOD", maxDistanceMiles: 25 },
  notifications: { offerReceived: true, dealClosed: true, weeklyDigest: true },
};

const AUTONOMY_LABELS = [
  { level: 1, label: "Supervised", desc: "Agent asks for approval at every step" },
  { level: 2, label: "Semi-Autonomous", desc: "Agent negotiates, asks you to approve final deals" },
  { level: 3, label: "Fully Autonomous", desc: "Agent completes transactions within your limits" },
];

export default function SettingsPage() {
  const [user, setUser] = useState<{ name: string; email: string; trustScore: number } | null>(null);
  const [config, setConfig] = useState<AgentConfig>(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then(({ user }) => {
        setUser(user);
        try {
          const parsed = JSON.parse(user.agentConfig || "{}");
          setConfig({ ...DEFAULT_CONFIG, ...parsed });
        } catch { /* use defaults */ }
      });
  }, []);

  function updateConfig(path: string[], value: unknown) {
    setConfig((prev) => {
      const next = { ...prev };
      let obj: Record<string, unknown> = next as unknown as Record<string, unknown>;
      for (let i = 0; i < path.length - 1; i++) {
        obj[path[i]] = { ...(obj[path[i]] as object) };
        obj = obj[path[i]] as Record<string, unknown>;
      }
      obj[path[path.length - 1]] = value;
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentConfig: config }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Agent Settings</h1>

      {/* Profile */}
      <div className="card p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Profile</h2>
        {user && (
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-brand-100 rounded-full flex items-center justify-center text-2xl font-bold text-brand-700">
              {user.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-slate-900">{user.name}</p>
              <p className="text-sm text-slate-500">{user.email}</p>
              <p className="text-sm text-slate-500">⭐ Trust Score: {user.trustScore?.toFixed(1)}/5.0</p>
            </div>
          </div>
        )}
      </div>

      {/* Autonomy Level */}
      <div className="card p-6">
        <h2 className="font-semibold text-slate-900 mb-2">Agent Autonomy Level</h2>
        <p className="text-sm text-slate-500 mb-4">How much control you give your agent</p>
        <div className="space-y-3">
          {AUTONOMY_LABELS.map(({ level, label, desc }) => (
            <button
              key={level}
              onClick={() => updateConfig(["autonomyLevel"], level)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                config.autonomyLevel === level
                  ? "border-brand-500 bg-brand-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  config.autonomyLevel === level ? "border-brand-500" : "border-slate-300"
                }`}>
                  {config.autonomyLevel === level && (
                    <div className="w-2.5 h-2.5 bg-brand-500 rounded-full" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-slate-900">{label}</p>
                  <p className="text-sm text-slate-500">{desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Seller Settings */}
      <div className="card p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Selling Defaults</h2>
        <div className="space-y-4">
          <div>
            <label className="label">Auto-accept offers above (% of asking)</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={70}
                max={100}
                value={config.seller.autoAcceptAbovePercent}
                onChange={(e) => updateConfig(["seller", "autoAcceptAbovePercent"], parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-semibold text-slate-900 w-12">
                {config.seller.autoAcceptAbovePercent}%
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Agent auto-accepts offers at or above {config.seller.autoAcceptAbovePercent}% of asking price
            </p>
          </div>
          <div>
            <label className="label">Auto-decline below (% of asking)</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={50}
                max={90}
                value={config.seller.autoDeclineBelowPercent}
                onChange={(e) => updateConfig(["seller", "autoDeclineBelowPercent"], parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-semibold text-slate-900 w-12">
                {config.seller.autoDeclineBelowPercent}%
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">Prefer local pickup</p>
              <p className="text-xs text-slate-500">Agent prioritizes local buyers when matching</p>
            </div>
            <button
              onClick={() => updateConfig(["seller", "preferLocalPickup"], !config.seller.preferLocalPickup)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                config.seller.preferLocalPickup ? "bg-brand-500" : "bg-slate-200"
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                config.seller.preferLocalPickup ? "translate-x-5" : ""
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Buyer Settings */}
      <div className="card p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Buying Defaults</h2>
        <div className="space-y-4">
          <div>
            <label className="label">Minimum condition I&apos;ll accept</label>
            <select
              className="input"
              value={config.buyer.conditionMinimum}
              onChange={(e) => updateConfig(["buyer", "conditionMinimum"], e.target.value)}
            >
              {["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"].map((c) => (
                <option key={c} value={c}>{c.replace("_", " ")}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Max distance for local pickup (miles)</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={5}
                max={100}
                value={config.buyer.maxDistanceMiles}
                onChange={(e) => updateConfig(["buyer", "maxDistanceMiles"], parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-semibold text-slate-900 w-16">
                {config.buyer.maxDistanceMiles} mi
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Notifications</h2>
        <div className="space-y-3">
          {[
            { key: "offerReceived", label: "New offer received", desc: "When someone offers on your listing" },
            { key: "dealClosed", label: "Deal closed", desc: "When a negotiation completes" },
            { key: "weeklyDigest", label: "Weekly summary", desc: "What your agent did this week" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">{label}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
              <button
                onClick={() => updateConfig(["notifications", key], !config.notifications[key as keyof typeof config.notifications])}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  config.notifications[key as keyof typeof config.notifications] ? "bg-brand-500" : "bg-slate-200"
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  config.notifications[key as keyof typeof config.notifications] ? "translate-x-5" : ""
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3 text-base">
        {saving ? "Saving..." : saved ? "✅ Saved!" : "Save Settings"}
      </button>
    </div>
  );
}
