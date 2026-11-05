import { STATUS_LABEL, STATUS_TONE, type OrderStatus } from "@/lib/orders";

const TONE = {
  neutral: "bg-ink/5 text-ink/70",
  good: "bg-good/10 text-good",
  warn: "bg-warn/10 text-warn",
  bad: "bg-bad/10 text-bad",
  info: "bg-blue/10 text-blue",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`chip ${TONE[STATUS_TONE[status]]}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}
