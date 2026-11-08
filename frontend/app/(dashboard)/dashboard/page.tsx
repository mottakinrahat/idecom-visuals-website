"use client";

import { DollarSign, BarChart3, User, ArrowUp, ArrowDown, Download, MoreHorizontal } from "@/components/dashboard/icons";
import { useStudioStore } from "@/components/dashboard/store";
import { Card, PageTitle, RangePill, Legend, BarChart, XLabels, LineChart, Donut } from "@/components/dashboard/ui";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEK = [
  { l: "Mon", income: 190, expense: 160 }, { l: "Tue", income: 105, expense: 155 }, { l: "Wed", income: 250, expense: 130 },
  { l: "Thu", income: 190, expense: 70 }, { l: "Fri", income: 205, expense: 165 }, { l: "Sat", income: 185, expense: 145 },
  { l: "Sun", income: 155, expense: 70 },
];
const BARS = [[25, 8, 10], [24, 25, 24], [23, 30, 28], [22, 42, 24], [21, 24, 30], [20, 36, 20]];

const Delta = ({ v, up = true }: { v: string; up?: boolean }) => (
  <span className={`inline-flex items-center text-xs font-medium ${up ? "text-[#22A559]" : "text-[#F0605D]"}`}>
    {up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}{v}
  </span>
);

export default function OverviewPage() {
  const { leads } = useStudioStore();
  const income = leads.filter((l) => l.stage === "Completed").reduce((s, l) => s + l.budget, 0);
  const pipeline = leads.reduce((s, l) => s + l.budget, 0);
  const newClients = leads.filter((l) => l.stage === "New Inquiry").length;

  const stats = [
    { label: "Total Income", value: `$${income.toLocaleString()}`, d: <Delta v="50.8%" />, icon: DollarSign },
    { label: "Total Sales", value: `$${pipeline.toLocaleString()}`, d: <Delta v="10.5%" up={false} />, icon: BarChart3 },
    { label: "New Clients", value: String(newClients), d: <Delta v="24.9%" />, icon: User },
  ];

  return (
    <>
      <PageTitle
        title="Overview"
        right={
          <div className="flex items-center gap-3">
            <button type="button" className="w-9 h-9 grid place-items-center rounded-lg border border-[var(--d-line)] bg-[var(--d-card)]" aria-label="Download">
              <Download className="w-4 h-4" />
            </button>
            <RangePill label="Last 7 days" icon={false} />
          </div>
        }
      />

      <div className="grid gap-5 md:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="flex items-center justify-between">
            <div>
              <div className="text-sm text-[var(--d-muted)]">{s.label}</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-semibold">{s.value}</span>{s.d}
              </div>
            </div>
            <span className="w-16 h-16 rounded-2xl grid place-items-center bg-[var(--d-tint)] text-[var(--d-accent)]">
              <s.icon className="w-7 h-7" strokeWidth={2.2} />
            </span>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2 mt-5">
        <Card>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold">Statistics</h2><RangePill />
          </div>
          <BarChart data={WEEK} />
          <XLabels labels={DAYS} />
          <div className="mt-4 flex justify-center"><Legend /></div>
        </Card>
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Analytics</h2><RangePill />
          </div>
          <div className="flex items-center gap-6 mb-4 text-sm">
            <span className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg grid place-items-center bg-[var(--d-tint)] text-[var(--d-accent)]"><ArrowUp className="w-4 h-4" /></span>
              ${income.toLocaleString()}
            </span>
            <span className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg grid place-items-center bg-[var(--d-card2)] text-[var(--d-expense)]"><ArrowDown className="w-4 h-4" /></span>
              $1,750
            </span>
          </div>
          <LineChart a={[0, 22, 14, 46, 20, 62, 85]} b={[0, 10, 30, 15, 38, 25, 14]} />
          <XLabels labels={DAYS} offset={false} />
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_2fr] mt-5">
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Sales</h2>
            <MoreHorizontal className="w-5 h-5 text-[var(--d-muted)]" />
          </div>
          <Donut value={leads.length} total={Math.max(leads.length + 2, 1)} label="Total" />
        </Card>
        <Card>
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <h2 className="text-lg font-semibold">Statistics</h2><Legend /><RangePill />
          </div>
          <div className="flex flex-col gap-3">
            {BARS.map(([n, l, r]) => (
              <div key={n} className="flex items-center gap-3 text-[11px] text-[var(--d-muted)]">
                <span className="w-5">{n}</span>
                <div className="flex-1 grid grid-cols-2 items-center">
                  <div className="flex justify-end"><i className="h-2.5 rounded-full bg-[var(--d-income)]" style={{ width: `${l * 2}%` }} /></div>
                  <div><i className="block h-2.5 rounded-full bg-[var(--d-expense)]" style={{ width: `${r * 2}%` }} /></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
