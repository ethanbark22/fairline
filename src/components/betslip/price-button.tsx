"use client";

import { useBetslip } from "./betslip-context";
import type { BetslipSelection } from "@/lib/betslip/types";
import { formatPrice } from "@/lib/format";

/** A clickable price, like bet365's 1X2 columns. Clicking adds/swaps/removes the leg in the betslip — it never places a bet or moves money. */
export function PriceButton({ selection }: { selection: BetslipSelection }) {
  const { toggleSelection, isSelected } = useBetslip();
  const selected = isSelected(selection.fixtureId, selection.outcome);

  return (
    <button
      type="button"
      onClick={() => toggleSelection(selection)}
      aria-pressed={selected}
      className={`flex w-full flex-col items-center rounded-md border px-2 py-1.5 text-sm transition ${
        selected
          ? "border-emerald-500 bg-emerald-500/15 text-emerald-300"
          : "border-current/20 hover:border-current/40 hover:bg-current/5"
      }`}
    >
      <span className="text-xs opacity-70">{selection.outcome}</span>
      <span className="font-semibold tabular-nums">{formatPrice(selection.price)}</span>
    </button>
  );
}
