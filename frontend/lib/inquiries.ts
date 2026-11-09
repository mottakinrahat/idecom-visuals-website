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

const isUrl = (u: string) => {
  try {
    const url = new URL(withProtocol(u));
    return url.hostname.includes(".");
  } catch {
    return false;
  }
};

export function validateInquiry(v: InquiryForm): Partial<Record<keyof InquiryForm, string>> {
  const e: Partial<Record<keyof InquiryForm, string>> = {};
  if (v.name.trim().length < 2) e.name = "Please enter your name";
  if (!/^[0-9+()\-\s]{7,20}$/.test(v.phone.trim())) e.phone = "Enter a valid phone number, e.g. 01712 345678";
  if (v.email.trim() && !/^\S+@\S+\.\S+$/.test(v.email.trim())) e.email = "That email doesn't look right";
  if (!v.facebookUrl.trim()) e.facebookUrl = "Paste your Facebook page link";
  else if (!isUrl(v.facebookUrl) || !/(facebook\.com|fb\.com|fb\.me)/i.test(v.facebookUrl)) e.facebookUrl = "Use your Facebook page link, e.g. facebook.com/yourpage";
  if (v.website.trim() && !isUrl(v.website)) e.website = "That website link doesn't look right";
  if (!v.category) e.category = "Choose what field your business is in";
  if (v.description.trim().length < 10) e.description = "Tell us a little more (at least 10 characters)";
  return e;
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
