"use client";

import { useEffect, useState } from "react";

interface LeaderEntry {
  id: string;
  name: string | null;
  email: string;
  referralCount: number;
  position: number;
}

export default function LiveLeaderboard() {
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard?limit=10")
      .then((r) => r.json())
      .then((d) => { setEntries(d.leaderboard || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-2">
      {loading ? (
        Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
        ))
      ) : entries.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <p>Be the first to join!</p>
        </div>
      ) : (
        entries.map((entry, i) => (
          <div
            key={entry.id}
            className="flex items-center gap-4 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all"
          >
            <div className="w-8 text-center">
              {i < 3 ? (
                <span className="text-lg">{medals[i]}</span>
              ) : (
                <span className="text-sm font-bold text-slate-500">#{i + 1}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm truncate">
                {entry.name || entry.email.split("@")[0]}
              </p>
              <p className="text-xs text-slate-500 truncate">{anonymize(entry.email)}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-brand-400 text-sm">{entry.referralCount}</p>
              <p className="text-xs text-slate-500">referrals</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function anonymize(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local.slice(0, 2)}${"*".repeat(Math.min(local.length - 2, 4))}@${domain}`;
}
