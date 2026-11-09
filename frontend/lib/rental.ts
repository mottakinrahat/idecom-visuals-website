/**
 * Rental pricing helpers (mirror of backend/src/equipment/rental-pricing.ts).
 * The hourly price is the BASE rate; every other duration is proportional:
 *   total = pricePerHour × minutes ÷ 60   →  500/h: 20 min = 166.67, 30 min = 250, 3 h = 1,500
 * The server recalculates the total on booking, so this is for live display only.
 */

export const MIN_RENTAL_MINUTES = 1;
export const MAX_RENTAL_MINUTES = 60 * 24 * 30;

export type DurationUnit = "minutes" | "hours";

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export const calculateRentalPrice = (pricePerHour: number, minutes: number) =>
  round2((pricePerHour * minutes) / 60);

/** Convert a value typed in hours or minutes to whole minutes. */
export const toMinutes = (value: number, unit: DurationUnit) =>
  Math.round(unit === "hours" ? value * 60 : value);

export const formatBDT = (n: number) =>
  `৳${n.toLocaleString("en-US", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;

export function formatDuration(minutes: number) {
  const d = Math.floor(minutes / 1440);
  const h = Math.floor((minutes % 1440) / 60);
  const m = minutes % 60;
  return [d && `${d}d`, h && `${h}h`, m && `${m}m`].filter(Boolean).join(" ") || "0m";
}

/* ---------- validation (same rules as the backend DTOs) ---------- */

export type EquipmentFormValues = {
  name: string;
  description: string;
  imageUrl: string;
  pricePerHour: string; // kept as text while typing
  status: "active" | "maintenance";
};

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export function validateEquipment(v: EquipmentFormValues): FieldErrors<EquipmentFormValues> {
  const e: FieldErrors<EquipmentFormValues> = {};
  const name = v.name.trim();
  if (name.length < 2) e.name = "Name must be at least 2 characters";
  else if (name.length > 80) e.name = "Name must be at most 80 characters";
  if (v.description.trim().length > 1000) e.description = "Description must be at most 1000 characters";
  const price = Number(v.pricePerHour);
  if (v.pricePerHour.trim() === "" || Number.isNaN(price)) e.pricePerHour = "Enter the hourly price";
  else if (price <= 0) e.pricePerHour = "Price per hour must be greater than 0";
  else if (price > 1_000_000) e.pricePerHour = "Price per hour is too large";
  else if (Math.round(price * 100) / 100 !== price) e.pricePerHour = "Use at most 2 decimals";
  return e;
}

export type BookingFormValues = { customerName: string; customerPhone: string; note: string; startAt: string };

export function validateBooking(v: BookingFormValues, minutes: number): FieldErrors<BookingFormValues & { durationMinutes: number }> {
  const e: FieldErrors<BookingFormValues & { durationMinutes: number }> = {};
  if (v.customerName.trim().length < 2) e.customerName = "Enter the customer name";
  if (!/^[0-9+()\-\s]{7,20}$/.test(v.customerPhone.trim())) e.customerPhone = "Enter a valid phone number";
  if (!v.startAt) e.startAt = "Pick a start time";
  else if (new Date(v.startAt).getTime() < Date.now() - 5 * 60_000) e.startAt = "Start time cannot be in the past";
  if (!Number.isFinite(minutes) || minutes < MIN_RENTAL_MINUTES) e.durationMinutes = "Minimum rental is 1 minute";
  else if (minutes > MAX_RENTAL_MINUTES) e.durationMinutes = "Maximum rental is 30 days";
  return e;
}

