import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { OrderDetail } from "@/components/account/OrderDetail";
import { requireUser } from "@/lib/auth";
import { getOrderForUser } from "@/lib/orders";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const order = user.preview ? null : await getOrderForUser(id, user.id);
  if (!order) notFound();
  return (
    <div className="fs-enter">
      <Link href="/hesabim" className="mb-5 inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-ink"><ArrowLeft size={15} /> Siparişlerim</Link>
      <OrderDetail order={order} />
    </div>
  );
}
