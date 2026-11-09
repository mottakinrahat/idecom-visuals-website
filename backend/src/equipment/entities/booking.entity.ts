export const BOOKING_STATUSES = [
  'pending',
  'confirmed',
  'active',
  'returned',
  'cancelled',
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

/** Statuses that hold the equipment (block overlapping bookings). */
export const BLOCKING_STATUSES: BookingStatus[] = [
  'pending',
  'confirmed',
  'active',
];

/** Allowed status transitions. */
export const BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['active', 'cancelled'],
  active: ['returned'],
  returned: [],
  cancelled: [],
};

export interface Booking {
  id: string;
  equipmentId: string;
  customerName: string;
  customerPhone: string;
  note: string;
  /** ISO start time. */
  startAt: string;
  /** ISO end time (startAt + durationMinutes). */
  endAt: string;
  durationMinutes: number;
  /** Snapshot of the hourly rate at booking time. */
  pricePerHour: number;
  /** Server-calculated: pricePerHour × durationMinutes ÷ 60. */
  totalPrice: number;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}

