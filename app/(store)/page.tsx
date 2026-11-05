import { BuySection } from "@/components/home/BuySection";
import { Faq } from "@/components/home/Faq";
import { Finder } from "@/components/home/Finder";
import { HeroExplode } from "@/components/home/HeroExplode";
import { HowTo } from "@/components/home/HowTo";
import { Marquee } from "@/components/home/Marquee";
import { ModelShowcase } from "@/components/home/ModelShowcase";
import { Pressure } from "@/components/home/Pressure";
import { ShoeFit } from "@/components/home/ShoeFit";
import { ScrollEffects } from "@/components/home/ScrollEffects";
import { Story } from "@/components/home/Story";
import { Trust } from "@/components/home/Trust";
import { fromPrice, getCatalog, getFaqs, getSettings } from "@/lib/store/catalog";

export const revalidate = 60;

export default async function HomePage() {
  const [catalog, settings, faqs] = await Promise.all([getCatalog(), getSettings(), getFaqs()]);
  const prices = Object.fromEntries(catalog.map((p) => [p.slug, fromPrice(p)]));
  return (
    <>
      <HeroExplode claim={settings.claims.find((c) => c.active)?.text} />
      <ShoeFit />
      <ModelShowcase prices={prices} />
      <Marquee claim={settings.claims.find((c) => c.active)?.text} />
      <Pressure />
      <Finder mapping={settings.finder} />
      <HowTo />
      <BuySection products={catalog} marketplaces={settings.marketplaces} />
      <Trust settings={settings} />
      <Story />
      <Faq items={faqs} />
      <ScrollEffects />
    </>
  );
}
