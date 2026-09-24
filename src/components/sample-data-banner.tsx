/** Shown on every screen that still runs on made-up data, so nobody mistakes it for live prices or stats. */
export function SampleDataBanner() {
  return (
    <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
      <strong className="font-semibold">Sample data.</strong> These fixtures, stats and prices are
      made up to preview the screens. We haven&apos;t signed up with a stats or odds provider yet
      — see <code className="rounded bg-black/20 px-1">docs/PLAN.md</code>.
    </div>
  );
}
