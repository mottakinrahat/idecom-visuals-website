"use client";

import { useStudioStore } from "@/components/dashboard/store";
import { Card, PageTitle, RangePill, Legend, BarChart, XLabels } from "@/components/dashboard/ui";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
const SERIES = MONTHS.map((l, i) => ({
  l,
  income: [120, 160, 140, 210, 180, 240, 200][i],
  expense: [60, 70, 90, 80, 110, 90, 100][i],
}));

export default function IncomePage() {
  const { leads } = useStudioStore();
  const paid = leads.filter((l) => l.stage === "Completed");
  const total = paid.reduce((s, l) => s + l.budget, 0);
  const pending = leads.filter((l) => l.stage !== "Completed").reduce((s, l) => s + l.budget, 0);

  const cards = [
    { k: "Received", v: `$${total.toLocaleString()}` },
    { k: "Pending", v: `$${pending.toLocaleString()}` },
    { k: "Projects paid", v: String(paid.length) },
  ];

  return (
    <>
      <PageTitle title="Income" right={<RangePill label="Last 7 months" icon={false} />} />
      <div className="grid gap-5 md:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.k}>
            <div className="text-sm text-[var(--d-muted)]">{c.k}</div>
            <div className="mt-1 text-2xl font-semibold">{c.v}</div>
          </Card>
        ))}
      </div>

      <Card className="mt-5">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h2 className="text-lg font-semibold">Income vs expense</h2><Legend />
        </div>
        <BarChart data={SERIES} />
        <XLabels labels={MONTHS} />
      </Card>

      <Card className="mt-5 overflow-x-auto">
        <h2 className="text-lg font-semibold mb-4">Received payments</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--d-muted)] text-xs">
              <th className="py-2 font-medium">Client</th>
              <th className="font-medium">Service</th>
              <th className="font-medium">Due</th>
              <th className="font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {paid.length === 0 && (
              <tr><td colSpan={4} className="py-6 text-center text-[var(--d-muted)]">No completed projects yet.</td></tr>
            )}
            {paid.map((l) => (
              <tr key={l.id} className="border-t border-[var(--d-line)]">
                <td className="py-3">{l.client}<div className="text-xs text-[var(--d-muted)]">{l.company}</div></td>
                <td>{l.service}</td>
                <td>{l.dueDate}</td>
                <td className="text-right font-semibold">${l.budget.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
