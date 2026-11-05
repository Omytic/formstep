import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="icerik" className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-night text-paper lg:block">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_60%,rgba(36,119,234,0.35),transparent_70%)]" />
        <Link href="/" className="absolute left-10 top-10 z-10">
          <Image src="/assets/brand/logo-white.png" alt="FormStep" width={150} height={34} className="h-8 w-auto" />
        </Link>
        <div className="absolute inset-0 grid place-items-center">
          <div className="fs-float w-[70%] max-w-[520px]">
            <Image src="/assets/products/m900-2.png" alt="" width={900} height={900} priority className="-rotate-12 drop-shadow-[0_60px_60px_rgba(0,0,0,0.5)]" />
          </div>
        </div>
        <p className="display absolute bottom-10 left-10 right-10 text-5xl">
          Her adımda
          <br />
          <span className="text-sky">daha fazla konfor.</span>
        </p>
      </div>
      <div className="flex flex-col bg-paper">
        <div className="flex items-center justify-between px-6 py-6 lg:hidden">
          <Link href="/"><Image src="/assets/brand/logo.png" alt="FormStep" width={130} height={29} className="h-7 w-auto" /></Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="fs-enter w-full max-w-md">{children}</div>
        </div>
        <p className="px-6 pb-6 text-center text-xs text-ink/45">
          <Link href="/" className="hover:text-ink">Mağazaya dön</Link>
        </p>
      </div>
    </main>
  );
}
