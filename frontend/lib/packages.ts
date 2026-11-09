"use client";

import { useCallback, useEffect, useState } from "react";
import { API_URL } from "./api";

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

const PKG_STORAGE_KEY = "idecom_studio_packages_v2";
const PKG_FOOTER_KEY = "idecom_studio_packages_footer_v1";

export function usePackagesStore() {
  const [packages, setPackages] = useState<StudioPackage[]>(INITIAL_PACKAGES);
  const [meta, setMeta] = useState<PackageFooterConfig>(DEFAULT_PACKAGE_FOOTER);
  const [loading, setLoading] = useState(true);

  const persistLocal = (next: StudioPackage[]) => {
    try {
      localStorage.setItem(PKG_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let active = true;
    try {
      const savedMeta = localStorage.getItem(PKG_FOOTER_KEY);
      if (savedMeta) setMeta({ ...DEFAULT_PACKAGE_FOOTER, ...JSON.parse(savedMeta) });
      const savedPkgs = localStorage.getItem(PKG_STORAGE_KEY);
      if (savedPkgs) {
        const parsed = JSON.parse(savedPkgs);
        if (Array.isArray(parsed) && parsed.length > 0 && "tierName" in parsed[0]) {
          setPackages(parsed);
        }
      }
    } catch {
      // ignore
    }

    fetch(`${API_URL}/packages`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((remote: StudioPackage[] | null) => {
        if (!active) return;
        if (
          Array.isArray(remote) &&
          remote.length > 0 &&
          "tierName" in remote[0]
        ) {
          setPackages(remote);
          persistLocal(remote);
        }
      })
      .catch(() => {
        // fallback to localStorage / INITIAL_PACKAGES
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const savePackage = useCallback(async (pkg: StudioPackage, isNew: boolean) => {
    setPackages((prev) => {
      const next = isNew
        ? [...prev, pkg]
        : prev.map((p) => (p.id === pkg.id ? pkg : p));
      persistLocal(next);
      return next;
    });

    try {
      const res = await fetch(
        isNew ? `${API_URL}/packages` : `${API_URL}/packages/${pkg.id}`,
        {
          method: isNew ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
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
          }),
        }
      );
      if (res.ok) {
        const saved: StudioPackage = await res.json();
        setPackages((prev) => {
          const next = prev.map((p) => (p.id === pkg.id ? saved : p));
          persistLocal(next);
          return next;
        });
      }
    } catch {
      // localStorage already updated
    }
  }, []);

  const deletePackage = useCallback(async (id: string) => {
    setPackages((prev) => {
      const next = prev.filter((p) => p.id !== id);
      persistLocal(next);
      return next;
    });
    try {
      await fetch(`${API_URL}/packages/${id}`, { method: "DELETE" });
    } catch {
      // ignore
    }
  }, []);

  const resetPackages = useCallback(async () => {
    setPackages(INITIAL_PACKAGES);
    setMeta(DEFAULT_PACKAGE_FOOTER);
    persistLocal(INITIAL_PACKAGES);
    try {
      localStorage.removeItem(PKG_FOOTER_KEY);
      await fetch(`${API_URL}/packages/reset`, { method: "POST" });
    } catch {
      // ignore
    }
  }, []);

  const updateMeta = useCallback((patch: Partial<PackageFooterConfig>) => {
    setMeta((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(PKG_FOOTER_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return {
    packages,
    meta,
    loading,
    savePackage,
    deletePackage,
    resetPackages,
    updateMeta,
  };
}
