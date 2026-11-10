"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, clearError, reportError } from "./http";

export type PackageIconType = "camera" | "location" | "user" | "store";

export type StudioPackage = {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  iconType: PackageIconType;
  imageUrl: string;
  tierName: string; // "Standard" | "Premium" | custom
  highlighted: boolean;
  price: number;
  duration: string;
  features: string[];
  updatedAt?: string;
};

export type PackageFooterConfig = {
  eyebrow: string;
  heading: string;
  subheading: string;
  ctaTitle: string;
  ctaSubtitle: string;
  whatsappPhone: string;
};

export const DEFAULT_PACKAGE_FOOTER: PackageFooterConfig = {
  eyebrow: "PROFESSIONAL",
  heading: "Video Production Services",
  subheading: "High-quality visuals for your brand, business and personal story.",
  ctaTitle: "Not quite what you need? Let's tailor a plan for you.",
  ctaSubtitle: "Reach out for a consultation.",
  whatsappPhone: "0151679083",
};

export const INITIAL_PACKAGES: StudioPackage[] = [
  {
    id: "pkg-01-std",
    number: "01",
    title: "Content Shooting",
    subtitle: "(Indoor)",
    iconType: "camera",
    imageUrl:
      "https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&w=1000&q=80",
    tierName: "Standard",
    highlighted: false,
    price: 4500,
    duration: "2 Hours",
    features: [
      "1x Sony A7 V, tripod-mounted",
      "1 set backdrop of your choice",
      "Basic 2-point lighting",
      "1 in-house camera operator",
      "Raw footage delivered same day",
    ],
  },
  {
    id: "pkg-01-prm",
    number: "01",
    title: "Content Shooting",
    subtitle: "(Indoor)",
    iconType: "camera",
    imageUrl:
      "https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&w=1000&q=80",
    tierName: "Premium",
    highlighted: true,
    price: 10000,
    duration: "4 hours + 30 min extra",
    features: [
      "2x Sony A7 V, multi-angle simultaneous",
      "All backdrops, up to 3 set changes",
      "Camera operator + on-set assistant",
      "Props, softbox + reflector setup",
      "1-Basic short-form Reels",
      "Priority same-day raw delivery up to 4K",
    ],
  },
  {
    id: "pkg-02-std",
    number: "02",
    title: "Outdoor Shoot",
    subtitle: "(Near IDeCom Office)",
    iconType: "location",
    imageUrl:
      "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1000&q=80",
    tierName: "Standard",
    highlighted: false,
    price: 5999,
    duration: "Half-day • 5 Hours",
    features: [
      "1x Sony A7 V, guided posing/direction",
      "1 Camera operator + 1 assistant",
      "Portable Led Light",
      "Wireless lapel mic",
      "Gimbal Stabilizer",
      "Reflector/diffuser for natural light",
      "Raw audio + Up to 4K video delivered",
    ],
  },
  {
    id: "pkg-02-prm",
    number: "02",
    title: "Outdoor Shoot",
    subtitle: "(Near IDeCom Office)",
    iconType: "location",
    imageUrl:
      "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1000&q=80",
    tierName: "Premium",
    highlighted: true,
    price: 11499,
    duration: "Half-day • 5 hours + 30 min extra",
    features: [
      "1x Sony A7 V, guided posing/direction",
      "1 Camera operator + 2 assistant",
      "Portable Led Light",
      "Wireless lapel mic",
      "Gimbal Stabilizer",
      "Reflector/diffuser for natural light",
      "2min Edited Video or 2 Short-form Reels (60sec)",
      "Priority Delivery in 24-72 hours.",
      "Raw audio + video delivered on demand",
    ],
  },
  {
    id: "pkg-03-std",
    number: "03",
    title: "Personal Branding",
    subtitle: "",
    iconType: "user",
    imageUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80",
    tierName: "Standard",
    highlighted: false,
    price: 7999,
    duration: "Half-day • 3 Hours",
    features: [
      "2 outfits/looks, 1-2 set changes",
      "1x Sony A7 V, guided posing/direction",
      "1 short-form talking-head reel",
      "Delivery in 3-4 working days",
    ],
  },
  {
    id: "pkg-03-prm",
    number: "03",
    title: "Personal Branding",
    subtitle: "",
    iconType: "user",
    imageUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80",
    tierName: "Premium",
    highlighted: true,
    price: 14999,
    duration: "Full-day • 6 Hours + 30 min extra",
    features: [
      "Up to 3 outfit/look changes, all sets",
      "2x Sony A7 V, photo + video",
      "Pre-shoot styling & moodboard session",
      "1 short-form talking-head reel",
      "Delivery in 5 working days",
    ],
  },
  {
    id: "pkg-04-std",
    number: "04",
    title: "Small Business",
    subtitle: "",
    iconType: "store",
    imageUrl:
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1000&q=80",
    tierName: "Standard",
    highlighted: false,
    price: 4999,
    duration: "Half-day • 2.5 Hours",
    features: [
      "1 Script based on Business",
      "1 set backdrop of your choice",
      "Basic 2-point lighting",
      "1 in-house camera operator",
      "1x Sony A7 V, tripod-mounted",
      "Wireless lapel mic",
      "Reflector/diffuser for natural light",
      "Basic edited video delivery within 72 hours.",
    ],
  },
  {
    id: "pkg-04-prm",
    number: "04",
    title: "Small Business",
    subtitle: "",
    iconType: "store",
    imageUrl:
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1000&q=80",
    tierName: "Premium",
    highlighted: true,
    price: 7999,
    duration: "Half-day • 3 Hours",
    features: [
      "1 Script based on Business",
      "Camera operator + Assistance",
      "1x Sony A7 V, tripod-mounted",
      "Wireless lapel mic",
      "Reflector/diffuser for natural light",
      "Studio Indoor (If Outdoor, additional cost will be added)",
      "Regular edited video + motion delivery within 72 hours.",
    ],
  },
];

const LEGACY_FOOTER_KEY = "idecom_studio_packages_footer_v1"; // older versions kept these texts in this browser
const LEGACY_PACKAGES_KEY = "idecom_studio_packages_v2";

/** Packages live in the backend (table packages); the page texts (banner / WhatsApp) in kv_store "package-meta". */
export function usePackagesStore() {
  const [packages, setPackages] = useState<StudioPackage[]>([]);
  const [meta, setMeta] = useState<PackageFooterConfig>(DEFAULT_PACKAGE_FOOTER);
  const [loading, setLoading] = useState(true);
  const ready = useRef(false);
  const metaTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [rows, m] = await Promise.all([
          apiFetch<StudioPackage[]>("/packages"),
          apiFetch<{ data: Partial<PackageFooterConfig> | null }>("/content/package-meta"),
        ]);
        let footer = { ...DEFAULT_PACKAGE_FOOTER, ...(m.data ?? {}) };
        // one-time move of texts saved in this browser
        try {
          const raw = localStorage.getItem(LEGACY_FOOTER_KEY);
          if (raw && !m.data) {
            footer = { ...DEFAULT_PACKAGE_FOOTER, ...JSON.parse(raw) };
            await apiFetch("/content/package-meta", { method: "PUT", body: { data: footer } });
          }
          if (raw && !m.data) localStorage.removeItem(LEGACY_FOOTER_KEY);
          localStorage.removeItem(LEGACY_PACKAGES_KEY); // old cache; the database is the source now
        } catch {
          // storage unavailable — ignore
        }
        if (!active) return;
        ready.current = true;
        setPackages(rows);
        setMeta(footer);
        clearError();
      } catch (e) {
        reportError((e as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const payload = (pkg: StudioPackage) => ({
    number: pkg.number,
    title: pkg.title,
    subtitle: pkg.subtitle,
    iconType: pkg.iconType,
    imageUrl: pkg.imageUrl,
    tierName: pkg.tierName,
    highlighted: pkg.highlighted,
    price: pkg.price,
    duration: pkg.duration,
    features: pkg.features,
  });

  const savePackage = useCallback(async (pkg: StudioPackage, isNew: boolean) => {
    if (!ready.current) return reportError("Not connected to the database, so this package was not saved.");
    try {
      const saved = await apiFetch<StudioPackage>(isNew ? "/packages" : `/packages/${pkg.id}`, {
        method: isNew ? "POST" : "PUT",
        body: payload(pkg),
      });
      setPackages((prev) => (isNew ? [...prev, saved] : prev.map((p) => (p.id === pkg.id ? saved : p))));
      clearError();
    } catch (e) {
      reportError(`Could not save the package: ${(e as Error).message}`);
    }
  }, []);

  const deletePackage = useCallback(async (id: string) => {
    if (!ready.current) return reportError("Not connected to the database.");
    try {
      await apiFetch(`/packages/${id}`, { method: "DELETE" });
      setPackages((prev) => prev.filter((p) => p.id !== id));
      clearError();
    } catch (e) {
      reportError(`Could not delete the package: ${(e as Error).message}`);
    }
  }, []);

  const resetPackages = useCallback(async () => {
    if (!ready.current) return reportError("Not connected to the database.");
    try {
      const rows = await apiFetch<StudioPackage[]>("/packages/reset", { method: "POST" });
      await apiFetch("/content/package-meta", { method: "PUT", body: { data: DEFAULT_PACKAGE_FOOTER } });
      setPackages(rows);
      setMeta(DEFAULT_PACKAGE_FOOTER);
      clearError();
    } catch (e) {
      reportError(`Could not reset: ${(e as Error).message}`);
    }
  }, []);

  const updateMeta = useCallback((patch: Partial<PackageFooterConfig>) => {
    if (!ready.current) return reportError("Not connected to the database, so this change was not saved.");
    setMeta((prev) => {
      const next = { ...prev, ...patch };
      clearTimeout(metaTimer.current);
      metaTimer.current = setTimeout(() => {
        apiFetch("/content/package-meta", { method: "PUT", body: { data: next } })
          .then(clearError)
          .catch((e: Error) => reportError(`Could not save to the database: ${e.message}`));
      }, 800);
      return next;
    });
  }, []);

  return { packages, meta, loading, savePackage, deletePackage, resetPackages, updateMeta };
}
