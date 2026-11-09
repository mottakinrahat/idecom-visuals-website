"use client";

import type { ReactNode } from "react";

type Tone = "green" | "amber" | "red" | "blue" | "gray";
const TONES: Record<Tone, string> = {
  green: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-500/15 text-amber-600",
  red: "bg-red-500/15 text-red-500",
  blue: "bg-sky-500/15 text-sky-600",
  gray: "bg-[var(--d-card2)] text-[var(--d-muted)]",
};

export function Badge({ tone = "gray", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap ${TONES[tone]}`}>
      <i className="w-1.5 h-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

export function EmptyState({ title, message, action }: { title: string; message?: string; action?: ReactNode }) {
  return (
    <div className="py-14 px-4 text-center">
      <p className="text-[14px] font-semibold">{title}</p>
      {message && <p className="text-[13px] text-[var(--d-muted)] mt-1">{message}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="py-14 flex flex-col items-center gap-2 text-[13px] text-[var(--d-muted)]">
      <span className="w-6 h-6 rounded-full border-2 border-[var(--d-accent)] border-t-transparent animate-spin" />
      {label}
    </div>
  );
}

/** Inline error banner with optional retry. */
export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-[13px] text-red-500">
      <span>{message}</span>
      {onRetry && <button type="button" onClick={onRetry} className="font-semibold underline cursor-pointer">Retry</button>}
    </div>
  );
}

