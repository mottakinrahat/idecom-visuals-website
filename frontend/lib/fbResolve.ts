/** Server-only helpers for Facebook links (host allow-listed to avoid SSRF). */
export const FB_HOSTS = new Set([
  "facebook.com",
  "www.facebook.com",
  "m.facebook.com",
  "web.facebook.com",
  "business.facebook.com",
  "fb.com",
  "www.fb.com",
  "fb.me",
  "www.fb.me",
  "fb.watch",
]);

const decodeEntities = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&#x2F;/gi, "/")
    .replace(/&#x27;/gi, "'")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));

export async function followRedirects(input: string, ua = "Mozilla/5.0"): Promise<URL | null> {
  let cur: URL;
  try {
    cur = new URL(input);
  } catch {
    return null;
  }
  if (cur.protocol === "http:") cur.protocol = "https:";
  for (let i = 0; i < 6; i++) {
    if (cur.protocol !== "https:" || !FB_HOSTS.has(cur.hostname.toLowerCase())) return null;
    let res: Response;
    try {
      res = await fetch(cur, { redirect: "manual", headers: { "user-agent": ua }, signal: AbortSignal.timeout(8000) });
    } catch {
      return cur;
    }
    const loc = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && loc) {
      cur = new URL(loc, cur);
      if (cur.protocol === "http:") cur.protocol = "https:";
      continue;
    }
    break;
  }
  return FB_HOSTS.has(cur.hostname.toLowerCase()) ? cur : null;
}

export type FbVerifyResult =
  | { valid: true; pageName?: string; canonicalUrl: string }
  | { valid: false; message: string };

const FB_CRAWLER_UA = "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";
const INVALID_TITLES = /^(facebook|log in or sign up to view|log into facebook|content not found|page not found|error|sorry, something went wrong)$/i;

/** Verifies that a Facebook page/profile link actually resolves to a live public Facebook page. */
export async function verifyFacebookPage(input: string): Promise<FbVerifyResult> {
  const resolved = await followRedirects(input, FB_CRAWLER_UA);
  if (!resolved) {
    return { valid: false, message: "Enter a valid Facebook page link (e.g. facebook.com/yourbrand)" };
  }

  const cleanPath = resolved.pathname.replace(/\/+$/, "");
  if (!cleanPath || /^\/(login(\.php)?|checkpoint|recover|help|r\.php|reg)$/i.test(cleanPath)) {
    return { valid: false, message: "This Facebook page could not be found. Please check the link." };
  }

  try {
    const res = await fetch(resolved, {
      headers: {
        "user-agent": FB_CRAWLER_UA,
        "accept-language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });

    if (res.status === 404 || res.status === 410) {
      return { valid: false, message: "This Facebook page does not exist. Please check the link." };
    }

    const html = await res.text();
    const ogTitleRaw =
      html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i)?.[1];
    const ogUrlRaw =
      html.match(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:url["']/i)?.[1];
    const titleRaw = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];

    const ogTitle = ogTitleRaw ? decodeEntities(ogTitleRaw).trim() : "";
    const ogUrl = ogUrlRaw ? decodeEntities(ogUrlRaw).trim() : "";
    const title = titleRaw ? decodeEntities(titleRaw).trim() : "";

    if (!ogTitle && !ogUrl) {
      return { valid: false, message: "This Facebook page could not be found or is not public." };
    }

    if (ogTitle && INVALID_TITLES.test(ogTitle) && !ogUrl) {
      return { valid: false, message: "This Facebook page could not be found or is not public." };
    }

    const pageName = ogTitle && !INVALID_TITLES.test(ogTitle) ? ogTitle : title && !INVALID_TITLES.test(title) ? title : undefined;
    return {
      valid: true,
      pageName,
      canonicalUrl: ogUrl || resolved.toString(),
    };
  } catch {
    // If Facebook is temporarily unreachable from server network, fall back to resolved URL check
    return {
      valid: true,
      canonicalUrl: resolved.toString(),
    };
  }
}

