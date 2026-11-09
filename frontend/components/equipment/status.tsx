import { Badge } from "@/components/ui";
import type { Availability, BookingStatus } from "@/lib/api";

const AVAIL = { available: ["green", "Available"], rented: ["amber", "Rented out"], maintenance: ["red", "Maintenance"] } as const;
const BOOKING = {
  pending: ["amber", "Pending"], confirmed: ["blue", "Confirmed"], active: ["green", "Out on rental"], returned: ["gray", "Returned"], cancelled: ["red", "Cancelled"],
} as const;

export const AvailabilityBadge = ({ value }: { value: Availability }) => <Badge tone={AVAIL[value][0]}>{AVAIL[value][1]}</Badge>;
export const BookingStatusBadge = ({ value }: { value: BookingStatus }) => <Badge tone={BOOKING[value][0]}>{BOOKING[value][1]}</Badge>;

/** Next valid actions for a booking (mirrors the backend transition table). */
export const NEXT_ACTIONS: Record<BookingStatus, { to: BookingStatus; label: string; danger?: boolean }[]> = {
  pending: [{ to: "confirmed", label: "Confirm" }, { to: "cancelled", label: "Cancel", danger: true }],
  confirmed: [{ to: "active", label: "Hand over" }, { to: "cancelled", label: "Cancel", danger: true }],
  active: [{ to: "returned", label: "Mark returned" }],
  returned: [],
  cancelled: [],
};

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

