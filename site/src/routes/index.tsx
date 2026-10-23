import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { loadDashboardData } from "~/lib/providers";
import { formatAmerican, formatDecimal, formatProbability } from "~/lib/odds";
import { Shell } from "~/components/shell";
import { Chip, Label, Sparkline } from "~/components/ui";
import { OpportunityCard } from "~/components/opportunity-card";

export const Route = createFileRoute("/")({
  loader: async () => loadDashboardData(),
  component: Landing,
});

const TIERS = [
  {
    name: "Observer",
    price: "$29",
    cadence: "/month",
    blurb: "The board, the maths, and the record. For the bettor who wants a second opinion.",
    features: [
      "Top-10 +EV board, refreshed hourly",
      "NFL and NBA at launch — the two deepest, most liquid markets",
      "Full +EV calculator with Kelly sizing",
      "Public, timestamped track record",
      "Morning digest email",
    ],
    cta: "Join the waitlist",
    accent: false,
  },
  {
    name: "Trader",
    price: "$99",
    cadence: "/month",
    blurb: "The full card set with the line-movement history behind every number.",
    features: [
      "Everything in Observer",
      "Unlimited opportunity cards, all market types",
      "Open → current line movement per market",
      "Fractional-Kelly bankroll tooling",
      "Closing-line-value tracking per pick",
      "Model-change alerts on your saved leagues",
    ],
    cta: "Join the waitlist",
    accent: true,
  },
  {
    name: "Whale",
    price: "$299+",
    cadence: "/month",
    blurb: "Private model notes and risk parameters tuned to your own book and bankroll.",
    features: [
      "Everything in Trader",
      "Weekly written model notes (what moved, why)",
      "Custom bankroll and drawdown limits",
      "Market-by-market exposure reporting",
      "Monthly performance review, 30 minutes",
      "Priority access to new leagues and props",
    ],
    cta: "Join the waitlist",
    accent: false,
  },
];

const FAQ = [
  {
    q: "Is AlphaEdge a sportsbook?",
    a: "No. We are an information product. There are no deposits, no withdrawals, no bet slips and no wagering of any kind inside AlphaEdge. You place your own bets at a licensed operator and enter the price you were offered into our calculator.",
  },
  {
    q: "How are picks graded?",
    a: "Every published pick is stored with the price taken, the stake and the timestamp. It is graded win, loss or push against the settled result, and the track record page computes ROI, win rate and net units directly from those stored rows — never from a spreadsheet someone typed afterwards.",
  },
  {
    q: "Why does a good track record only win about 54%?",
    a: "Because that is what a real edge looks like at spread prices. At −110 you need 52.4% to break even; winning 54–56% against the number is a professional result, and it produces a modest positive ROI with meaningful variance. Anyone advertising 70% winners at −110 is either grading badly or selling something.",
  },
  {
    q: "Is the data on this site live?",
    a: "Not yet. This is a demonstration build with a seeded sample dataset — the odds, probabilities and pick history are fixtures, clearly labelled DEMONSTRATION DATA on every screen. Live feeds and the production model come after sign-off.",
  },
];

function Landing() {
  const data = Route.useLoaderData();
  const opportunities = data.board;
  const featured = useMemo(
    () => [...opportunities].sort((a, b) => b.ev - a.ev).slice(0, 3),
    [opportunities],
  );
  const hero = featured[0];
  const snapshotLabel = new Date(data.snapshotAt).toISOString().replace("T", " ").slice(0, 16) + " UTC";
  const [waitlistTier, setWaitlistTier] = useState<string | null>(null);

  return (
    <Shell snapshotLabel={snapshotLabel}>
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="grid-lines pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div className="relative mx-auto grid max-w-[1400px] gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Chip tone="gold">Members' terminal</Chip>
              <Chip>21+ · information product</Chip>
            </div>
            <h1 className="mt-5 text-[2.1rem] font-semibold leading-[1.08] tracking-[-0.02em] text-fg sm:text-5xl">
              We don't take bets.
              <br />
              <span className="text-gold">We sell the edge.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-mut">
              AlphaEdge gives analytical bettors three things the sportsbook will never give them: a
              calibrated win probability, the fair price that probability implies, and the size of the
              gap to the number their book is hanging. You decide. You place. We never touch a wager.
            </p>

            <div className="mt-7 flex flex-col gap-2 sm:flex-row">
              <Link
                to="/dashboard"
                className="num inline-flex items-center justify-center rounded-sm border border-pos/50 bg-pos/15 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-pos transition-colors hover:bg-pos/25"
              >
                Open the Deal Flow →
              </Link>
              <Link
                to="/calculator"
                className="num inline-flex items-center justify-center rounded-sm border border-line2 bg-panel px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-fg transition-colors hover:border-mut2"
              >
                Run the EV calculator
              </Link>
            </div>

            <dl className="mt-9 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-6 sm:grid-cols-4">
              {[
                ["2", "leagues at launch"],
                ["4", "market types"],
                [`${data.board.length}`, "sample cards live"],
                ["0", "bets we take"],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="num text-2xl font-semibold text-fg">{value}</dt>
                  <dd className="mt-0.5 text-[11px] uppercase tracking-[0.1em] text-mut2">{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Featured card — the product, on the landing page. */}
          {hero ? (
            <div className="relative">
              <div className="mb-2 flex items-center justify-between">
                <Label>Sample card · highest EV in demo set</Label>
                <span className="num text-[9px] uppercase tracking-[0.16em] text-gold">
                  Demonstration data
                </span>
              </div>
              <div className="rounded-md border border-line2 bg-panel2/60 p-4">
                <div className="flex items-center gap-2">
                  <Chip tone="info">{hero.league}</Chip>
                  <Chip>{hero.betType}</Chip>
                  <span className="num ml-auto text-[10px] text-mut2">{hero.book}</span>
                </div>
                <div className="mt-3 text-[13px] text-fg">{hero.matchup}</div>
                <div className="num mt-1 text-lg font-semibold text-fg">{hero.selection}</div>

                <div className="mt-4 grid grid-cols-3 gap-3 border-y border-line py-3">
                  <div>
                    <Label>Model</Label>
                    <div className="num text-base text-fg">{formatProbability(hero.modelProbability)}</div>
                  </div>
                  <div>
                    <Label>Book implies</Label>
                    <div className="num text-base text-mut">{formatProbability(hero.impliedProbability)}</div>
                  </div>
                  <div>
                    <Label>Edge</Label>
                    <div className="num text-base text-pos">+{hero.edgePoints.toFixed(1)} pts</div>
                  </div>
                </div>

                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <Label>Expected value</Label>
                    <div className="num text-2xl font-semibold text-pos">+{hero.ev.toFixed(1)}%</div>
                    <div className="num mt-1 text-[10px] text-mut2">
                      {formatAmerican(hero.bookOdds)} · {formatDecimal(hero.decimalOdds)} decimal
                    </div>
                  </div>
                  <div className="text-right">
                    <Sparkline points={hero.lineHistory} up={hero.movementPoints >= 0} width={150} height={40} />
                    <div className="num mt-1 text-[9px] text-mut2">
                      open {formatProbability(hero.openImplied)} → {formatProbability(hero.impliedProbability)}
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-mut2">
                Illustrative card built from the demo dataset. Not live odds. Informational only — not a
                bet offer.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────── */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-[1400px] px-4 py-14 sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Label>The method</Label>
              <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-fg">
                The edge is arithmetic, not opinion.
              </h2>
            </div>
            <p className="max-w-md text-[13px] leading-relaxed text-mut">
              No touts, no parlays, no "lock of the week". Three steps, every market, every day.
            </p>
          </div>

          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                n: "01",
                t: "Model probability",
                d: "Our ensemble converts pace, efficiency, rest, travel and injury inputs into a single win probability for each side of each market. The number is published before the price — never tuned to match it.",
                k: "p = 55.2%",
              },
              {
                n: "02",
                t: "Compare to your book's price",
                d: "The book's price converts to an implied probability. The gap between our number and theirs, priced through the payout, is expected value per unit staked.",
                k: "EV = (0.552 × 1.926 − 1) = +6.3%",
              },
              {
                n: "03",
                t: "Size it, then decide",
                d: "Kelly tells you the mathematically optimal stake for your bankroll; fractional Kelly keeps variance survivable. The decision, and the bet, stay with you.",
                k: "¼ Kelly = 1.8% of bankroll",
              },
            ].map((step) => (
              <li key={step.n} className="rounded-md border border-line bg-panel p-5">
                <div className="flex items-center justify-between">
                  <span className="num text-[10px] tracking-[0.2em] text-mut2">{step.n}</span>
                  <span className="h-1 w-1 rounded-full bg-gold/70" aria-hidden />
                </div>
                <h3 className="mt-3 text-[15px] font-medium text-fg">{step.t}</h3>
                <p className="mt-2 text-[12px] leading-relaxed text-mut">{step.d}</p>
                <div className="num mt-4 rounded-sm border border-line bg-ink px-2.5 py-2 text-[11px] text-pos">
                  {step.k}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Live sample cards ──────────────────────────────────────────── */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-[1400px] px-4 py-14 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <Label>Inside the terminal</Label>
              <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-fg">
                Three highest-EV cards in the sample set.
              </h2>
            </div>
            <Link
              to="/dashboard"
              className="num text-[11px] uppercase tracking-[0.12em] text-info hover:text-info/80"
            >
              See all {opportunities.length} cards →
            </Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((o) => (
              <OpportunityCard key={o.id} opportunity={o} agoSeconds={o.secondsAgo} />
            ))}
          </div>
          <p className="mt-4 rounded-sm border border-line bg-panel px-3 py-2 text-[11px] leading-relaxed text-mut2">
            <span className="text-mut">Demonstration data.</span> All cards, prices and probabilities on
            this page are fixtures from a seeded sample dataset, generated for product review. They are
            not live odds, not recommendations, and not a record of results.
          </p>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────────── */}
      <section id="pricing" className="scroll-mt-20 border-b border-line">
        <div className="mx-auto max-w-[1400px] px-4 py-14 sm:px-6">
          <div className="max-w-2xl">
            <Label>Membership</Label>
            <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-fg">
              Three tiers. One number that matters: expected value.
            </h2>
            <p className="mt-3 text-[13px] leading-relaxed text-mut">
              Billed monthly, cancel any time. No deposits, no bankroll held by us, no revenue share on
              your bets — a flat subscription for analysis, full stop.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-md border bg-panel p-5 ${
                  tier.accent ? "border-gold/45" : "border-line"
                }`}
              >
                {tier.accent ? (
                  <span className="absolute -top-2.5 left-4 rounded-sm border border-gold/50 bg-ink px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-gold">
                    Most popular
                  </span>
                ) : null}
                <div className="flex items-baseline justify-between">
                  <h3 className="text-[15px] font-semibold text-fg">{tier.name}</h3>
                  <div className="text-right">
                    <span className="num text-2xl font-semibold text-fg">{tier.price}</span>
                    <span className="num text-[11px] text-mut2">{tier.cadence}</span>
                  </div>
                </div>
                <p className="mt-2 min-h-[36px] text-[12px] leading-relaxed text-mut">{tier.blurb}</p>
                <ul className="mt-4 flex-1 space-y-2 border-t border-line pt-4">
                  {tier.features.map((f) => (
                    <li key={f} className="flex gap-2 text-[12px] leading-relaxed text-mut">
                      <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-pos" aria-hidden />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 space-y-2">
                  <button
                    type="button"
                    onClick={() => setWaitlistTier(tier.name)}
                    className={`num w-full rounded-sm border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                      tier.accent
                        ? "border-gold/50 bg-gold/15 text-gold hover:bg-gold/25"
                        : "border-line2 bg-panel2 text-fg hover:border-mut2"
                    }`}
                  >
                    {tier.cta}
                  </button>
                  <Link
                    to="/dashboard"
                    className="num block w-full rounded-sm border border-line px-4 py-2 text-center text-[10px] uppercase tracking-[0.12em] text-mut transition-colors hover:text-fg"
                  >
                    Explore the demo first
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {waitlistTier ? (
            <div
              role="status"
              className="mt-4 flex flex-wrap items-center gap-3 rounded-md border border-info/40 bg-info/10 px-4 py-3"
            >
              <span className="num text-[10px] uppercase tracking-[0.14em] text-info">Waitlist</span>
              <p className="text-[12px] text-fg">
                <span className="font-medium">{waitlistTier}</span> — the waitlist opens with paid launch.
                This demonstration build has no checkout and collects no payment details; nothing has been
                charged or reserved.
              </p>
              <button
                type="button"
                onClick={() => setWaitlistTier(null)}
                className="num ml-auto text-[10px] uppercase tracking-[0.12em] text-mut hover:text-fg"
              >
                Dismiss
              </button>
            </div>
          ) : null}

          <p className="mt-4 text-[11px] leading-relaxed text-mut2">
            Pricing shown is the intended launch offer, not a live checkout. Subscription billing arrives
            with accounts in the next release.
          </p>
        </div>
      </section>

      {/* ── Guardrails ─────────────────────────────────────────────────── */}
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Label>Guardrails</Label>
            <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-fg">
              What we will never do.
            </h2>
            <p className="mt-3 text-[13px] leading-relaxed text-mut">
              The product only works if you can audit it. These four constraints are structural, not
              marketing.
            </p>
            <Link
              to="/track-record"
              className="num mt-5 inline-block rounded-sm border border-line2 px-4 py-2.5 text-[11px] uppercase tracking-[0.12em] text-fg transition-colors hover:border-mut2"
            >
              Inspect the track record →
            </Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              ["No wagering, ever", "No deposits, withdrawals, bet slips or \"place bet\" buttons. We never hold a customer dollar."],
              ["No unverifiable records", "Every pick is timestamped and graded from stored results. If we cannot evidence a number, we do not publish it."],
              ["No invented experts", "We do not sell celebrity handicappers or borrowed credibility. Model output is labelled as model output."],
              ["No fake audit badges", "No third-party seal until a third party has actually audited us — and then it will be named and linked."],
            ].map(([t, d]) => (
              <li key={t} className="rounded-md border border-line bg-panel p-4">
                <div className="flex items-center gap-2">
                  <span className="num text-[10px] text-neg">✕</span>
                  <h3 className="text-[13px] font-medium text-fg">{t}</h3>
                </div>
                <p className="mt-1.5 text-[12px] leading-relaxed text-mut">{d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────── */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-[900px] px-4 py-14 sm:px-6">
          <Label>Straight answers</Label>
          <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-fg">Questions we get asked</h2>
          <div className="mt-6 divide-y divide-line border-y border-line">
            {FAQ.map((item) => (
              <details key={item.q} className="group py-3.5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[13px] font-medium text-fg marker:hidden">
                  {item.q}
                  <span className="num text-mut2 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 max-w-[70ch] text-[12px] leading-relaxed text-mut">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Close ──────────────────────────────────────────────────────── */}
      <section>
        <div className="mx-auto flex max-w-[1400px] flex-col items-start gap-5 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-fg">
              Price the number before you take it.
            </h2>
            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-mut">
              The calculator is fully functional — real implied probability, real expected value, real
              Kelly sizing. Put in your own probability and your book's price and see whether the bet is
              worth making at all.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              to="/calculator"
              className="num rounded-sm border border-pos/50 bg-pos/15 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-pos hover:bg-pos/25"
            >
              Open the calculator
            </Link>
            <Link
              to="/dashboard"
              className="num rounded-sm border border-line2 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-fg hover:border-mut2"
            >
              Deal Flow
            </Link>
          </div>
        </div>
      </section>
    </Shell>
  );
}
