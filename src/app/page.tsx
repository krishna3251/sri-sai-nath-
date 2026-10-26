import Workspace from "@/components/erp-workspace";
import { isShopUnlocked } from "@/lib/shop-session";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function Page() {
  if (!(await isShopUnlocked())) redirect("/sign-in");
  return <Workspace />;
}
