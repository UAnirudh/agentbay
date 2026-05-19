import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-100 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="font-bold text-xl text-slate-900">AgentBay</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-secondary text-sm">Sign In</Link>
          <Link href="/register" className="btn-primary text-sm">Get Started Free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-sm font-medium px-4 py-2 rounded-full mb-8 border border-brand-100">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          AI agents active 24/7
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight mb-6">
          Buy and sell anything.{" "}
          <span className="text-brand-500">Your agent handles everything else.</span>
        </h1>
        <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          No listings to write. No prices to research. No negotiating with strangers.
          Your personal AI agent does it all — automatically.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register" className="btn-primary text-base px-8 py-4">
            Start for Free →
          </Link>
          <Link href="/login" className="btn-secondary text-base px-8 py-4">
            Sign In
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">How AgentBay Works</h2>
          <p className="text-slate-500 text-center mb-16">Two flows. Zero friction.</p>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Seller */}
            <div className="card p-8">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl">📦</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Selling is 3 words</h3>
              <div className="space-y-4">
                {[
                  { step: "1", text: "Describe or photo your item" },
                  { step: "2", text: "AI writes the listing & sets the price" },
                  { step: "3", text: "Agent negotiates, you get paid" },
                ].map(({ step, text }) => (
                  <div key={step} className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-brand-500 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                      {step}
                    </div>
                    <span className="text-slate-700">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Buyer */}
            <div className="card p-8">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl">🛒</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Buying is one sentence</h3>
              <div className="space-y-4">
                {[
                  { step: "1", text: "Tell your agent what you want" },
                  { step: "2", text: "Agent finds, ranks, and negotiates" },
                  { step: "3", text: "You approve. Done." },
                ].map(({ step, text }) => (
                  <div key={step} className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-brand-500 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                      {step}
                    </div>
                    <span className="text-slate-700">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-8 text-center">
            {[
              { value: "< 3 min", label: "to create a listing" },
              { value: "10%+", label: "better price than asking" },
              { value: "0", label: "negotiations to manage" },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="text-4xl font-bold text-brand-500 mb-2">{value}</div>
                <div className="text-slate-500 text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Personas */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">Built for everyone</h2>
          <p className="text-slate-500 text-center mb-12">Not just tech-savvy users</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: "👩‍👧", title: "Parents", desc: "Clear out kids' items without lifting a finger" },
              { icon: "🎓", title: "Students", desc: "Find deals on textbooks and electronics" },
              { icon: "🔧", title: "Workers", desc: "Sell tools at fair market value" },
              { icon: "🏡", title: "Retirees", desc: "Downsize without the hassle" },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="card p-6 text-center">
                <div className="text-4xl mb-3">{icon}</div>
                <div className="font-semibold text-slate-900 mb-1">{title}</div>
                <div className="text-slate-500 text-sm">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center px-6">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to start?</h2>
        <p className="text-slate-500 mb-8">Free to join. 8% only when you sell.</p>
        <Link href="/register" className="btn-primary text-lg px-10 py-4">
          Create Your Account →
        </Link>
      </section>

      <footer className="border-t border-slate-100 py-8 text-center text-slate-400 text-sm">
        © 2026 AgentBay. Your agent, your commerce.
      </footer>
    </div>
  );
}
