import {
  bookmakerMargin,
  edge,
  impliedProbability,
  minimumPrice,
  priceQualifies,
  removeMargin,
} from "@/lib/value/value";

// Made-up example so the maths can be checked by eye. Not real prices.
const EXAMPLE = {
  fixture: "Home FC vs Away United",
  outcomes: ["Home", "Draw", "Away"],
  prices: [2.1, 3.4, 3.6],
  // A pretend model probability for "Home", only to demonstrate edge.
  modelProbabilityHome: 0.5,
  requiredEdge: 0.02,
};

const pct = (p: number) => `${(p * 100).toFixed(1)}%`;
const signedPct = (p: number) => `${p >= 0 ? "+" : ""}${(p * 100).toFixed(1)}%`;
// Round minimum prices up so we never show one lower than the true minimum.
const priceUp = (price: number) => (Math.ceil(price * 100) / 100).toFixed(2);

export default function Home() {
  const marketProbs = removeMargin(EXAMPLE.prices);
  const margin = bookmakerMargin(EXAMPLE.prices);
  const homeEdge = edge(EXAMPLE.modelProbabilityHome, marketProbs[0]);
  const minPrice = minimumPrice(EXAMPLE.modelProbabilityHome, EXAMPLE.requiredEdge);
  const qualifies = priceQualifies(EXAMPLE.prices[0], minPrice);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <h1 className="text-3xl font-semibold">Fairline</h1>
      <p className="mt-2 text-sm opacity-80">
        Sports betting research and analysis. We do not take bets and we cannot know results.
      </p>

      <section className="mt-8 rounded-lg border border-current/20 p-5">
        <h2 className="text-lg font-semibold">Value maths check</h2>
        <p className="mt-1 text-sm opacity-80">
          Example only: made-up prices for {EXAMPLE.fixture}, not live odds.
        </p>

        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-current/20">
              <th className="py-2">Outcome</th>
              <th className="py-2">Price</th>
              <th className="py-2">Raw implied</th>
              <th className="py-2">Market probability</th>
            </tr>
          </thead>
          <tbody>
            {EXAMPLE.outcomes.map((name, i) => (
              <tr key={name} className="border-b border-current/10">
                <td className="py-2">{name}</td>
                <td className="py-2">{EXAMPLE.prices[i].toFixed(2)}</td>
                <td className="py-2">{pct(impliedProbability(EXAMPLE.prices[i]))}</td>
                <td className="py-2">{pct(marketProbs[i])}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
          <dt>Bookmaker margin</dt>
          <dd>{pct(margin)}</dd>
          <dt>Example model probability (Home)</dt>
          <dd>{pct(EXAMPLE.modelProbabilityHome)}</dd>
          <dt>Edge (Home)</dt>
          <dd>{signedPct(homeEdge)}</dd>
          <dt>Minimum price (asking for {EXAMPLE.requiredEdge * 100} points of edge)</dt>
          <dd>{priceUp(minPrice)}</dd>
          <dt>Does {EXAMPLE.prices[0].toFixed(2)} qualify?</dt>
          <dd>{qualifies ? "Yes" : "No, value no longer qualifies"}</dd>
        </dl>
      </section>

      <footer className="mt-10 text-xs opacity-70">
        18+ only. Gambling can be addictive; please play responsibly. For free, confidential
        support visit BeGambleAware.org or call the National Gambling Helpline on 0808 8020 133.
      </footer>
    </main>
  );
}
