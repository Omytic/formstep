import { SettingsForms } from "@/components/account/SettingsForms";
import { requireUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

export default async function Page() {
  const user = await requireUser("/hesabim/ayarlar");
  let profile = { fullName: user.fullName, phone: "", marketing: false };
  if (!user.preview) {
    const supabase = await supabaseServer();
    const { data } = await supabase.from("profiles").select("full_name, phone, marketing_consent").eq("id", user.id).maybeSingle();
    if (data) profile = { fullName: data.full_name, phone: data.phone, marketing: data.marketing_consent };
  }
  return <SettingsForms profile={profile} />;
}
