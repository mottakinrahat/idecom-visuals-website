"use client";

import { useEffect, useId, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "@/components/dashboard/icons";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
};

const WIDTH = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" };

/** Accessible modal: Esc / backdrop closes, locks page scroll, rendered in a portal. */
export function Modal({ open, title, onClose, children, footer, size = "md" }: Props) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  // the dashboard theme variables live on .dash, so mirror them onto the portal root
  const themeRoot = document.querySelector<HTMLElement>(".dash");
  return createPortal(
    <div className="dash fixed inset-0 z-[200] grid place-items-center p-4 !bg-transparent" data-theme={themeRoot?.dataset.theme ?? "light"}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className={`relative w-full ${WIDTH[size]} max-h-[92vh] flex flex-col rounded-2xl bg-[var(--d-card)] border border-[var(--d-line)] shadow-2xl`}>
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[var(--d-line)]">
          <h2 id={titleId} className="text-[16px] font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 text-[var(--d-muted)] hover:text-[var(--d-fg)] cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 px-5 py-4 border-t border-[var(--d-line)]">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

