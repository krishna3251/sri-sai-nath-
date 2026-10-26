import SignIn from "@/components/shop-sign-in";
import { isShopUnlocked, sessionConfigured } from "@/lib/shop-session";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function Page() {
  if (await isShopUnlocked()) redirect("/");
  return <SignIn configured={sessionConfigured()} />;
}
