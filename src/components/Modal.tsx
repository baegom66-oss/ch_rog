"use client";

import { X } from "lucide-react";
import { useEffect, useEffectEvent, useId, type ReactNode } from "react";

interface ModalProps {
  title: string;
  subtitle?: ReactNode;
  onClose: () => void;
  /** 스크롤되는 본문. 여백은 사용하는 쪽에서 정한다 */
  children: ReactNode;
}

/** 모바일에선 아래에서 올라오는 시트, 넓은 화면에선 가운데 대화상자. 바깥 클릭·Esc로 닫힌다 */
export default function Modal({ title, subtitle, onClose, children }: ModalProps) {
  const titleId = useId();
  const handleKey = useEffectEvent((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  });

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--ink)]/40 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-[var(--paper)] shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
          <div className="min-w-0">
            <p id={titleId} className="text-sm font-semibold text-[var(--ink)]">
              {title}
            </p>
            {subtitle && <p className="text-[11px] text-[var(--muted)]">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-[var(--muted)] hover:bg-[var(--wash)]"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
