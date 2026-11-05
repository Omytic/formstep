import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { AddedToast } from "@/components/cart/AddedToast";
import { Consent } from "@/components/layout/Consent";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PreviewBanner } from "@/components/layout/PreviewBanner";
import { getSettings } from "@/lib/store/catalog";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const { announcement, marketplaces } = await getSettings();
  return (
    <CartProvider>
      <Header
        announcement={announcement.active && announcement.text ? announcement.text : undefined}
        instagram={marketplaces.instagram}
        x={marketplaces.x}
      />
      <main id="icerik">{children}</main>
      <Footer />
      <CartDrawer />
      <AddedToast />
      <Consent gaId={process.env.NEXT_PUBLIC_GA_ID?.trim() || null} />
      <PreviewBanner />
    </CartProvider>
  );
}
