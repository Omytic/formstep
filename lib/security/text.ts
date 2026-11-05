import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function safeEqualString(left: string, right: string): boolean {
  const a = createHash("sha256").update(left).digest();
  const b = createHash("sha256").update(right).digest();
  return timingSafeEqual(a, b);
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;

export function sanitizeText(input: string, max: number): string {
  return input.replace(/<[^>]*>/g, "").replace(CONTROL, "").trim().slice(0, max);
}

export function safeInternalPath(value: string | null | undefined, fallback = "/hesabim"): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  if (value.includes("://") || value.includes("\n") || value.includes("\r")) return fallback;
  return value;
}

const SECRET_KEYS = [
  "authorization",
  "cookie",
  "password",
  "token",
  "salt",
  "secret",
  "service_role",
  "merchant_key",
  "merchant_salt",
  "email",
  "phone",
  "address",
];

export function redact(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[derinlik]";
  if (value === null || typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.includes("@")) return "[e-posta]";
    if (value.length > 180) return `${value.slice(0, 24)}…`;
    return value;
  }
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => redact(item, depth + 1));
  if (typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      output[key] = SECRET_KEYS.some((secret) => key.toLowerCase().includes(secret))
        ? "[gizli]"
        : redact(item, depth + 1);
    }
    return output;
  }
  return "[desteklenmeyen]";
}

export function logInfo(event: string, fields: Record<string, unknown> = {}): void {
  console.info(JSON.stringify({ level: "info", event, fields: redact(fields) }));
}

export function logError(event: string, fields: Record<string, unknown> = {}): void {
  console.error(JSON.stringify({ level: "error", event, fields: redact(fields) }));
}
