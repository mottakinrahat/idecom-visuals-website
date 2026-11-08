"use client";

import { ChevronDown, CalendarDays } from "@/components/dashboard/icons";

export const Card = ({ className = "", children }: { className?: string; children: React.ReactNode }) => (
  <div className={`rounded-2xl bg-[var(--d-card)] border border-[var(--d-line)] p-5 ${className}`}>{children}</div>
);

export const PageTitle = ({ title, right }: { title: string; right?: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-3 mb-6">
    <h1 className="text-2xl font-semibold">{title}</h1>
    {right}
  </div>
);

export const RangePill = ({ label = "19 Aug – 25 Aug", icon = true }: { label?: string; icon?: boolean }) => (
  <button
    type="button"
    className="inline-flex items-center gap-2 px-3 h-9 rounded-lg border border-[var(--d-line)] bg-[var(--d-card)] text-xs text-[var(--d-muted)]"
  >
    {icon && <CalendarDays className="w-3.5 h-3.5" />}
    {label}
    <ChevronDown className="w-3.5 h-3.5" />
  </button>
);

export const Legend = () => (
  <div className="flex items-center gap-5 text-xs text-[var(--d-muted)]">
    <span className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-full bg-[var(--d-income)]" />Income</span>
    <span className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-full bg-[var(--d-expense)]" />Expense</span>
  </div>
);

/** Stacked bars: income (front) over expense (back) per label. */
export function BarChart({ data }: { data: { l: string; income: number; expense: number }[] }) {
  const max = Math.max(...data.map((d) => d.income + d.expense), 1);
  return (
    <div className="flex gap-3">
      <div className="flex flex-col justify-between text-[11px] text-[var(--d-muted)] h-[180px] pt-0.5">
        {[4, 3, 2, 1, 0].map((i) => <span key={i}>{Math.round((max / 4) * i)}</span>)}
      </div>
      <div
        className="flex-1 grid items-end gap-2 border-b border-[var(--d-line)] h-[180px]"
        style={{ gridTemplateColumns: `repeat(${data.length},1fr)` }}
      >
        {data.map((d) => (
          <div key={d.l} className="flex justify-center items-end h-full">
            <div
              className="relative w-3 sm:w-4 rounded-full overflow-hidden bg-[var(--d-expense)]"
              style={{ height: `${((d.income + d.expense) / max) * 100}%` }}
            >
              <div
                className="absolute bottom-0 inset-x-0 bg-[var(--d-income)] rounded-full"
                style={{ height: `${(d.income / (d.income + d.expense)) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function XLabels({ labels, offset = true }: { labels: string[]; offset?: boolean }) {
  return (
    <div
      className={`grid text-[11px] text-[var(--d-muted)] mt-2 ${offset ? "pl-9" : ""}`}
      style={{ gridTemplateColumns: `repeat(${labels.length},1fr)` }}
    >
      {labels.map((l) => <span key={l} className="text-center">{l}</span>)}
    </div>
  );
}

export function LineChart({ a, b }: { a: number[]; b: number[] }) {
  const W = 400, H = 170, max = Math.max(...a, ...b) * 1.1;
  const pts = (arr: number[]) => arr.map((v, i) => [(i / (arr.length - 1)) * W, H - (v / max) * H] as const);
  const path = (arr: number[]) => pts(arr).map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`-6 -6 ${W + 12} ${H + 12}`} className="w-full h-[180px] overflow-visible" preserveAspectRatio="none">
      <path d={`${path(a)} L${W},${H} L0,${H} Z`} fill="var(--d-income)" opacity=".12" />
      <path d={path(b)} fill="none" stroke="var(--d-expense)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      <path d={path(a)} fill="none" stroke="var(--d-income)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function Donut({ value, total, label }: { value: number; total: number; label: string }) {
  const r = 62, c = 2 * Math.PI * r, p = Math.min(value / total, 1);
  return (
    <div className="relative w-44 h-44 mx-auto">
      <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
        <circle cx="80" cy="80" r={r} fill="none" stroke="var(--d-expense)" strokeWidth="12" strokeLinecap="round" />
        <circle cx="80" cy="80" r={r} fill="none" stroke="var(--d-income)" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${c * p} ${c}`} />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <div className="text-2xl font-semibold">{value.toLocaleString()}</div>
        <div className="text-xs text-[var(--d-muted)]">{label}</div>
      </div>
    </div>
  );
}
