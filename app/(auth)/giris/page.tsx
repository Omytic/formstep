import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginRegister } from "@/components/account/AuthForms";
import { getUser } from "@/lib/auth";
import { safeInternalPath } from "@/lib/security/text";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Giriş yap", robots: { index: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string; sekme?: string; hata?: string }> }) {
  const sp = await searchParams;
  const next = safeInternalPath(sp.next, "/hesabim");
  if (await getUser()) redirect(next);
  return <LoginRegister next={next} initialTab={sp.sekme === "kayit" ? "kayit" : "giris"} linkError={sp.hata === "baglanti"} />;
}
