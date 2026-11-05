import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN } from "@/lib/admin-path";

/**
 * 1) Yönetim paneli yalnızca gizli adresten (ADMIN) açılır; doğrudan /admin 404 döner.
 * 2) Supabase oturum çerezlerini tazeler.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return NextResponse.rewrite(new URL("/sayfa-bulunamadi", request.url), { status: 404 });
  }
  const isAdmin = pathname === ADMIN || pathname.startsWith(ADMIN + "/");
  const target = isAdmin ? new URL("/admin" + pathname.slice(ADMIN.length) + request.nextUrl.search, request.url) : null;

  let response = target ? NextResponse.rewrite(target, { request }) : NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const needsSession = isAdmin || /^\/(hesabim|giris|sifre-sifirla|odeme)/.test(pathname);
  if (!url || !key || !needsSession) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = target ? NextResponse.rewrite(target, { request }) : NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/|assets/|fonts/|api/|icon.png|apple-icon.png|robots.txt|sitemap.xml).*)"],
};
