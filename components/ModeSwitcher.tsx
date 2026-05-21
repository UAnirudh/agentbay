"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export type ViewMode = "standard" | "chat";

const STORAGE_KEY = "agentbay_view_mode";

export function useViewMode(): [ViewMode, (m: ViewMode) => void] {
  const [mode, setModeState] = useState<ViewMode>("standard");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved === "chat" || saved === "standard") setModeState(saved);
  }, []);

  const setMode = (m: ViewMode) => {
    setModeState(m);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, m);
  };

  return [mode, setMode];
}

export default function ModeSwitcher() {
  const [mode, setMode] = useViewMode();
  const router = useRouter();
  const pathname = usePathname();

  const toggleTo = (m: ViewMode) => {
    setMode(m);
    if (m === "chat" && !pathname?.startsWith("/test/chat")) {
      router.push("/test/chat");
    } else if (m === "standard" && pathname?.startsWith("/test/chat")) {
      router.push("/test");
    }
  };

  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
      <button
        onClick={() => toggleTo("standard")}
        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
          mode === "standard"
            ? "bg-white/10 text-white shadow-sm"
            : "text-slate-400 hover:text-white"
        }`}
      >
        📋 Standard
      </button>
      <button
        onClick={() => toggleTo("chat")}
        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
          mode === "chat"
            ? "bg-gradient-to-r from-brand-500 to-purple-500 text-white shadow-sm"
            : "text-slate-400 hover:text-white"
        }`}
      >
        💬 Chat
      </button>
    </div>
  );
}
