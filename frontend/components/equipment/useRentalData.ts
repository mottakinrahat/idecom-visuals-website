"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError, type Booking, type Equipment } from "@/lib/api";

/** Loads equipment + bookings and exposes refresh; shared by the dashboard and the public page. */
export function useRentalData() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const [e, b] = await Promise.all([api.listEquipment(), api.listBookings()]);
      setEquipment(e);
      setBookings(b);
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([api.listEquipment(), api.listBookings()])
      .then(([e, b]) => {
        if (!active) return;
        setEquipment(e);
        setBookings(b);
        setError("");
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : "Failed to load data");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { equipment, bookings, loading, error, refresh };
}
