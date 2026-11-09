import type { EquipmentFormValues } from "./rental";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
const ORIGIN = API_URL.replace(/\/api\/?$/, "");

/** Uploaded images are served by the backend; turn "/uploads/x.jpg" into a full URL. */
export const assetUrl = (path: string) => (!path ? "" : /^(https?:|data:)/.test(path) ? path : `${ORIGIN}${path}`);

export type Availability = "available" | "rented" | "maintenance";
export type BookingStatus = "pending" | "confirmed" | "active" | "returned" | "cancelled";

export type Booking = {
  id: string;
  equipmentId: string;
  equipmentName?: string;
  customerName: string;
  customerPhone: string;
  note: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  pricePerHour: number;
  totalPrice: number;
  status: BookingStatus;
};

export type Equipment = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  pricePerHour: number;
  status: "active" | "maintenance";
  availability: Availability;
  currentBooking: Booking | null;
  nextBooking: Booking | null;
  upcomingBookings: number;
  createdAt: string;
  updatedAt: string;
};

export class ApiError extends Error {
  constructor(message: string, public status: number, public details: string[] = []) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: init?.body instanceof FormData ? init?.headers : { "Content-Type": "application/json", ...init?.headers },
      cache: "no-store",
    });
  } catch {
    throw new ApiError("Cannot reach the server. Is the backend running?", 0);
  }
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const msgs: string[] = Array.isArray(body?.message) ? body.message : body?.message ? [body.message] : [];
    throw new ApiError(msgs[0] ?? `Request failed (${res.status})`, res.status, msgs);
  }
  return body as T;
}

const payload = (v: EquipmentFormValues) => ({
  name: v.name.trim(),
  description: v.description.trim(),
  imageUrl: v.imageUrl,
  pricePerHour: Number(v.pricePerHour),
  status: v.status,
});

export const api = {
  listEquipment: (q = "", availability = "") =>
    request<Equipment[]>(`/equipment?${new URLSearchParams({ ...(q && { q }), ...(availability && { availability }) })}`),
  createEquipment: (v: EquipmentFormValues) => request<Equipment>("/equipment", { method: "POST", body: JSON.stringify(payload(v)) }),
  updateEquipment: (id: string, v: EquipmentFormValues) => request<Equipment>(`/equipment/${id}`, { method: "PATCH", body: JSON.stringify(payload(v)) }),
  deleteEquipment: (id: string) => request<void>(`/equipment/${id}`, { method: "DELETE" }),

  listBookings: () => request<Booking[]>("/bookings"),
  createBooking: (equipmentId: string, b: { customerName: string; customerPhone: string; note: string; startAt: string; durationMinutes: number }) =>
    request<Booking>(`/equipment/${equipmentId}/bookings`, {
      method: "POST",
      body: JSON.stringify({ ...b, customerName: b.customerName.trim(), customerPhone: b.customerPhone.trim(), note: b.note.trim(), startAt: new Date(b.startAt).toISOString() }),
    }),
  setBookingStatus: (id: string, status: BookingStatus) =>
    request<Booking>(`/bookings/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),

  uploadImage: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return request<{ url: string }>("/uploads/image", { method: "POST", body: fd });
  },
};

