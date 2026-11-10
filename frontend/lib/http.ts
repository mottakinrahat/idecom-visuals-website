"use client";

import { useSyncExternalStore } from "react";
import { API_URL } from "./api";

/** JSON request to the backend. Throws an Error with a readable message. */
export async function apiFetch<T = unknown>(path: string, init: (Omit<RequestInit, "body"> & { body?: unknown }) = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      headers: { "Content-Type": "application/json", ...init.headers },
      cache: "no-store",
    });
  } catch {
    throw new Error("Cannot reach the server. Is the backend running?");
  }
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = Array.isArray(body?.message) ? body.message[0] : body?.message;
    throw new Error(msg || `Request failed (${res.status})`);
  }
  return body as T;
}

/* ---- one place that remembers the last "could not save" problem, shown as a banner in the dashboard ---- */

let message = "";
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const reportError = (m: string) => {
  message = m;
  emit();
};
export const clearError = () => {
  if (message) {
    message = "";
    emit();
  }
};

export function useServerError() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => message,
    () => "",
  );
}
