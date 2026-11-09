"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2 } from "@/components/dashboard/icons";
import { Card } from "@/components/dashboard/ui";
import {
  Button, IconButton, ConfirmDialog, DataTable, Dropdown, EmptyState, ErrorBanner, Spinner, Toaster, useToast, type Column,
} from "@/components/ui";
import { api, ApiError, assetUrl, type Booking, type BookingStatus, type Equipment } from "@/lib/api";
import { formatBDT, formatDuration } from "@/lib/rental";
import { BookingModal } from "./BookingModal";
import { EquipmentFormModal } from "./EquipmentFormModal";
import { AvailabilityBadge, BookingStatusBadge, NEXT_ACTIONS, fmtDateTime } from "./status";
import { useRentalData } from "./useRentalData";

export function EquipmentManager() {
  return (
    <Toaster>
      <Manager />
    </Toaster>
  );
}

type Tab = "equipment" | "bookings";

function Manager() {
  const toast = useToast();
  const { equipment, bookings, loading, error, refresh } = useRentalData();
  const [tab, setTab] = useState<Tab>("equipment");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState<{ item: Equipment | null } | null>(null);
  const [rent, setRent] = useState<Equipment | null>(null);
  const [removing, setRemoving] = useState<Equipment | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);

  const stats = useMemo(() => ({
    total: equipment.length,
    available: equipment.filter((e) => e.availability === "available").length,
    rented: equipment.filter((e) => e.availability === "rented").length,
    maintenance: equipment.filter((e) => e.availability === "maintenance").length,
  }), [equipment]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return equipment.filter((e) =>
      (!filter || e.availability === filter) && (!needle || `${e.name} ${e.description}`.toLowerCase().includes(needle)));
  }, [equipment, q, filter]);

  const confirmRemove = async () => {
    if (!removing) return;
    setRemoveBusy(true);
    try {
      await api.deleteEquipment(removing.id);
      toast.success(`"${removing.name}" deleted`);
      setRemoving(null);
      refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Delete failed");
      setRemoving(null);
    } finally {
      setRemoveBusy(false);
    }
  };

  const changeStatus = async (b: Booking, to: BookingStatus) => {
    try {
      await api.setBookingStatus(b.id, to);
      toast.success("Booking updated");
      refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Update failed");
    }
  };

  const equipmentColumns: Column<Equipment>[] = [
    {
      key: "item", header: "Equipment",
      cell: (e) => (
        <div className="flex items-center gap-3 min-w-[180px]">
          <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-[var(--d-card2)] border border-[var(--d-line)] grid place-items-center text-[10px] text-[var(--d-muted)]">
            {e.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={assetUrl(e.imageUrl)} alt={e.name} className="w-full h-full object-cover" />
            ) : "No img"}
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{e.name}</p>
            <p className="text-[12px] text-[var(--d-muted)] truncate max-w-[260px] md:hidden">{formatBDT(e.pricePerHour)} / hour</p>
          </div>
        </div>
      ),
    },
    { key: "desc", header: "Description", hideOnMobile: true, cell: (e) => <p className="text-[var(--d-muted)] line-clamp-2 max-w-[320px]">{e.description || "—"}</p> },
    { key: "price", header: "Price / hour", hideOnMobile: true, cell: (e) => <span className="font-semibold">{formatBDT(e.pricePerHour)}</span> },
    {
      key: "avail", header: "Availability",
      cell: (e) => (
        <div className="flex flex-col gap-1 items-start">
          <AvailabilityBadge value={e.availability} />
          {e.currentBooking ? (
            <span className="text-[11px] text-[var(--d-muted)]">until {fmtDateTime(e.currentBooking.endAt)}</span>
          ) : e.nextBooking ? (
            <span className="text-[11px] text-[var(--d-muted)]">next {fmtDateTime(e.nextBooking.startAt)}</span>
          ) : null}
        </div>
      ),
    },
    {
      key: "actions", header: "", className: "text-right",
      cell: (e) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button size="sm" disabled={e.availability === "maintenance"} onClick={() => setRent(e)}>Rent</Button>
          <IconButton label="Edit" onClick={() => setForm({ item: e })}><Pencil className="w-4 h-4" /></IconButton>
          <IconButton label="Delete" onClick={() => setRemoving(e)} className="hover:!text-red-500 hover:!border-red-500"><Trash2 className="w-4 h-4" /></IconButton>
        </div>
      ),
    },
  ];

  const bookingColumns: Column<Booking>[] = [
    {
      key: "who", header: "Customer",
      cell: (b) => (
        <div className="min-w-[140px]">
          <p className="font-semibold">{b.customerName}</p>
          <p className="text-[12px] text-[var(--d-muted)]">{b.customerPhone}</p>
        </div>
      ),
    },
    { key: "item", header: "Equipment", cell: (b) => b.equipmentName ?? "—" },
    {
      key: "when", header: "When", hideOnMobile: true,
      cell: (b) => <span className="whitespace-nowrap">{fmtDateTime(b.startAt)} → {fmtDateTime(b.endAt)}<br /><span className="text-[12px] text-[var(--d-muted)]">{formatDuration(b.durationMinutes)}</span></span>,
    },
    { key: "total", header: "Total", cell: (b) => <span className="font-semibold">{formatBDT(b.totalPrice)}</span> },
    { key: "status", header: "Status", cell: (b) => <BookingStatusBadge value={b.status} /> },
    {
      key: "actions", header: "", className: "text-right",
      cell: (b) => (
        <div className="flex justify-end gap-1.5 flex-wrap">
          {NEXT_ACTIONS[b.status].map((a) => (
            <Button key={a.to} size="sm" variant={a.danger ? "secondary" : "primary"} onClick={() => changeStatus(b, a.to)}>{a.label}</Button>
          ))}
        </div>
      ),
    },
  ];

  const statCards = [
    ["Total equipment", stats.total, ""], ["Available", stats.available, "available"], ["Rented out", stats.rented, "rented"], ["Maintenance", stats.maintenance, "maintenance"],
  ] as const;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-[20px] font-semibold">Equipment Booking</h1>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setForm({ item: null })}>Add equipment</Button>
      </div>

      {error && <div className="mb-5"><ErrorBanner message={error} onRetry={refresh} /></div>}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        {statCards.map(([label, n, key]) => (
          <button key={label} type="button" onClick={() => { setTab("equipment"); setFilter(key); }} className="text-left cursor-pointer">
            <Card className={`!p-4 transition-colors ${filter === key && tab === "equipment" ? "!border-[var(--d-accent)]" : "hover:!border-[var(--d-accent)]"}`}>
              <p className="text-[12px] text-[var(--d-muted)]">{label}</p>
              <p className="text-[24px] font-semibold mt-1">{n}</p>
            </Card>
          </button>
        ))}
      </div>

      <Card className="!p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-[var(--d-line)]">
          <div role="tablist" className="flex gap-1 p-1 rounded-full bg-[var(--d-card2)]">
            {(["equipment", "bookings"] as Tab[]).map((t) => (
              <button
                key={t} role="tab" aria-selected={tab === t} type="button" onClick={() => setTab(t)}
                className={`px-4 h-8 rounded-full text-[13px] font-medium cursor-pointer transition-colors ${tab === t ? "bg-[var(--d-primary)] text-[var(--d-ink)]" : "text-[var(--d-muted)] hover:text-[var(--d-fg)]"}`}
              >
                {t === "equipment" ? "Equipment" : `Equipment Booking (${bookings.length})`}
              </button>
            ))}
          </div>
          {tab === "equipment" && (
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <label className="flex items-center gap-2 h-9 px-3 rounded-lg bg-[var(--d-card2)] text-[var(--d-muted)] text-[13px] flex-1 sm:w-64">
                <Search className="w-4 h-4" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search equipment" aria-label="Search equipment" className="bg-transparent outline-none w-full text-[var(--d-fg)]" />
              </label>
              <Dropdown
                value={filter}
                onChange={setFilter}
                ariaLabel="Filter by availability"
                className="h-9 min-w-[150px]"
                options={[
                  { value: "", label: "All status", dot: "gray" },
                  { value: "available", label: "Available", dot: "green" },
                  { value: "rented", label: "Rented out", dot: "amber" },
                  { value: "maintenance", label: "Maintenance", dot: "red" },
                ]}
              />
            </div>
          )}
        </div>

        {loading ? (
          <Spinner />
        ) : tab === "equipment" ? (
          rows.length ? (
            <DataTable columns={equipmentColumns} rows={rows} rowKey={(e) => e.id} />
          ) : (
            <EmptyState
              title={equipment.length ? "No equipment matches your filters" : "No equipment yet"}
              message={equipment.length ? "Try a different search or filter." : "Add your first camera, light or lens to start renting."}
              action={!equipment.length && <Button icon={<Plus className="w-4 h-4" />} onClick={() => setForm({ item: null })}>Add equipment</Button>}
            />
          )
        ) : bookings.length ? (
          <DataTable columns={bookingColumns} rows={bookings} rowKey={(b) => b.id} />
        ) : (
          <EmptyState title="No bookings yet" message="Rent out an item and it will show up here." />
        )}
      </Card>

      {form && (
        <EquipmentFormModal
          equipment={form.item}
          onClose={() => setForm(null)}
          onSaved={(saved, mode) => { setForm(null); toast.success(`"${saved.name}" ${mode}`); refresh(); }}
        />
      )}
      {rent && (
        <BookingModal
          equipment={rent}
          onClose={() => setRent(null)}
          onBooked={(b) => { setRent(null); toast.success(`Booked — total ${formatBDT(b.totalPrice)}`); setTab("bookings"); refresh(); }}
        />
      )}
      <ConfirmDialog
        open={!!removing}
        danger
        loading={removeBusy}
        title="Delete equipment?"
        message={<>This will permanently remove <b>{removing?.name}</b> and its booking history.</>}
        confirmLabel="Delete"
        onConfirm={confirmRemove}
        onClose={() => setRemoving(null)}
      />
    </>
  );
}

