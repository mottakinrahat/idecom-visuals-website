import { NextResponse } from "next/server";
import { followRedirects } from "@/lib/fbResolve";

/** Follows Facebook share/short links and returns the canonical video URL. */
export async function GET(req: Request) {
  const input = new URL(req.url).searchParams.get("url") || "";
  const cur = await followRedirects(input);
  if (!cur) return NextResponse.json({ error: "unresolved" }, { status: 422 });

  // drop tracking/share params, keep the video path (or ?v= for /watch)
  const out = new URL(`https://www.facebook.com${cur.pathname}`);
  const v = cur.searchParams.get("v");
  if (v) out.searchParams.set("v", v);
  return NextResponse.json({ url: out.toString() });
}
