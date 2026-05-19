import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/logout-button";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="font-bold text-lg text-slate-900">AgentBay</span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              <NavLink href="/dashboard">Home</NavLink>
              <NavLink href="/dashboard/sell">Sell</NavLink>
              <NavLink href="/dashboard/buy">Buy</NavLink>
              <NavLink href="/dashboard/negotiations">Deals</NavLink>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/settings" className="text-slate-500 hover:text-slate-900 text-sm">
              Settings
            </Link>
            <LogoutButton />
          </div>
        </div>
        {/* Mobile nav */}
        <div className="md:hidden flex border-t border-slate-100 px-4 py-2 gap-1 overflow-x-auto">
          <MobileNavLink href="/dashboard">Home</MobileNavLink>
          <MobileNavLink href="/dashboard/sell">Sell</MobileNavLink>
          <MobileNavLink href="/dashboard/buy">Buy</MobileNavLink>
          <MobileNavLink href="/dashboard/negotiations">Deals</MobileNavLink>
          <MobileNavLink href="/dashboard/settings">Settings</MobileNavLink>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
    >
      {children}
    </Link>
  );
}
