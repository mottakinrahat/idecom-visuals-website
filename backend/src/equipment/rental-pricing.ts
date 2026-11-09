/**
 * Rental pricing rules (single source of truth on the server).
 *
 * The hourly price is the BASE rate. Every other duration is derived from it
 * proportionally:  total = pricePerHour × minutes ÷ 60  (rounded to 2 decimals).
 *
 *   1 hour   @ 500/h  → 500.00
 *   20 min   @ 500/h  → 166.67
 *   30 min   @ 500/h  → 250.00
 *   3 hours  @ 500/h  → 1500.00
 */

export const MIN_RENTAL_MINUTES = 1;
export const MAX_RENTAL_MINUTES = 60 * 24 * 30; // 30 days

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function calculateRentalPrice(
  pricePerHour: number,
  durationMinutes: number,
): number {
  return round2((pricePerHour * durationMinutes) / 60);
}

export function calculateEndTime(startIso: string, durationMinutes: number) {
  return new Date(
    new Date(startIso).getTime() + durationMinutes * 60_000,
  ).toISOString();
}

