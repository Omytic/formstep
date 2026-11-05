type Bucket = { tokens: number; updated: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
}): { ok: boolean; remaining: number } {
  const now = input.now ?? Date.now();
  const current = buckets.get(input.key);
  if (!current || now - current.updated >= input.windowMs) {
    buckets.set(input.key, { tokens: input.limit - 1, updated: now });
    return { ok: true, remaining: input.limit - 1 };
  }
  if (current.tokens <= 0) return { ok: false, remaining: 0 };
  current.tokens -= 1;
  return { ok: true, remaining: current.tokens };
}

export function resetRateLimits(): void {
  buckets.clear();
}

export function clientIp(header: string | null): string {
  if (!header) return "0.0.0.0";
  const first = header.split(",")[0]?.trim() ?? "";
  if (!/^[0-9a-fA-F:.]+$/.test(first)) return "0.0.0.0";
  return first.slice(0, 64);
}
