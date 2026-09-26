"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { BetslipSelection } from "@/lib/betslip/types";

interface BetslipContextValue {
  selections: BetslipSelection[];
  /** Adds a selection; picking a different outcome for a fixture already in the slip swaps it, and picking the same one again removes it — the same as clicking a price on a real bookmaker's slip. */
  toggleSelection: (selection: BetslipSelection) => void;
  removeSelection: (fixtureId: string) => void;
  clear: () => void;
  isSelected: (fixtureId: string, outcome: string) => boolean;
}

const BetslipContext = createContext<BetslipContextValue | null>(null);

export function BetslipProvider({ children }: { children: ReactNode }) {
  const [selections, setSelections] = useState<BetslipSelection[]>([]);

  const toggleSelection = useCallback((selection: BetslipSelection) => {
    setSelections((prev) => {
      const existingIndex = prev.findIndex((s) => s.fixtureId === selection.fixtureId);
      if (existingIndex === -1) return [...prev, selection];
      if (prev[existingIndex].outcome === selection.outcome) {
        return prev.filter((_, i) => i !== existingIndex);
      }
      const next = [...prev];
      next[existingIndex] = selection;
      return next;
    });
  }, []);

  const removeSelection = useCallback((fixtureId: string) => {
    setSelections((prev) => prev.filter((s) => s.fixtureId !== fixtureId));
  }, []);

  const clear = useCallback(() => setSelections([]), []);

  const isSelected = useCallback(
    (fixtureId: string, outcome: string) =>
      selections.some((s) => s.fixtureId === fixtureId && s.outcome === outcome),
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
