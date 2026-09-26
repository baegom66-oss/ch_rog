"use client";

import { HelpCircle } from "lucide-react";

interface FieldHintProps {
  text: string;
}

/** 은은한 툴팁. hover / focus 시 설명 표시 */
export default function FieldHint({ text }: FieldHintProps) {
  return (
    <span className="group relative inline-flex align-middle">
      <button
        type="button"
        className="rounded-full p-0.5 text-[var(--muted)]/70 transition hover:text-[var(--accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
        aria-label={text}
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 w-48 -translate-x-1/2 rounded-lg bg-[var(--ink)] px-2.5 py-2 text-left text-[10px] leading-4 text-white opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
        <span className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-4 border-transparent border-t-[var(--ink)]" />
      </span>
    </span>
  );
}
