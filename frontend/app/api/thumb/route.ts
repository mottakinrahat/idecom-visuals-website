import { followRedirects } from "@/lib/fbResolve";

const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&#x2F;/g, "/").replace(/&quot;/g, '"');

/** Facebook video thumbnail (the page's og:image), proxied so it never hotlink-fails or expires in the browser. */
export async function GET(req: Request) {
  const input = new URL(req.url).searchParams.get("url") || "";
  const page = await followRedirects(input, "facebookexternalhit/1.1");
  if (!page) return new Response("bad url", { status: 400 });

  try {
    const html = await (
      await fetch(page, { headers: { "user-agent": "facebookexternalhit/1.1" }, signal: AbortSignal.timeout(8000) })
    ).text();
    const m = html.match(/<meta property="og:image" content="([^"]+)"/i);
    if (!m) return new Response("no image", { status: 404 });

    const img = new URL(decode(m[1]));
    if (img.protocol !== "https:" || !/(\.|^)(fbcdn\.net|facebook\.com)$/i.test(img.hostname)) {
      return new Response("blocked", { status: 400 });
    }
    const r = await fetch(img, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return new Response("fetch failed", { status: 502 });
    return new Response(r.body, {
      headers: {
        "content-type": r.headers.get("content-type") || "image/jpeg",
        "cache-control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch {
    return new Response("error", { status: 502 });
  }
}
