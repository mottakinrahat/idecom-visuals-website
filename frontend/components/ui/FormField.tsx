"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "@/components/dashboard/icons";

const CONTROL =
  "w-full rounded-xl bg-[var(--d-card2)] border border-[var(--d-line)] px-3.5 text-[13px] text-[var(--d-fg)] placeholder:text-[var(--d-muted)] focus:border-[var(--d-accent)] outline-none transition-colors";

/** Label + control + hint/error wrapper shared by every form field. */
export function Field({
  label,
  error,
  hint,
  htmlFor,
  children,
  className = "",
}: {
  label: string;
  error?: string;
  hint?: ReactNode;
  htmlFor: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="block text-[12px] font-medium text-[var(--d-muted)] mb-1.5"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-1 text-[12px] text-red-500">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-[12px] text-[var(--d-muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

type Common = {
  label: string;
  error?: string;
  hint?: ReactNode;
  wrapperClassName?: string;
};

export function TextField({
  label,
  error,
  hint,
  wrapperClassName,
  className = "",
  ...rest
}: Common & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <Field
      label={label}
      error={error}
      hint={hint}
      htmlFor={id}
      className={wrapperClassName}
    >
      <input
        id={id}
        aria-invalid={!!error}
        className={`${CONTROL} h-10 ${error ? "!border-red-500" : ""} ${className}`}
        {...rest}
      />
    </Field>
  );
}

export function TextArea({
  label,
  error,
  hint,
  wrapperClassName,
  className = "",
  ...rest
}: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <Field
      label={label}
      error={error}
      hint={hint}
      htmlFor={id}
      className={wrapperClassName}
    >
      <textarea
        id={id}
        aria-invalid={!!error}
        className={`${CONTROL} py-2.5 resize-y min-h-[84px] ${
          error ? "!border-red-500" : ""
        } ${className}`}
        {...rest}
      />
    </Field>
  );
}

export type DropdownOption = {
  value: string;
  label: string;
  dot?: "green" | "amber" | "red" | "blue" | "gray";
};

const DOT_COLORS: Record<NonNullable<DropdownOption["dot"]>, string> = {
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  blue: "bg-sky-500",
  gray: "bg-gray-400",
};

function inferDot(val: string): DropdownOption["dot"] | undefined {
  const v = val.toLowerCase();
  if (v === "active" || v === "available" || v === "completed") return "green";
  if (v === "maintenance" || v === "cancelled") return "red";
  if (v === "rented" || v === "pending" || v === "review") return "amber";
  if (v === "confirmed" || v === "in production") return "blue";
  return undefined;
}

/**
 * Custom-designed dropdown menu (replaces ugly native OS <select> popup).
 * Renders its popover in a portal so it is never clipped inside modals.
 */
export function Dropdown({
  id,
  value,
  options,
  onChange,
  error,
  className = "",
  ariaLabel,
}: {
  id?: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  error?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const selected = options.find((o) => o.value === value) ?? options[0];

  const updatePosition = () => {
    const el = btnRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const menuHeight = Math.min(options.length * 40 + 16, 260);
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < menuHeight + 12 && rect.top > menuHeight;
    setCoords({
      top: openUpward ? rect.top - menuHeight - 6 : rect.bottom + 6,
      left: rect.left,
      width: Math.max(rect.width, 160),
    });
  };

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onScrollOrResize = () => updatePosition();
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open, options.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const themeRoot =
    typeof document !== "undefined"
      ? document.querySelector<HTMLElement>(".dash")
      : null;

  const selectedDot = selected ? selected.dot ?? inferDot(selected.value) : undefined;

  return (
    <>
      <button
        ref={btnRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        aria-invalid={error}
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center justify-between gap-2.5 rounded-xl bg-[var(--d-card2)] border px-3.5 h-10 text-[13px] text-[var(--d-fg)] transition-all cursor-pointer select-none ${
          open
            ? "border-[var(--d-accent)] ring-2 ring-[var(--d-accent)]/15 bg-[var(--d-card)]"
            : error
            ? "border-red-500"
            : "border-[var(--d-line)] hover:border-[var(--d-accent)]/60"
        } ${className}`}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedDot && (
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${DOT_COLORS[selectedDot]}`}
            />
          )}
          <span className="truncate font-medium">{selected?.label ?? ""}</span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[var(--d-muted)] shrink-0 transition-transform duration-200 ${
            open ? "rotate-180 text-[var(--d-accent)]" : ""
          }`}
        />
      </button>

      {open &&
        coords &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            data-theme={themeRoot?.dataset.theme ?? "light"}
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              width: coords.width,
            }}
            className="dash z-[350] p-1.5 rounded-xl bg-[var(--d-card)] border border-[var(--d-line)] shadow-[0_12px_32px_rgba(0,0,0,0.16)] max-h-64 overflow-y-auto"
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              const dot = opt.dot ?? inferDot(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-[13px] text-left transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[var(--d-tint)] text-[var(--d-fg)] font-semibold"
                      : "text-[var(--d-fg)] hover:bg-[var(--d-card2)]"
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    {dot && (
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${DOT_COLORS[dot]}`}
                      />
                    )}
                    <span className="truncate">{opt.label}</span>
                  </span>
                  {isSelected && (
                    <Check className="w-4 h-4 text-[var(--d-accent)] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}

export function SelectField({
  label,
  error,
  hint,
  wrapperClassName,
  className = "",
  value,
  onChange,
  children,
}: Common & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();

  // Extract <option value="...">label</option> children so existing callers work seamlessly
  const options: DropdownOption[] = [];
  Children.forEach(children, (child) => {
    if (isValidElement<{ value?: string; children?: ReactNode }>(child) && child.type === "option") {
      const el = child as ReactElement<{ value?: string; children?: ReactNode }>;
      const val = String(el.props.value ?? "");
      const lbl =
        typeof el.props.children === "string"
          ? el.props.children
          : Array.isArray(el.props.children)
          ? el.props.children.join("")
          : val;
      options.push({ value: val, label: lbl });
    }
  });

  const handleSelect = (nextValue: string) => {
    if (!onChange) return;
    const syntheticEvent = {
      target: { value: nextValue },
      currentTarget: { value: nextValue },
    } as ChangeEvent<HTMLSelectElement>;
    onChange(syntheticEvent);
  };

  return (
    <Field
      label={label}
      error={error}
      hint={hint}
      htmlFor={id}
      className={wrapperClassName}
    >
      <Dropdown
        id={id}
        value={String(value ?? options[0]?.value ?? "")}
        options={options}
        onChange={handleSelect}
        error={!!error}
        className={`w-full ${className}`}
      />
    </Field>
  );
}
