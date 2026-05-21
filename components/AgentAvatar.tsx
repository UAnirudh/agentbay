"use client";

import { useEffect, useState } from "react";

export type AvatarMood = "idle" | "thinking" | "happy" | "speaking" | "searching" | "negotiating";

interface Props {
  mood?: AvatarMood;
  size?: "sm" | "md" | "lg";
  label?: string;
}

const moodConfig: Record<AvatarMood, { eyes: string; mouth: string; bg: string; pulse: boolean }> = {
  idle: { eyes: "•   •", mouth: "‿", bg: "from-brand-500 to-purple-600", pulse: false },
  thinking: { eyes: "·   ·", mouth: "·", bg: "from-amber-500 to-purple-500", pulse: true },
  happy: { eyes: "^   ^", mouth: "ᴗ", bg: "from-green-500 to-cyan-500", pulse: false },
  speaking: { eyes: "•   •", mouth: "○", bg: "from-brand-500 to-cyan-500", pulse: true },
  searching: { eyes: "◉   ◉", mouth: "·", bg: "from-cyan-500 to-brand-500", pulse: true },
  negotiating: { eyes: "▸   ◂", mouth: "—", bg: "from-purple-500 to-pink-500", pulse: false },
};

const sizes = {
  sm: { wrap: "w-12 h-12", eye: "text-xs", mouth: "text-sm" },
  md: { wrap: "w-20 h-20", eye: "text-base", mouth: "text-xl" },
  lg: { wrap: "w-32 h-32", eye: "text-2xl", mouth: "text-3xl" },
};

export default function AgentAvatar({ mood = "idle", size = "md", label }: Props) {
  const cfg = moodConfig[mood];
  const dim = sizes[size];
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 120);
    }, 3500 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <div className="relative">
        {cfg.pulse && (
          <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${cfg.bg} opacity-30 blur-xl animate-pulse`} />
        )}
        <div
          className={`relative ${dim.wrap} rounded-2xl bg-gradient-to-br ${cfg.bg} flex flex-col items-center justify-center shadow-lg shadow-brand-500/30 transition-all`}
        >
          <div className={`${dim.eye} text-white font-bold leading-none mb-1 ${blink ? "scale-y-0" : ""} transition-transform origin-center duration-100`}>
            {cfg.eyes}
          </div>
          <div className={`${dim.mouth} text-white font-bold leading-none`}>
            {cfg.mouth}
          </div>
        </div>
      </div>
      {label && <span className="text-xs text-slate-400 font-medium mt-1">{label}</span>}
    </div>
  );
}
