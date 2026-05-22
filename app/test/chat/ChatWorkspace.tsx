"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AgentAvatar, { AvatarMood } from "@/components/AgentAvatar";
import { resolveMarketplace } from "@/lib/marketplaces";

interface Deal {
  title: string;
  description: string;
  priceCents: number;
  source: string;
  url: string;
  condition: string;
  location?: string;
  matchScore: number;
  reasoning: string;
}

interface Draft {
  title: string;
  description: string;
  category: string;
  condition: string;
  suggestedPriceCents: number;
  tags: string[];
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  results?: Deal[];
  draft?: Draft;
  listingId?: string;
  navigateTo?: string;
  isClarifying?: boolean;
  timestamp: number;
}

const SUGGESTIONS = [
  "Find me a MacBook Pro M3 under $1400",
  "I want to sell my old Xbox One",
  "Show me the marketplace",
  "Find a road bike near me",
  "Search for a standing desk under $300",
];

export default function ChatWorkspace() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hey! I'm your AgentBay agent. Tell me what you want to buy or sell and I'll search the web, write listings, and handle negotiations for you. I might ask a quick question first to nail down exactly what you need.",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [mood, setMood] = useState<AvatarMood>("idle");
  const [loading, setLoading] = useState(false);
  const [hasPrefs, setHasPrefs] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    // Check if user has preferences saved
    fetch("/api/test/preferences")
      .then((r) => r.json())
      .then((d) => {
        const p = d.preferences || {};
        setHasPrefs(Object.keys(p).length > 0);
      })
      .catch(() => {});
  }, []);

  async function send(text: string) {
    const userText = text.trim();
    if (!userText || loading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: userText,
      timestamp: Date.now(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    setMood("thinking");

    try {
      const res = await fetch("/api/test/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      setMood((data.mood as AvatarMood) || "speaking");

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply,
        results: data.results,
        draft: data.draft,
        listingId: data.listingId,
        navigateTo: data.navigate_to,
        isClarifying: data.intent === "clarify",
        timestamp: Date.now(),
      };
      setMessages((m) => [...m, assistantMsg]);

      if (data.navigate_to) {
        setTimeout(() => router.push(data.navigate_to), 700);
      }

      setTimeout(() => setMood("idle"), 2000);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: err instanceof Error ? `Ran into an issue: ${err.message}` : "Something went wrong. Try again.",
          timestamp: Date.now(),
        },
      ]);
      setMood("idle");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <AgentAvatar mood={mood} size="md" />
          <div>
            <p className="font-bold text-white text-base">AgentBay</p>
            <p className="text-xs text-slate-400 capitalize">
              {loading ? "working..." : mood === "searching" ? "searching the web..." : mood}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/test/preferences"
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition ${
              hasPrefs
                ? "border-brand-500/40 bg-brand-500/10 text-brand-300 hover:bg-brand-500/20"
                : "border-white/[0.08] bg-white/[0.04] text-slate-400 hover:text-white"
            }`}
          >
            ⚙️ {hasPrefs ? "Preferences saved" : "Set preferences"}
          </Link>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto card p-4 sm:p-6 mb-4 space-y-4"
        style={{ scrollBehavior: "smooth" }}
      >
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            {m.role === "assistant" && (
              <div className="shrink-0">
                <AgentAvatar mood="idle" size="sm" />
              </div>
            )}
            <div className={`max-w-[85%] ${m.role === "user" ? "items-end" : "items-start"} flex flex-col gap-2`}>
              {/* Message bubble */}
              <div
                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-gradient-to-br from-brand-500 to-purple-500 text-white rounded-tr-sm"
                    : m.isClarifying
                    ? "bg-amber-500/10 border border-amber-500/30 text-amber-100 rounded-tl-sm"
                    : "bg-white/[0.04] border border-white/[0.08] text-slate-200 rounded-tl-sm"
                }`}
              >
                {m.isClarifying && (
                  <span className="text-amber-400 text-xs font-semibold block mb-1">🤔 Quick question</span>
                )}
                {m.content}
              </div>

              {/* Search results */}
              {m.results && m.results.length > 0 && (
                <div className="space-y-2 w-full max-w-2xl">
                  <p className="text-xs text-slate-500 px-1">Found {m.results.length} matches</p>
                  {m.results.slice(0, 6).map((d, i) => {
                    const src = resolveMarketplace(d.source);
                    const isAgentBay = d.source === "agentbay";
                    return (
                      <a
                        key={i}
                        href={d.url}
                        target={isAgentBay ? undefined : "_blank"}
                        rel={isAgentBay ? undefined : "noopener noreferrer"}
                        className="block p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15] transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg bg-${src.color}-500/20 flex items-center justify-center text-${src.color}-400 font-bold text-xs shrink-0`}
                          >
                            {src.logoChar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white text-sm truncate">{d.title}</p>
                            <p className="text-xs text-slate-500 truncate">
                              {src.name} · {d.condition.replace("_", " ")}
                              {d.location ? ` · 📍 ${d.location}` : ""}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-white font-bold text-sm">
                              {d.priceCents > 0 ? `$${(d.priceCents / 100).toFixed(0)}` : "See listing"}
                            </p>
                            <p className="text-xs text-slate-500">{d.matchScore}% match</p>
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}

              {/* Listing draft */}
              {m.draft && m.listingId && (
                <Link
                  href={`/test/listings/${m.listingId}`}
                  className="block p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/15 transition w-full max-w-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">✨</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-purple-300 text-xs font-semibold mb-0.5">Listing published</p>
                      <p className="font-semibold text-white text-sm truncate">{(m.draft as Draft).title}</p>
                      <p className="text-xs text-slate-500">
                        ${((m.draft as Draft).suggestedPriceCents / 100).toFixed(0)} · tap to view &amp; manage →
                      </p>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <AgentAvatar mood="thinking" size="sm" />
            <div className="px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex gap-1.5 items-center">
              {[0, 150, 300].map((d) => (
                <div
                  key={d}
                  className="w-2 h-2 rounded-full bg-brand-400 animate-pulse"
                  style={{ animationDelay: `${d}ms` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Suggestions (first message only) */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-3 shrink-0">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-xs px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:bg-white/[0.08] hover:text-white transition"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="shrink-0 flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Buy, sell, search, negotiate... just tell me what you need"
          disabled={loading}
          className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500/50 transition"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn-primary px-5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
}
