import { notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import ModeSwitcher from "@/components/ModeSwitcher";

export const dynamic = "force-dynamic";

export default async function TestLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) notFound();

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 pointer-events-none">
        <div className="orb w-[500px] h-[500px] bg-brand-500 -top-32 -left-32" />
        <div className="orb w-[400px] h-[400px] bg-purple-500 bottom-0 right-0" />
        <div className="absolute inset-0 grid-bg opacity-50" />
      </div>

      <nav className="sticky top-0 z-50 glass border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/test" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="font-bold text-white">AgentBay</span>
              <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-wider">Test</span>
            </Link>
            <div className="hidden md:flex items-center gap-1 text-sm">
              <Link href="/test" className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.04] transition">Home</Link>
              <Link href="/test/buy" className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.04] transition">Buy</Link>
              <Link href="/test/sell" className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.04] transition">Sell</Link>
              <Link href="/test/marketplace" className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.04] transition">Marketplace</Link>
              <Link href="/test/negotiations" className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.04] transition">Negotiations</Link>
              <Link href="/test/my-listings" className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.04] transition">My listings</Link>
              <Link href="/test/preferences" className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.04] transition">Preferences</Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ModeSwitcher />
            <Link href="/test/chat" className="btn-primary text-sm py-1.5">💬 Chat</Link>
            {session.isAdmin && <Link href="/admin" className="btn-ghost text-sm hidden md:block">Admin</Link>}
          </div>
        </div>
      </nav>

      <main className="relative">{children}</main>
    </div>
  );
}
