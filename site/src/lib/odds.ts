/**
 * Pure betting math. No React, no I/O, no globals — safe to unit test and to
 * port line-for-line into the Python engine.
 *
 * Conventions
 *  - American odds: -110, +105 (never 0, never between -100 and 100)
 *  - Decimal odds: 1.91, 2.10 (always > 1)
 *  - Probabilities are decimals in [0, 1]
 *  - `edge` is always expressed in probability points unless suffixed `Pct`
 */

export type Grade = "win" | "loss" | "push";

export function americanToDecimal(american: number): number {
  if (!Number.isFinite(american) || american === 0) return Number.NaN;
  if (american > -100 && american < 100) return Number.NaN; // not a valid American price
  return american > 0 ? 1 + american / 100 : 1 + 100 / Math.abs(american);
}

export function decimalToAmerican(decimal: number): number {
  if (!Number.isFinite(decimal) || decimal <= 1) return Number.NaN;
  return decimal >= 2
    ? Math.round((decimal - 1) * 100)
    : -Math.round(100 / (decimal - 1));
}

export function americanToImpliedProbability(american: number): number {
  if (!Number.isFinite(american) || (american > -100 && american < 100) || american === 0)
    return Number.NaN;
  return american > 0 ? 100 / (american + 100) : Math.abs(american) / (Math.abs(american) + 100);
}

export function decimalToImpliedProbability(decimal: number): number {
  if (!Number.isFinite(decimal) || decimal <= 1) return Number.NaN;
  return 1 / decimal;
}

/** Expected value as a percentage of stake: (p × decimal − 1) × 100. */
export function evPercent(probability: number, decimalOdds: number): number {
  if (!Number.isFinite(probability) || !Number.isFinite(decimalOdds)) return Number.NaN;
  return (probability * decimalOdds - 1) * 100;
}

/** Expected profit in currency units on a given stake. */
export function expectedProfit(
  probability: number,
  decimalOdds: number,
  stake: number,
): number {
  if (![probability, decimalOdds, stake].every(Number.isFinite)) return Number.NaN;
  return stake * (probability * decimalOdds - 1);
}

/**
 * Full Kelly fraction of bankroll (0..1), i.e. f* = (p·b − q)/b where b = decimal − 1.
 * Equivalent to (p·decimal − 1)/(decimal − 1). Negative edge returns 0.
 */
export function kellyFraction(probability: number, decimalOdds: number): number {
  if (!Number.isFinite(probability) || !Number.isFinite(decimalOdds) || decimalOdds <= 1)
    return Number.NaN;
  const b = decimalOdds - 1;
  const f = (probability * decimalOdds - 1) / b;
  return Math.max(0, f);
}

/** Kelly stake in currency units at a given fraction (1 = full Kelly, 0.25 = quarter Kelly). */
export function kellyStake(
  probability: number,
  decimalOdds: number,
  bankroll: number,
  fraction = 1,
): number {
  const f = kellyFraction(probability, decimalOdds);
  if (!Number.isFinite(f) || !Number.isFinite(bankroll)) return Number.NaN;
  return f * fraction * bankroll;
}

/** Flat-bet comparison: what the same stake returns in expectation at the model's probability. */
export function flatBetOutcome(
  probability: number,
  decimalOdds: number,
  flatStake: number,
): { stake: number; expectedProfit: number; expectedRoiPct: number } {
  const profit = expectedProfit(probability, decimalOdds, flatStake);
  return {
    stake: flatStake,
    expectedProfit: profit,
    expectedRoiPct: flatStake > 0 ? (profit / flatStake) * 100 : Number.NaN,
  };
}

/** Profit in units for a settled pick. Push returns 0 and stakes are returned. */
export function pickProfitUnits(grade: Grade, americanOdds: number, units: number): number {
  const dec = americanToDecimal(americanOdds);
  if (!Number.isFinite(dec)) return 0;
  if (grade === "win") return units * (dec - 1);
  if (grade === "loss") return -units;
  return 0;
}

/** Break-even win rate required at a given decimal price: 1 / decimal. */
export function breakevenWinRate(decimalOdds: number): number {
  return decimalToImpliedProbability(decimalOdds);
}

/**
 * True for a price a book could actually post: +100 or longer, or −100 or
 * shorter. Anything strictly between −100 and +100 is not a legal American
 * price and must never reach a screen.
 */
export function isLegalAmericanPrice(american: number): boolean {
  return Number.isFinite(american) && (american <= -100 || american >= 100);
}

/**
 * Average price of a book of picks, computed in DECIMAL space.
 *
 * American prices are not a linear scale: they are two scales that meet at
 * ±100, so averaging them numerically is meaningless — (-110 + 112) / 2 = 1
 * is not a price at all. Decimal odds are proportional to the return on a unit
 * stake, so they average correctly; we average there and convert back once.
 *
 * Signature is deliberately plain (array of American prices in, one decimal
 * out) so it ports straight into the Python engine. Returns NaN for an empty
 * set or if any input is not a legal American price.
 */
export function averageDecimalOdds(americanPrices: number[]): number {
  if (americanPrices.length === 0) return Number.NaN;
  let sum = 0;
  for (const american of americanPrices) {
    const dec = americanToDecimal(american);
    if (!Number.isFinite(dec)) return Number.NaN;
    sum += dec;
  }
  return sum / americanPrices.length;
}

/**
 * The same average, expressed back in American odds, guaranteed to be a legal
 * price. The ±100 boundary is the danger zone: a decimal average just under
 * 2.00 converts to −100 and just over converts to +100, so we snap anything
 * that lands inside the (-100, +100) dead zone onto the boundary it is on.
 */
export function averageAmericanOdds(americanPrices: number[]): number {
  const avgDecimal = averageDecimalOdds(americanPrices);
  if (!Number.isFinite(avgDecimal)) return Number.NaN;
  const american = decimalToAmerican(avgDecimal);
  if (!Number.isFinite(american)) return Number.NaN;
  // Defence in depth: `decimalToAmerican` cannot produce a dead-zone value
  // today, but a future change to it must not be able to leak one into the UI.
  if (!isLegalAmericanPrice(american)) return avgDecimal >= 2 ? 100 : -100;
  return american;
}

/**
 * Stake-weighted mean of each pick's implied break-even probability:
 * sum(units / decimalOdds) / sum(units). This is a descriptive benchmark,
 * not a universal win-rate threshold guaranteeing flat P&L for mixed prices;
 * realized profit also depends on which picks win and their stakes.
 */
export function breakevenWinRateForPicks(rows: { odds: number; units: number }[]): number {
  let weighted = 0;
  let totalUnits = 0;
  for (const row of rows) {
    const implied = americanToImpliedProbability(row.odds);
    if (!Number.isFinite(implied) || !Number.isFinite(row.units)) continue;
    weighted += implied * row.units;
    totalUnits += row.units;
  }
  return totalUnits > 0 ? weighted / totalUnits : Number.NaN;
}

export type SummaryInput = { grade: Grade; odds: number; units: number };

export type PerformanceSummary = {
  picks: number;
  graded: number;
  wins: number;
  losses: number;
  pushes: number;
  winRate: number; // excludes pushes, 0..1
  unitsRisked: number;
  unitsNet: number;
  roi: number; // net units / units risked
  avgDecimalOdds: number; // mean of the decimal prices; the space prices can be averaged in
  avgAmericanOdds: number; // avgDecimalOdds converted back, always a legal price (or NaN)
  breakevenWinRate: number; // stake-weighted 1/decimal across the rows, 0..1
  avgUnits: number;
};

export function summarizePicks(rows: SummaryInput[]): PerformanceSummary {
  let wins = 0;
  let losses = 0;
  let pushes = 0;
  let unitsRisked = 0;
  let unitsNet = 0;
  const prices: number[] = [];

  for (const row of rows) {
    unitsRisked += row.units;
    unitsNet += pickProfitUnits(row.grade, row.odds, row.units);
    prices.push(row.odds);
    if (row.grade === "win") wins++;
    else if (row.grade === "loss") losses++;
    else pushes++;
  }

  const decided = wins + losses;
  return {
    picks: rows.length,
    graded: rows.length,
    wins,
    losses,
    pushes,
    winRate: decided > 0 ? wins / decided : 0,
    unitsRisked,
    unitsNet,
    roi: unitsRisked > 0 ? unitsNet / unitsRisked : 0,
    avgDecimalOdds: averageDecimalOdds(prices),
    avgAmericanOdds: averageAmericanOdds(prices),
    breakevenWinRate: breakevenWinRateForPicks(rows),
    avgUnits: rows.length > 0 ? unitsRisked / rows.length : 0,
  };
}

/** Running cumulative units, oldest first — used for the equity curve. */
export function cumulativeUnits(rows: (SummaryInput & { date: string })[]): number[] {
  let running = 0;
  return rows.map((row) => {
    running += pickProfitUnits(row.grade, row.odds, row.units);
    return Number(running.toFixed(4));
  });
}

export type OddsFormat = "american" | "decimal";

/**
 * Tolerant parser. Accepts "+110", "-110", "110", "2.10", "1.91", "−110" (unicode minus).
 * Explicit format wins; otherwise infer: leading +/− or |value| ≥ 100 → American,
 * a decimal point or value in (1, 100) → decimal.
 */
export function parseOdds(
  raw: string,
  format: OddsFormat = "american",
): { ok: true; american: number; decimal: number } | { ok: false; error: string } {
  const cleaned = raw.trim().replace(/[−–—]/g, "-").replace(/,/g, "");
  if (cleaned === "") return { ok: false, error: "Enter a price." };
  if (!/^[+-]?\d*\.?\d+$/.test(cleaned)) return { ok: false, error: "That isn't a valid price." };

  const value = Number(cleaned);
  if (!Number.isFinite(value)) return { ok: false, error: "That isn't a valid price." };

  // The caller's format toggle decides; no silent guessing between the two scales.
  if (format === "decimal") {
    if (value <= 1) return { ok: false, error: "Decimal odds must be greater than 1.00." };
    const american = decimalToAmerican(value);
    return { ok: true, american, decimal: value };
  }

  if (value === 0) return { ok: false, error: "American odds cannot be zero." };
  if (value > -100 && value < 100)
    return { ok: false, error: "American odds are +100 or longer, or −100 or shorter." };

  return { ok: true, american: value, decimal: americanToDecimal(value) };
}

/** Human-readable price: "+105" / "−110" / "2.05". */
export function formatAmerican(american: number): string {
  if (!Number.isFinite(american)) return "—";
  return american > 0 ? `+${Math.round(american)}` : `−${Math.abs(Math.round(american))}`;
}

export function formatDecimal(decimal: number, dp = 2): string {
  if (!Number.isFinite(decimal)) return "—";
  return decimal.toFixed(dp);
}

export function formatPct(value: number, dp = 1): string {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(dp)}%`;
}

export function formatProbability(probability: number, dp = 1): string {
  if (!Number.isFinite(probability)) return "—";
  return `${(probability * 100).toFixed(dp)}%`;
}

export function formatUnits(value: number, dp = 2): string {
  if (!Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toFixed(dp)}u`;
}

export function formatMoney(value: number, dp = 2): string {
  if (!Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}$${Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  })}`;
}
