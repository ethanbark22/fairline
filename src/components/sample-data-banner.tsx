import type { ReactNode } from "react";

/** Shown on every screen that still runs on made-up data, so nobody mistakes it for live prices, stats or a real account. */
export function SampleDataBanner({
  heading = "Sample data.",
  children,
}: {
  heading?: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-warning/40 bg-warning-bg px-4 py-3 text-sm text-warning">
      <strong className="font-semibold">{heading}</strong>{" "}
      {children ?? (
        <>
          These fixtures, stats and prices are made up to preview the screens. We haven&apos;t signed
          up with a stats or odds provider yet — see{" "}
          <code className="rounded bg-black/20 px-1">docs/PLAN.md</code>.
        </>
      )}
    </div>
  );
}
