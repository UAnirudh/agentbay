import Link from "next/link";
import WaitlistSignup from "@/components/WaitlistSignup";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ref?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;
  const ref = params.ref;

  const errorMessages: Record<string, string> = {
    invalid_state: "Authentication session expired. Please try again.",
    missing_params: "Authentication failed. Please try again.",
    token_exchange_failed: "Could not connect to Google. Please try again.",
    no_access_token: "Authentication failed. Please try again.",
    invalid_profile: "Could not retrieve your profile from Google.",
    profile_fetch_failed: "Could not load your Google profile. Please try again.",
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative">
      <div className="fixed inset-0 pointer-events-none">
        <div className="orb w-[500px] h-[500px] bg-brand-500 -top-32 -left-32" />
        <div className="orb w-[400px] h-[400px] bg-purple-500 bottom-0 -right-32" />
        <div className="absolute inset-0 grid-bg" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <span className="text-white font-bold">A</span>
            </div>
            <span className="font-bold text-xl text-white">AgentBay</span>
          </Link>
          <h1 className="text-3xl font-black text-white mb-2">Join the waitlist</h1>
          <p className="text-slate-400">Sign in with Google to claim your spot</p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">
              {errorMessages[error] || "Something went wrong. Please try again."}
            </div>
          )}

          <div className="space-y-4">
            <div className="text-center">
              <WaitlistSignup initialRef={ref} />
            </div>

            <div className="relative flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-white/[0.08]" />
              <span className="text-slate-600 text-xs">what you get</span>
              <div className="flex-1 h-px bg-white/[0.08]" />
            </div>

            <div className="space-y-3">
              {[
                { icon: "🎯", text: "Unique referral link to climb the list" },
                { icon: "📊", text: "Real-time rank & leaderboard tracking" },
                { icon: "🚀", text: "Priority access when AgentBay launches" },
                { icon: "🤖", text: "Your personal AI commerce agent" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3 text-sm text-slate-300">
                  <span className="text-base">{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          By continuing, you agree to our Terms & Privacy Policy.
          <br />
          No spam. Unsubscribe anytime.
        </p>

        <div className="text-center mt-4">
          <Link href="/" className="text-slate-600 hover:text-slate-400 text-sm transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
