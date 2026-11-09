"use client";

import { useEffect, useMemo, useState } from "react";
import {
  calculateRentalPrice, formatBDT, formatDuration, toMinutes, MAX_RENTAL_MINUTES, MIN_RENTAL_MINUTES, type DurationUnit,
} from "@/lib/rental";

const PRESETS = [
  { label: "20 min", minutes: 20 },
  { label: "30 min", minutes: 30 },
  { label: "1 hour", minutes: 60 },
  { label: "3 hours", minutes: 180 },
  { label: "1 day", minutes: 1440 },
];

/**
 * Pick a rental duration in hours or minutes; the total is calculated live
 * from the fixed hourly base rate (price × minutes ÷ 60).
 */
export function RentalCalculator({ pricePerHour, onChange, error }: {
  pricePerHour: number; onChange: (minutes: number) => void; error?: string;
}) {
  const [unit, setUnit] = useState<DurationUnit>("hours");
  const [amount, setAmount] = useState("1");

  const minutes = useMemo(() => {
    const n = Number(amount);
    return amount.trim() === "" || Number.isNaN(n) ? 0 : toMinutes(n, unit);
  }, [amount, unit]);

  const emit = (a: string, u: DurationUnit) => {
    const n = Number(a);
    onChange(a.trim() === "" || Number.isNaN(n) ? 0 : toMinutes(n, u));
  };

  const total = minutes >= MIN_RENTAL_MINUTES ? calculateRentalPrice(pricePerHour, minutes) : 0;
  // report the default duration to the parent once on mount
  useEffect(() => { emit(amount, unit); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (m: number) => {
    const asHours = m >= 60 && m % 60 === 0;
    const u: DurationUnit = asHours ? "hours" : "minutes";
    const a = String(asHours ? m / 60 : m);
    setUnit(u); setAmount(a); emit(a, u);
  };

  return (
    <div className="rounded-xl border border-[var(--d-line)] bg-[var(--d-card2)] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between text-[12px] text-[var(--d-muted)]">
        <span>Rental duration</span>
        <span>Base rate: <b className="text-[var(--d-fg)]">{formatBDT(pricePerHour)}</b> / hour</span>
      </div>

      <div className="flex gap-2">
        <input
          type="number" min="0" step={unit === "hours" ? "0.25" : "1"} inputMode="decimal" aria-label="Duration"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); emit(e.target.value, unit); }}
          className="h-10 w-full min-w-0 rounded-xl bg-[var(--d-card)] border border-[var(--d-line)] px-3.5 text-[13px] focus:border-[var(--d-accent)] outline-none"
        />
        <div role="group" aria-label="Unit" className="flex shrink-0 rounded-xl overflow-hidden border border-[var(--d-line)]">
          {(["minutes", "hours"] as DurationUnit[]).map((u) => (
            <button
              key={u} type="button" aria-pressed={unit === u}
              onClick={() => { setUnit(u); emit(amount, u); }}
              className={`px-3 text-[12px] font-medium capitalize cursor-pointer transition-colors ${unit === u ? "bg-[var(--d-primary)] text-[var(--d-ink)]" : "bg-[var(--d-card)] text-[var(--d-muted)] hover:text-[var(--d-fg)]"}`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.label} type="button" onClick={() => choose(p.minutes)}
            className={`px-2.5 py-1 rounded-full border text-[12px] cursor-pointer transition-colors ${minutes === p.minutes ? "border-[var(--d-accent)] text-[var(--d-accent)]" : "border-[var(--d-line)] text-[var(--d-muted)] hover:border-[var(--d-accent)]"}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {error || minutes > MAX_RENTAL_MINUTES ? (
        <p role="alert" className="text-[12px] text-red-500">{error ?? "Maximum rental is 30 days"}</p>
      ) : (
        <div className="flex items-end justify-between gap-3 pt-3 border-t border-[var(--d-line)]">
          <div className="text-[12px] text-[var(--d-muted)] leading-relaxed">
            {minutes >= MIN_RENTAL_MINUTES ? (
              <>{formatDuration(minutes)} · {formatBDT(pricePerHour)} × {minutes} min ÷ 60</>
            ) : "Enter a duration"}
          </div>
          <div className="text-right">
            <div className="text-[11px] text-[var(--d-muted)]">Total</div>
            <div className="text-[22px] font-semibold leading-none" aria-live="polite">{formatBDT(total)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
