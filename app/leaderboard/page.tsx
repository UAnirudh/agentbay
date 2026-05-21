export const dynamic = "force-dynamic";

import Link from "next/link";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { desc, asc } from "drizzle-orm";
import { anonymizeEmail } from "@/lib/auth";
import { getTotalSignups } from "@/lib/referral";
import { tickInBackground } from "@/lib/jobs";
import WaitlistSignup from "@/components/WaitlistSignup";

async function getFullLeaderboard() {
  return db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    referralCount: users.referralCount,
    queueScore: users.queueScore,
    createdAt: users.createdAt,
  }).from(users)
    .orderBy(desc(users.queueScore), asc(users.createdAt))
    .limit(100)
    .all();
}

export default async function LeaderboardPage() {
  tickInBackground();
  const [allUsers, total] = await Promise.all([getFullLeaderboard(), getTotalSignups()]);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 pointer-events-none">
        <div className="orb w-[500px] h-[500px] bg-purple-500 -top-32 -right-32" />
        <div className="orb w-[400px] h-[400px] bg-brand-500 bottom-0 -left-32" />
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
          <Link href="/login" className="btn-primary text-sm py-2">
            Join Waitlist
          </Link>
        </div>
      </nav>

      <div className="relative max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-purple-400 text-sm font-semibold uppercase tracking-widest block mb-4">Live Rankings</span>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Waitlist Leaderboard</h1>
          <p className="text-slate-400 text-lg mb-6">
            Top referrers get <strong className="text-white">priority access</strong> when AgentBay launches.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-sm text-slate-400">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            {total.toLocaleString()} people on the waitlist
          </div>
        </div>

        {/* Top 3 podium */}
        {allUsers.length >= 3 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[allUsers[1], allUsers[0], allUsers[2]].map((user, displayIdx) => {
              const actualIdx = displayIdx === 0 ? 1 : displayIdx === 1 ? 0 : 2;
              const heights = ["h-28", "h-36", "h-24"];
              const gradients = [
                "from-slate-500/30 to-slate-600/20 border-slate-500/30",
                "from-brand-500/30 to-purple-500/20 border-brand-500/30",
                "from-amber-500/20 to-amber-600/10 border-amber-500/30",
              ];

              return (
                <div key={user.id} className={`card ${gradients[displayIdx]} border flex flex-col items-center justify-end p-4 ${heights[displayIdx]} relative overflow-hidden`}>
                  <div className="absolute top-2 left-2 text-xl">{medals[actualIdx]}</div>
                  <div className="text-center">
                    <p className="font-bold text-white text-sm truncate max-w-[100px]">
                      {user.name || anonymizeEmail(user.email)}
                    </p>
                    <p className="text-brand-400 font-black text-lg">{user.referralCount}</p>
                    <p className="text-xs text-slate-500">referrals</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Full leaderboard */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-400">Top 100 Referrers</span>
            <span className="text-xs text-slate-600">Updates live</span>
          </div>
          {allUsers.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <p className="text-2xl mb-2">🚀</p>
              <p>Be the first to join and top the leaderboard!</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {allUsers.map((user, i) => (
                <div
                  key={user.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-all"
                >
                  <div className="w-10 text-center shrink-0">
                    {i < 3 ? (
                      <span className="text-lg">{medals[i]}</span>
                    ) : (
                      <span className="font-bold text-slate-500 text-sm">#{i + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">
                      {user.name || anonymizeEmail(user.email)}
                    </p>
                    <p className="text-xs text-slate-600 truncate">{anonymizeEmail(user.email)}</p>
                  </div>
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-center hidden sm:block">
                      <p className="font-bold text-brand-400 text-sm">{user.referralCount}</p>
                      <p className="text-xs text-slate-600">referrals</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-purple-400 text-sm">{Math.round(user.queueScore)}</p>
                      <p className="text-xs text-slate-600">score</p>
                    </div>
                    {i < 3 && (
                      <div>
                        <span className="badge bg-green-500/20 text-green-400 border border-green-500/30 text-xs">
                          Top {i + 1}
                        </span>
                      </div>
                    )}
                    {i < 10 && i >= 3 && (
                      <span className="badge bg-brand-500/20 text-brand-400 border border-brand-500/30 text-xs hidden sm:inline-flex">
                        Top 10
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-slate-400 mb-6 text-lg">
            Not on the list? <strong className="text-white">Join now</strong> and start climbing.
          </p>
          <WaitlistSignup />
          <p className="text-slate-600 text-xs mt-3">Free. No card. Just your Google account.</p>
        </div>
      </div>
    </div>
  );
}
