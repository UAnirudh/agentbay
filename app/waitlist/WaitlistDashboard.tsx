"use client";

import { useState } from "react";
import Link from "next/link";

interface Props {
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    referralCode: string;
    referralCount: number;
    createdAt: string;
  };
  position: number;
  total: number;
  referralUrl: string;
  leaderboard: Array<{
    id: string;
    name: string | null;
    email: string;
    referralCount: number;
    queueScore: number;
    position: number;
    isCurrentUser: boolean;
    createdAt: string;
  }>;
  recentReferrals: Array<{
    id: string;
    email: string;
    createdAt: string;
  }>;
}

const MILESTONES = [
  { label: "First referral", target: 1, icon: "🎯", reward: "Top 500 guaranteed" },
  { label: "5 referrals", target: 5, icon: "🔥", reward: "Priority queue boost" },
  { label: "10 referrals", target: 10, icon: "💪", reward: "Beta feature access" },
  { label: "25 referrals", target: 25, icon: "🚀", reward: "Founding member badge" },
  { label: "50 referrals", target: 50, icon: "🌟", reward: "Lifetime discount" },
];

export default function WaitlistDashboard({ user, position, total, referralUrl, leaderboard, recentReferrals }: Props) {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareTwitter = () => {
    const text = `I just joined the waitlist for AgentBay — the AI commerce agent that buys and sells for you. Join me and skip the line: ${referralUrl}`;
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareWhatsApp = () => {
    const text = `Check out AgentBay! An AI agent that handles all your buying and selling. I'm #${position} on the waitlist. Join and skip ahead: ${referralUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`, "_blank");
  };

  const percentile = Math.round((1 - position / Math.max(total, 1)) * 100);
  const nextMilestone = MILESTONES.find((m) => m.target > user.referralCount);

  return (
    <div className="min-h-screen relative">
      {/* BG */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="orb w-[500px] h-[500px] bg-brand-500 -top-32 -right-32" />
        <div className="orb w-[400px] h-[400px] bg-purple-500 bottom-0 -left-32" />
        <div className="absolute inset-0 grid-bg" />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 glass border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-white">AgentBay</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/leaderboard" className="btn-ghost text-sm hidden sm:block">Leaderboard</Link>
            <div className="flex items-center gap-2">
              {user.image ? (
                <img src={user.image} alt="" className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                  {(user.name || user.email)[0].toUpperCase()}
                </div>
              )}
              <span className="text-sm text-slate-300 hidden sm:block">{user.name || user.email.split("@")[0]}</span>
            </div>
            <a href="/api/auth/logout" className="btn-ghost text-sm text-slate-500">Sign out</a>
          </div>
        </div>
      </nav>

      <div className="relative max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-1">Your waitlist dashboard</h1>
          <p className="text-slate-400">Refer friends to climb the ranks and unlock early access.</p>
        </div>

        {/* Main stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Your rank",
              value: `#${position.toLocaleString()}`,
              sub: `top ${percentile}%`,
              color: "brand",
              icon: "🏆",
            },
            {
              label: "Referrals",
              value: user.referralCount.toString(),
              sub: "people referred",
              color: "purple",
              icon: "👥",
            },
            {
              label: "Total waitlist",
              value: total.toLocaleString(),
              sub: "and growing",
              color: "cyan",
              icon: "📈",
            },
            {
              label: "Queue score",
              value: Math.round(user.referralCount * 10).toString(),
              sub: `+10 per referral`,
              color: "green",
              icon: "⚡",
            },
          ].map((s) => (
            <div key={s.label} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs text-slate-500 uppercase tracking-wider">{s.label}</p>
                <span className="text-lg">{s.icon}</span>
              </div>
              <p className={`text-3xl font-black mb-1 ${s.color === "brand" ? "text-brand-400" : s.color === "purple" ? "text-purple-400" : s.color === "cyan" ? "text-cyan-400" : "text-green-400"}`}>
                {s.value}
              </p>
              <p className="text-xs text-slate-500">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Referral link */}
          <div className="lg:col-span-2 space-y-6">
            {/* Share card */}
            <div className="card p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-purple-500/5" />
              <div className="relative">
                <h2 className="font-bold text-white mb-1">Your referral link</h2>
                <p className="text-slate-400 text-sm mb-4">Each friend who joins moves you up <strong className="text-white">10 spots</strong>.</p>
                <div className="flex gap-2 mb-4">
                  <div className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-slate-300 truncate font-mono">
                    {referralUrl}
                  </div>
                  <button
                    onClick={copyLink}
                    className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                      copied
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "btn-primary"
                    }`}
                  >
                    {copied ? "✓ Copied!" : "Copy link"}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={shareTwitter} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.10] text-sm text-slate-300 transition-all">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.736-8.85L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    Share on X
                  </button>
                  <button onClick={shareWhatsApp} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.10] text-sm text-slate-300 transition-all">
                    <span>💬</span> WhatsApp
                  </button>
                  <button onClick={shareLinkedIn} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.10] text-sm text-slate-300 transition-all">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    LinkedIn
                  </button>
                </div>
              </div>
            </div>

            {/* Milestones */}
            <div className="card p-6">
              <h2 className="font-bold text-white mb-4">Milestones</h2>
              <div className="space-y-3">
                {MILESTONES.map((m) => {
                  const achieved = user.referralCount >= m.target;
                  return (
                    <div key={m.label} className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${achieved ? "bg-green-500/10 border-green-500/30" : "bg-white/[0.02] border-white/[0.06]"}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${achieved ? "bg-green-500/20" : "bg-white/[0.05]"}`}>
                        {achieved ? "✅" : m.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm ${achieved ? "text-green-400" : "text-white"}`}>{m.label}</p>
                        <p className="text-xs text-slate-500">{m.reward}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {achieved ? (
                          <span className="text-green-400 text-xs font-semibold">Achieved!</span>
                        ) : (
                          <span className="text-slate-500 text-xs">{user.referralCount}/{m.target}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {nextMilestone && (
                <div className="mt-4 p-3 rounded-xl bg-brand-500/10 border border-brand-500/20">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-400">Progress to {nextMilestone.label}</span>
                    <span className="text-brand-400 font-semibold">{user.referralCount}/{nextMilestone.target}</span>
                  </div>
                  <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((user.referralCount / nextMilestone.target) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Recent referrals */}
            {recentReferrals.length > 0 && (
              <div className="card p-6">
                <h2 className="font-bold text-white mb-4">Recent referrals</h2>
                <div className="space-y-2">
                  {recentReferrals.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-sm">
                          ✓
                        </div>
                        <span className="text-sm text-slate-300">{anonymize(r.email)}</span>
                      </div>
                      <span className="text-xs text-slate-600">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Leaderboard sidebar */}
          <div className="space-y-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-white">Top referrers</h2>
                <Link href="/leaderboard" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">View all →</Link>
              </div>
              <div className="space-y-2">
                {leaderboard.map((entry) => {
                  const medals = ["🥇", "🥈", "🥉"];
                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                        entry.isCurrentUser
                          ? "bg-brand-500/15 border border-brand-500/30"
                          : "bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="w-7 text-center shrink-0">
                        {entry.position <= 3 ? (
                          <span>{medals[entry.position - 1]}</span>
                        ) : (
                          <span className="text-xs font-bold text-slate-500">#{entry.position}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${entry.isCurrentUser ? "text-brand-300" : "text-white"}`}>
                          {entry.name || entry.email.split("@")[0]}
                          {entry.isCurrentUser && " (you)"}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-brand-400">{entry.referralCount}</p>
                        <p className="text-xs text-slate-600">refs</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tips */}
            <div className="card p-5">
              <h3 className="font-bold text-white mb-3 text-sm">Boost your rank faster</h3>
              <div className="space-y-3 text-xs text-slate-400">
                {[
                  "Share on social media for maximum reach",
                  "Post in community groups and forums",
                  "Text your friends directly with your link",
                  "Add to your email signature or bio",
                  "Share on Reddit or Discord communities",
                ].map((tip, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-brand-500 shrink-0">→</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function anonymize(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local.slice(0, 2)}${"*".repeat(Math.min(local.length - 2, 4))}@${domain}`;
}
