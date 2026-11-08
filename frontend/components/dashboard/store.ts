"use client";

import { useEffect, useState } from "react";

export type VideoItem = {
  id: string;
  w: string;
  tag: string;
  t: string;
  d: string;
  a: string;
  b: string;
  videoUrl?: string;
  thumbUrl?: string;
};

export type DesignItem = {
  id: string;
  cap: string;
  cls: "" | "w-a" | "w-wide";
  art: string;
  label: string;
  imageUrl?: string;
};

export type ServiceItem = {
  id: string;
  title: string;
  hl: boolean;
  items: string[];
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  photoUrl?: string;
};

export type CrmLead = {
  id: string;
  client: string;
  company: string;
  email: string;
  phone: string;
  service: "Video Production" | "Brand Design" | "Reels Package" | "Marketing" | "Full Retainer";
  budget: number;
  stage: "New Inquiry" | "Proposal Sent" | "In Production" | "Review" | "Completed";
  dueDate: string;
  notes: string;
};

export type SiteContent = {
  hero: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    description: string;
    highlightText: string;
    videoUrl: string;
    specs: string;
    ctaPrimary: string;
    ctaSecondary: string;
    facts: { title: string; subtitle: string }[];
  };
  clients: {
    eyebrow: string;
    title: string;
    em: string;
    brands: { style: string; name: string }[];
    stats: { number: string; label: string }[];
  };
  services: {
    eyebrow: string;
    title: string;
    em: string;
    sub: string;
    list: ServiceItem[];
  };
  videos: {
    eyebrow: string;
    title: string;
    em: string;
    landscape: VideoItem[];
    vertical: VideoItem[];
  };
  designs: {
    eyebrow: string;
    title: string;
    em: string;
    items: DesignItem[];
  };
  team: {
    eyebrow: string;
    title: string;
    em: string;
    members: TeamMember[];
  };
  contact: {
    eyebrow: string;
    title: string;
    em: string;
    sub: string;
    whatsappNumber: string;
    email: string;
    phone: string;
    location: string;
    footerBio: string;
    socials: { name: string; url: string }[];
  };
};

export const DEFAULT_SITE_CONTENT: SiteContent = {
  hero: {
    eyebrow: "Creative visual studio",
    titleLine1: "IDeCom",
    titleLine2: "Visuals",
    description: "for brands and creators who want to be seen and remembered.",
    highlightText: "Video production, brand design and social campaigns",
    videoUrl: "https://pub-23faa5b2e66f4ce4a3bd0fd2a00bc342.r2.dev/videos/C9550.mp4",
    specs: "4K UHD · 24 FPS · 16:9",
    ctaPrimary: "Start a project",
    ctaSecondary: "See our work",
    facts: [
      { title: "Based in Bangladesh", subtitle: "Shooting on location" },
      { title: "Working worldwide", subtitle: "Remote edits & design" },
      { title: "Full creative studio", subtitle: "Video · Design · Marketing" },
    ],
  },
  clients: {
    eyebrow: "Our clients",
    title: "Brands & creators",
    em: "we've worked with",
    brands: [
      { style: "b1", name: "NORTHLANE" },
      { style: "b2", name: "kōra studio" },
      { style: "b3", name: "Urban Brew" },
      { style: "b4", name: "Motiv" },
      { style: "b5", name: "pixelfarm" },
      { style: "b1", name: "SOLACE" },
      { style: "b3", name: "Greenroot" },
      { style: "b4", name: "Vanta Wear" },
      { style: "b2", name: "roast&co" },
    ],
    stats: [
      { number: "250", label: "Projects delivered" },
      { number: "120", label: "Happy clients" },
      { number: "50M", label: "Views generated" },
    ],
  },
  services: {
    eyebrow: "Expertise",
    title: "Services &",
    em: "capabilities",
    sub: "One team from first idea to final post. Pick a single service or hand us the whole campaign.",
    list: [
      {
        id: "svc-1",
        title: "Creative production",
        hl: false,
        items: [
          "Commercial & brand films",
          "Product photography",
          "Reels & short-form video",
          "Corporate & event coverage",
          "Video editing & color grading",
          "Motion graphics",
        ],
      },
      {
        id: "svc-2",
        title: "Creative & brand design",
        hl: true,
        items: [
          "Logo & brand identity",
          "Social media design",
          "Packaging & label design",
          "Posters & print",
          "YouTube thumbnails",
          "Pitch decks & presentations",
        ],
      },
      {
        id: "svc-3",
        title: "Marketing",
        hl: false,
        items: [
          "Social media management",
          "Facebook & Instagram ads",
          "Content strategy",
          "Influencer marketing",
          "Campaign management",
          "Monthly performance reports",
        ],
      },
    ],
  },
  videos: {
    eyebrow: "Our projects",
    title: "Featured",
    em: "videos",
    landscape: [
      { id: "l-1", w: "Launch", tag: "Brand film", t: "Café opening launch film", d: "00:01:12:06", a: "#3f6f12", b: "#1a2a0b", videoUrl: "", thumbUrl: "" },
      { id: "l-2", w: "Glow", tag: "Commercial", t: "Skincare product commercial", d: "00:00:45:00", a: "#7a4a2b", b: "#26170e", videoUrl: "", thumbUrl: "" },
      { id: "l-3", w: "Live", tag: "Event", t: "Music night highlights", d: "00:02:30:12", a: "#2b4f7a", b: "#0e1826", videoUrl: "", thumbUrl: "" },
      { id: "l-4", w: "Craft", tag: "Documentary", t: "Inside a handloom workshop", d: "00:04:10:18", a: "#6b5a2a", b: "#1f1a0b", videoUrl: "", thumbUrl: "" },
    ],
    vertical: [
      { id: "v-1", w: "Food", tag: "Reel", t: "Burger drop", d: "00:00:28", a: "#8a2f2f", b: "#240c0c", videoUrl: "", thumbUrl: "" },
      { id: "v-2", w: "Style", tag: "Reel", t: "Eid fashion edit", d: "00:00:32", a: "#5a2f7a", b: "#170c24", videoUrl: "", thumbUrl: "" },
      { id: "v-3", w: "Tech", tag: "Reel", t: "Phone unboxing", d: "00:00:41", a: "#4a6a10", b: "#121a05", videoUrl: "", thumbUrl: "" },
      { id: "v-4", w: "Travel", tag: "Reel", t: "Weekend by the sea", d: "00:00:36", a: "#1f6b72", b: "#081d20", videoUrl: "", thumbUrl: "" },
      { id: "v-5", w: "Gym", tag: "Reel", t: "Fitness studio promo", d: "00:00:24", a: "#7a5a12", b: "#221905", videoUrl: "", thumbUrl: "" },
      { id: "v-6", w: "Home", tag: "Reel", t: "Apartment walkthrough", d: "00:00:52", a: "#3a4a5a", b: "#0d1116", videoUrl: "", thumbUrl: "" },
    ],
  },
  designs: {
    eyebrow: "Latest designs",
    title: "Design",
    em: "works",
    items: [
      { id: "d-1", cls: "w-a", art: "art-can", cap: "Packaging · Fizz Lab soda", label: "FIZZ LAB", imageUrl: "" },
      { id: "d-2", cls: "", art: "art-dance", cap: "Logo · Dance Pass", label: "DANCE PASS", imageUrl: "" },
      { id: "d-3", cls: "", art: "art-root", cap: "Identity · Greenroot", label: "GREENROOT", imageUrl: "" },
      { id: "d-4", cls: "w-wide", art: "art-sale", cap: "Social media · Sale campaign", label: "50% OFF · Monsoon sale", imageUrl: "" },
      { id: "d-5", cls: "", art: "art-coffee", cap: "Poster · Roast & Co.", label: "Coffee Craft", imageUrl: "" },
      { id: "d-6", cls: "", art: "art-noir", cap: "Product ad · Noir parfum", label: "NOIR", imageUrl: "" },
      { id: "d-7", cls: "", art: "art-thumb", cap: "YouTube thumbnail", label: "I tried it 7 days!", imageUrl: "" },
      { id: "d-8", cls: "", art: "art-match", cap: "Event poster", label: "Match Day · FRI 9 PM", imageUrl: "" },
      { id: "d-9", cls: "w-wide", art: "art-travel", cap: "Travel campaign", label: "Summer escape", imageUrl: "" },
      { id: "d-10", cls: "", art: "art-glow", cap: "Packaging · Serum label", label: "glow.", imageUrl: "" },
      { id: "d-11", cls: "", art: "art-deck", cap: "Presentation design", label: "Q3 Growth Plan", imageUrl: "" },
    ],
  },
  team: {
    eyebrow: "Meet the team",
    title: "The core behind",
    em: "IDeCom",
    members: [
      { id: "tm-1", name: "Your Name", role: "Founder & Creative Director", photoUrl: "" },
      { id: "tm-2", name: "Team Member", role: "Lead Video Editor", photoUrl: "" },
      { id: "tm-3", name: "Team Member", role: "Brand Designer", photoUrl: "" },
      { id: "tm-4", name: "Team Member", role: "Marketing Lead", photoUrl: "" },
    ],
  },
  contact: {
    eyebrow: "Get in touch",
    title: "Let's work",
    em: "together",
    sub: "Tell us about your brand, your deadline and your budget. We usually reply within 24 hours.",
    whatsappNumber: "8801700000000",
    email: "hello@idecomvisuals.com",
    phone: "+880 1XXX-XXXXXX",
    location: "Bangladesh",
    footerBio:
      "IDeCom Visuals is a creative studio for brands and creators. We plan, shoot, edit and design content that stops the scroll, then run the campaigns that put it in front of the right people.",
    socials: [
      { name: "Facebook", url: "#contact" },
      { name: "Instagram", url: "#contact" },
      { name: "YouTube", url: "#contact" },
      { name: "Behance", url: "#contact" },
    ],
  },
};

export const DEFAULT_CRM_LEADS: CrmLead[] = [
  {
    id: "crm-1",
    client: "Tariq Hasan",
    company: "Urban Brew Café",
    email: "tariq@urbanbrew.bd",
    phone: "+880 1711-223344",
    service: "Video Production",
    budget: 3500,
    stage: "In Production",
    dueDate: "2026-11-18",
    notes: "4K café launch film + 5 vertical Instagram reels with color grade.",
  },
  {
    id: "crm-2",
    client: "Nadia Rahman",
    company: "Kōra Skincare",
    email: "nadia@korastudio.com",
    phone: "+880 1819-554433",
    service: "Full Retainer",
    budget: 6200,
    stage: "In Production",
    dueDate: "2026-11-25",
    notes: "Monthly product commercial shoot, packaging refresh & paid ad creatives.",
  },
  {
    id: "crm-3",
    client: "Rafiq Ahmed",
    company: "Vanta Wear",
    email: "rafiq@vantawear.io",
    phone: "+880 1912-887766",
    service: "Reels Package",
    budget: 1800,
    stage: "Review",
    dueDate: "2026-11-12",
    notes: "8 vertical fashion drop reels — first cut delivered, awaiting client feedback.",
  },
  {
    id: "crm-4",
    client: "Samira Chowdhury",
    company: "Greenroot Organics",
    email: "samira@greenroot.co",
    phone: "+880 1611-998877",
    service: "Brand Design",
    budget: 2900,
    stage: "Proposal Sent",
    dueDate: "2026-11-30",
    notes: "Complete brand identity, pouch packaging & social launch kit.",
  },
  {
    id: "crm-5",
    client: "Zayan Karim",
    company: "Northlane Athletics",
    email: "zayan@northlane.fit",
    phone: "+880 1755-443322",
    service: "Marketing",
    budget: 2400,
    stage: "New Inquiry",
    dueDate: "2026-12-05",
    notes: "Looking for Q4 Meta + YouTube ad campaign and gym promo reel.",
  },
  {
    id: "crm-6",
    client: "Farhan Islam",
    company: "Roast & Co.",
    email: "farhan@roastandco.com",
    phone: "+880 1311-665544",
    service: "Brand Design",
    budget: 2100,
    stage: "Completed",
    dueDate: "2026-10-28",
    notes: "Coffee bag label series & in-store poster set delivered and approved.",
  },
];

const SITE_STORAGE_KEY = "idecom_cms_site_v1";
const CRM_STORAGE_KEY = "idecom_crm_leads_v1";

export function useStudioStore() {
  const [content, setContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [leads, setLeads] = useState<CrmLead[]>(DEFAULT_CRM_LEADS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const savedSite = localStorage.getItem(SITE_STORAGE_KEY);
      if (savedSite) {
        setContent({ ...DEFAULT_SITE_CONTENT, ...JSON.parse(savedSite) });
      }
      const savedCrm = localStorage.getItem(CRM_STORAGE_KEY);
      if (savedCrm) {
        setLeads(JSON.parse(savedCrm));
      }
    } catch {
      // ignore storage errors
    }
    setHydrated(true);

    const onStorage = () => {
      try {
        const s = localStorage.getItem(SITE_STORAGE_KEY);
        if (s) setContent({ ...DEFAULT_SITE_CONTENT, ...JSON.parse(s) });
        const c = localStorage.getItem(CRM_STORAGE_KEY);
        if (c) setLeads(JSON.parse(c));
      } catch {
        // ignore
      }
    };
    window.addEventListener("idecom-store-update", onStorage);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("idecom-store-update", onStorage);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const updateContent = (updater: SiteContent | ((prev: SiteContent) => SiteContent)) => {
    setContent((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      try {
        localStorage.setItem(SITE_STORAGE_KEY, JSON.stringify(next));
        window.dispatchEvent(new Event("idecom-store-update"));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const resetContent = () => {
    setContent(DEFAULT_SITE_CONTENT);
    try {
      localStorage.removeItem(SITE_STORAGE_KEY);
      window.dispatchEvent(new Event("idecom-store-update"));
    } catch {
      // ignore
    }
  };

  const updateLeads = (updater: CrmLead[] | ((prev: CrmLead[]) => CrmLead[])) => {
    setLeads((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      try {
        localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify(next));
        window.dispatchEvent(new Event("idecom-store-update"));
      } catch {
        // ignore
      }
      return next;
    });
  };

  return { content, updateContent, resetContent, leads, updateLeads, hydrated };
}

