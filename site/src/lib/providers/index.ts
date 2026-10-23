import type { DataProvider, Opportunity, Pick } from "./types";
import { isLaunchLeague } from "./types";
import { mockProvider } from "./mock";
import {
  evPercent,
  americanToDecimal,
  americanToImpliedProbability,
} from "~/lib/odds";

/**
 * Provider selection is configuration, not code. Set DATA_PROVIDER to swap the
 * source once a real feed adapter exists (e.g. "sportradar", "oddsapi").
 */
const registry: Record<string, DataProvider> = {
  mock: mockProvider,
};

const selected = (import.meta.env?.VITE_DATA_PROVIDER as string | undefined) ?? "mock";

export const activeProvider: DataProvider = registry[selected] ?? mockProvider;

export type EnrichedOpportunity = Opportunity & {
  decimalOdds: number;
  impliedProbability: number;
  ev: number;
  edgePoints: number;
  openImplied: number;
  movementPoints: number;
};

/**
 * Pure derivation layer: raw market data in, decision metrics out.
 *
 * Convention: every probability field on the returned object is a decimal in
 * [0, 1]. Percent formatting is the renderer's job (`formatProbability`), never
 * this layer's — that is what keeps "open 50.5% → now 51.9%" honest per card.
 */
export function enrich(o: Opportunity): EnrichedOpportunity {
  const decimalOdds = americanToDecimal(o.bookOdds);
  const impliedProbability = americanToImpliedProbability(o.bookOdds);
  const openImplied = americanToImpliedProbability(o.openOdds);
  return {
    ...o,
    decimalOdds,
    impliedProbability,
    ev: evPercent(o.modelProbability, decimalOdds),
    edgePoints: (o.modelProbability - impliedProbability) * 100,
    openImplied,
    movementPoints: (impliedProbability - openImplied) * 100,
  };
}

/**
 * The board rule: a market only reaches the ranked "+EV opportunity board" if its
 * expected value is strictly positive. There is no threshold to tune here — a card
 * showing negative EV under a "+EV" heading is a credibility failure, not a
 * modelling opinion.
 */
export const BOARD_EV_FLOOR = 0;

export type BoardResult = {
  /** Ranked board: EV > 0 only, sorted by EV then confidence. */
  board: EnrichedOpportunity[];
  /** Markets deliberately kept off the board (no positive expectation). */
  excluded: EnrichedOpportunity[];
  /** Rows the provider supplied, board + excluded. */
  total: number;
};

/**
 * Single choke point between raw market data and the ranked board. Every UI
 * surface reads `board`; nothing renders `getOpportunities()` directly. A future
 * seed row or feed adapter cannot put a no-edge market in the ranked list without
 * failing `assertBoardInvariants` loudly at load time.
 */
export function buildBoard(raw: Opportunity[]): BoardResult {
  const seen = new Set<string>();
  const board: EnrichedOpportunity[] = [];
  const excluded: EnrichedOpportunity[] = [];

  for (const o of raw) {
    if (seen.has(o.id)) throw new Error(`[board] duplicate opportunity id: ${o.id}`);
    seen.add(o.id);

    const row = enrich(o);
    const priced = Number.isFinite(row.ev) && Number.isFinite(row.impliedProbability);
    if (!priced) {
      throw new Error(
        `[board] ${o.id} has unusable pricing (bookOdds=${o.bookOdds}, openOdds=${o.openOdds})`,
      );
    }
    if (!isLaunchLeague(o.league)) {
      throw new Error(`[board] ${o.id} is in ${o.league}, which is outside launch scope`);
    }
    if (row.ev > BOARD_EV_FLOOR) board.push(row);
    else excluded.push(row);
  }

  board.sort((a, b) => b.ev - a.ev || b.confidence - a.confidence);
  assertBoardInvariants(board, excluded);
  return { board, excluded, total: raw.length };
}

/**
 * Hard guard, run on every load. If this ever throws, the data source is wrong —
 * it is not a case to render around.
 */
function assertBoardInvariants(board: EnrichedOpportunity[], excluded: EnrichedOpportunity[]) {
  for (const row of board) {
    if (!(row.ev > BOARD_EV_FLOOR)) {
      throw new Error(`[board] non-positive EV market ${row.id} (${row.ev.toFixed(2)}%) reached the ranked board`);
    }
    if (!Number.isFinite(row.openImplied)) {
      throw new Error(`[board] ${row.id} has no opening price — the movement label would be a lie`);
    }
  }
  const boardIds = new Set(board.map((r) => r.id));
  for (const row of excluded) {
    if (boardIds.has(row.id)) {
      throw new Error(`[board] ${row.id} is both ranked and excluded`);
    }
  }
}

/**
 * Line-movement integrity: the sparkline path must start at the implied
 * probability of the opening price and end at the implied probability of the
 * current price, or the "open → now" label contradicts the chart next to it.
 */
export function checkLineMovement(o: Opportunity): string | null {
  if (o.lineHistory.length < 2) return `${o.id}: lineHistory needs at least two points`;
  const open = americanToImpliedProbability(o.openOdds) * 100;
  const now = americanToImpliedProbability(o.bookOdds) * 100;
  if (!Number.isFinite(open) || !Number.isFinite(now)) return `${o.id}: unusable odds`;
  if (Math.abs(o.lineHistory[0] - open) > 0.05)
    return `${o.id}: lineHistory opens at ${o.lineHistory[0]} but openOdds implies ${open.toFixed(2)}`;
  const last = o.lineHistory[o.lineHistory.length - 1];
  if (Math.abs(last - now) > 0.05)
    return `${o.id}: lineHistory ends at ${last} but bookOdds implies ${now.toFixed(2)}`;
  for (const point of o.lineHistory) {
    if (!Number.isFinite(point) || point <= 0 || point >= 100)
      return `${o.id}: lineHistory point ${point} is not a plausible percent`;
  }
  return null;
}

export async function loadDashboardData(): Promise<{
  board: EnrichedOpportunity[];
  excluded: EnrichedOpportunity[];
  total: number;
  snapshotAt: string;
  provider: { id: string; label: string; isDemonstration: boolean };
}> {
  const [raw, snapshotAt] = await Promise.all([
    activeProvider.getOpportunities(),
    activeProvider.getSnapshotAt(),
  ]);

  for (const o of raw) {
    const problem = checkLineMovement(o);
    if (problem) throw new Error(`[line-movement] ${problem}`);
  }

  const { board, excluded, total } = buildBoard(raw);
  return {
    board,
    excluded,
    total,
    snapshotAt,
    provider: {
      id: activeProvider.id,
      label: activeProvider.label,
      isDemonstration: activeProvider.isDemonstration,
    },
  };
}

export async function loadPicks(): Promise<Pick[]> {
  return activeProvider.getPicks();
}

