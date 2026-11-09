"use client";

import type { ReactNode } from "react";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** hide below the `md` breakpoint to keep the table readable on phones */
  hideOnMobile?: boolean;
  className?: string;
};

/** Generic responsive table: horizontal scroll on small screens, secondary columns hidden on mobile. */
export function DataTable<T>({ columns, rows, rowKey }: { columns: Column<T>[]; rows: T[]; rowKey: (row: T) => string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="text-[12px] text-[var(--d-muted)] border-b border-[var(--d-line)]">
            {columns.map((c) => (
              <th key={c.key} className={`py-3 px-3 font-medium whitespace-nowrap ${c.hideOnMobile ? "hidden md:table-cell" : ""} ${c.className ?? ""}`}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-[var(--d-line)] last:border-0 hover:bg-[var(--d-card2)]/60 transition-colors">
              {columns.map((c) => (
                <td key={c.key} className={`py-3 px-3 align-middle ${c.hideOnMobile ? "hidden md:table-cell" : ""} ${c.className ?? ""}`}>{c.cell(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

