import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN, LEGACY_ADMIN } from "@/lib/admin-path";
import { ACCOUNT_PATHS, ACCOUNTS_ENABLED, SALES_ENABLED, SALES_PATHS } from "@/lib/features";
import { LEGAL_NAV } from "@/lib/legal";

/** Var olmayan ürün ve bilgi sayfaları gerçek 404 döner (sayfa akışı başladıktan sonra 200 kalmasın). */
const UNKNOWN_PAGE = new RegExp(`^/(urun/(?!(m100|m300|m900)/?$)[^/]+|bilgilendirme/(?!(${LEGAL_NAV.map((l) => l.slug).join("|")})/?$)[^/]+)`);

/**
 * 1) Yönetim paneli /admin'dedir; eski /secretgate adresleri oraya yönlenir.
 * 2) Kapalı bölümler (satış, üyelik) 404 döner; bkz. lib/features.ts.
 * 3) Yönetici girişi ADMIN/giris adresindedir; içeride /yonetim-giris sayfasına gider.
 * 4) Supabase oturum çerezlerini tazeler.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === LEGACY_ADMIN || pathname.startsWith(LEGACY_ADMIN + "/")) {
    const url = request.nextUrl.clone();
    url.pathname = ADMIN + pathname.slice(LEGACY_ADMIN.length);
    return NextResponse.redirect(url, 308);
  }

  const hidden =
    pathname.startsWith("/yonetim-giris") ||
    (!SALES_ENABLED && SALES_PATHS.test(pathname)) ||
    (!ACCOUNTS_ENABLED && ACCOUNT_PATHS.test(pathname)) ||
    (UNKNOWN_PAGE.test(pathname) && pathname !== "/bilgilendirme/teslimat");
  if (hidden) {
    return NextResponse.rewrite(new URL("/sayfa-bulunamadi", request.url), { status: 404 });
  }
  const isAdmin = pathname === ADMIN || pathname.startsWith(ADMIN + "/");
  const isLogin = pathname === ADMIN + "/giris";
  const target = isLogin ? new URL("/yonetim-giris" + request.nextUrl.search, request.url) : null;

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
