"use client";

import { useEffect, useId, useRef, useState, type ComponentType } from "react";
import {
  ArrowDown2,
  Book,
  Building,
  Calendar2,
  Camera,
  Cpu,
  Heart,
  Airplane,
  Reserve,
  ShoppingCart,
  Shop,
  Star1,
  Magicpen,
} from "iconsax-react";
import { INQUIRY_CATEGORIES } from "@/lib/inquiries";

type Icon = ComponentType<{ size?: string | number; color?: string; variant?: "Linear" | "Bold" }>;

const ICONS: Record<string, Icon> = {
  "E-commerce": ShoppingCart,
  "Restaurant & Food": Reserve,
  "Fashion & Clothing": Shop,
  "Beauty & Health": Heart,
  "Real Estate": Building,
  "Education & Courses": Book,
  "Technology & Software": Cpu,
  "Events & Wedding": Calendar2,
  "Travel & Tourism": Airplane,
  "Personal Brand / Creator": Camera,
  Other: Magicpen,
};

/** Custom dropdown so the list matches the site (native <select> popups can't be styled). */
export default function CategorySelect({
  id,
  value,
  onChange,
  onBlur,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const listId = useId();
  const options = INQUIRY_CATEGORIES as readonly string[];
  const Current = ICONS[value] ?? Star1;

  const openMenu = () => {
    setActive(Math.max(0, options.indexOf(value)));
    setOpen(true);
  };
  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
    (root.current?.querySelector("button") as HTMLButtonElement | null)?.focus();
  };

  // close when clicking elsewhere
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) {
        setOpen(false);
        onBlur?.();
      }
    };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open, onBlur]);

  // keep the highlighted row visible
  useEffect(() => {
    if (open) list.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const onKey = (e: React.KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(options.length - 1, i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
    else if (e.key === "Home") { e.preventDefault(); setActive(0); }
    else if (e.key === "End") { e.preventDefault(); setActive(options.length - 1); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(options[active]); }
    else if (e.key === "Escape") { e.preventDefault(); setOpen(false); onBlur?.(); }
    else if (e.key === "Tab") { setOpen(false); onBlur?.(); }
  };

  return (
    <div className="cs" ref={root} data-open={open}>
      <button
        type="button"
        id={id}
        className="cs-btn"
        data-empty={value === ""}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        data-invalid={invalid}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onBlur={() => { if (!open) onBlur?.(); }}
        onKeyDown={onKey}
      >
        <span className="cs-ic"><Current size={18} color="currentColor" /></span>
        <span className="cs-val">{value || "Choose a category…"}</span>
        <ArrowDown2 size={16} color="currentColor" className="cs-chev" />
      </button>

      {open && (
        <ul className="cs-list" id={listId} role="listbox" ref={list} aria-label="Business field">
          {options.map((o, i) => {
            const Ic = ICONS[o] ?? Star1;
            const selected = o === value;
            return (
              <li
                key={o}
                role="option"
                aria-selected={selected}
                data-active={i === active}
                className="cs-opt"
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(o)}
              >
                <span className="cs-ic"><Ic size={18} color="currentColor" /></span>
                <span className="cs-txt">{o}</span>
                {selected && (
                  <svg className="cs-check" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
