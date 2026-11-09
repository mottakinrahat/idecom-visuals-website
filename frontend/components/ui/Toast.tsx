"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type Toast = { id: number; message: string; tone: "success" | "error" };
const Ctx = createContext<{ success: (m: string) => void; error: (m: string) => void } | null>(null);

/** Wrap a page once; call useToast().success("…") from anywhere inside. */
export function Toaster({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((message: string, tone: Toast["tone"]) => {
    const id = Date.now() + Math.random();
    setItems((t) => [...t, { id, message, tone }]);
    setTimeout(() => setItems((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  const api = useMemo(() => ({ success: (m: string) => push(m, "success"), error: (m: string) => push(m, "error") }), [push]);

  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="fixed bottom-4 right-4 z-[300] flex flex-col gap-2" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`px-4 py-3 rounded-xl text-[13px] font-medium shadow-lg border ${t.tone === "success" ? "bg-[var(--d-card,#fff)] text-[var(--d-fg,#111)] border-emerald-500/50" : "bg-red-500 text-white border-transparent"}`}>
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useToast must be used inside <Toaster>");
  return c;
}

