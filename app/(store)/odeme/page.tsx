import type { Metadata } from "next";
import { Checkout } from "@/components/checkout/Checkout";
import { getUser } from "@/lib/auth";
import { isPreview } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSettings } from "@/lib/store/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Ödeme", robots: { index: false } };

export default async function Page() {
  const [settings, user] = await Promise.all([getSettings(), getUser()]);
  let addresses: { id: string; title: string; fullName: string; phone: string; city: string; district: string; line: string; postalCode: string }[] = [];
  if (user) {
    const { data } = await supabaseAdmin()
      .from("addresses")
      .select("id, title, full_name, phone, city, district, line, postal_code, is_default")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false });
    addresses = (data ?? []).map((a) => ({ id: a.id, title: a.title, fullName: a.full_name, phone: a.phone, city: a.city, district: a.district, line: a.line, postalCode: a.postal_code }));
  }
  return (
    <div className="min-h-screen bg-paper">
      <Checkout seller={settings.seller} shipping={settings.shipping} social={settings.marketplaces} user={user ? { email: user.email, fullName: user.fullName } : null} addresses={addresses} preview={isPreview()} />
    </div>
  );
}
