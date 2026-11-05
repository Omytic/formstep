import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <main id="icerik" className="relative grid min-h-screen place-items-center overflow-hidden bg-night px-5 text-center text-paper">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(50%_50%_at_50%_60%,rgba(36,119,234,0.3),transparent_70%)]" />
      <div className="fs-enter relative">
        <div className="fs-float mx-auto w-56">
          <Image src="/assets/products/m300.png" alt="" width={400} height={400} className="rotate-[24deg]" />
        </div>
        <p className="display mt-6 text-8xl text-sky">404</p>
        <h1 className="display mt-2 text-4xl">Bu sayfa adım atmadı.</h1>
        <p className="mx-auto mt-4 max-w-sm text-mist">Aradığın sayfa taşınmış ya da hiç var olmamış olabilir.</p>
        <Link href="/" className="btn btn-primary mt-8">Ana sayfaya dön</Link>
      </div>
    </main>
  );
}
