import { isPreview } from "@/lib/env";

/** Yalnızca geliştirme önizlemesinde görünen küçük not. */
export function PreviewBanner() {
  if (!isPreview()) return null;
  return (
    <details className="group fixed bottom-3 right-3 z-[55] max-w-[300px] rounded-2xl border border-warn/30 bg-[#fff8eb] text-xs leading-5 text-[#7a4a06] shadow-lg">
      <summary className="cursor-pointer list-none px-3 py-2 font-semibold">Önizleme modu</summary>
      <p className="px-3 pb-3">Veritabanı bağlı değil; stok ve içerikler örnektir. Supabase bağlanınca bu not kaybolur.</p>
    </details>
  );
}
