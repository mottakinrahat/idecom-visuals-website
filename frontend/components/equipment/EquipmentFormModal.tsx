"use client";

import { useState } from "react";
import { Modal, Button, TextField, TextArea, SelectField, ImageUpload } from "@/components/ui";
import { api, ApiError, type Equipment } from "@/lib/api";
import { validateEquipment, formatBDT, type EquipmentFormValues, type FieldErrors } from "@/lib/rental";

const EMPTY: EquipmentFormValues = { name: "", description: "", imageUrl: "", pricePerHour: "", status: "active" };

const fromEquipment = (e: Equipment): EquipmentFormValues => ({
  name: e.name, description: e.description, imageUrl: e.imageUrl, pricePerHour: String(e.pricePerHour), status: e.status,
});

/** Add / edit equipment. Pass `equipment` to edit, omit to create. Mounted fresh each time it opens. */
export function EquipmentFormModal({ equipment, onClose, onSaved }: {
  equipment?: Equipment | null; onClose: () => void; onSaved: (saved: Equipment, mode: "created" | "updated") => void;
}) {
  const editing = !!equipment;
  const [values, setValues] = useState<EquipmentFormValues>(equipment ? fromEquipment(equipment) : EMPTY);
  const [errors, setErrors] = useState<FieldErrors<EquipmentFormValues>>({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof EquipmentFormValues>(k: K, v: EquipmentFormValues[K]) => {
    setValues((s) => ({ ...s, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const errs = validateEquipment(values);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    setServerError("");
    try {
      const saved = editing ? await api.updateEquipment(equipment!.id, values) : await api.createEquipment(values);
      onSaved(saved, editing ? "updated" : "created");
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const price = Number(values.pricePerHour);
  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? "Edit equipment" : "Add equipment"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="equipment-form" loading={saving}>{editing ? "Save changes" : "Add equipment"}</Button>
        </>
      }
    >
      <form id="equipment-form" onSubmit={submit} noValidate className="flex flex-col gap-4">
        <ImageUpload value={values.imageUrl} onChange={(u) => set("imageUrl", u)} label="Equipment image" />
        <TextField label="Name" value={values.name} onChange={(e) => set("name", e.target.value)} error={errors.name} placeholder="e.g. Sony A7 IV + 24-70mm" maxLength={80} />
        <TextArea label="Description" value={values.description} onChange={(e) => set("description", e.target.value)} error={errors.description} placeholder="What's included, condition, notes…" maxLength={1000} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Rental price per hour (৳)"
            type="number" inputMode="decimal" min="0" step="0.01"
            value={values.pricePerHour} onChange={(e) => set("pricePerHour", e.target.value)}
            error={errors.pricePerHour} placeholder="500"
            hint={price > 0 && !errors.pricePerHour ? `30 min = ${formatBDT(Math.round(price * 50) / 100)} · 3 h = ${formatBDT(Math.round(price * 300) / 100)} (calculated automatically)` : "Base hourly rate — other durations are calculated from it"}
          />
          <SelectField label="Status" value={values.status} onChange={(e) => set("status", e.target.value as EquipmentFormValues["status"])} hint={values.status === "maintenance" ? "Not bookable while in maintenance" : undefined}>
            <option value="active">Active (bookable)</option>
            <option value="maintenance">Under maintenance</option>
          </SelectField>
        </div>
        {serverError && <p role="alert" className="text-[13px] text-red-500">{serverError}</p>}
      </form>
    </Modal>
  );
}

