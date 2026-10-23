import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { loadDashboardData } from "~/lib/providers";
import {

  decimalToImpliedProbability,
  evPercent,
  expectedProfit,
  formatAmerican,
  formatDecimal,
  formatMoney,
  formatPct,
  kellyFraction,
  kellyStake,
  parseOdds,
  type OddsFormat,
} from "~/lib/odds";
import { Shell } from "~/components/shell";
import { Chip, DISCLAIMER, Label } from "~/components/ui";

export const Route = createFileRoute("/calculator")({
  validateSearch: (search: Record<string, unknown>): { opp?: string } => ({
    opp: typeof search.opp === "string" ? search.opp : undefined,
  }),
  loader: async () => loadDashboardData(),
  component: Calculator,
});

const KELLY_OPTIONS = [
  { value: 1, label: "Full Kelly" },
  { value: 0.5, label: "½ Kelly" },
  { value: 0.25, label: "¼ Kelly" },
  { value: 0.125, label: "⅛ Kelly" },
] as const;

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <Label>{label}</Label>
        {hint ? <span className="text-[10px] text-mut2">{hint}</span> : null}
      </div>
      <div className="mt-1.5">{children}</div>
      {error ? <p className="mt-1 text-[11px] text-neg">{error}</p> : null}
    </div>
  );
}

const inputClass =
  "num w-full rounded-sm border border-line2 bg-ink px-3 py-2.5 text-[15px] text-fg outline-none transition-colors placeholder:text-mut2 focus:border-gold/60 focus:ring-1 focus:ring-gold/30";

function Calculator() {
  const data = Route.useLoaderData();
  const { opp } = Route.useSearch();

  const [probabilityInput, setProbabilityInput] = useState("55");
  const [oddsFormat, setOddsFormat] = useState<OddsFormat>("american");
  const [oddsInput, setOddsInput] = useState("+110");
  const [bankrollInput, setBankrollInput] = useState("10000");
  const [stakeInput, setStakeInput] = useState("500");
  const [fraction, setFraction] = useState<number>(0.25);
  const [loadedOppId, setLoadedOppId] = useState<string | null>(null);

  // Prefill from a Deal Flow card when arriving with ?opp=<id>
  useEffect(() => {
    if (!opp) return;
    const match = data.board.find((o) => o.id === opp);
    if (!match) return;
    setProbabilityInput((match.modelProbability * 100).toFixed(1));
    setOddsFormat("american");
    setOddsInput(match.bookOdds > 0 ? `+${match.bookOdds}` : `${match.bookOdds}`);
    setLoadedOppId(match.id);
  }, [opp, data.board]);

  const loadedOpp = useMemo(
    () => data.board.find((o) => o.id === loadedOppId) ?? null,
    [data.board, loadedOppId],
  );

  const parsed = useMemo(() => {
    const probValue = Number(probabilityInput.replace("%", "").trim());
    const probValid = Number.isFinite(probValue) && probValue > 0 && probValue < 100;
    const odds = parseOdds(oddsInput, oddsFormat);
    const bankroll = Number(bankrollInput.replace(/[,$]/g, ""));
    const stake = Number(stakeInput.replace(/[,$]/g, ""));
    const bankrollValid = Number.isFinite(bankroll) && bankroll > 0;
    const stakeValid = Number.isFinite(stake) && stake > 0;

    const p = probValue / 100;
    const decimal = odds.ok ? odds.decimal : Number.NaN;
    const valid = probValid && odds.ok && bankrollValid && stakeValid;

    const implied = valid ? decimalToImpliedProbability(decimal) : Number.NaN;
    const ev = valid ? evPercent(p, decimal) : Number.NaN;
    const kelly = valid ? kellyFraction(p, decimal) : Number.NaN;

    return {
      valid,
      probValue,
      probValid,
      p,
      odds,
      oddsError: odds.ok ? undefined : odds.error,
      probError: probValid ? undefined : "Enter a probability between 0 and 100.",
      bankroll,
      bankrollValid,
      bankrollError: bankrollValid ? undefined : "Enter a bankroll greater than zero.",
      stake,
      stakeValid,
      stakeError: stakeValid ? undefined : "Enter a stake greater than zero.",
      decimal,
      implied,
      edgePoints: valid ? (p - implied) * 100 : Number.NaN,
      ev,
      kelly,
      kellyStakeValue: valid ? kellyStake(p, decimal, bankroll, fraction) : Number.NaN,
      fullKellyStakeValue: valid ? kellyStake(p, decimal, bankroll, 1) : Number.NaN,
      expectedProfitValue: valid ? expectedProfit(p, decimal, stake) : Number.NaN,
      flatRoi: valid ? ev : Number.NaN,
    };
  }, [probabilityInput, oddsInput, oddsFormat, bankrollInput, stakeInput, fraction]);

  const positive = parsed.valid && parsed.ev > 0;
  const breakeven = parsed.valid ? parsed.implied * 100 : Number.NaN;

  const loadOpportunity = (id: string) => {
    const match = data.board.find((o) => o.id === id);
    if (!match) return;
    setProbabilityInput((match.modelProbability * 100).toFixed(1));
    setOddsFormat("american");
    setOddsInput(match.bookOdds > 0 ? `+${match.bookOdds}` : `${match.bookOdds}`);
    setLoadedOppId(id);
  };

  return (
    <Shell snapshotLabel={new Date(data.snapshotAt).toISOString().replace("T", " ").slice(0, 16) + " UTC"}>
      <div className="mx-auto max-w-[1400px] px-4 pb-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line py-6">
          <div>
            <div className="flex items-center gap-2">
              <Label>EV calculator</Label>
              <Chip tone="pos">Live maths</Chip>
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-fg">
              Is this price worth taking?
            </h1>
            <p className="mt-1.5 max-w-2xl text-[12px] leading-relaxed text-mut">
              Enter your probability and the price your book is offering. We convert the price to an
              implied probability, compute expected value, and size the stake with the Kelly Criterion.
              Nothing here is a recommendation — it is arithmetic on your own inputs.
            </p>
          </div>
          <div className="rounded-md border border-line bg-panel px-3 py-2">
            <Label>Prefill from board</Label>
            <select
              value={loadedOppId ?? ""}
              onChange={(e) => (e.target.value ? loadOpportunity(e.target.value) : setLoadedOppId(null))}
              className="num mt-1 w-full min-w-[240px] rounded-sm border border-line2 bg-ink px-2 py-1.5 text-[11px] text-fg outline-none focus:border-gold/60"
            >
              <option value="">Manual entry</option>
              {data.board.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.league} · {o.selection} ({o.bookOdds > 0 ? "+" : ""}
                  {o.bookOdds})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          {/* ── Inputs ─────────────────────────────────────────────────── */}
          <section className="rounded-md border border-line bg-panel p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-fg">Inputs</h2>
              <span className="num text-[9px] uppercase tracking-[0.14em] text-gold">Demonstration data</span>
            </div>

            {loadedOpp ? (
              <div className="mt-3 rounded-sm border border-line2 bg-panel2 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Chip tone="info">{loadedOpp.league}</Chip>
                  <Chip>{loadedOpp.betType}</Chip>
                  <span className="num ml-auto text-[10px] text-mut2">{loadedOpp.book}</span>
                </div>
                <div className="mt-1.5 text-[12px] text-fg">{loadedOpp.matchup}</div>
                <div className="num text-[12px] text-mut">
                  {loadedOpp.selection} · sample card, not a live price
                </div>
              </div>
            ) : null}

            <div className="mt-4 space-y-4">
              <Field
                label="Our model's win probability"
                hint="0–100"
                error={parsed.probError}
              >
                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="0"
                    max="100"
                    value={probabilityInput}
                    onChange={(e) => setProbabilityInput(e.target.value)}
                    aria-label="Model win probability in percent"
                    className={`${inputClass} pr-8 ${parsed.probError ? "border-neg/60" : ""}`}
                  />
                  <span className="num pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-mut2">
                    %
                  </span>
                </div>
              </Field>

              <Field label="Book price" hint={oddsFormat === "american" ? "e.g. −110 or +105" : "e.g. 1.91"}>
                <div className="flex gap-1.5">
                  <div className="flex shrink-0 rounded-sm border border-line2 bg-ink p-0.5">
                    {(["american", "decimal"] as OddsFormat[]).map((f) => (
                      <button
                        key={f}
                        type="button"
                        aria-pressed={oddsFormat === f}
                        onClick={() => {
                          if (f === oddsFormat) return;
                          // Convert the current entry so the price stays the same.
                          if (f === "decimal" && parsed.odds.ok) {
                            setOddsInput(parsed.decimal.toFixed(2));
                          } else if (f === "american" && parsed.odds.ok) {
                            setOddsInput(
                              parsed.odds.american > 0
                                ? `+${parsed.odds.american}`
                                : `${parsed.odds.american}`,
                            );
                          }
                          setOddsFormat(f);
                        }}
                        className={`rounded-[2px] px-2 py-1 text-[10px] uppercase tracking-[0.08em] ${
                          oddsFormat === f ? "bg-panel2 text-fg" : "text-mut2 hover:text-mut"
                        }`}
                      >
                        {f === "american" ? "US" : "Dec"}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={oddsInput}
                    onChange={(e) => setOddsInput(e.target.value)}
                    placeholder={oddsFormat === "american" ? "-110" : "1.91"}
                    aria-label="Book odds"
                    className={`${inputClass} ${parsed.oddsError ? "border-neg/60" : ""}`}
                  />
                </div>
                {parsed.oddsError ? (
                  <p className="mt-1 text-[11px] text-neg">{parsed.oddsError}</p>
                ) : parsed.odds.ok ? (
                  <p className="num mt-1 text-[10px] text-mut2">
                    {formatAmerican(parsed.odds.american)} American · {formatDecimal(parsed.odds.decimal)} decimal
                  </p>
                ) : null}
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Bankroll" hint="for Kelly sizing" error={parsed.bankrollError}>
                  <div className="relative">
                    <span className="num pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-mut2">
                      $
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={bankrollInput}
                      onChange={(e) => setBankrollInput(e.target.value)}
                      aria-label="Bankroll in dollars"
                      className={`${inputClass} pl-7 ${parsed.bankrollError ? "border-neg/60" : ""}`}
                    />
                  </div>
                </Field>
                <Field label="Your intended stake" hint="flat bet" error={parsed.stakeError}>
                  <div className="relative">
                    <span className="num pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-mut2">
                      $
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={stakeInput}
                      onChange={(e) => setStakeInput(e.target.value)}
                      aria-label="Intended stake in dollars"
                      className={`${inputClass} pl-7 ${parsed.stakeError ? "border-neg/60" : ""}`}
                    />
                  </div>
                </Field>
              </div>

              <Field label="Kelly fraction" hint="variance control">
                <div className="flex flex-wrap gap-1">
                  {KELLY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      aria-pressed={fraction === opt.value}
                      onClick={() => setFraction(opt.value)}
                      className={`num rounded-sm border px-2.5 py-1.5 text-[10px] uppercase tracking-[0.08em] transition-colors ${
                        fraction === opt.value
                          ? "border-gold/50 bg-gold/15 text-gold"
                          : "border-line bg-ink text-mut hover:text-fg"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            <p className="mt-4 border-t border-line pt-3 text-[11px] leading-relaxed text-mut2">
              Kelly assumes your probability is accurate. If it is off by even a few points, full Kelly
              overstakes — which is why most professionals size at a quarter or less.
            </p>
          </section>

          {/* ── Results ────────────────────────────────────────────────── */}
          <section className="flex flex-col gap-4">
            <div className="rounded-md border border-line bg-panel p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-fg">Result</h2>
                {parsed.valid ? (
                  <Chip tone={positive ? "pos" : "neg"}>{positive ? "+EV" : "−EV"}</Chip>
                ) : (
                  <Chip tone="gold">Awaiting input</Chip>
                )}
              </div>

              {parsed.valid ? (
                <>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div className="rounded-sm border border-line bg-ink px-3 py-2.5">
                      <Label>Book implied</Label>
                      <div className="num mt-1 text-lg text-fg">{formatPct(parsed.implied * 100, 2)}</div>
                    </div>
                    <div className="rounded-sm border border-line bg-ink px-3 py-2.5">
                      <Label>Our model</Label>
                      <div className="num mt-1 text-lg text-fg">{formatPct(parsed.p * 100, 1)}</div>
                    </div>
                    <div className="rounded-sm border border-line bg-ink px-3 py-2.5">
                      <Label>Edge</Label>
                      <div className={`num mt-1 text-lg ${positive ? "text-pos" : "text-neg"}`}>
                        {parsed.edgePoints >= 0 ? "+" : "−"}
                        {Math.abs(parsed.edgePoints).toFixed(2)} pts
                      </div>
                    </div>
                    <div className="rounded-sm border border-line bg-ink px-3 py-2.5">
                      <Label>EV per unit</Label>
                      <div className={`num mt-1 text-lg ${positive ? "text-pos" : "text-neg"}`}>
                        {parsed.ev >= 0 ? "+" : "−"}
                        {Math.abs(parsed.ev).toFixed(2)}%
                      </div>
                    </div>
                    <div className="rounded-sm border border-line bg-ink px-3 py-2.5">
                      <Label>Expected profit</Label>
                      <div className={`num mt-1 text-lg ${parsed.expectedProfitValue >= 0 ? "text-pos" : "text-neg"}`}>
                        {formatMoney(parsed.expectedProfitValue)}
                      </div>
                      <div className="num mt-0.5 text-[10px] text-mut2">on {formatMoney(parsed.stake, 0)}</div>
                    </div>
                    <div className="rounded-sm border border-line bg-ink px-3 py-2.5">
                      <Label>Break-even win %</Label>
                      <div className="num mt-1 text-lg text-mut">{formatPct(breakeven, 2)}</div>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-sm border border-pos/35 bg-pos/[0.06] px-3 py-3">
                      <Label>
                        {fraction === 1 ? "Full" : fraction === 0.5 ? "Half" : fraction === 0.25 ? "Quarter" : "Eighth"}{" "}
                        Kelly stake
                      </Label>
                      <div className="num mt-1 text-2xl font-semibold text-pos">
                        {formatMoney(parsed.kellyStakeValue, 0)}
                      </div>
                      <div className="num mt-1 text-[10px] text-mut">
                        {formatPct(parsed.kelly * fraction * 100, 2)} of bankroll · full Kelly{" "}
                        {formatPct(parsed.kelly * 100, 2)}
                      </div>
                    </div>
                    <div className="rounded-sm border border-line bg-panel2 px-3 py-3">
                      <Label>Flat-bet comparison</Label>
                      <div className="num mt-1 text-2xl font-semibold text-fg">
                        {formatMoney(parsed.expectedProfitValue)}
                      </div>
                      <div className="num mt-1 text-[10px] text-mut">
                        expected profit at {formatMoney(parsed.stake, 0)} flat ·{" "}
                        {formatPct(parsed.flatRoi, 2)} ROI
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-4 rounded-sm border border-gold/30 bg-gold/[0.06] p-4">
                  <p className="text-[12px] leading-relaxed text-mut">
                    Enter a probability between 0 and 100, a valid price in the selected format, a bankroll
                    and a stake. We won't guess at malformed input — the numbers appear once every field
                    parses.
                  </p>
                </div>
              )}
            </div>

            {/* Plain-English readout */}
            <div className="rounded-md border border-line bg-panel p-4 sm:p-5">
              <Label>Plain English</Label>
              {parsed.valid ? (
                <p className="mt-2 text-[13px] leading-relaxed text-fg">
                  Our model says <span className="num text-gold">{formatPct(parsed.p * 100, 1)}</span>; the
                  book's price implies <span className="num">{formatPct(parsed.implied * 100, 1)}</span>.{" "}
                  {positive ? (
                    <>
                      That is a <span className="text-pos">+EV opportunity</span> of{" "}
                      <span className="num text-pos">{formatPct(parsed.ev, 2)}</span> per unit staked —
                      about <span className="num text-pos">{formatMoney(parsed.expectedProfitValue)}</span>{" "}
                      in expectation on your {formatMoney(parsed.stake, 0)} stake. Kelly sizing at{" "}
                      {fraction === 1 ? "full" : fraction === 0.5 ? "half" : fraction === 0.25 ? "a quarter" : "an eighth"}{" "}
                      of the criterion suggests <span className="num">{formatMoney(parsed.kellyStakeValue, 0)}</span>{" "}
                      of your {formatMoney(parsed.bankroll, 0)} bankroll.
                      {parsed.stake > parsed.kellyStakeValue * 1.05 ? (
                        <>
                          {" "}
                          Your intended stake is{" "}
                          <span className="num">
                            {(parsed.stake / Math.max(parsed.kellyStakeValue, 1)).toFixed(1)}×
                          </span>{" "}
                          the Kelly recommendation, so variance will run higher than the maths calls for.
                        </>
                      ) : parsed.stake <= parsed.kellyStakeValue ? (
                        <> Your intended stake is within the Kelly recommendation.</>
                      ) : null}
                    </>
                  ) : (
                    <>
                      That is a <span className="text-neg">negative-EV bet</span>: the book's price is
                      shorter than our model's probability, so you are paying more than the outcome is
                      worth. At this price you would need{" "}
                      <span className="num">{formatPct(breakeven, 2)}</span> to break even; no stake size
                      makes a negative-EV price good. Pass.
                    </>
                  )}
                </p>
              ) : (
                <p className="mt-2 text-[13px] leading-relaxed text-mut">
                  The readout appears once the inputs are valid.
                </p>
              )}

              {parsed.valid ? (
                <div className="num mt-4 space-y-1 rounded-sm border border-line bg-ink px-3 py-2.5 text-[11px] text-mut">
                  <div className="text-[9px] uppercase tracking-[0.16em] text-mut2">Show the work</div>
                  <div>decimal = {oddsFormat === "american" && parsed.odds.ok ? (parsed.odds.american > 0 ? `1 + ${parsed.odds.american} / 100` : `1 + 100 / ${Math.abs(parsed.odds.american)}`) : "entered"} = {formatDecimal(parsed.decimal, 4)}</div>
                  <div>implied = 1 / {formatDecimal(parsed.decimal, 4)} = {formatPct(parsed.implied * 100, 2)}</div>
                  <div>
                    EV = ({parsed.p.toFixed(3)} × {formatDecimal(parsed.decimal, 4)}) − 1 ={" "}
                    {formatPct(parsed.ev, 2)}
                  </div>
                  <div>
                    Kelly f* = ({parsed.p.toFixed(3)} × {formatDecimal(parsed.decimal, 4)} − 1) / (
                    {formatDecimal(parsed.decimal, 4)} − 1) = {formatPct(parsed.kelly * 100, 2)}
                  </div>
                  <div>
                    stake = {formatPct(parsed.kelly * 100, 2)} × {fraction} × {formatMoney(parsed.bankroll, 0)} ={" "}
                    {formatMoney(parsed.kellyStakeValue, 2)}
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <div className="mt-4 rounded-md border border-line bg-panel p-4">
          <Label>Method</Label>
          <div className="mt-2 grid gap-3 text-[11px] leading-relaxed text-mut2 sm:grid-cols-3">
            <p>
              <span className="text-mut">Implied probability</span> = 1 / decimal odds. A −110 price implies
              52.38%; +150 implies 40.00%. This is the market's break-even estimate, vig included.
            </p>
            <p>
              <span className="text-mut">Expected value</span> = (p × decimal) − 1. Positive means the payout
              exceeds the probability-weighted cost of the bet. Edge is the same gap expressed in
              probability points.
            </p>
            <p>
              <span className="text-mut">Kelly</span> = (p × decimal − 1) / (decimal − 1), the bankroll
              fraction that maximises long-run growth. Fractional Kelly trades some growth for far less
              drawdown.
            </p>
          </div>
          <p className="mt-3 border-t border-line pt-3 text-[10px] leading-relaxed text-mut2">{DISCLAIMER}</p>
          <p className="mt-2 text-[10px] leading-relaxed text-mut2">
            Prefilled values come from the demonstration dataset, not a live feed.{" "}
            <Link to="/dashboard" className="text-info hover:text-info/80">
              Browse the sample board →
            </Link>
          </p>
        </div>
      </div>
    </Shell>
  );
}
