"use client";

import { useEffect, useSyncExternalStore } from "react";
import { apiFetch, clearError, reportError } from "./http";
import { calculateRentalPrice, toMinutes, type DurationUnit } from "./rental";

/** Flat rate for each labour added to a package. */
export const LABOUR_RATE = 1000;

export type CostPurpose = "car" | "maintenance" | "labour" | "other";

export type EquipmentLine = {
  id: string;
  equipmentId: string;
  name: string;
  pricePerHour: number;
  value: number; // duration as typed
  unit: DurationUnit;
  qty: number;
};

export type VideoEditing = { enabled: boolean; videos: number; pricePerVideo: number };

export type ExtraCost = {
  id: string;
  purpose: CostPurpose;
  label: string; // used when purpose === "other"
  qty: number; // labour count (labour only)
  amount: number; // ignored for labour (qty × LABOUR_RATE)
};

export type Discount = { type: "percent" | "fixed"; value: number };

export type CustomPackage = {
  id: string;
  name: string;
  client: string;
  equipment: EquipmentLine[];
  editing: VideoEditing;
  extras: ExtraCost[];
  discount: Discount;
  createdAt: string;
};

export const PURPOSE_LABEL: Record<CostPurpose, string> = {
  car: "Car rent",
  maintenance: "Maintenance cost",
  labour: "Labour",
  other: "Other",
};

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** price per hour × (minutes ÷ 60) × quantity */
export const equipmentLineTotal = (l: EquipmentLine) =>
  round2(calculateRentalPrice(l.pricePerHour, toMinutes(l.value, l.unit)) * l.qty);

export const extraAmount = (c: ExtraCost) => (c.purpose === "labour" ? c.qty * LABOUR_RATE : c.amount);

export function calcPackage(p: Pick<CustomPackage, "equipment" | "editing" | "extras" | "discount">) {
  const equipment = round2(p.equipment.reduce((s, l) => s + equipmentLineTotal(l), 0));
  const editing = p.editing.enabled ? round2(p.editing.videos * p.editing.pricePerVideo) : 0;
  const extras = round2(p.extras.reduce((s, c) => s + extraAmount(c), 0));
  const subtotal = round2(equipment + editing + extras);
  const raw = p.discount.type === "percent" ? (subtotal * p.discount.value) / 100 : p.discount.value;
  const discount = round2(Math.min(Math.max(raw, 0), subtotal));
  return { equipment, editing, extras, subtotal, discount, total: round2(subtotal - discount) };
}

/* ---------- storage: PostgreSQL via the backend (table custom_packages) ---------- */

const LEGACY_KEY = "idecom_custom_packages_v1"; // older versions kept packages in this browser

let list: CustomPackage[] = [];
let loaded = false;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();
const set = (next: CustomPackage[]) => {
  list = next;
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

const body = (p: CustomPackage) => ({
  name: p.name,
  client: p.client,
  equipment: p.equipment,
  editing: p.editing,
  extras: p.extras,
  discount: p.discount,
  createdAt: p.createdAt,
});

async function load() {
  try {
    let rows = await apiFetch<CustomPackage[]>("/custom-packages");
    // one-time move of packages that only exist in this browser
    try {
      const raw = localStorage.getItem(LEGACY_KEY);
      const legacy = raw ? (JSON.parse(raw) as CustomPackage[]) : [];
      if (legacy.length && rows.length === 0) {
        for (const p of legacy) await apiFetch(`/custom-packages/${p.id}`, { method: "PUT", body: body(p) });
        rows = await apiFetch<CustomPackage[]>("/custom-packages");
        localStorage.removeItem(LEGACY_KEY);
      }
    } catch {
      // storage unavailable — ignore
    }
    loaded = true;
    clearError();
    set(rows); // also wakes `ready` subscribers
  } catch (e) {
    reportError((e as Error).message);
    loading = null;
  }
}

export function useCustomPackages() {
  const packages = useSyncExternalStore(subscribe, () => list, () => EMPTY);
  // true once the list really came from the database (the edit page waits for this)
  const ready = useSyncExternalStore(subscribe, () => loaded, () => false);
  useEffect(() => {
    if (!loading) loading = load();
  }, []);

  const save = async (p: CustomPackage) => {
    if (!loaded) return reportError("Not connected to the database, so this package was not saved.");
    const prev = list;
    set(prev.some((x) => x.id === p.id) ? prev.map((x) => (x.id === p.id ? p : x)) : [p, ...prev]);
    try {
      await apiFetch(`/custom-packages/${p.id}`, { method: "PUT", body: body(p) });
      clearError();
    } catch (e) {
      set(prev);
      reportError(`Could not save to the database: ${(e as Error).message}`);
    }
  };

  const remove = async (id: string) => {
    if (!loaded) return reportError("Not connected to the database.");
    const prev = list;
    set(prev.filter((x) => x.id !== id));
    try {
      await apiFetch(`/custom-packages/${id}`, { method: "DELETE" });
      clearError();
    } catch (e) {
      set(prev);
      reportError(`Could not delete: ${(e as Error).message}`);
    }
  };

  return { packages, ready, save, remove };
}

const EMPTY: CustomPackage[] = [];
