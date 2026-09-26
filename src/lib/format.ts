/** Display-only formatting helpers, shared between screens. Not tested like lib/price or lib/value — nothing here calculates a number, only formats one. */

export function formatKickoff(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  });
}

export function formatCapturedAt(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  });
}

export function formatPrice(price: number): string {
  return price.toFixed(2);
}

export function formatPct(p: number): string {
  return `${(p * 100).toFixed(1)}%`;
}

export function formatSignedPct(p: number): string {
  const pct = p * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
}
