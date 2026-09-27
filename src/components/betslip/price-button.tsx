"use client";

import { useBetslip } from "./betslip-context";
import type { BetslipSelection } from "@/lib/betslip/types";
import { formatPrice } from "@/lib/format";

/** A clickable price, like bet365's market columns. Clicking adds/swaps/removes the leg in the betslip — it never places a bet or moves money. */
export function PriceButton({ selection }: { selection: BetslipSelection }) {
  const { toggleSelection, isSelected } = useBetslip();
  const selected = isSelected(selection.fixtureId, selection.market, selection.outcome);

  return (
    <button
      type="button"
      onClick={() => toggleSelection(selection)}
      aria-pressed={selected}
      className={`flex w-full flex-col items-center rounded-lg border-2 px-2 py-1.5 text-sm font-semibold transition active:scale-95 ${
        selected
          ? "border-brand bg-brand text-brand-foreground shadow-[0_0_14px_var(--brand)]"
          : "border-line bg-surface-2 hover:border-brand hover:bg-surface hover:shadow-[0_0_10px_var(--brand)]"
      }`}
    >
      <span className={`text-xs uppercase tracking-wide ${selected ? "opacity-80" : "text-muted"}`}>
        {selection.outcome}
      </span>
      <span className="font-display font-bold tabular-nums">{formatPrice(selection.price)}</span>
    </button>
  );
}
