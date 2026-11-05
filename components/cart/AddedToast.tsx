"use client";

import Image from "next/image";
import { Check, X } from "lucide-react";
import { useCart } from "./CartProvider";

export function AddedToast() {
  const { toast, dismissToast, setOpen } = useCart();
  if (!toast) return null;
  return (
    <div key={toast.id} role="status" className="fs-pop fixed right-4 top-20 z-[65] w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl bg-ink text-paper shadow-2xl">
      <div className="flex items-center gap-3 p-3">
        {toast.image ? (
          <div className="relative size-14 shrink-0 rounded-xl bg-white/10">
            <Image src={toast.image} alt="" fill sizes="56px" className="object-contain p-1" />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <Check size={15} className="text-sky" /> {toast.title}
          </p>
          {toast.body ? <p className="truncate text-xs text-mist">{toast.body}</p> : null}
        </div>
        <button type="button" onClick={() => { dismissToast(); setOpen(true); }} className="btn btn-primary btn-sm">
          Sepete git
        </button>
        <button type="button" onClick={dismissToast} className="grid size-8 place-items-center text-mist" aria-label="Kapat">
          <X size={15} />
        </button>
      </div>
      <div className="h-0.5 origin-left bg-sky" style={{ animation: "fs-toast 3.8s linear both" }} />
      <style>{`@keyframes fs-toast{from{transform:scaleX(1)}to{transform:scaleX(0)}}`}</style>
    </div>
  );
}
