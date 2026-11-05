import { buildTokenRequest, PAYTR_TOKEN_URL } from "@/lib/paytr/hash";

export type TokenResult = { ok: true; token: string } | { ok: false; reason: string };

/** PayTR iFrame API 1. adım: sunucudan token alır. Anahtarlar tarayıcıya hiç gitmez. */
export async function requestIframeToken(input: {
  userIp: string;
  merchantOid: string;
  email: string;
  amountKurus: number;
  basket: string;
  userName: string;
  userAddress: string;
  userPhone: string;
  okUrl: string;
  failUrl: string;
}): Promise<TokenResult> {
  const body = buildTokenRequest({
    merchantId: process.env.PAYTR_MERCHANT_ID!,
    merchantKey: process.env.PAYTR_MERCHANT_KEY!,
    merchantSalt: process.env.PAYTR_MERCHANT_SALT!,
    userIp: input.userIp,
    merchantOid: input.merchantOid,
    email: input.email,
    paymentAmountMinor: input.amountKurus,
    basket: input.basket,
    userName: input.userName,
    userAddress: input.userAddress,
    userPhone: input.userPhone,
    okUrl: input.okUrl,
    failUrl: input.failUrl,
    testMode: process.env.PAYTR_TEST_MODE !== "0",
    iframeV2: false,
  });
  try {
    const res = await fetch(PAYTR_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(body as unknown as Record<string, string>).toString(),
      signal: AbortSignal.timeout(15000),
    });
    const json = (await res.json()) as { status?: string; token?: string; reason?: string };
    if (json.status === "success" && json.token) return { ok: true, token: json.token };
    return { ok: false, reason: json.reason ?? "PayTR token alınamadı" };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "PayTR bağlantı hatası" };
  }
}
