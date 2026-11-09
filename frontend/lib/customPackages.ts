"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
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

/* ---------- storage (browser) ---------- */

const KEY = "idecom_custom_packages_v1";
const EVT = "idecom-custom-packages";
let cache: { raw: string | null; list: CustomPackage[] } = { raw: null, list: [] };

function read(): CustomPackage[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw !== cache.raw) cache = { raw, list: raw ? (JSON.parse(raw) as CustomPackage[]) : [] };
  } catch {
    // ignore
  }
  return cache.list;
}

const subscribe = (cb: () => void) => {
  window.addEventListener(EVT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVT, cb);
    window.removeEventListener("storage", cb);
  };
};

const EMPTY: CustomPackage[] = [];

export function useCustomPackages() {
  const list = useSyncExternalStore(subscribe, read, () => EMPTY);
  const [, force] = useState(0);

  const write = useCallback((next: CustomPackage[]) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event(EVT));
    force((n) => n + 1);
  }, []);

  const save = (p: CustomPackage) => {
    const cur = read();
    write(cur.some((x) => x.id === p.id) ? cur.map((x) => (x.id === p.id ? p : x)) : [p, ...cur]);
  };
  const remove = (id: string) => write(read().filter((x) => x.id !== id));

  return { packages: list, save, remove };
}
