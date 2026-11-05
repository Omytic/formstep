import { createHmac, timingSafeEqual, createHash, randomBytes } from "node:crypto";

export const PAYTR_TOKEN_URL = "https://www.paytr.com/odeme/api/get-token";
export const PAYTR_IFRAME_ORIGIN = "https://www.paytr.com";

/** Official iframe step 1 hash. Salt is appended, key is the HMAC key. iframe_v2 is not part of the hash. */
export function paytrIframeToken(input: {
  merchantId: string;
  userIp: string;
  merchantOid: string;
  email: string;
  paymentAmount: string;
  userBasket: string;
  noInstallment: string;
  maxInstallment: string;
  currency: string;
  testMode: string;
  merchantKey: string;
  merchantSalt: string;
}): string {
  const hashStr =
    input.merchantId +
    input.userIp +
    input.merchantOid +
    input.email +
    input.paymentAmount +
    input.userBasket +
    input.noInstallment +
    input.maxInstallment +
    input.currency +
    input.testMode;
  return createHmac("sha256", input.merchantKey)
    .update(hashStr + input.merchantSalt)
    .digest("base64");
}

/** Official callback hash: merchant_oid + salt + status + total_amount. */
export function paytrCallbackToken(input: {
  merchantOid: string;
  status: string;
  totalAmount: string;
  merchantKey: string;
  merchantSalt: string;
}): string {
  const hashStr = input.merchantOid + input.merchantSalt + input.status + input.totalAmount;
  return createHmac("sha256", input.merchantKey).update(hashStr).digest("base64");
}

export function safeEqual(left: string, right: string): boolean {
  const a = createHash("sha256").update(left).digest();
  const b = createHash("sha256").update(right).digest();
  return timingSafeEqual(a, b);
}

export function iframeSrc(token: string): string {
  if (!/^[A-Za-z0-9+/=_-]+$/.test(token)) {
    throw new Error("PayTR token biçimi geçersiz.");
  }
  return `${PAYTR_IFRAME_ORIGIN}/odeme/guvenli/${token}`;
}

export function encodeBasket(
  lines: { name: string; unitPriceMinor: number; quantity: number }[],
): string {
  const rows = lines.map((line) => [
    line.name,
    (line.unitPriceMinor / 100).toFixed(2),
    line.quantity,
  ]);
  return Buffer.from(JSON.stringify(rows), "utf8").toString("base64");
}

export function merchantOid(): string {
  return `FS${randomBytes(12).toString("hex")}`.slice(0, 26);
}

export type PaytrCallbackBody = {
  merchant_oid: string;
  status: "success" | "failed";
  total_amount: string;
  hash: string;
  failed_reason_code?: string;
  failed_reason_msg?: string;
  test_mode?: string;
};

export function parseCallback(form: FormData): PaytrCallbackBody | null {
  const merchant_oid = String(form.get("merchant_oid") ?? "");
  const status = String(form.get("status") ?? "");
  const total_amount = String(form.get("total_amount") ?? "");
  const hash = String(form.get("hash") ?? "");
  if (!merchant_oid || (status !== "success" && status !== "failed") || !total_amount || !hash) {
    return null;
  }
  if (!/^[A-Za-z0-9]+$/.test(merchant_oid)) return null;
  if (!/^\d+$/.test(total_amount)) return null;
  return {
    merchant_oid,
    status,
    total_amount,
    hash,
    failed_reason_code: optional(form, "failed_reason_code"),
    failed_reason_msg: optional(form, "failed_reason_msg"),
    test_mode: optional(form, "test_mode"),
  };
}

function optional(form: FormData, key: string): string | undefined {
  const value = form.get(key);
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export type TokenRequest = {
  merchant_id: string;
  user_ip: string;
  merchant_oid: string;
  email: string;
  payment_amount: string;
  paytr_token: string;
  user_basket: string;
  debug_on: string;
  no_installment: string;
  max_installment: string;
  user_name: string;
  user_address: string;
  user_phone: string;
  merchant_ok_url: string;
  merchant_fail_url: string;
  timeout_limit: string;
  currency: "TL";
  test_mode: string;
  lang: "tr";
  iframe_v2?: string;
};

export function buildTokenRequest(input: {
  merchantId: string;
  merchantKey: string;
  merchantSalt: string;
  userIp: string;
  merchantOid: string;
  email: string;
  paymentAmountMinor: number;
  basket: string;
  userName: string;
  userAddress: string;
  userPhone: string;
  okUrl: string;
  failUrl: string;
  testMode: boolean;
  iframeV2: boolean;
}): TokenRequest {
  const payment_amount = String(input.paymentAmountMinor);
  const test_mode = input.testMode ? "1" : "0";
  const request: TokenRequest = {
    merchant_id: input.merchantId,
    user_ip: input.userIp,
    merchant_oid: input.merchantOid,
    email: input.email,
    payment_amount,
    paytr_token: paytrIframeToken({
      merchantId: input.merchantId,
      userIp: input.userIp,
      merchantOid: input.merchantOid,
      email: input.email,
      paymentAmount: payment_amount,
      userBasket: input.basket,
      noInstallment: "0",
      maxInstallment: "0",
      currency: "TL",
      testMode: test_mode,
      merchantKey: input.merchantKey,
      merchantSalt: input.merchantSalt,
    }),
    user_basket: input.basket,
    debug_on: input.testMode ? "1" : "0",
    no_installment: "0",
    max_installment: "0",
    user_name: input.userName.slice(0, 60),
    user_address: input.userAddress.slice(0, 400),
    user_phone: input.userPhone.slice(0, 20),
    merchant_ok_url: input.okUrl,
    merchant_fail_url: input.failUrl,
    timeout_limit: "30",
    currency: "TL",
    test_mode,
    lang: "tr",
  };
  if (input.iframeV2) request.iframe_v2 = "1";
  return request;
}
