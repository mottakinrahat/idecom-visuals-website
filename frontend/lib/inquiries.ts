import { API_URL } from "./api";

export const INQUIRY_CATEGORIES = [
  "E-commerce",
  "Restaurant & Food",
  "Fashion & Clothing",
  "Beauty & Health",
  "Real Estate",
  "Education & Courses",
  "Technology & Software",
  "Events & Wedding",
  "Travel & Tourism",
  "Personal Brand / Creator",
  "Other",
] as const;

/** pending → phone-verified → accepted (becomes a CRM lead); or rejected */
export type InquiryStatus = "pending" | "verified" | "accepted" | "rejected";

export type Inquiry = {
  id: string;
  name: string;
  phone: string;
  email: string;
  facebookUrl: string;
  website: string;
  category: string;
  description: string;
  status: InquiryStatus;
  createdAt: string;
  verifiedAt?: string;
  verifyNote?: string;
  acceptedAt?: string;
  leadId?: string;
  rejectedAt?: string;
  rejectReason?: string;
};

export type InquiryForm = {
  name: string;
  phone: string;
  email: string;
  facebookUrl: string;
  website: string;
  category: string;
  description: string;
};

export const EMPTY_FORM: InquiryForm = { name: "", phone: "", email: "", facebookUrl: "", website: "", category: "", description: "" };

/** "facebook.com/mypage" → "https://facebook.com/mypage" */
export const withProtocol = (u: string) => {
  const v = u.trim();
  return v && !/^https?:\/\//i.test(v) ? `https://${v}` : v;
};

const VALID_FB_HOSTS = new Set([
  "facebook.com",
  "www.facebook.com",
  "m.facebook.com",
  "web.facebook.com",
  "business.facebook.com",
  "fb.com",
  "www.fb.com",
  "fb.me",
  "www.fb.me",
]);

const FB_PLACEHOLDERS = new Set(["yourpage", "your-page", "your_page", "yourbrand", "example", "testpage"]);

const FB_SYSTEM_ROUTES = new Set([
  "login",
  "login.php",
  "reg",
  "recover",
  "checkpoint",
  "help",
  "settings",
  "privacy",
  "policies",
  "terms",
  "watch",
  "marketplace",
  "gaming",
  "bookmarks",
  "notifications",
  "messages",
  "events",
  "friends",
  "home.php",
  "hashtag",
  "search",
]);

export function validateName(raw: string): string | undefined {
  const v = raw.trim();
  if (!v) return "Please enter your name";
  if (v.length < 2) return "Name must be at least 2 characters";
  if (v.length > 80) return "Name must be 80 characters or less";
  if (!/^[\p{L}\s.'-]+$/u.test(v) || (v.match(/\p{L}/gu) ?? []).length < 2) {
    return "Enter a valid name (letters only)";
  }
  return undefined;
}

export function validateBangladeshPhone(raw: string): string | undefined {
  const v = raw.trim();
  if (!v) return "Please enter your phone number";
  if (/^(\+?880|88)/.test(v)) {
    return "Remove +88 — enter the 11-digit number starting with 01 (e.g. 01712345678)";
  }
  if (/[^\d]/.test(v)) {
    return "Phone number must contain digits only without spaces or symbols (e.g. 01712345678)";
  }
  if (!v.startsWith("01")) {
    return "Bangladesh mobile number must start with 01 (e.g. 01712345678)";
  }
  if (v.length >= 3 && !/^01[3-9]/.test(v)) {
    return "Enter a valid Bangladesh operator prefix (013–019)";
  }
  if (v.length !== 11) {
    return `Phone number must be 11 digits (currently ${v.length} digit${v.length === 1 ? "" : "s"})`;
  }
  if (!/^01[3-9]\d{8}$/.test(v)) {
    return "Enter a valid 11-digit Bangladesh number (e.g. 01712345678)";
  }
  return undefined;
}

export function validateEmail(raw: string): string | undefined {
  const v = raw.trim();
  if (!v) return undefined; // optional field
  if (v.length > 120) return "Email must be 120 characters or less";
  if (v.includes("..") || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v)) {
    return "Enter a valid email address (e.g. you@example.com)";
  }
  return undefined;
}

export function validateFacebookUrl(raw: string): string | undefined {
  const v = raw.trim();
  if (!v) return "Paste your Facebook page link";
  if (v.length > 300) return "Facebook link is too long";
  if (/\s/.test(v)) return "Facebook link cannot contain spaces";

  let url: URL;
  try {
    url = new URL(withProtocol(v));
  } catch {
    return "Use your Facebook page link, e.g. facebook.com/yourpage";
  }

  if (!/^https?:$/i.test(url.protocol) || !VALID_FB_HOSTS.has(url.hostname.toLowerCase())) {
    return "Must be a valid Facebook link (e.g. facebook.com/yourbrand)";
  }

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return "Include your Facebook page username or path (e.g. facebook.com/yourbrand)";
  }

  const first = segments[0].toLowerCase();
  if (FB_PLACEHOLDERS.has(first)) {
    return "Please enter your actual Facebook page link";
  }
  if (FB_SYSTEM_ROUTES.has(first)) {
    return "Enter a Facebook page or profile link, not a Facebook system page";
  }

  if (first === "profile.php") {
    const id = url.searchParams.get("id") ?? "";
    if (!/^\d{4,}$/.test(id)) {
      return "profile.php link must include a valid numeric ID (e.g. facebook.com/profile.php?id=1000...)";
    }
    return undefined;
  }

  if (first === "pages" || first === "people" || first === "p" || first === "share" || first === "groups") {
    if (segments.length < 2 || segments[1].trim().length < 2) {
      return "Enter the complete Facebook page link (e.g. facebook.com/yourbrand)";
    }
    return undefined;
  }

  if (first.length < 3 && !/^\d+$/.test(first)) {
    return "Facebook page username must be at least 3 characters";
  }

  if (!/^[a-zA-Z0-9._-]+$/.test(first) || /^[.-]|[.-]$/.test(first)) {
    return "Facebook page link contains invalid characters";
  }

  return undefined;
}

export function validateWebsite(raw: string): string | undefined {
  const v = raw.trim();
  if (!v) return undefined; // optional field
  if (v.length > 300) return "Website link is too long";
  if (/\s/.test(v)) return "Website link cannot contain spaces";

  try {
    const url = new URL(withProtocol(v));
    if (!/^https?:$/i.test(url.protocol)) return "Enter a valid website link (e.g. www.yourwebsite.com)";
    if (!/^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(url.hostname)) {
      return "Enter a valid website domain (e.g. www.yourwebsite.com)";
    }
    return undefined;
  } catch {
    return "Enter a valid website link (e.g. www.yourwebsite.com)";
  }
}

export function validateCategory(raw: string): string | undefined {
  if (!raw || !(INQUIRY_CATEGORIES as readonly string[]).includes(raw)) {
    return "Choose what field your business is in";
  }
  return undefined;
}

export function validateDescription(raw: string): string | undefined {
  const v = raw.trim();
  if (!v) return "Please tell us what you need";
  if (v.length < 10) return "Tell us a little more (at least 10 characters)";
  if (v.length > 2000) return "Description must be 2000 characters or less";
  return undefined;
}

export function validateInquiryField(field: keyof InquiryForm, value: string): string | undefined {
  switch (field) {
    case "name":
      return validateName(value);
    case "phone":
      return validateBangladeshPhone(value);
    case "email":
      return validateEmail(value);
    case "facebookUrl":
      return validateFacebookUrl(value);
    case "website":
      return validateWebsite(value);
    case "category":
      return validateCategory(value);
    case "description":
      return validateDescription(value);
  }
}

export function validateInquiry(v: InquiryForm): Partial<Record<keyof InquiryForm, string>> {
  const e: Partial<Record<keyof InquiryForm, string>> = {};
  (Object.keys(v) as (keyof InquiryForm)[]).forEach((k) => {
    const err = validateInquiryField(k, v[k]);
    if (err) e[k] = err;
  });
  return e;
}

export type VerifyFbResponse = {
  valid: boolean;
  pageName?: string;
  canonicalUrl?: string;
  message?: string;
};

export async function verifyFacebookLinkOnline(rawUrl: string, signal?: AbortSignal): Promise<VerifyFbResponse> {
  const formatErr = validateFacebookUrl(rawUrl);
  if (formatErr) return { valid: false, message: formatErr };
  try {
    const res = await fetch(`/api/verify-fb?url=${encodeURIComponent(rawUrl.trim())}`, { signal });
    const data = (await res.json().catch(() => null)) as VerifyFbResponse | null;
    if (!data) return { valid: false, message: "Could not verify Facebook link" };
    return data;
  } catch (err) {
    if ((err as Error)?.name === "AbortError") throw err;
    return { valid: true, canonicalUrl: withProtocol(rawUrl) };
  }
}

export async function submitInquiry(v: InquiryForm): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/inquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: v.name.trim(),
        phone: v.phone.trim(),
        email: v.email.trim(),
        facebookUrl: withProtocol(v.facebookUrl),
        website: withProtocol(v.website),
        category: v.category,
        description: v.description.trim(),
      }),
    });
  } catch {
    throw new Error("We couldn't reach the server. Please try again in a moment, or message us on WhatsApp.");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const msg = Array.isArray(body?.message) ? body.message[0] : body?.message;
    throw new Error(msg || "Something went wrong. Please try again.");
  }
}

async function patch(id: string, action: string, body: object = {}): Promise<Inquiry> {
  const r = await fetch(`${API_URL}/inquiries/${id}/${action}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error((Array.isArray(j?.message) ? j.message[0] : j?.message) || "Something went wrong");
  return j;
}

export const inquiriesApi = {
  list: async (): Promise<Inquiry[]> => {
    const r = await fetch(`${API_URL}/inquiries`, { cache: "no-store" });
    if (!r.ok) throw new Error("Could not load requests");
    return r.json();
  },
  verify: (id: string, note: string) => patch(id, "verify", { note }),
  accept: (id: string, leadId: string) => patch(id, "accept", { leadId }),
  reject: (id: string, reason: string) => patch(id, "reject", { reason }),
  reopen: (id: string) => patch(id, "reopen"),
  remove: async (id: string) => {
    await fetch(`${API_URL}/inquiries/${id}`, { method: "DELETE" });
  },
};
