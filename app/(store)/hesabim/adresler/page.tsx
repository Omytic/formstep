import { AddressBook, type Address } from "@/components/account/AddressBook";
import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

export default async function Page() {
  const user = await requireUser("/hesabim/adresler");
  let addresses: Address[] = [];
  if (!user.preview) {
    const supabase = await supabaseServer();
    const { data } = await supabase.from("addresses").select("*").order("is_default", { ascending: false }).order("created_at");
    addresses = (data ?? []).map((a) => ({ id: a.id, title: a.title, fullName: a.full_name, phone: a.phone, city: a.city, district: a.district, line: a.line, postalCode: a.postal_code, isDefault: a.is_default }));
  }
  return <AddressBook addresses={addresses} />;
}
