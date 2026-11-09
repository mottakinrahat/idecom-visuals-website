"use client";

import { useState } from "react";
import { Modal, Button, TextField, TextArea } from "@/components/ui";
import { api, ApiError, assetUrl, type Booking, type Equipment } from "@/lib/api";
import { formatBDT, validateBooking, type BookingFormValues, type FieldErrors } from "@/lib/rental";
import { RentalCalculator } from "./RentalCalculator";

/** value for <input type="datetime-local"> in the user's local time */
const localNow = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

/** Rent an item: customer details + start time + duration (hours/minutes) with live total. */
export function BookingModal({ equipment, onClose, onBooked }: {
  equipment: Equipment; onClose: () => void; onBooked: (b: Booking) => void;
}) {
  const [values, setValues] = useState<BookingFormValues>({ customerName: "", customerPhone: "", note: "", startAt: localNow() });
  const [minutes, setMinutes] = useState(60);
  const [errors, setErrors] = useState<FieldErrors<BookingFormValues & { durationMinutes: number }>>({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof BookingFormValues>(k: K, v: string) => {
    setValues((s) => ({ ...s, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const errs = validateBooking(values, minutes);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    setServerError("");
    try {
      onBooked(await api.createBooking(equipment.id, { ...values, durationMinutes: minutes }));
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Rent: ${equipment.name}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="booking-form" loading={saving}>Book now</Button>
        </>
      }
    >
      <form id="booking-form" onSubmit={submit} noValidate className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-xl bg-[var(--d-card2)] p-3">
          {equipment.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={assetUrl(equipment.imageUrl)} alt="" className="w-12 h-12 rounded-lg object-cover" />
          )}
          <div className="min-w-0 text-[13px]">
            <p className="font-semibold truncate">{equipment.name}</p>
            <p className="text-[var(--d-muted)]">{formatBDT(equipment.pricePerHour)} / hour</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Customer name" value={values.customerName} onChange={(e) => set("customerName", e.target.value)} error={errors.customerName} autoComplete="name" />
          <TextField label="Phone" type="tel" value={values.customerPhone} onChange={(e) => set("customerPhone", e.target.value)} error={errors.customerPhone} placeholder="+880 1XXX-XXXXXX" autoComplete="tel" />
        </div>
        <TextField label="Start time" type="datetime-local" min={localNow()} value={values.startAt} onChange={(e) => set("startAt", e.target.value)} error={errors.startAt} />

        <RentalCalculator pricePerHour={equipment.pricePerHour} onChange={(m) => { setMinutes(m); setErrors((e) => ({ ...e, durationMinutes: undefined })); }} error={errors.durationMinutes} />

        <TextArea label="Note (optional)" value={values.note} onChange={(e) => set("note", e.target.value)} maxLength={500} placeholder="Pick-up details, special requests…" />
        {serverError && <p role="alert" className="text-[13px] text-red-500">{serverError}</p>}
      </form>
    </Modal>
  );
}

