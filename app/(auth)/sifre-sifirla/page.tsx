import type { Metadata } from "next";
import { ResetForm } from "@/components/account/AuthForms";

export const metadata: Metadata = { title: "Yeni şifre", robots: { index: false } };

export default function Page() {
  return <ResetForm />;
}
