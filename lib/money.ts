export const CURRENCY = "TRY" as const;

export type Currency = typeof CURRENCY;

export type Money = {
  amountMinor: number;
  currency: Currency;
};

export function assertKurus(amountMinor: number): number {
  if (!Number.isInteger(amountMinor)) {
    throw new Error("Tutar kuruş cinsinden tam sayı olmalıdır.");
  }
  return amountMinor;
}

export function formatTry(amountMinor: number): string {
  assertKurus(amountMinor);
  const sign = amountMinor < 0 ? "-" : "";
  const absolute = Math.abs(amountMinor);
  const lira = Math.floor(absolute / 100);
  const kurus = absolute % 100;
  const grouped = lira.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${sign}${grouped},${kurus.toString().padStart(2, "0")} TL`;
}

/** Half-up rounding for non-negative integer arithmetic. */
export function mulDivRound(amount: number, numerator: number, denominator: number): number {
  if (!Number.isInteger(amount) || !Number.isInteger(numerator) || !Number.isInteger(denominator)) {
    throw new Error("Yuvarlama yalnızca tam sayılarla yapılır.");
  }
  if (denominator <= 0 || amount < 0 || numerator < 0) {
    throw new Error("Yuvarlama girdileri geçersiz.");
  }
  return Math.floor((amount * numerator + Math.floor(denominator / 2)) / denominator);
}

/** Vitrin gösterimi: kuruş yoksa "399 TL", varsa "399,90 TL". */
export function formatPrice(amountMinor: number): string {
  const s = formatTry(amountMinor);
  return s.endsWith(",00 TL") ? s.replace(",00 TL", " TL") : s;
}
