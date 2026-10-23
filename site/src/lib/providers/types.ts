import type { Grade } from "~/lib/odds";

/**
 * Every league the data model can represent. The union stays wide so switching a
 * league on later is a config change (`LAUNCH_LEAGUES`) and a feed, not a refactor.
 */
export type League = "NFL" | "NBA" | "NHL" | "MLB" | "NCAAF";
export type BetType = "Spread" | "Moneyline" | "Total" | "Prop";
export type Book = "DraftKings" | "FanDuel" | "BetMGM";

export const ALL_LEAGUES: League[] = ["NFL", "NBA", "NHL", "MLB", "NCAAF"];

/**
 * Leagues enabled in the product. Owner decision, business plan rev 2: NFL and NBA
 * only at launch (deepest handle, most liquid lines, most reliable odds feeds).
 * NHL / MLB / NCAAF are representable above but switched off here.
 */
export const LAUNCH_LEAGUES: League[] = ["NFL", "NBA"];

export function isLaunchLeague(league: League): boolean {
  return LAUNCH_LEAGUES.includes(league);
}

export const BET_TYPES: BetType[] = ["Spread", "Moneyline", "Total", "Prop"];

export type Opportunity = {
  id: string;
  league: League;
  /** e.g. "Kansas City Chiefs @ Buffalo Bills" */
  matchup: string;
  /** e.g. "KC −3.5" */
  selection: string;
  betType: BetType;
  /** Local kickoff label, pre-rendered to keep server and client markup identical. */
  startLabel: string;
  /** Sportsbook whose price we are quoting. */
  book: Book;
  /** American price currently available. */
  bookOdds: number;
  /** American price at the moment the line opened. */
  openOdds: number;
  /** Our model's probability that the selection covers/wins. 0..1 */
  modelProbability: number;
  /** 0..100 model agreement score. */
  confidence: number;
  /**
   * Implied-probability path from open to now, in percent (50.5, 51.92, ...), for
   * the sparkline. `lineHistory[0]` must equal the implied probability of
   * `openOdds` and the last point must equal that of `bookOdds`.
   */
  lineHistory: number[];
  /** Seconds between the data snapshot and the moment it was published. */
  secondsAgo: number;
  /**
   * Set when a market carries no positive expectation. These rows are kept in the
   * dataset (so the +EV-only rule is exercised) but the provider never lets them
   * onto the ranked board.
   */
  noEdge?: boolean;
};

export type Pick = {
  id: string;
  date: string; // ISO date, YYYY-MM-DD
  league: League;
  matchup: string;
  selection: string;
  betType: BetType;
  book: Book;
  /** American price actually taken. */
  odds: number;
  /** Units staked (1u = 1% of a notional 100u bankroll). */
  units: number;
  grade: Grade;
};

/**
 * The only surface the UI is allowed to read data from. Swapping the mock
 * provider for Sportradar / The Odds API / a Postgres-backed implementation is
 * a one-line change in `src/lib/providers/index.ts`.
 */
export interface DataProvider {
  readonly id: string;
  readonly label: string;
  readonly isDemonstration: boolean;
  /** ISO timestamp of the dataset snapshot the app is displaying. */
  getSnapshotAt(): Promise<string>;
  getOpportunities(): Promise<Opportunity[]>;
  getPicks(): Promise<Pick[]>;
}
