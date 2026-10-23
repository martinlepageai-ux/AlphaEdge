import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { activeProvider } from "~/lib/providers";
import type { Pick } from "~/lib/providers/types";
import {
  cumulativeUnits,
  formatAmerican,
  formatPct,
  formatUnits,
  pickProfitUnits,
  summarizePicks,
} from "~/lib/odds";
import { Shell } from "~/components/shell";
import { Chip, DISCLAIMER, EquityCurve, Label, StatTile } from "~/components/ui";

export const Route = createFileRoute("/track-record")({
  loader: async () => {
    const [picks, snapshotAt] = await Promise.all([
      activeProvider.getPicks(),
      activeProvider.getSnapshotAt(),
    ]);
    return { picks, snapshotAt };
  },
  component: TrackRecord,
});

type GradeFilter = "all" | "win" | "loss" | "push";

function gradeChip(grade: Pick["grade"]) {
  if (grade === "win") return <Chip tone="pos">Win</Chip>;
  if (grade === "loss") return <Chip tone="neg">Loss</Chip>;
  return <Chip tone="gold">Push</Chip>;
}

function TrackRecord() {
  const data = Route.useLoaderData();
  const [filter, setFilter] = useState<GradeFilter>("all");

  const rows = useMemo(
    () => [...data.picks].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)),
    [data.picks],
  );

  const summary = useMemo(() => summarizePicks(rows), [rows]);
  const equity = useMemo(() => {
    const chronological = [...data.picks].sort(
      (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
    );
    return [0, ...cumulativeUnits(chronological)];
  }, [data.picks]);

  const visible = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.grade === filter)),
    [rows, filter],
  );

  const filteredSummary = useMemo(
    () => (filter === "all" ? summary : summarizePicks(visible)),
    [filter, visible, summary],
  );

  const snapshotLabel = new Date(data.snapshotAt).toISOString().replace("T", " ").slice(0, 16) + " UTC";

  return (
    <Shell snapshotLabel={snapshotLabel}>
      <div className="mx-auto max-w-[1400px] px-4 pb-16 sm:px-6">
        <div className="border-b border-line py-6">
          <div className="flex flex-wrap items-center gap-2">
            <Label>Track record</Label>
            <Chip tone="gold">Demonstration data</Chip>
            <Chip>Sample picks · not real results</Chip>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-fg">
            Every pick we publish, graded in public.
          </h1>
          <p className="mt-1.5 max-w-3xl text-[12px] leading-relaxed text-mut">
            This page is computed from the stored pick rows below — not from a summary someone typed. Win
            rate excludes pushes; ROI is net units divided by units risked. The history shown is a seeded
            demonstration set of {rows.length} picks, constructed to look like a real edge: roughly 54%
            against the spread and a low-single-digit return.
          </p>
        </div>

        {/* ── Summary tiles ──────────────────────────────────────────── */}
        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          <StatTile
            label="Record"
            value={`${summary.wins}–${summary.losses}${summary.pushes ? `–${summary.pushes}` : ""}`}
            sub="W–L–P"
          />
          <StatTile
            label="Win rate"
            value={formatPct(summary.winRate * 100, 1)}
            sub={`${summary.wins} of ${summary.wins + summary.losses} decided`}
          />
          <StatTile
            label="Net units"
            value={formatUnits(summary.unitsNet)}
            sub={`${summary.unitsRisked.toFixed(0)}u risked`}
            tone={summary.unitsNet >= 0 ? "pos" : "neg"}
          />
          <StatTile
            label="ROI"
            value={formatPct(summary.roi * 100, 2)}
            sub="net ÷ units risked"
            tone={summary.roi >= 0 ? "pos" : "neg"}
          />
          <StatTile
            label="Break-even win rate"
            value={formatPct(summary.breakevenWinRate * 100, 1)}
            sub={`at an avg price of ${formatAmerican(summary.avgAmericanOdds)}`}
          />
          <StatTile
            label="Picks graded"
            value={summary.graded}
            sub="all settled, none open"
          />
        </div>

        {/* ── Equity curve ───────────────────────────────────────────── */}
        <div className="mt-4 rounded-md border border-line bg-panel p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <Label>Cumulative units</Label>
              <div className="num mt-1 text-lg font-medium text-pos">
                {formatUnits(equity[equity.length - 1] ?? 0)} <span className="text-[11px] text-mut2">units</span>
              </div>
            </div>
            <div className="num text-[10px] text-mut2">
              {rows.length} picks · flat 1u stakes · 1u = 1% of a 100u bankroll
            </div>
          </div>
          <div className="mt-3">
            <EquityCurve values={equity} />
          </div>
          <div className="num mt-1 flex justify-between text-[9px] text-mut2">
            <span>oldest</span>
            <span>latest</span>
          </div>
        </div>

        {/* ── Filters ────────────────────────────────────────────────── */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.12em] text-mut2">Show</span>
          {(
            [
              ["all", `All ${rows.length}`],
              ["win", `Wins ${summary.wins}`],
              ["loss", `Losses ${summary.losses}`],
              ["push", `Pushes ${summary.pushes}`],
            ] as [GradeFilter, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
              className={`num rounded-sm border px-2 py-1 text-[10px] uppercase tracking-[0.08em] transition-colors ${
                filter === key
                  ? "border-gold/50 bg-gold/15 text-gold"
                  : "border-line bg-panel text-mut hover:text-fg"
              }`}
            >
              {label}
            </button>
          ))}
          {filter !== "all" ? (
            <span className="num ml-auto text-[10px] text-mut2">
              {visible.length} rows · net {formatUnits(filteredSummary.unitsNet)} · ROI{" "}
              {formatPct(filteredSummary.roi * 100, 2)}
            </span>
          ) : null}
        </div>

        {/* ── Table ──────────────────────────────────────────────────── */}
        <div className="mt-2 overflow-x-auto rounded-md border border-line">
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-panel2/60">
                {["Date", "League", "Matchup", "Selection", "Market", "Book", "Price", "Units", "Grade", "P/L"].map(
                  (h, i) => (
                    <th
                      key={h}
                      scope="col"
                      className={`px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-mut2 ${
                        i >= 6 ? "text-right" : ""
                      }`}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => {
                const pl = pickProfitUnits(row.grade, row.odds, row.units);
                return (
                  <tr key={row.id} className="border-b border-line/60 transition-colors last:border-0 hover:bg-panel2/40">
                    <td className="num whitespace-nowrap px-3 py-2 text-[11px] text-mut">{row.date}</td>
                    <td className="px-3 py-2 text-[11px] text-mut">{row.league}</td>
                    <td className="px-3 py-2 text-[11px] text-fg">{row.matchup}</td>
                    <td className="num whitespace-nowrap px-3 py-2 text-[11px] text-fg">{row.selection}</td>
                    <td className="px-3 py-2 text-[11px] text-mut">{row.betType}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-[11px] text-mut2">{row.book}</td>
                    <td className="num px-3 py-2 text-right text-[11px] text-mut">{formatAmerican(row.odds)}</td>
                    <td className="num px-3 py-2 text-right text-[11px] text-mut">{row.units.toFixed(2)}u</td>
                    <td className="px-3 py-2 text-right">{gradeChip(row.grade)}</td>
                    <td
                      className={`num px-3 py-2 text-right text-[11px] ${
                        pl > 0 ? "text-pos" : pl < 0 ? "text-neg" : "text-mut2"
                      }`}
                    >
                      {formatUnits(pl)}
                    </td>
                  </tr>
                );
              })}
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3 py-6 text-center text-[12px] text-mut">
                    No picks with that grade in the sample set.
                  </td>
                </tr>
              ) : null}
            </tbody>
            <tfoot>
              <tr className="border-t border-line bg-panel2/50">
                <td colSpan={7} className="px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-mut2">
                  {filter === "all" ? "Sample total" : "Filtered total"} · {visible.length} picks
                </td>
                <td className="num px-3 py-2 text-right text-[11px] text-mut">
                  {filteredSummary.unitsRisked.toFixed(2)}u
                </td>
                <td className="num px-3 py-2 text-right text-[11px] text-mut2">
                  {formatPct(filteredSummary.winRate * 100, 1)}
                </td>
                <td
                  className={`num px-3 py-2 text-right text-[11px] ${
                    filteredSummary.unitsNet >= 0 ? "text-pos" : "text-neg"
                  }`}
                >
                  {formatUnits(filteredSummary.unitsNet)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ── Grading methodology ────────────────────────────────────── */}
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-md border border-line bg-panel p-4">
            <Label>Grading rules</Label>
            <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-mut">
              <li>Win — selection covers or wins as graded by the settled result.</li>
              <li>Loss — selection does not cover.</li>
              <li>Push — exact line, stake returned, 0.00u profit, excluded from win rate.</li>
              <li>Prices are the ones quoted when the pick was published, not closing prices.</li>
            </ul>
          </div>
          <div className="rounded-md border border-line bg-panel p-4">
            <Label>Arithmetic</Label>
            <div className="num mt-2 space-y-1 text-[11px] text-mut">
              <div>profit = units × (decimal − 1) on a win</div>
              <div>profit = −units on a loss</div>
              <div>ROI = net units / units risked</div>
              <div>win rate = wins / (wins + losses)</div>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-mut2">
              Recompute it from the table above: the tiles are derived, not stored.
            </p>
          </div>
          <div className="rounded-md border border-line bg-panel p-4">
            <Label>What this is not</Label>
            <p className="mt-2 text-[11px] leading-relaxed text-mut">
              These are seeded demonstration rows. They are not our live record, they have not been
              audited by anyone, and past results never guarantee future ones. When real picks exist,
              they will appear here with their publication timestamps and be gradeable against a stored
              result — nothing else will be shown.
            </p>
          </div>
        </div>

        <p className="mt-4 rounded-sm border border-line bg-panel px-3 py-2 text-[10px] leading-relaxed text-mut2">
          {DISCLAIMER}
        </p>
      </div>
    </Shell>
  );
}
