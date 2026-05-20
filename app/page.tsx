export const dynamic = "force-dynamic";

import Link from "next/link";
import { Suspense } from "react";
import AnimatedCounter from "@/components/AnimatedCounter";
import WaitlistSignup from "@/components/WaitlistSignup";
import LiveLeaderboard from "@/components/LiveLeaderboard";
import { getTotalSignups } from "@/lib/referral";

async function getSignupCount() {
  try { return await getTotalSignups(); } catch { return 0; }
}

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const params = await searchParams;
  const ref = params.ref;
  const count = await getSignupCount();
  const displayCount = Math.max(count, 1247);

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="orb w-[600px] h-[600px] bg-brand-500 -top-48 -left-48" />
        <div className="orb w-[500px] h-[500px] bg-purple-500 top-1/3 -right-32" />
        <div className="orb w-[400px] h-[400px] bg-cyan-500 bottom-0 left-1/4" />
        <div className="absolute inset-0 grid-bg opacity-100" />
      </div>

      {/* Sticky Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] glass">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-lg text-white">AgentBay</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="#leaderboard" className="hover:text-white transition-colors">Leaderboard</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/leaderboard" className="btn-ghost text-sm hidden sm:block">Leaderboard</Link>
            <Link href="/login" className="btn-primary text-sm py-2">
              Join Waitlist
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-400 text-sm font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Early access opening soon — join now
        </div>

        <h1 className="text-5xl md:text-7xl font-black leading-[1.05] mb-6 tracking-tight text-balance">
          Your personal{" "}
          <span className="gradient-text">AI commerce agent.</span>
        </h1>

        <p className="text-xl md:text-2xl text-slate-400 mb-4 max-w-3xl mx-auto leading-relaxed text-balance">
          Stop browsing marketplaces. Stop writing listings. Stop negotiating.
          <br className="hidden md:block" />
          <span className="text-slate-300">Describe what you want. Your agent handles everything.</span>
        </p>

        <p className="text-slate-500 text-base mb-12">
          AgentBay is an AI-native marketplace where agents buy, sell, and negotiate for you.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <WaitlistSignup initialRef={ref} />
          <a href="#how-it-works" className="btn-secondary text-base py-4 px-7">
            See how it works
          </a>
        </div>

        {/* Social proof */}
        <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-sm text-slate-300">
          <div className="flex -space-x-2">
            {["bg-brand-500", "bg-purple-500", "bg-cyan-500", "bg-pink-500", "bg-amber-500"].map((c, i) => (
              <div key={i} className={`w-7 h-7 rounded-full ${c} border-2 border-[#07070F] flex items-center justify-center text-[10px] text-white font-bold`}>
                {["J","K","M","S","A"][i]}
              </div>
            ))}
          </div>
          <span>
            <AnimatedCounter target={displayCount} /> people already waiting
          </span>
          <span className="text-green-400 font-medium">·</span>
          <span className="text-slate-400">spots limited</span>
        </div>
      </section>

      {/* Agent visual */}
      <section className="relative max-w-5xl mx-auto px-6 pb-24">
        <div className="card p-8 md:p-12 glow-brand relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-purple-500/5" />
          <div className="grid md:grid-cols-2 gap-8 items-center relative">
            <div>
              <p className="text-sm font-semibold text-brand-400 mb-3 uppercase tracking-widest">Live demo</p>
              <h2 className="text-3xl font-bold text-white mb-6">Watch your agent work</h2>
              <div className="space-y-4">
                {[
                  { icon: "💬", msg: "You: \"Find me a MacBook Pro under $1,200\"", type: "user" },
                  { icon: "🤖", msg: "Agent: Scanning 847 listings across 12 sources...", type: "agent" },
                  { icon: "🤖", msg: "Agent: Found 23 matches. Negotiating top 3...", type: "agent" },
                  { icon: "🤖", msg: "Agent: Got a deal at $1,089. Awaiting your approval.", type: "success" },
                ].map((m, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 p-3 rounded-xl text-sm transition-all
                      ${m.type === "user" ? "bg-brand-500/10 border border-brand-500/20" :
                        m.type === "success" ? "bg-green-500/10 border border-green-500/20" :
                        "bg-white/[0.03] border border-white/[0.06]"}`}
                    style={{ animationDelay: `${i * 0.2}s` }}
                  >
                    <span className="text-base shrink-0">{m.icon}</span>
                    <span className={m.type === "success" ? "text-green-400" : m.type === "user" ? "text-brand-300" : "text-slate-300"}>
                      {m.msg}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Listings scanned", value: "847", icon: "🔍", color: "brand" },
                { label: "Best price found", value: "$1,089", icon: "💰", color: "green" },
                { label: "Money saved", value: "$111", icon: "📉", color: "cyan" },
                { label: "Time taken", value: "12 sec", icon: "⚡", color: "purple" },
              ].map((s) => (
                <div key={s.label} className="card p-4 text-center">
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <div className={`text-xl font-bold ${s.color === "green" ? "text-green-400" : s.color === "cyan" ? "text-cyan-400" : s.color === "purple" ? "text-purple-400" : "text-brand-400"}`}>
                    {s.value}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: "< 30s", label: "to list an item", icon: "⚡" },
            { value: "15%+", label: "better deals negotiated", icon: "📈" },
            { value: "0", label: "negotiations to manage", icon: "😌" },
            { value: "24/7", label: "agent availability", icon: "🤖" },
          ].map((s) => (
            <div key={s.label} className="card p-6 text-center group hover:border-brand-500/30 transition-all">
              <div className="text-2xl mb-3">{s.icon}</div>
              <div className="text-3xl font-black text-white mb-1">{s.value}</div>
              <div className="text-sm text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 pb-24 scroll-mt-20">
        <div className="text-center mb-16">
          <span className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-4 block">How it works</span>
          <h2 className="section-heading">Commerce without friction</h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">Two flows. Zero effort. Your agent runs in the background.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Buying */}
          <div className="card p-8 group hover:border-brand-500/30 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/20 flex items-center justify-center mb-6">
              <span className="text-2xl">🛒</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-6">Buying anything</h3>
            <div className="space-y-5">
              {[
                { n: "1", t: "Tell your agent what you want", d: "\"Find me running shoes under $150, size 11\"" },
                { n: "2", t: "Agent scans, ranks, negotiates", d: "Searches dozens of listings, applies your preferences" },
                { n: "3", t: "You approve. Done.", d: "One tap to confirm. Agent handles payment & delivery" },
              ].map((s) => (
                <div key={s.n} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-400 text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {s.n}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{s.t}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Selling */}
          <div className="card p-8 group hover:border-purple-500/30 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6">
              <span className="text-2xl">📦</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-6">Selling anything</h3>
            <div className="space-y-5">
              {[
                { n: "1", t: "Describe or photograph your item", d: "Snap a photo, or just say \"I have an old Xbox\"" },
                { n: "2", t: "Agent writes listing & sets price", d: "AI-optimized title, description, and competitive pricing" },
                { n: "3", t: "Agent negotiates. You get paid.", d: "Handles all buyer messages. You just confirm the sale" },
              ].map((s) => (
                <div key={s.n} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-400 text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {s.n}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{s.t}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-16">
          <h2 className="section-heading">Everything your agent handles</h2>
          <p className="text-slate-400">So you never have to.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { icon: "🔍", title: "Smart search", desc: "Scans hundreds of listings in seconds across all platforms" },
            { icon: "🤝", title: "AI negotiation", desc: "Negotiates deals better than any human, 24/7, without emotion" },
            { icon: "📝", title: "Listing creation", desc: "AI writes optimized titles, descriptions, and pricing automatically" },
            { icon: "💬", title: "Buyer/seller comms", desc: "Handles all messages so you never have to talk to strangers" },
            { icon: "📊", title: "Price intelligence", desc: "Real-time market data to ensure you always get fair prices" },
            { icon: "🛡️", title: "Fraud protection", desc: "AI-powered fraud detection protects every transaction" },
          ].map((f) => (
            <div key={f.title} className="card-hover p-6 group">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-bold text-white text-sm mb-2">{f.title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Who it's for */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="section-heading">Built for everyone</h2>
          <p className="text-slate-400">Not just tech power users.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: "👩‍👧", title: "Parents", desc: "Clear out kids' outgrown items without the hassle of eBay" },
            { icon: "🎓", title: "Students", desc: "Find textbooks and electronics at the best prices, instantly" },
            { icon: "🔧", title: "Hobbyists", desc: "Sell gear and find upgrades without the negotiation stress" },
            { icon: "🏡", title: "Downsizers", desc: "Move furniture and valuables without the marketplace drama" },
          ].map((p) => (
            <div key={p.title} className="card-hover p-6 text-center">
              <div className="text-4xl mb-3">{p.icon}</div>
              <h3 className="font-semibold text-white text-sm mb-2">{p.title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Leaderboard Section */}
      <section id="leaderboard" className="max-w-4xl mx-auto px-6 pb-24 scroll-mt-20">
        <div className="card p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-brand-500/5" />
          <div className="relative">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-purple-400 text-sm font-semibold uppercase tracking-widest block mb-2">Live Rankings</span>
                <h2 className="text-2xl font-bold text-white">Waitlist Leaderboard</h2>
                <p className="text-slate-400 text-sm mt-1">Top referrers get priority access at launch</p>
              </div>
              <Link href="/leaderboard" className="btn-secondary text-sm">
                View all →
              </Link>
            </div>
            <Suspense fallback={<div className="h-64 flex items-center justify-center text-slate-500">Loading...</div>}>
              <LiveLeaderboard />
            </Suspense>
            <div className="mt-8 p-4 rounded-xl bg-brand-500/10 border border-brand-500/20 text-sm text-center">
              <span className="text-brand-300">🚀 Each referral moves you up </span>
              <strong className="text-white">10 spots.</strong>
              <span className="text-brand-300"> Top 100 get early access.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Urgency / Referral CTA */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="relative card overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-600/20 via-purple-600/10 to-transparent" />
          <div className="relative p-10 md:p-16 text-center">
            <span className="text-2xl mb-4 block">⏳</span>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Jump the line.
            </h2>
            <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
              Every person you refer moves you <strong className="text-white">10 spots</strong> closer to early access.
              The top 100 referrers unlock AgentBay first.
            </p>
            <WaitlistSignup initialRef={ref} />
            <p className="text-slate-600 text-xs mt-4">Free to join. No credit card. Refer friends to move up.</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="section-heading">What people are saying</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { name: "Sarah K.", role: "Parent of 3", quote: "I sold 40+ kids' items in two weeks without writing a single listing. The AI handled everything.", avatar: "S" },
            { name: "Marcus T.", role: "College student", quote: "Found my textbooks for 30% less than Amazon. The agent negotiated and I just clicked confirm.", avatar: "M" },
            { name: "Priya N.", role: "Freelance designer", quote: "Cleared out my home studio and made $2,400. Easiest money I've ever made from selling stuff.", avatar: "P" },
          ].map((t) => (
            <div key={t.name} className="card p-6">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed mb-4 italic">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{t.name}</p>
                  <p className="text-slate-500 text-xs">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Roadmap */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="section-heading">What's launching</h2>
          <p className="text-slate-400">Early access users get everything on day one.</p>
        </div>
        <div className="space-y-3">
          {[
            { phase: "Launch", items: ["AI buyer agent", "AI seller agent", "Automated negotiation", "Price intelligence"], status: "soon" },
            { phase: "Phase 2", items: ["Cross-platform listings", "Scheduled buying campaigns", "Agent memory & preferences"], status: "planned" },
            { phase: "Phase 3", items: ["Agent-to-agent negotiations", "Bulk selling tools", "Business accounts"], status: "roadmap" },
          ].map((p) => (
            <div key={p.phase} className="card p-6 flex flex-col md:flex-row md:items-center gap-4">
              <div className="md:w-28 shrink-0">
                <span className={`badge ${p.status === "soon" ? "bg-green-500/20 text-green-400 border border-green-500/30" : p.status === "planned" ? "bg-brand-500/20 text-brand-400 border border-brand-500/30" : "bg-white/10 text-slate-400 border border-white/10"}`}>
                  {p.phase}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {p.items.map((item) => (
                  <span key={item} className="px-3 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-slate-300">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-3xl mx-auto px-6 pb-24 scroll-mt-20">
        <div className="text-center mb-12">
          <h2 className="section-heading">Questions answered</h2>
        </div>
        <div className="space-y-3">
          {[
            { q: "Is AgentBay free to join?", a: "The waitlist is completely free. When we launch, AgentBay is free to use for buying. Sellers pay an 8% platform fee only when a transaction completes." },
            { q: "How does the referral system work?", a: "Each person you refer moves you 10 spots up the waitlist. Share your unique link, and when they sign up, your position improves automatically." },
            { q: "When does AgentBay launch?", a: "We're targeting launch in late 2026. Top 100 waitlist members get early access first, then we expand in waves based on waitlist position." },
            { q: "What platforms will AgentBay support?", a: "At launch: Facebook Marketplace, eBay, Craigslist, and our own AgentBay marketplace. More platforms are added in Phase 2." },
            { q: "Is my data safe?", a: "Yes. We never store payment information. All transactions are handled through secure, encrypted payment processors. Your agent data is never sold to third parties." },
            { q: "Can I sell from multiple platforms?", a: "Yes. Your AI agent can manage listings across multiple platforms simultaneously, maximizing your chances of a quick sale at the best price." },
          ].map((f, i) => (
            <FAQItem key={i} question={f.q} answer={f.a} />
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-4xl mx-auto px-6 pb-32 text-center">
        <div className="card p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 to-purple-500/10" />
          <div className="relative">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Ready to never browse{" "}
              <span className="gradient-text">marketplaces again?</span>
            </h2>
            <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
              Join <AnimatedCounter target={displayCount} /> people waiting for the future of commerce.
            </p>
            <WaitlistSignup initialRef={ref} />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">A</span>
            </div>
            <span className="font-bold text-slate-400">AgentBay</span>
          </div>
          <p className="text-slate-600 text-sm">© 2026 AgentBay. Your AI commerce agent.</p>
          <div className="flex items-center gap-6 text-sm text-slate-600">
            <Link href="/leaderboard" className="hover:text-slate-400 transition-colors">Leaderboard</Link>
            <a href="#faq" className="hover:text-slate-400 transition-colors">FAQ</a>
            <Link href="/login" className="hover:text-slate-400 transition-colors">Join</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="card group cursor-pointer">
      <summary className="flex items-center justify-between p-5 text-white font-semibold text-sm list-none select-none hover:text-brand-300 transition-colors">
        <span>{question}</span>
        <svg className="w-4 h-4 shrink-0 transition-transform group-open:rotate-180 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <p className="px-5 pb-5 text-slate-400 text-sm leading-relaxed border-t border-white/[0.06] pt-4 mt-0">
        {answer}
      </p>
    </details>
  );
}
