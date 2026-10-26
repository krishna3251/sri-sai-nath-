import "server-only";
import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
export type ShopSession = { unlocked?: boolean; issuedAt?: number };
export function sessionConfigured() {
  return (
    !!process.env.SHOP_PIN &&
    (process.env.SHOP_SESSION_SECRET?.length || 0) >= 32
  );
}
export function sessionOptions(): SessionOptions {
  return {
    password: process.env.SHOP_SESSION_SECRET || "",
    cookieName: "sri-sai-shop-session",
    ttl: 12 * 60 * 60,
    cookieOptions: {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production" &&
        process.env.SHOP_COOKIE_SECURE !== "false",
      sameSite: "strict",
      path: "/",
    },
  };
}
export async function shopSession() {
  return getIronSession<ShopSession>(await cookies(), sessionOptions());
}
export async function isShopUnlocked() {
  if (!sessionConfigured()) return false;
  const s = await shopSession();
  return (
    !!s.unlocked &&
    !!s.issuedAt &&
    Date.now() - s.issuedAt < 12 * 60 * 60 * 1000
  );
}
