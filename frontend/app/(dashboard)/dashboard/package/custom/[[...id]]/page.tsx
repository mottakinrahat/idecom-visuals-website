"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useSyncExternalStore } from "react";
import { CustomPackageBuilder } from "@/components/packages/CustomPackageBuilder";
import { useCustomPackages } from "@/lib/customPackages";

const noop = () => () => {};

/** /dashboard/package/custom → new package, /dashboard/package/custom/<id> → edit. */
export default function CustomPackagePage() {
  const params = useParams<{ id?: string[] }>();
  const id = params.id?.[0];
  const { packages } = useCustomPackages();
  const ready = useSyncExternalStore(noop, () => true, () => false); // saved packages live in the browser

  if (!ready) return <p className="text-[13px] text-[var(--d-muted)]">Loading…</p>;

  const initial = id ? packages.find((p) => p.id === id) ?? null : null;
  if (id && !initial) {
    return (
      <div className="flex flex-col gap-3 items-start">
        <p className="text-[14px]">This custom package no longer exists.</p>
        <Link href="/dashboard/package" className="text-[13px] font-semibold text-[var(--d-accent)] hover:underline">← Back to packages</Link>
      </div>
    );
  }
  return <CustomPackageBuilder key={id ?? "new"} initial={initial} />;
}
