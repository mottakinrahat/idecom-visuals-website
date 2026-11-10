"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { inquiriesApi } from "@/lib/inquiries";
import {
  LayoutDashboard,
  Wallet,
  LayoutTemplate,
  Contact,
  Package,
  Camera,
  MessageSquare,
  Settings,
  Search,
  Bell,
  AlignLeft,
  ChevronDown,
  Sun,
  Moon,
  X,
} from "@/components/dashboard/icons";
import { Shapes, Logo } from "@/components/home/Shapes";
import { useTheme } from "./theme";
import { useServerError } from "@/lib/http";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/income", label: "Income", icon: Wallet },
  { href: "/dashboard/cms", label: "CMS", icon: LayoutTemplate },
  { href: "/dashboard/requests", label: "Requests", icon: MessageSquare },
  { href: "/dashboard/crm", label: "CRM", icon: Contact },
  { href: "/dashboard/package", label: "Package", icon: Package },
  { href: "/dashboard/equipment-booking", label: "Equipment Booking", icon: Camera },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [theme, toggleTheme] = useTheme();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const serverError = useServerError();
  const [pendingCount, setPendingCount] = useState(0);

  // badge on "Requests": how many are waiting for a phone call
  useEffect(() => {
    let live = true;
    inquiriesApi.list().then((l) => live && setPendingCount(l.filter((i) => i.status === "pending").length)).catch(() => {});
    return () => { live = false; };
  }, [pathname]);

  return (
    <div className="dash min-h-screen flex" data-theme={theme}>
      <Shapes />

      {/* Sidebar */}
      <aside
        data-collapsed={collapsed}
        className={`group/side is-collapsible fixed inset-y-0 left-0 z-50 bg-[var(--d-card)] border-r border-[var(--d-line)] flex flex-col transition-all duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        } w-60 ${collapsed ? "lg:w-[76px]" : ""}`}
      >
        <div className="h-[72px] px-5 flex items-center justify-between shrink-0 lg:group-data-[collapsed=true]/side:px-0 lg:group-data-[collapsed=true]/side:justify-center">
          <Logo />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="lg:hidden p-1.5 text-[var(--d-muted)]"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-3">
          <label className="flex items-center gap-2 px-3 h-10 rounded-lg bg-[var(--d-card2)] text-[var(--d-muted)] text-[13px] lg:group-data-[collapsed=true]/side:justify-center lg:group-data-[collapsed=true]/side:px-0">
            <Search className="w-4 h-4" />
            <input
              placeholder="Search anything"
              className="bg-transparent outline-none w-full placeholder:text-[var(--d-muted)] lg:group-data-[collapsed=true]/side:hidden"
            />
          </label>
        </div>

        <nav className="px-3 mt-5 flex flex-col gap-1">
          <span className="px-2 mb-1 text-[11px] tracking-wide text-[var(--d-muted)] lg:group-data-[collapsed=true]/side:hidden">MAIN MENU</span>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                title={item.label}
                className={`relative flex items-center gap-3 px-3 h-10 rounded-lg text-[13px] transition-colors lg:group-data-[collapsed=true]/side:justify-center lg:group-data-[collapsed=true]/side:px-0 ${
                  active
                    ? "bg-[var(--d-tint)] text-[var(--d-fg)] font-semibold"
                    : "text-[var(--d-fg)] hover:bg-[var(--d-card2)]"
                }`}
              >
                {active && (
                  <span className="absolute -left-3 top-0 bottom-0 w-1 rounded-r bg-[var(--d-accent)]" />
                )}
                <Icon className="w-[18px] h-[18px]" strokeWidth={1.8} />
                <span className="lg:group-data-[collapsed=true]/side:hidden">{item.label}</span>
                {item.href === "/dashboard/requests" && pendingCount > 0 && (
                  <span className="ml-auto min-w-5 h-5 px-1.5 grid place-items-center rounded-full bg-[var(--d-primary)] text-[var(--d-ink)] text-[11px] font-bold lg:group-data-[collapsed=true]/side:absolute lg:group-data-[collapsed=true]/side:top-1 lg:group-data-[collapsed=true]/side:right-1 lg:group-data-[collapsed=true]/side:min-w-4 lg:group-data-[collapsed=true]/side:h-4 lg:group-data-[collapsed=true]/side:text-[9px] lg:group-data-[collapsed=true]/side:px-1">
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 h-[72px] px-5 lg:px-6 flex items-center justify-between bg-[var(--d-card)] border-b border-[var(--d-line)]">
          <button
            type="button"
            onClick={() => (window.innerWidth >= 1024 ? setCollapsed((c) => !c) : setOpen(true))}
            className="p-2 text-[var(--d-fg)]"
            aria-label="Toggle sidebar"
          >
            <AlignLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            <button type="button" className="p-2 text-[var(--d-fg)]" aria-label="Search">
              <Search className="w-5 h-5" strokeWidth={1.8} />
            </button>
            <button type="button" className="p-2 text-[var(--d-fg)]" aria-label="Notifications">
              <Bell className="w-5 h-5" strokeWidth={1.8} />
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-full border border-[var(--d-line)] text-[var(--d-fg)] hover:border-[var(--d-accent)]"
              aria-label="Toggle light / dark mode"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className="flex items-center gap-2.5 pl-4 border-l border-[var(--d-line)]">
              <span className="w-9 h-9 rounded-full bg-[var(--d-primary)] text-[var(--d-ink)] grid place-items-center text-[13px] font-semibold">
                ID
              </span>
              <span className="hidden sm:flex items-center gap-1 text-[13px] font-medium">
                IDeCom <ChevronDown className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-5 lg:p-8 w-full max-w-[1440px] mx-auto">
          {serverError && (
            <div role="alert" className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-[13px] text-red-500">
              {serverError}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
