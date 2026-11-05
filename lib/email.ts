import { adm } from "@/lib/admin-path";
import { emailConfigured, siteUrl } from "@/lib/env";
import { formatTry } from "@/lib/money";
import { mapOrder, ORDER_SELECT, type Order } from "@/lib/orders";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Mail = { subject: string; html: string };

/** Sipariş postasının gittiği ve yanıtların döndüğü adres. */
const STORE_MAIL = "info@omytic.com";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function layout(title: string, body: string): string {
  return `<!doctype html><html lang="tr"><body style="margin:0;background:#f6f8fc;font-family:Helvetica,Arial,sans-serif;color:#10131d">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:20px;overflow:hidden">
<tr><td style="background:#0e1a36;padding:28px 32px;color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.5px">FormStep</td></tr>
<tr><td style="padding:32px"><h1 style="margin:0 0 16px;font-size:24px">${esc(title)}</h1>${body}</td></tr>
<tr><td style="padding:20px 32px;background:#f6f8fc;color:#6b7280;font-size:12px">Bu e-posta ${STORE_MAIL} adresinden, formstep.tr siparişinle ilgili olarak gönderildi. Yanıtların aynı adrese ulaşır.</td></tr>
</table></td></tr></table></body></html>`;
}

function itemsTable(o: Order): string {
  const rows = o.items
    .map((i) => `<tr><td style="padding:6px 0">FormStep ${esc(i.productName)} · ${esc(i.sizeLabel)} × ${i.qty}</td><td align="right">${formatTry(i.unitKurus * i.qty)}</td></tr>`)
    .join("");
  return `<table width="100%" style="font-size:14px;border-top:1px solid #e5e7eb;margin-top:16px;padding-top:8px">${rows}
<tr><td style="padding-top:10px;color:#6b7280">Kargo</td><td align="right" style="padding-top:10px">${o.shippingKurus ? formatTry(o.shippingKurus) : "Ücretsiz"}</td></tr>
${o.discountKurus ? `<tr><td style="color:#6b7280">İndirim</td><td align="right">−${formatTry(o.discountKurus)}</td></tr>` : ""}
<tr><td style="padding-top:8px;font-weight:700">Toplam</td><td align="right" style="padding-top:8px;font-weight:700">${formatTry(o.totalKurus)}</td></tr></table>`;
}

function button(href: string, label: string) {
  return `<p style="margin:24px 0 0"><a href="${href}" style="display:inline-block;background:#2477ea;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600">${label}</a></p>`;
}

export function renderMail(kind: string, o: Order): Mail | null {
  const link = `${siteUrl()}/siparis/${o.publicToken}`;
  switch (kind) {
    case "order_paid":
      return {
        subject: `Siparişin alındı — ${o.number}`,
        html: layout("Teşekkürler, siparişin alındı!", `<p>Merhaba ${esc(o.fullName)}, ödemen onaylandı. Siparişini hazırlamaya başlıyoruz.</p>${itemsTable(o)}${button(link, "Siparişini görüntüle")}`),
      };
    case "order_shipped":
      return {
        subject: `Siparişin kargoda — ${o.number}`,
        html: layout("Siparişin yola çıktı", `<p>${esc(o.trackingCarrier ?? "Kargo")} takip numaran: <strong>${esc(o.trackingNumber ?? "-")}</strong></p>${button(link, "Siparişi takip et")}`),
      };
    case "order_cancelled":
      return { subject: `Siparişin iptal edildi — ${o.number}`, html: layout("Siparişin iptal edildi", `<p>Ödeme alındıysa, iade bankana göre birkaç iş günü içinde kartına yansır.</p>${button(link, "Sipariş ayrıntıları")}`) };
    case "order_refunded":
      return { subject: `İaden yapıldı — ${o.number}`, html: layout("İaden yapıldı", `<p>${formatTry(o.totalKurus)} tutarındaki iaden başlatıldı. Bankana göre birkaç iş günü içinde kartına yansır.</p>${button(link, "Sipariş ayrıntıları")}`) };
    case "admin_new_order":
      return { subject: `Yeni sipariş: ${o.number} — ${formatTry(o.totalKurus)}`, html: layout(`Yeni sipariş ${o.number}`, `<p>${esc(o.fullName)} · ${esc(o.email)}</p>${itemsTable(o)}${button(`${siteUrl()}${adm(`/siparisler/${o.id}`)}`, "Yönetim panelinde aç")}`) };
    default:
      return null;
  }
}

async function send(to: string, mail: Mail): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to, reply_to: STORE_MAIL, subject: mail.subject, html: mail.html }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

/**
 * Kuyruktaki e-postaları gönderir. Her sipariş+tür için tek satır olduğundan
 * PayTR bildirimi tekrar gelse de e-posta iki kez gitmez. Hata ödemeyi etkilemez.
 */
export async function flushOutbox(limit = 20): Promise<void> {
  const db = supabaseAdmin();
  const { data: jobs } = await db
    .from("email_outbox")
    .select("id, order_id, kind, recipient, attempts")
    .eq("status", "queued")
    .lt("attempts", 5)
    .order("created_at")
    .limit(limit);
  if (!jobs?.length) return;

  let adminEmail = "";
  if (jobs.some((j) => j.recipient === "admin")) {
    const { data } = await db.from("store_settings").select("value").eq("key", "private.notify").maybeSingle();
    adminEmail = String((data?.value as Record<string, unknown>)?.admin_email ?? "").trim() || STORE_MAIL;
  }

  for (const job of jobs) {
    const to = job.recipient === "admin" ? adminEmail : String(job.recipient);
    if (!emailConfigured() || !to) {
      await db.from("email_outbox").update({ status: "skipped", last_error: !to ? "alıcı yok" : "e-posta sağlayıcısı yok" }).eq("id", job.id);
      continue;
    }
    try {
      const { data: row } = await db.from("orders").select(ORDER_SELECT).eq("id", job.order_id).single();
      const mail = row ? renderMail(job.kind, mapOrder(row)) : null;
      if (!mail) throw new Error("şablon yok");
      await send(to, mail);
      await db.from("email_outbox").update({ status: "sent", sent_at: new Date().toISOString(), attempts: job.attempts + 1 }).eq("id", job.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await db
        .from("email_outbox")
        .update({ attempts: job.attempts + 1, last_error: msg.slice(0, 300), status: job.attempts + 1 >= 5 ? "failed" : "queued" })
        .eq("id", job.id);
    }
  }
}
