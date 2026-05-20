import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative">
      <div className="fixed inset-0 pointer-events-none">
        <div className="orb w-[400px] h-[400px] bg-brand-500 top-0 left-0" />
        <div className="orb w-[300px] h-[300px] bg-purple-500 bottom-0 right-0" />
        <div className="absolute inset-0 grid-bg" />
      </div>
      <div className="relative text-center">
        <p className="text-8xl font-black text-white/5 mb-4">404</p>
        <h1 className="text-3xl font-black text-white mb-2 -mt-12">Page not found</h1>
        <p className="text-slate-400 mb-8">This page doesn't exist or you don't have access to it.</p>
        <Link href="/" className="btn-primary">← Back to AgentBay</Link>
      </div>
    </div>
  );
}
