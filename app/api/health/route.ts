import { emailConfigured, paytrConfigured, supabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

/** Sırları göstermeden, yapılandırmanın tamamlanıp tamamlanmadığını söyler. */
export function GET() {
  return Response.json({ ok: true, supabase: supabaseConfigured(), paytr: paytrConfigured(), email: emailConfigured() });
}
