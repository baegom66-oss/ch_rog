"use client";

import { Clock3, Earth, PartyPopper, UserRound, Wifi } from "lucide-react";
import type { TabId } from "@/types";

interface BottomNavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

const TABS: { id: TabId; label: string; icon: typeof Clock3 }[] = [
  { id: "timeline", label: "타임라인", icon: Clock3 },
  { id: "sns", label: "SNS", icon: Wifi },
  { id: "character", label: "캐릭터", icon: UserRound },
  { id: "event", label: "이벤트", icon: PartyPopper },
  { id: "world", label: "세계", icon: Earth },
];

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.95)_0%,rgba(243,235,254,0.95)_100%)] backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-2 transition ${
                isActive
                  ? "text-[var(--main)]"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              <span className="relative flex h-7 w-11 items-center justify-center">
                {isActive && (
                  <span
                    className="absolute inset-x-1 bottom-0.5 top-1.5 rounded-full bg-[var(--point)]"
                    aria-hidden
                  />
                )}
                <Icon
                  className={`relative h-5 w-5 ${isActive ? "stroke-[2.25]" : ""}`}
                  aria-hidden
                />
              </span>
              <span className={`text-[10px] tracking-tight ${isActive ? "font-semibold" : "font-medium"}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
