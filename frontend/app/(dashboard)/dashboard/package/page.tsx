"use client";

import { Check } from "@/components/dashboard/icons";
import { useStudioStore } from "@/components/dashboard/store";
import { Card, PageTitle } from "@/components/dashboard/ui";

const PACKAGES = [
  { service: "Video Production", price: 1200, items: ["Concept & script", "Shoot day + crew", "Editing & color grade", "2 revisions"] },
  { service: "Reels Package", price: 450, items: ["8 short-form reels", "Captions & music", "Platform formats", "1 revision"] },
  { service: "Brand Design", price: 800, items: ["Logo & identity", "Brand guidelines", "Social templates", "2 revisions"] },
  { service: "Marketing", price: 600, items: ["Content strategy", "Ad creative", "Campaign setup", "Monthly report"] },
  { service: "Full Retainer", price: 2500, items: ["Video + design + ads", "Priority turnaround", "Dedicated manager", "Unlimited revisions"] },
];

export default function PackagePage() {
  const { leads } = useStudioStore();
  return (
    <>
      <PageTitle title="Package" />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {PACKAGES.map((p) => {
          const n = leads.filter((l) => l.service === p.service).length;
          return (
            <Card key={p.service} className="flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <h2 className="text-lg font-semibold">{p.service}</h2>
                <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--d-tint)] text-[var(--d-accent)] font-medium">{n} active</span>
              </div>
              <div className="text-3xl font-semibold">
                ${p.price.toLocaleString()}<span className="text-sm text-[var(--d-muted)] font-normal"> / project</span>
              </div>
              <ul className="flex flex-col gap-2 text-sm flex-1">
                {p.items.map((i) => (
                  <li key={i} className="flex items-center gap-2"><Check className="w-4 h-4 text-[var(--d-accent)]" />{i}</li>
                ))}
              </ul>
              <button type="button" className="h-10 rounded-full bg-[var(--d-primary)] hover:bg-[var(--d-primary-hi)] text-[var(--d-ink)] text-sm font-semibold transition-colors">
                Edit package
              </button>
            </Card>
          );
        })}
      </div>
    </>
  );
}
