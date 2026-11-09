"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-[var(--d-primary)] hover:bg-[var(--d-primary-hi)] text-[var(--d-ink)] border-transparent",
  secondary: "bg-[var(--d-card)] hover:border-[var(--d-accent)] text-[var(--d-fg)] border-[var(--d-line)]",
  ghost: "bg-transparent hover:bg-[var(--d-card2)] text-[var(--d-fg)] border-transparent",
  danger: "bg-red-500 hover:bg-red-600 text-white border-transparent",
};
const SIZES: Record<Size, string> = { sm: "h-8 px-3 text-[12px]", md: "h-10 px-4 text-[13px]" };

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
};

export function Button({ variant = "primary", size = "md", loading, icon, className = "", children, disabled, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-full border font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {loading ? <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" /> : icon}
      {children}
    </button>
  );
}

/** Square icon-only button (edit / delete / close …). */
export function IconButton({ label, className = "", children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`w-8 h-8 inline-grid place-items-center rounded-lg border border-[var(--d-line)] text-[var(--d-muted)] hover:text-[var(--d-fg)] hover:border-[var(--d-accent)] transition-colors cursor-pointer disabled:opacity-40 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

