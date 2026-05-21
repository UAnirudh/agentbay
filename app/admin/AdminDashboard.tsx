"use client";

import { useState } from "react";
import Link from "next/link";

interface Props {
  session: { email: string; name: string | null };
  stats: {
    totalUsers: number;
    usersToday: number;
    usersThisWeek: number;
    totalReferrals: number;
    referralsToday: number;
    conversionRate: string;
    viralCoefficient: string;
  };
  topReferrers: Array<{ id: string; email: string; name: string | null; referralCount: number; isApproved: boolean; createdAt: string }>;
  recentSignups: Array<{ id: string; email: string; name: string | null; referralCount: number; isApproved: boolean; createdAt: string }>;
}

export default function AdminDashboard({ session, stats, topReferrers, recentSignups }: Props) {
  const [approving, setApproving] = useState<string | null>(null);
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());

  const approveUser = async (userId: string) => {
    setApproving(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isApproved: true }),
      });
      if (res.ok) setApprovedIds((prev) => new Set(Array.from(prev).concat(userId)));
    } finally {
      setApproving(null);
    }
  };


  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 pointer-events-none">
        <div className="orb w-[400px] h-[400px] bg-brand-500 -top-32 -right-32" />
        <div className="absolute inset-0 grid-bg" />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 glass border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-white">AgentBay</span>
            <span className="badge bg-amber-500/20 text-amber-400 border border-amber-500/30 ml-2">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/leaderboard" className="btn-ghost text-sm">Leaderboard</Link>
            <span className="text-sm text-slate-400">{session.name || session.email}</span>
            <a href="/api/auth/logout" className="btn-secondary text-sm py-2">Sign out</a>
          </div>
        </div>
      </nav>

      <div className="relative max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-1">Admin Dashboard</h1>
          <p className="text-slate-400">AgentBay waitlist analytics</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total signups", value: stats.totalUsers.toLocaleString(), sub: "all time", color: "brand" },
            { label: "Today", value: `+${stats.usersToday}`, sub: "last 24 hours", color: "green" },
            { label: "This week", value: `+${stats.usersThisWeek}`, sub: "last 7 days", color: "purple" },
            { label: "Viral coefficient", value: stats.viralCoefficient, sub: "referrals per user", color: "cyan" },
          ].map((s) => (
            <div key={s.label} className="card p-5">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">{s.label}</p>
              <p className={`text-3xl font-black mb-1 ${s.color === "brand" ? "text-brand-400" : s.color === "green" ? "text-green-400" : s.color === "purple" ? "text-purple-400" : "text-cyan-400"}`}>
                {s.value}
              </p>
              <p className="text-xs text-slate-500">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Total referrals", value: stats.totalReferrals.toLocaleString() },
            { label: "Referrals today", value: `+${stats.referralsToday}` },
            { label: "Conversion rate", value: `${stats.conversionRate}%` },
            { label: "Avg refs/user", value: stats.totalUsers > 0 ? (stats.totalReferrals / stats.totalUsers).toFixed(1) : "0" },
          ].map((s) => (
            <div key={s.label} className="card p-4 text-center">
              <p className="text-2xl font-black text-white mb-1">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Top referrers */}
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-white/[0.06]">
              <h2 className="font-bold text-white">Top Referrers</h2>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {topReferrers.map((user, i) => (
                <div key={user.id} className="flex items-center gap-4 px-5 py-3">
                  <span className="text-sm font-bold text-slate-500 w-6">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{user.name || user.email}</p>
                    <p className="text-xs text-slate-600 truncate">{user.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-brand-400 text-sm">{user.referralCount} refs</p>
                  </div>
                  {!user.isApproved && !approvedIds.has(user.id) && (
                    <button
                      onClick={() => approveUser(user.id)}
                      disabled={approving === user.id}
                      className="text-xs px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-all disabled:opacity-50"
                    >
                      {approving === user.id ? "..." : "Approve"}
                    </button>
                  )}
                  {(user.isApproved || approvedIds.has(user.id)) && (
                    <span className="text-xs px-2 py-1 rounded-lg bg-green-500/10 text-green-500">Approved</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recent signups */}
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-white/[0.06]">
              <h2 className="font-bold text-white">Recent Signups</h2>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {recentSignups.map((user) => (
                <div key={user.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {(user.name || user.email)[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{user.name || user.email}</p>
                    <p className="text-xs text-slate-600">{new Date(user.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-500">{user.referralCount} refs</p>
                    {(user.isApproved || approvedIds.has(user.id)) && (
                      <span className="text-xs text-green-400">approved</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
