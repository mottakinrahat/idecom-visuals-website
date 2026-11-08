"use client";

import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";
const KEY = "idecom-dash-theme";
const EVT = "idecom-theme";

function subscribe(cb: () => void) {
  window.addEventListener(EVT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVT, cb);
    window.removeEventListener("storage", cb);
  };
}

function read(): Theme {
  try {
    return localStorage.getItem(KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function useTheme(): [Theme, () => void] {
  const theme = useSyncExternalStore(subscribe, read, () => "light" as Theme);
  const toggle = () => {
    try {
      localStorage.setItem(KEY, theme === "dark" ? "light" : "dark");
    } catch {}
    window.dispatchEvent(new Event(EVT));
  };
  return [theme, toggle];
}
