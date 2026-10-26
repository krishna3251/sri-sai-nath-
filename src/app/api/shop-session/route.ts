import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { sessionConfigured, shopSession } from "@/lib/shop-session";
export const runtime = "nodejs";
const attempts = new Map<string, { count: number; until: number }>();
function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    const url = new URL(origin);
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      url.host === req.headers.get("host")
    );
  } catch {
    return false;
  }
}
export async function POST(req: NextRequest) {
  if (!sameOrigin(req))
    return NextResponse.json(
      { error: "Request origin not accepted." },
      { status: 403 },
    );
  if (!sessionConfigured())
    return NextResponse.json(
      { error: "Shop access is not configured." },
      { status: 503 },
    );
  const key =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  if (attempts.size > 10000)
    for (const [k, v] of attempts) if (v.until <= now) attempts.delete(k);
  let bucket = attempts.get(key);
  if (!bucket || bucket.until <= now) {
    bucket = { count: 0, until: now + 15 * 60 * 1000 };
    attempts.set(key, bucket);
  }
  if (bucket.count >= 5)
    return NextResponse.json(
      {
        error: "Too many attempts. Please wait 15 minutes before trying again.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((bucket.until - now) / 1000)),
        },
      },
    );
  let pin: unknown;
  try {
    if (Number(req.headers.get("content-length") || 0) > 1024) throw Error();
    const body = await req.text();
    if (body.length > 1024) throw Error();
    pin = JSON.parse(body).pin;
  } catch {
    return NextResponse.json({ error: "Enter the shop PIN." }, { status: 400 });
  }
  bucket.count++;
  const hash = (s: string) => createHash("sha256").update(s).digest();
  if (
    typeof pin !== "string" ||
    !timingSafeEqual(hash(pin), hash(process.env.SHOP_PIN!))
  )
    return NextResponse.json(
      { error: "That PIN is incorrect. Please try again." },
      { status: 401 },
    );
  attempts.delete(key);
  const session = await shopSession();
  session.unlocked = true;
  session.issuedAt = now;
  await session.save();
  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function DELETE(req: NextRequest) {
  if (!sameOrigin(req))
    return NextResponse.json(
      { error: "Request origin not accepted." },
      { status: 403 },
    );
  if (sessionConfigured()) (await shopSession()).destroy();
  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
