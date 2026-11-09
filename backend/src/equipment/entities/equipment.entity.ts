export const EQUIPMENT_STATUSES = ['active', 'maintenance'] as const;
/** Manual status set by the office. "maintenance" blocks all new bookings. */
export type EquipmentStatus = (typeof EQUIPMENT_STATUSES)[number];

/** Live availability, derived from status + current bookings. */
export type Availability = 'available' | 'rented' | 'maintenance';

export interface Equipment {
  id: string;
  name: string;
  description: string;
  /** Path/URL of the uploaded image ('' when none). */
  imageUrl: string;
  /** Base hourly rate in BDT. All other durations are derived from it. */
  pricePerHour: number;
  status: EquipmentStatus;
  createdAt: string;
  updatedAt: string;
}

