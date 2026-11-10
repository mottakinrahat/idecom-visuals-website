import { NextResponse } from "next/server";
import { verifyFacebookPage } from "@/lib/fbResolve";
import { validateFacebookUrl, withProtocol } from "@/lib/inquiries";

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("url") || "";
  const formatErr = validateFacebookUrl(raw);
  if (formatErr) {
    return NextResponse.json({ valid: false, message: formatErr }, { status: 422 });
  }

  const result = await verifyFacebookPage(withProtocol(raw));
  return NextResponse.json(result, { status: result.valid ? 200 : 422 });
}
