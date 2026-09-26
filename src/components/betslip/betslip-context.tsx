"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { BetslipSelection } from "@/lib/betslip/types";
import type { MarketKey } from "@/lib/providers/odds/types";

interface BetslipContextValue {
  selections: BetslipSelection[];
  /** Adds a selection; picking a different outcome in a market already in the slip swaps it, and picking the same one again removes it — the same as clicking a price on a real bookmaker's slip. A different market on the same fixture is a separate leg. */
  toggleSelection: (selection: BetslipSelection) => void;
  removeSelection: (fixtureId: string, market: MarketKey) => void;
  clear: () => void;
  isSelected: (fixtureId: string, market: MarketKey, outcome: string) => boolean;
}

const BetslipContext = createContext<BetslipContextValue | null>(null);

function sameSlot(a: BetslipSelection, fixtureId: string, market: MarketKey): boolean {
  return a.fixtureId === fixtureId && a.market === market;
}

export function BetslipProvider({ children }: { children: ReactNode }) {
  const [selections, setSelections] = useState<BetslipSelection[]>([]);

  const toggleSelection = useCallback((selection: BetslipSelection) => {
    setSelections((prev) => {
      const existingIndex = prev.findIndex((s) => sameSlot(s, selection.fixtureId, selection.market));
      if (existingIndex === -1) return [...prev, selection];
      if (prev[existingIndex].outcome === selection.outcome) {
        return prev.filter((_, i) => i !== existingIndex);
      }
      const next = [...prev];
      next[existingIndex] = selection;
      return next;
    });
  }, []);

  const removeSelection = useCallback((fixtureId: string, market: MarketKey) => {
    setSelections((prev) => prev.filter((s) => !sameSlot(s, fixtureId, market)));
  }, []);

  const clear = useCallback(() => setSelections([]), []);

  const isSelected = useCallback(
    (fixtureId: string, market: MarketKey, outcome: string) =>
      selections.some((s) => sameSlot(s, fixtureId, market) && s.outcome === outcome),
    [selections],
  );

  const value = useMemo(
    () => ({ selections, toggleSelection, removeSelection, clear, isSelected }),
    [selections, toggleSelection, removeSelection, clear, isSelected],
  );

  return <BetslipContext.Provider value={value}>{children}</BetslipContext.Provider>;
}

export function useBetslip(): BetslipContextValue {
  const ctx = useContext(BetslipContext);
  if (!ctx) {
    throw new Error("useBetslip must be used inside a BetslipProvider");
  }
  return ctx;
}
