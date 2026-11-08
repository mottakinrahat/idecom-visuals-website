/** Server-only helpers for Facebook links (host allow-listed to avoid SSRF). */
export const FB_HOSTS = new Set(["facebook.com", "www.facebook.com", "m.facebook.com", "web.facebook.com", "fb.watch"]);

export async function followRedirects(input: string, ua = "Mozilla/5.0"): Promise<URL | null> {
  let cur: URL;
  try {
    cur = new URL(input);
  } catch {
    return null;
  }
  for (let i = 0; i < 6; i++) {
    if (cur.protocol !== "https:" || !FB_HOSTS.has(cur.hostname)) return null;
    let res: Response;
    try {
      res = await fetch(cur, { redirect: "manual", headers: { "user-agent": ua }, signal: AbortSignal.timeout(8000) });
    } catch {
      return cur;
    }
    const loc = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && loc) {
      cur = new URL(loc, cur);
      continue;
    }
    break;
  }
  return FB_HOSTS.has(cur.hostname) ? cur : null;
}
