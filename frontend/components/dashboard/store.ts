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

export type SocialPlatformKey =
  | "whatsapp"
  | "facebook"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "linkedin"
  | "x";

export type SiteSettings = {
  logoUrl: string;
  showWordmarkWithLogo?: boolean;
  socialLinks: Record<SocialPlatformKey, string>;
};

export const SOCIAL_PLATFORMS: {
  key: SocialPlatformKey;
  label: string;
  placeholder: string;
  hint: string;
}[] = [
  {
    key: "whatsapp",
    label: "WhatsApp",
    placeholder: "e.g. 8801516790830 or https://wa.me/8801516790830",
    hint: "Phone number with country code or direct wa.me link",
  },
  {
    key: "facebook",
    label: "Facebook",
    placeholder: "https://facebook.com/yourpage",
    hint: "Facebook page or profile URL",
  },
  {
    key: "instagram",
    label: "Instagram",
    placeholder: "https://instagram.com/yourhandle",
    hint: "Instagram profile URL",
  },
  {
    key: "tiktok",
    label: "TikTok",
    placeholder: "https://tiktok.com/@yourhandle",
    hint: "TikTok profile URL",
  },
  {
    key: "youtube",
    label: "YouTube",
    placeholder: "https://youtube.com/@yourchannel",
    hint: "YouTube channel URL",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    placeholder: "https://linkedin.com/company/yourstudio",
    hint: "LinkedIn company or profile URL",
  },
  {
    key: "x",
    label: "X (Twitter)",
    placeholder: "https://x.com/yourhandle",
    hint: "X / Twitter profile URL",
  },
];

export function resolveSocialHref(key: SocialPlatformKey | string, raw?: string): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed || trimmed === "#" || trimmed === "#contact") return "";
  const lowerKey = key.toLowerCase();
  if (lowerKey === "whatsapp") {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
    if (trimmed.startsWith("wa.me/")) return `https://${trimmed}`;
    const digits = trimmed.replace(/\D/g, "");
    if (!digits) return "";
    const normalized = digits.length === 11 && digits.startsWith("01") ? `88${digits}` : digits;
    return `https://wa.me/${normalized}`;
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

export type ActiveSocialItem = {
  key: SocialPlatformKey;
  label: string;
  href: string;
  raw: string;
};

export function getActiveSocials(content: SiteContent): ActiveSocialItem[] {
  const links = content.settings?.socialLinks ?? DEFAULT_SITE_SETTINGS.socialLinks;
  const active: ActiveSocialItem[] = [];
  for (const p of SOCIAL_PLATFORMS) {
    const raw = links[p.key] ?? "";
    const href = resolveSocialHref(p.key, raw);
    if (href) {
      active.push({ key: p.key, label: p.label, href, raw });
    }
  }
  return active;
}

export type SiteContent = {
  settings: SiteSettings;
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

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  logoUrl: "",
  showWordmarkWithLogo: false,
  socialLinks: {
    whatsapp: "8801516790830",
    facebook: "https://facebook.com/idecomvisuals",
    instagram: "https://instagram.com/idecomvisuals",
    tiktok: "",
    youtube: "",
    linkedin: "",
    x: "",
  },
};

export const DEFAULT_SITE_CONTENT: SiteContent = {
  settings: DEFAULT_SITE_SETTINGS,
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

function mergeSiteContent(parsed: Partial<SiteContent>): SiteContent {
  return {
    ...DEFAULT_SITE_CONTENT,
    ...parsed,
    settings: {
      ...DEFAULT_SITE_SETTINGS,
      ...(parsed.settings ?? {}),
      socialLinks: {
        ...DEFAULT_SITE_SETTINGS.socialLinks,
        ...(parsed.settings?.socialLinks ?? {}),
      },
    },
  };
}

export function useStudioStore() {
  const [content, setContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [leads, setLeads] = useState<CrmLead[]>(DEFAULT_CRM_LEADS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const savedSite = localStorage.getItem(SITE_STORAGE_KEY);
      if (savedSite) {
        setContent(mergeSiteContent(JSON.parse(savedSite)));
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
        if (s) setContent(mergeSiteContent(JSON.parse(s)));
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

