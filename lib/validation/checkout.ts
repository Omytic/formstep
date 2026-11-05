import { z } from "zod";
import { TR_PROVINCES } from "@/lib/geo/provinces";

const trimmed = (min: number, max: number, msg: string) => z.string().trim().min(min, msg).max(max, msg);

export const phoneSchema = z
  .string()
  .transform((v) => v.replace(/[\s()-]/g, ""))
  .refine((v) => /^(\+90|0)?5\d{9}$/.test(v), "Geçerli bir cep telefonu gir (5xx xxx xx xx).")
  .transform((v) => "0" + v.slice(-10));

export const checkoutSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Geçerli bir e-posta adresi gir.").max(160),
    fullName: trimmed(3, 80, "Adını ve soyadını gir."),
    phone: phoneSchema,
    city: z.string().refine((v) => (TR_PROVINCES as readonly string[]).includes(v), "İl seç."),
    district: trimmed(2, 60, "İlçe gir."),
    line: trimmed(10, 300, "Açık adresini mahalle, sokak ve numara ile gir."),
    postalCode: z.string().trim().max(10).optional().default(""),
    billingType: z.enum(["individual", "corporate"]),
    companyName: z.string().trim().max(160).optional().default(""),
    taxOffice: z.string().trim().max(80).optional().default(""),
    taxNumber: z.string().trim().max(11).optional().default(""),
    acceptTerms: z.boolean().refine((v) => v, "Devam etmek için sözleşmeleri onaylaman gerekiyor."),
    marketing: z.boolean().optional().default(false),
    coupon: z.string().trim().max(32).optional().default(""),
    cart: z.array(z.object({ variantId: z.string().min(1).max(80), qty: z.number().int().min(1).max(10) })).min(1).max(10),
  })
  .superRefine((v, ctx) => {
    if (v.billingType === "corporate") {
      if (v.companyName.length < 2) ctx.addIssue({ code: "custom", path: ["companyName"], message: "Şirket ünvanını gir." });
      if (v.taxOffice.length < 2) ctx.addIssue({ code: "custom", path: ["taxOffice"], message: "Vergi dairesini gir." });
      if (!/^\d{10,11}$/.test(v.taxNumber)) ctx.addIssue({ code: "custom", path: ["taxNumber"], message: "Vergi numarası 10 haneli olmalı." });
    }
  });

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutData = z.output<typeof checkoutSchema>;

export const addressSchema = z.object({
  title: trimmed(1, 30, "Adrese bir ad ver."),
  fullName: trimmed(3, 80, "Ad soyad gir."),
  phone: phoneSchema,
  city: z.string().refine((v) => (TR_PROVINCES as readonly string[]).includes(v), "İl seç."),
  district: trimmed(2, 60, "İlçe gir."),
  line: trimmed(10, 300, "Açık adresi gir."),
  postalCode: z.string().trim().max(10).optional().default(""),
});
