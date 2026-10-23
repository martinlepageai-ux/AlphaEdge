import type { Opportunity, Pick } from "~/lib/providers/types";
import { isLaunchLeague } from "~/lib/providers/types";
import {
  americanToDecimal,
  americanToImpliedProbability,
  averageAmericanOdds,
  evPercent,
  formatAmerican,
  isLegalAmericanPrice,
  summarizePicks,
} from "~/lib/odds";

/**
 * DEMONSTRATION DATA — NOT LIVE ODDS, NOT REAL RESULTS.
 *
 * Every number in this file is a hand-built fixture used to exercise the UI and
 * the grading maths. Prices are plausible but fictional; the pick history is
 * constructed to grade out at a realistic ~54% and a low-single-digit ROI, not
 * a fantasy win rate. Nothing here should ever be presented as live or as our
 * performance. Swap `mockProvider` for a real adapter to go live.
 *
 * INVARIANTS (checked by `assertSeedIntegrity` below, and again by the provider):
 *  - launch scope is NFL + NBA only
 *  - `lineHistory[0]` is the implied probability of `openOdds`
 *  - `lineHistory[last]` is the implied probability of `bookOdds`
 *  - rows whose EV is not positive are marked `noEdge` and never reach the board
 */
/** ISO timestamp of the snapshot the demo dataset represents. */
export const SEED_SNAPSHOT_AT = "2026-10-23T18:42:00.000Z";

/**
 * The seeded market board. 24 priced markets plus 2 deliberately no-edge markets
 * (`noEdge: true`) that the provider's board filter excludes — they exist so the
 * +EV-only rule is exercised by the demo data itself rather than asserted in prose.
 */
export const SEED_OPPORTUNITIES: Opportunity[] = [
  {
    id: "opp-nfl-01",
    league: "NFL",
    matchup: "Kansas City Chiefs @ Buffalo Bills",
    selection: "KC −3.5",
    betType: "Spread",
    startLabel: "Sun 4:25 PM ET",
    book: "DraftKings",
    bookOdds: -108,
    openOdds: -102,
    modelProbability: 0.552,
    confidence: 78,
    lineHistory: [50.5, 51.0, 51.36, 51.74, 51.92],
    secondsAgo: 12,
  },
  {
    id: "opp-nfl-02",
    league: "NFL",
    matchup: "Philadelphia Eagles @ Dallas Cowboys",
    selection: "DAL +2.5",
    betType: "Spread",
    startLabel: "Sun 8:20 PM ET",
    book: "FanDuel",
    bookOdds: 102,
    openOdds: 105,
    modelProbability: 0.514,
    confidence: 64,
    lineHistory: [48.78, 48.93, 49.16, 49.39, 49.5],
    secondsAgo: 28,
  },
  {
    id: "opp-nfl-03",
    league: "NFL",
    matchup: "Baltimore Ravens @ Cincinnati Bengals",
    selection: "CIN +1.5",
    betType: "Spread",
    startLabel: "Sun 1:00 PM ET",
    book: "BetMGM",
    bookOdds: -105,
    openOdds: -110,
    modelProbability: 0.541,
    confidence: 71,
    lineHistory: [52.38, 52.04, 51.78, 51.54, 51.22],
    secondsAgo: 41,
  },
  {
    id: "opp-nfl-04",
    league: "NFL",
    matchup: "San Francisco 49ers @ Seattle Seahawks",
    selection: "SF ML",
    betType: "Moneyline",
    startLabel: "Sun 4:05 PM ET",
    book: "DraftKings",
    bookOdds: -132,
    openOdds: -145,
    modelProbability: 0.601,
    confidence: 82,
    lineHistory: [59.18, 58.61, 57.81, 57.13, 56.9],
    secondsAgo: 9,
  },
  {
    id: "opp-nfl-05",
    league: "NFL",
    matchup: "Detroit Lions @ Chicago Bears",
    selection: "Over 46.5",
    betType: "Total",
    startLabel: "Sun 1:00 PM ET",
    book: "FanDuel",
    bookOdds: -110,
    openOdds: -104,
    modelProbability: 0.538,
    confidence: 66,
    lineHistory: [50.98, 51.55, 51.94, 52.41, 52.38],
    secondsAgo: 63,
  },
  {
    id: "opp-nfl-06",
    league: "NFL",
    matchup: "Green Bay Packers @ Minnesota Vikings",
    selection: "MIN −1.5",
    betType: "Spread",
    startLabel: "Sun 1:00 PM ET",
    book: "BetMGM",
    bookOdds: 100,
    openOdds: -106,
    modelProbability: 0.536,
    confidence: 59,
    lineHistory: [51.46, 51.76, 52.09, 52.5, 50.0],
    secondsAgo: 77,
  },
  {
    id: "opp-nfl-07",
    league: "NFL",
    matchup: "New York Jets @ Miami Dolphins",
    selection: "Under 41.5",
    betType: "Total",
    startLabel: "Sun 1:00 PM ET",
    book: "DraftKings",
    bookOdds: -112,
    openOdds: -108,
    modelProbability: 0.545,
    confidence: 62,
    lineHistory: [51.92, 52.07, 52.18, 52.41, 52.83],
    secondsAgo: 96,
  },
  {
    id: "opp-nfl-08",
    league: "NFL",
    matchup: "Tampa Bay Buccaneers @ New Orleans Saints",
    selection: "TB ML",
    betType: "Moneyline",
    startLabel: "Sun 1:00 PM ET",
    book: "FanDuel",
    bookOdds: -118,
    openOdds: -125,
    modelProbability: 0.566,
    confidence: 68,
    lineHistory: [55.56, 55.14, 54.75, 54.44, 54.13],
    secondsAgo: 34,
  },
  {
    id: "opp-nfl-09",
    league: "NFL",
    matchup: "Los Angeles Chargers @ Denver Broncos",
    selection: "LAC +3.0",
    betType: "Spread",
    startLabel: "Sun 4:25 PM ET",
    book: "BetMGM",
    bookOdds: 108,
    openOdds: 100,
    modelProbability: 0.511,
    confidence: 55,
    lineHistory: [50.0, 50.59, 51.13, 51.95, 48.08],
    secondsAgo: 122,
  },
  {
    id: "opp-nfl-10",
    league: "NFL",
    matchup: "Jacksonville Jaguars @ Houston Texans",
    selection: "Trevor Lawrence Over 1.5 Pass TD",
    betType: "Prop",
    startLabel: "Sun 1:00 PM ET",
    book: "DraftKings",
    bookOdds: -125,
    openOdds: -118,
    modelProbability: 0.588,
    confidence: 61,
    lineHistory: [54.13, 54.42, 54.68, 55.01, 55.56],
    secondsAgo: 148,
  },
  {
    id: "opp-nfl-11",
    league: "NFL",
    matchup: "Pittsburgh Steelers @ Cleveland Browns",
    selection: "PIT −2.0",
    betType: "Spread",
    startLabel: "Sun 1:00 PM ET",
    book: "FanDuel",
    bookOdds: -104,
    openOdds: -110,
    modelProbability: 0.548,
    confidence: 57,
    lineHistory: [52.38, 52.04, 51.66, 51.43, 50.98],
    secondsAgo: 210,
  },
  {
    id: "opp-nfl-12",
    league: "NFL",
    matchup: "Arizona Cardinals @ Los Angeles Rams",
    selection: "Puka Nacua Over 79.5 Rec Yds",
    betType: "Prop",
    startLabel: "Sun 8:20 PM ET",
    book: "BetMGM",
    bookOdds: -110,
    openOdds: -105,
    modelProbability: 0.556,
    confidence: 73,
    lineHistory: [51.22, 51.58, 51.9, 52.24, 52.38],
    secondsAgo: 55,
  },
  {
    id: "opp-nba-01",
    league: "NBA",
    matchup: "Boston Celtics @ New York Knicks",
    selection: "NYK +4.5",
    betType: "Spread",
    startLabel: "Tue 7:30 PM ET",
    book: "FanDuel",
    bookOdds: -104,
    openOdds: -110,
    modelProbability: 0.534,
    confidence: 67,
    lineHistory: [52.38, 51.97, 51.59, 51.29, 50.98],
    secondsAgo: 18,
  },
  {
    id: "opp-nba-02",
    league: "NBA",
    matchup: "Denver Nuggets @ Los Angeles Lakers",
    selection: "Over 231.5",
    betType: "Total",
    startLabel: "Tue 10:00 PM ET",
    book: "DraftKings",
    bookOdds: -108,
    openOdds: -104,
    modelProbability: 0.547,
    confidence: 74,
    lineHistory: [50.98, 51.18, 51.39, 51.67, 51.92],
    secondsAgo: 24,
  },
  {
    id: "opp-nba-03",
    league: "NBA",
    matchup: "Golden State Warriors @ Phoenix Suns",
    selection: "PHX −2.5",
    betType: "Spread",
    startLabel: "Tue 9:00 PM ET",
    book: "BetMGM",
    bookOdds: 100,
    openOdds: -104,
    modelProbability: 0.531,
    confidence: 58,
    lineHistory: [50.98, 51.24, 51.45, 51.74, 50.0],
    secondsAgo: 39,
  },
  {
    id: "opp-nba-04",
    league: "NBA",
    matchup: "Milwaukee Bucks @ Miami Heat",
    selection: "Giannis Over 29.5 Pts",
    betType: "Prop",
    startLabel: "Tue 7:30 PM ET",
    book: "DraftKings",
    bookOdds: -115,
    openOdds: -110,
    modelProbability: 0.565,
    confidence: 76,
    lineHistory: [52.38, 52.78, 53.08, 53.41, 53.49],
    secondsAgo: 47,
  },
  {
    id: "opp-nba-05",
    league: "NBA",
    matchup: "Oklahoma City Thunder @ Minnesota Timberwolves",
    selection: "OKC −6.5",
    betType: "Spread",
    startLabel: "Tue 8:00 PM ET",
    book: "BetMGM",
    bookOdds: -102,
    openOdds: -108,
    modelProbability: 0.531,
    confidence: 69,
    lineHistory: [51.92, 51.5, 51.05, 50.6, 50.5],
    secondsAgo: 15,
  },
  {
    id: "opp-nba-06",
    league: "NBA",
    matchup: "Dallas Mavericks @ San Antonio Spurs",
    selection: "DAL ML",
    betType: "Moneyline",
    startLabel: "Tue 8:30 PM ET",
    book: "FanDuel",
    bookOdds: 118,
    openOdds: 108,
    modelProbability: 0.489,
    confidence: 61,
    lineHistory: [48.08, 48.85, 49.62, 50.28, 45.87],
    secondsAgo: 88,
  },
  {
    id: "opp-nba-07",
    league: "NBA",
    matchup: "Cleveland Cavaliers @ Orlando Magic",
    selection: "Under 218.5",
    betType: "Total",
    startLabel: "Tue 7:00 PM ET",
    book: "DraftKings",
    bookOdds: -105,
    openOdds: -110,
    modelProbability: 0.538,
    confidence: 63,
    lineHistory: [52.38, 52.1, 51.84, 51.65, 51.22],
    secondsAgo: 104,
  },
  {
    id: "opp-nba-08",
    league: "NBA",
    matchup: "Indiana Pacers @ Atlanta Hawks",
    selection: "Over 236.5",
    betType: "Total",
    startLabel: "Tue 7:30 PM ET",
    book: "BetMGM",
    bookOdds: 100,
    openOdds: -106,
    modelProbability: 0.529,
    confidence: 56,
    lineHistory: [51.46, 50.88, 50.34, 50.03, 50.0],
    secondsAgo: 132,
  },
  {
    id: "opp-nba-09",
    league: "NBA",
    matchup: "Sacramento Kings @ Portland Trail Blazers",
    selection: "SAC ML",
    betType: "Moneyline",
    startLabel: "Tue 10:00 PM ET",
    book: "FanDuel",
    bookOdds: -138,
    openOdds: -150,
    modelProbability: 0.607,
    confidence: 79,
    lineHistory: [60.0, 59.39, 58.79, 58.29, 57.98],
    secondsAgo: 61,
  },
  {
    id: "opp-nba-10",
    league: "NBA",
    matchup: "Memphis Grizzlies @ Utah Jazz",
    selection: "Ja Morant Over 8.5 Assists",
    betType: "Prop",
    startLabel: "Tue 9:00 PM ET",
    book: "DraftKings",
    bookOdds: 105,
    openOdds: 100,
    modelProbability: 0.497,
    confidence: 54,
    lineHistory: [50.0, 50.38, 50.65, 51.0, 48.78],
    secondsAgo: 171,
  },
  {
    id: "opp-nba-11",
    league: "NBA",
    matchup: "Toronto Raptors @ Brooklyn Nets",
    selection: "BKN +1.5",
    betType: "Spread",
    startLabel: "Tue 7:30 PM ET",
    book: "BetMGM",
    bookOdds: -110,
    openOdds: -104,
    modelProbability: 0.539,
    confidence: 52,
    lineHistory: [50.98, 51.27, 51.52, 51.78, 52.38],
    secondsAgo: 233,
  },
  {
    id: "opp-nba-12",
    league: "NBA",
    matchup: "New Orleans Pelicans @ Chicago Bulls",
    selection: "CHI ML",
    betType: "Moneyline",
    startLabel: "Tue 8:00 PM ET",
    book: "FanDuel",
    bookOdds: 112,
    openOdds: 120,
    modelProbability: 0.494,
    confidence: 60,
    lineHistory: [45.45, 45.04, 44.58, 44.2, 47.17],
    secondsAgo: 96,
  },
  {
    id: "noedge-nfl-01",
    league: "NFL",
    matchup: "Indianapolis Colts @ Tennessee Titans",
    selection: "IND ML",
    betType: "Moneyline",
    startLabel: "Sun 1:00 PM ET",
    book: "DraftKings",
    bookOdds: -150,
    openOdds: -142,
    modelProbability: 0.598,
    confidence: 44,
    lineHistory: [58.68, 58.95, 59.12, 59.37, 60.0],
    secondsAgo: 310,
    noEdge: true,
  },
  {
    id: "noedge-nba-01",
    league: "NBA",
    matchup: "Washington Wizards @ Charlotte Hornets",
    selection: "Under 229.5",
    betType: "Total",
    startLabel: "Tue 7:00 PM ET",
    book: "BetMGM",
    bookOdds: -110,
    openOdds: -110,
    modelProbability: 0.5176,
    confidence: 38,
    lineHistory: [52.38, 52.39, 52.36, 52.41, 52.38],
    secondsAgo: 402,
    noEdge: true,
  },
];

/**
 * 40 graded picks, 2026 season to date: 21 wins, 18 losses, 1 push.
 * Grades out at 53.8% and +2.9% ROI on 40u risked.
 * Deliberately unglamorous — that is what a real edge looks like.
 */
export const SEED_PICKS: Pick[] = [
  { id: "pk-01", date: "2026-09-04", league: "NFL", matchup: "Ravens @ Chiefs", selection: "KC −3.0", betType: "Spread", book: "DraftKings", odds: -110, units: 1, grade: "win" },
  { id: "pk-02", date: "2026-09-06", league: "NFL", matchup: "Eagles @ Cowboys", selection: "DAL +2.5", betType: "Spread", book: "FanDuel", odds: 105, units: 1, grade: "loss" },
  { id: "pk-03", date: "2026-09-07", league: "NFL", matchup: "Lions @ Packers", selection: "Over 48.5", betType: "Total", book: "BetMGM", odds: -110, units: 1, grade: "win" },
  { id: "pk-04", date: "2026-09-10", league: "NFL", matchup: "Bills @ Dolphins", selection: "BUF ML", betType: "Moneyline", book: "DraftKings", odds: -145, units: 1, grade: "win" },
  { id: "pk-05", date: "2026-09-13", league: "NFL", matchup: "49ers @ Seahawks", selection: "SF +1.5", betType: "Spread", book: "FanDuel", odds: -105, units: 1, grade: "loss" },
  { id: "pk-06", date: "2026-09-14", league: "NFL", matchup: "Steelers @ Bengals", selection: "Under 43.5", betType: "Total", book: "BetMGM", odds: -108, units: 1, grade: "win" },
  { id: "pk-07", date: "2026-09-17", league: "NFL", matchup: "Buccaneers @ Falcons", selection: "TB ML", betType: "Moneyline", book: "DraftKings", odds: 118, units: 1, grade: "loss" },
  { id: "pk-08", date: "2026-09-21", league: "NFL", matchup: "Broncos @ Raiders", selection: "DEN −2.5", betType: "Spread", book: "BetMGM", odds: -110, units: 1, grade: "loss" },
  { id: "pk-09", date: "2026-09-24", league: "NFL", matchup: "Rams @ Cardinals", selection: "Puka Nacua Over 74.5", betType: "Prop", book: "DraftKings", odds: -115, units: 1, grade: "win" },
  { id: "pk-10", date: "2026-09-27", league: "NFL", matchup: "Chiefs @ Chargers", selection: "Under 45.0", betType: "Total", book: "FanDuel", odds: -105, units: 1, grade: "win" },
  { id: "pk-11", date: "2026-09-28", league: "NFL", matchup: "Cowboys @ Giants", selection: "DAL ML", betType: "Moneyline", book: "BetMGM", odds: -132, units: 1, grade: "loss" },
  { id: "pk-12", date: "2026-10-01", league: "NFL", matchup: "Titans @ Colts", selection: "IND −1.5", betType: "Spread", book: "DraftKings", odds: -108, units: 1, grade: "win" },
  { id: "pk-13", date: "2026-10-04", league: "NFL", matchup: "Vikings @ Bears", selection: "MIN ML", betType: "Moneyline", book: "FanDuel", odds: 112, units: 1, grade: "loss" },
  { id: "pk-14", date: "2026-10-05", league: "NFL", matchup: "Saints @ Panthers", selection: "Over 40.5", betType: "Total", book: "BetMGM", odds: -110, units: 1, grade: "win" },
  { id: "pk-15", date: "2026-10-08", league: "NFL", matchup: "Eagles @ Commanders", selection: "WAS +3.5", betType: "Spread", book: "DraftKings", odds: -110, units: 1, grade: "win" },
  { id: "pk-16", date: "2026-10-11", league: "NFL", matchup: "Texans @ Jaguars", selection: "HOU ML", betType: "Moneyline", book: "FanDuel", odds: -125, units: 1, grade: "loss" },
  { id: "pk-17", date: "2026-10-12", league: "NFL", matchup: "Bills @ Jets", selection: "BUF −6.5", betType: "Spread", book: "BetMGM", odds: -105, units: 1, grade: "win" },
  { id: "pk-18", date: "2026-10-15", league: "NFL", matchup: "Bengals @ Browns", selection: "Under 42.0", betType: "Total", book: "DraftKings", odds: -110, units: 1, grade: "loss" },
  { id: "pk-19", date: "2026-10-18", league: "NFL", matchup: "Packers @ Lions", selection: "GB +4.5", betType: "Spread", book: "FanDuel", odds: 100, units: 1, grade: "win" },
  { id: "pk-20", date: "2026-10-19", league: "NFL", matchup: "Ravens @ Steelers", selection: "Lamar Over 1.5 Pass TD", betType: "Prop", book: "BetMGM", odds: -118, units: 1, grade: "loss" },
  { id: "pk-21", date: "2026-10-22", league: "NFL", matchup: "Seahawks @ 49ers", selection: "SF −4.0", betType: "Spread", book: "DraftKings", odds: -110, units: 1, grade: "loss" },
  { id: "pk-22", date: "2026-10-06", league: "NBA", matchup: "Celtics @ Knicks", selection: "NYK +4.5", betType: "Spread", book: "FanDuel", odds: -104, units: 1, grade: "loss" },
  { id: "pk-23", date: "2026-10-07", league: "NBA", matchup: "Nuggets @ Lakers", selection: "Over 231.5", betType: "Total", book: "DraftKings", odds: -108, units: 1, grade: "win" },
  { id: "pk-24", date: "2026-10-09", league: "NBA", matchup: "Warriors @ Suns", selection: "PHX −2.5", betType: "Spread", book: "BetMGM", odds: 100, units: 1, grade: "loss" },
  { id: "pk-25", date: "2026-10-10", league: "NBA", matchup: "Bucks @ Heat", selection: "Giannis Over 29.5", betType: "Prop", book: "DraftKings", odds: -115, units: 1, grade: "win" },
  { id: "pk-26", date: "2026-10-11", league: "NBA", matchup: "Thunder @ Timberwolves", selection: "OKC −6.5", betType: "Spread", book: "BetMGM", odds: -102, units: 1, grade: "win" },
  { id: "pk-27", date: "2026-10-12", league: "NBA", matchup: "Mavericks @ Spurs", selection: "DAL ML", betType: "Moneyline", book: "FanDuel", odds: 118, units: 1, grade: "loss" },
  { id: "pk-28", date: "2026-10-13", league: "NBA", matchup: "Cavaliers @ Magic", selection: "Under 218.5", betType: "Total", book: "DraftKings", odds: -105, units: 1, grade: "win" },
  { id: "pk-29", date: "2026-10-14", league: "NBA", matchup: "Pacers @ Hawks", selection: "Over 236.5", betType: "Total", book: "BetMGM", odds: 100, units: 1, grade: "loss" },
  { id: "pk-30", date: "2026-10-15", league: "NBA", matchup: "Kings @ Trail Blazers", selection: "SAC ML", betType: "Moneyline", book: "FanDuel", odds: -138, units: 1, grade: "win" },
  { id: "pk-31", date: "2026-10-16", league: "NBA", matchup: "Grizzlies @ Jazz", selection: "Ja Morant Over 8.5 Ast", betType: "Prop", book: "DraftKings", odds: 105, units: 1, grade: "loss" },
  { id: "pk-32", date: "2026-10-17", league: "NBA", matchup: "Raptors @ Nets", selection: "BKN +1.5", betType: "Spread", book: "BetMGM", odds: -110, units: 1, grade: "win" },
  { id: "pk-33", date: "2026-10-18", league: "NBA", matchup: "Pelicans @ Bulls", selection: "CHI ML", betType: "Moneyline", book: "FanDuel", odds: 112, units: 1, grade: "win" },
  { id: "pk-34", date: "2026-10-19", league: "NBA", matchup: "Clippers @ Suns", selection: "LAC +2.0", betType: "Spread", book: "DraftKings", odds: -108, units: 1, grade: "loss" },
  { id: "pk-35", date: "2026-10-20", league: "NBA", matchup: "Lakers @ Spurs", selection: "Over 224.5", betType: "Total", book: "BetMGM", odds: -110, units: 1, grade: "push" },
  { id: "pk-36", date: "2026-10-20", league: "NBA", matchup: "Heat @ Magic", selection: "ORL −3.5", betType: "Spread", book: "FanDuel", odds: -105, units: 1, grade: "win" },
  { id: "pk-37", date: "2026-10-21", league: "NBA", matchup: "Celtics @ 76ers", selection: "Tatum Over 26.5", betType: "Prop", book: "DraftKings", odds: -110, units: 1, grade: "loss" },
  { id: "pk-38", date: "2026-10-21", league: "NBA", matchup: "Nuggets @ Warriors", selection: "DEN ML", betType: "Moneyline", book: "BetMGM", odds: -115, units: 1, grade: "win" },
  { id: "pk-39", date: "2026-10-22", league: "NBA", matchup: "Bucks @ Pacers", selection: "Over 238.5", betType: "Total", book: "FanDuel", odds: 102, units: 1, grade: "loss" },
  { id: "pk-40", date: "2026-10-22", league: "NBA", matchup: "Thunder @ Mavericks", selection: "OKC −2.5", betType: "Spread", book: "DraftKings", odds: -110, units: 1, grade: "win" },
];


/**
 * Runtime integrity check for the demonstration dataset.
 *
 * Throws on the first violation rather than degrading quietly: a fixture that
 * breaks one of these invariants would show the owner a board that contradicts
 * itself (a "no edge" market ranked as an opportunity, or a movement label that
 * disagrees with the sparkline beside it). Called by the provider on every load.
 */
export function assertSeedIntegrity(): void {
  const seen = new Set<string>();

  for (const o of SEED_OPPORTUNITIES) {
    if (seen.has(o.id)) throw new Error(`[seed] duplicate opportunity id ${o.id}`);
    seen.add(o.id);

    if (!isLaunchLeague(o.league))
      throw new Error(`[seed] ${o.id} is ${o.league}; launch scope is NFL and NBA only`);

    const openImplied = americanToImpliedProbability(o.openOdds) * 100;
    const nowImplied = americanToImpliedProbability(o.bookOdds) * 100;
    const last = o.lineHistory[o.lineHistory.length - 1];
    if (Math.abs(o.lineHistory[0] - openImplied) > 0.05)
      throw new Error(
        `[seed] ${o.id} lineHistory opens at ${o.lineHistory[0]} but openOdds ${o.openOdds} implies ${openImplied.toFixed(2)}`,
      );
    if (Math.abs(last - nowImplied) > 0.05)
      throw new Error(
        `[seed] ${o.id} lineHistory ends at ${last} but bookOdds ${o.bookOdds} implies ${nowImplied.toFixed(2)}`,
      );

    const ev = evPercent(o.modelProbability, americanToDecimal(o.bookOdds));
    const positive = ev > 0;
    if (Boolean(o.noEdge) === positive)
      throw new Error(
        `[seed] ${o.id} is flagged noEdge=${Boolean(o.noEdge)} but its EV is ${ev.toFixed(2)}% — the flag and the maths disagree`,
      );
  }

  for (const p of SEED_PICKS) {
    if (!isLaunchLeague(p.league))
      throw new Error(`[seed] pick ${p.id} is ${p.league}; launch scope is NFL and NBA only`);
  }
  assertTrackRecordIntegrity();
}

/**
 * Rendered-value guard for the track-record summary tiles.
 *
 * The page once printed an "Avg price" of −58 by averaging American odds as if
 * they were one linear scale. They are not: −110 and +112 sit either side of a
 * sign change, so their numeric mean is not a price at all. The average has to
 * be taken in decimal space and converted back once, and the result has to be
 * a legal price — +100 or longer, or −100 or shorter — or the tile must not
 * render a price at all.
 *
 * Runs on every provider load, so a regression fails loudly instead of quietly
 * showing a numerate subscriber an impossible number.
 */
export function assertTrackRecordIntegrity(): void {
  const summary = summarizePicks(SEED_PICKS);

  // 1. The decimal average is the real quantity: it must be a valid decimal price.
  if (!Number.isFinite(summary.avgDecimalOdds) || summary.avgDecimalOdds <= 1)
    throw new Error(
      `[track-record] avg decimal odds is ${summary.avgDecimalOdds}, which is not a valid decimal price`,
    );

  // 2. Whatever the tile prints must parse to a legal American price — or to no
  //    price at all (the "tile absent" case), never to a value in (-100, +100).
  const rendered = formatAmerican(summary.avgAmericanOdds); // the exact string the tile prints
  const shown = Number(rendered.replace(/[−–—]/g, "-").replace(/\+/g, ""));
  if (Number.isFinite(shown) && !isLegalAmericanPrice(shown))
    throw new Error(
      `[track-record] the tile renders an avg price of ${rendered}; a legal American price is <= -100 or >= +100`,
    );

  // 3. The headline must be a real win rate derived from the rows.
  if (!Number.isFinite(summary.breakevenWinRate) || summary.breakevenWinRate <= 0 || summary.breakevenWinRate >= 1)
    throw new Error(
      `[track-record] break-even win rate is ${summary.breakevenWinRate}, which is not a probability in (0, 1)`,
    );

  // 4. Boundary probe: books straddling even money are exactly where a naive
  //    conversion produces a dead-zone price, so exercise them explicitly.
  const probes: number[][] = [
    [-110, 110],
    [-100, 100],
    [-105, 100],
    [-101, 100],
    [-110, 105],
    [-110, -110, 112],
    [100, 100],
    [100, 105, -105],
  ];
  for (const probe of probes) {
    const avg = averageAmericanOdds(probe);
    if (!isLegalAmericanPrice(avg))
      throw new Error(
        `[track-record] averageAmericanOdds([${probe.join(", ")}]) = ${avg}, which is not a legal American price`,
      );
  }
}
