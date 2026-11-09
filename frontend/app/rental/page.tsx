"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, EmptyState, ErrorBanner, Spinner, Toaster, useToast } from "@/components/ui";
import { assetUrl, type Equipment } from "@/lib/api";
import { formatBDT } from "@/lib/rental";
import { BookingModal } from "@/components/equipment/BookingModal";
import { AvailabilityBadge, fmtDateTime } from "@/components/equipment/status";
import { useRentalData } from "@/components/equipment/useRentalData";

/** Customer-facing rental catalogue: browse gear, pick a duration in hours/minutes, see the live total, book. */
export default function RentalPage() {
  return (
    <Toaster>
      <Catalogue />
    </Toaster>
  );
}

function Catalogue() {
  const toast = useToast();
  const { equipment, loading, error, refresh } = useRentalData();
  const [rent, setRent] = useState<Equipment | null>(null);

  return (
    <div className="dash min-h-screen" data-theme="dark">
      <div className="max-w-6xl mx-auto px-5 py-10">
        <header className="mb-8">
          <Link href="/" className="text-[13px] text-[var(--d-muted)] hover:text-[var(--d-fg)]">← IDeCom Visuals</Link>
          <h1 className="mt-3 text-[26px] font-semibold">Equipment Rental</h1>
          <p className="text-[14px] text-[var(--d-muted)] mt-1">Rent cameras, lenses and lights by the hour — or just the minutes you need. Pay only for the time you use.</p>
        </header>

        {error && <div className="mb-6"><ErrorBanner message={error} onRetry={refresh} /></div>}
        {loading ? (
          <Spinner />
        ) : equipment.length === 0 ? (
          <EmptyState title="No equipment listed yet" message="Please check back soon." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {equipment.map((e) => (
              <article key={e.id} className="rounded-2xl overflow-hidden bg-[var(--d-card)] border border-[var(--d-line)] flex flex-col">
                <div className="aspect-[4/3] bg-[var(--d-card2)] grid place-items-center text-[var(--d-muted)] text-[13px]">
                  {e.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={assetUrl(e.imageUrl)} alt={e.name} className="w-full h-full object-cover" />
                  ) : "No image"}
                </div>
                <div className="p-4 flex flex-col gap-3 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-[15px] font-semibold">{e.name}</h2>
                    <AvailabilityBadge value={e.availability} />
                  </div>
                  <p className="text-[13px] text-[var(--d-muted)] line-clamp-3 flex-1">{e.description || "—"}</p>
                  {e.currentBooking && <p className="text-[12px] text-[var(--d-muted)]">Back at {fmtDateTime(e.currentBooking.endAt)}</p>}
                  <div className="flex items-center justify-between pt-3 border-t border-[var(--d-line)]">
                    <p className="text-[18px] font-semibold">{formatBDT(e.pricePerHour)}<span className="text-[12px] font-normal text-[var(--d-muted)]"> / hour</span></p>
                    <Button size="sm" disabled={e.availability === "maintenance"} onClick={() => setRent(e)}>Rent</Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {rent && (
        <BookingModal
          equipment={rent}
          onClose={() => setRent(null)}
          onBooked={(b) => { setRent(null); toast.success(`Request sent — total ${formatBDT(b.totalPrice)}. We'll confirm shortly.`); refresh(); }}
        />
      )}
    </div>
  );
}

