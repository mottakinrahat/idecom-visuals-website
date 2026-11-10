"use client";

import { useEffect, useSyncExternalStore } from "react";
import { API_URL } from "@/lib/api";
import { apiFetch, clearError, reportError } from "@/lib/http";

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
    email: string;
    phone: string;
    location: string;
    footerBio: string;
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
    email: "hello@idecomvisuals.com",
    phone: "+880 1XXX-XXXXXX",
    location: "Bangladesh",
    footerBio:
      "IDeCom Visuals is a creative studio for brands and creators. We plan, shoot, edit and design content that stops the scroll, then run the campaigns that put it in front of the right people.",
  },
};

// ---------------------------------------------------------------------------
// Server-backed state. Everything below is stored in PostgreSQL through the backend
// (CMS content in the tables site_sections, client_brands, client_stats, services → service_items, team_members,
// site_contact + a small `kv_store` document for hero/settings; CRM in `crm_leads`) — nothing is kept in localStorage.
// All components share ONE copy, so a change in the CMS shows up everywhere immediately.
// ---------------------------------------------------------------------------

/** Keys older versions used in this browser — read once to move that data to the database, then removed. */
const LEGACY_SITE_KEY = "idecom_cms_site_v1";
const LEGACY_CRM_KEY = "idecom_crm_leads_v1";

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

type Snapshot = { content: SiteContent; leads: CrmLead[]; hydrated: boolean };

let snap: Snapshot = { content: DEFAULT_SITE_CONTENT, leads: [], hydrated: false };
const SERVER_SNAPSHOT = snap;
const listeners = new Set<() => void>();
const setSnap = (patch: Partial<Snapshot>) => {
  snap = { ...snap, ...patch };
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

/** True only after the data was really loaded from the server — edits are blocked otherwise, so defaults can never overwrite your data. */
let serverReady = false;
const NOT_READY = "Not connected to the database, so this change was not saved. Check that the backend is running, then reload the page.";

const readLegacy = <T,>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};
const dropLegacy = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
};

const leadBody = (l: CrmLead) => ({
  client: l.client,
  company: l.company,
  email: l.email,
  phone: l.phone,
  service: l.service,
  budget: l.budget,
  stage: l.stage,
  dueDate: l.dueDate,
  notes: l.notes,
});

async function load() {
  try {
    const [site, leads] = await Promise.all([
      apiFetch<{ data: Partial<SiteContent> | null }>("/content/site"),
      apiFetch<CrmLead[]>("/crm-leads"),
    ]);

    let content = site.data ? mergeSiteContent(site.data) : DEFAULT_SITE_CONTENT;
    let list = leads;

    // one-time move of anything an older version kept only in this browser
    const legacySite = readLegacy<Partial<SiteContent>>(LEGACY_SITE_KEY);
    if (legacySite && !site.data) {
      content = mergeSiteContent(legacySite);
      await apiFetch("/content/site", { method: "PUT", body: { data: content } });
      dropLegacy(LEGACY_SITE_KEY);
    }
    const legacyLeads = readLegacy<CrmLead[]>(LEGACY_CRM_KEY);
    if (legacyLeads?.length && leads.length === 0) {
      for (const l of legacyLeads) await apiFetch(`/crm-leads/${l.id}`, { method: "PUT", body: leadBody(l) });
      list = await apiFetch<CrmLead[]>("/crm-leads");
      dropLegacy(LEGACY_CRM_KEY);
    }

    serverReady = true;
    clearError();
    setSnap({ content, leads: list, hydrated: true });
  } catch (e) {
    reportError((e as Error).message);
    setSnap({ hydrated: true });
    loading = null; // let the next page load try again
  }
}

let loading: Promise<void> | null = null;
function ensureLoaded() {
  if (!loading) {
    loading = load();
    // don't lose the last edit when the tab is closed within the save delay
    window.addEventListener("pagehide", () => {
      if (siteDirty) void fetch(`${API_URL}/content/site`, { method: "PUT", keepalive: true, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: snap.content }) });
    });
  }
  return loading;
}

/* ---- CMS content (one JSON document) ---- */

let siteTimer: ReturnType<typeof setTimeout> | undefined;
let siteDirty = false;

async function flushSite() {
  clearTimeout(siteTimer);
  siteDirty = false;
  try {
    await apiFetch("/content/site", { method: "PUT", body: { data: snap.content } });
    clearError();
  } catch (e) {
    siteDirty = true;
    reportError(`Could not save to the database: ${(e as Error).message}`);
  }
}

function updateContent(updater: SiteContent | ((prev: SiteContent) => SiteContent)) {
  if (!serverReady) return reportError(NOT_READY);
  const next = typeof updater === "function" ? updater(snap.content) : updater;
  setSnap({ content: next });
  siteDirty = true;
  clearTimeout(siteTimer);
  siteTimer = setTimeout(flushSite, 800); // saved ~0.8 s after you stop typing
}

function resetContent() {
  if (!serverReady) return reportError(NOT_READY);
  setSnap({ content: DEFAULT_SITE_CONTENT });
  void flushSite();
}

/* ---- CRM leads (table crm_leads: one row per lead) ---- */

let leadQueue: Promise<void> = Promise.resolve();

function updateLeads(updater: CrmLead[] | ((prev: CrmLead[]) => CrmLead[])) {
  if (!serverReady) return reportError(NOT_READY);
  const prev = snap.leads;
  const next = typeof updater === "function" ? updater(prev) : updater;
  setSnap({ leads: next });

  const before = new Map(prev.map((l) => [l.id, JSON.stringify(leadBody(l))]));
  const removed = prev.filter((l) => !next.some((n) => n.id === l.id));
  const changed = next.filter((l) => before.get(l.id) !== JSON.stringify(leadBody(l)));

  leadQueue = leadQueue.then(async () => {
    try {
      for (const l of removed) await apiFetch(`/crm-leads/${l.id}`, { method: "DELETE" });
      for (const l of changed) await apiFetch(`/crm-leads/${l.id}`, { method: "PUT", body: leadBody(l) });
      clearError();
    } catch (e) {
      reportError(`Could not save to the database: ${(e as Error).message}`);
      try {
        setSnap({ leads: await apiFetch<CrmLead[]>("/crm-leads") }); // show what is really stored
      } catch {
        // still offline
      }
    }
  });
}

export function useStudioStore() {
  const s = useSyncExternalStore(subscribe, () => snap, () => SERVER_SNAPSHOT);
  useEffect(() => {
    void ensureLoaded();
  }, []);
  return { content: s.content, leads: s.leads, hydrated: s.hydrated, updateContent, resetContent, updateLeads };
}
