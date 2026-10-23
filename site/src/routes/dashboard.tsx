import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { loadDashboardData } from "~/lib/providers";
import { BET_TYPES, LAUNCH_LEAGUES, type BetType, type League } from "~/lib/providers/types";
import { Shell } from "~/components/shell";
import { OpportunityCard } from "~/components/opportunity-card";
import { DISCLAIMER, Label, StatTile, formatAgo, useElapsedSeconds } from "~/components/ui";

export const Route = createFileRoute("/dashboard")({
  loader: async () => loadDashboardData(),
  component: Dashboard,
});

type SortKey = "ev" | "confidence" | "recent";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "ev", label: "Expected return" },
  { key: "confidence", label: "Confidence" },
  { key: "recent", label: "Most recent" },
];

function Segmented<T extends string>({
  options,
  value,
  onChange,
  allLabel,
}: {
  options: readonly T[];
  value: T | "ALL";
  onChange: (v: T | "ALL") => void;
  allLabel: string;
}) {
  const items: (T | "ALL")[] = ["ALL", ...options];
  return (
    <div className="flex flex-wrap items-center gap-1">
      {items.map((item) => {
        const active = value === item;
        return (
          <button
            key={item}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(item)}
            className={`num rounded-sm border px-2 py-1 text-[10px] uppercase tracking-[0.08em] transition-colors ${
              active
                ? "border-gold/50 bg-gold/15 text-gold"
                : "border-line bg-panel text-mut hover:border-line2 hover:text-fg"
            }`}
          >
            {item === "ALL" ? allLabel : item}
          </button>
        );
      })}
    </div>
  );
}

function Dashboard() {
  const data = Route.useLoaderData();
  const navigate = useNavigate();
  const elapsed = useElapsedSeconds();
  const [league, setLeague] = useState<League | "ALL">("ALL");
  const [betType, setBetType] = useState<BetType | "ALL">("ALL");
  const [sort, setSort] = useState<SortKey>("ev");

  const opportunities = data.board;

  const filtered = useMemo(() => {
    const rows = opportunities.filter(
      (o) => (league === "ALL" || o.league === league) && (betType === "ALL" || o.betType === betType),
    );
    return rows.sort((a, b) => {
      if (sort === "ev") return b.ev - a.ev;
      if (sort === "confidence") return b.confidence - a.confidence;
      return a.secondsAgo - b.secondsAgo;
    });
  }, [opportunities, league, betType, sort]);

  const stats = useMemo(() => {
    // The board is +EV-only by construction (see `buildBoard`), so the honest
    // question here is not "how many are positive" but "what is the typical edge".
    const avgEv = filtered.length ? filtered.reduce((s, o) => s + o.ev, 0) / filtered.length : 0;
    const best = filtered.reduce<(typeof filtered)[number] | null>(
      (acc, o) => (acc === null || o.ev > acc.ev ? o : acc),
      null,
    );
    const allPositive = filtered.every((o) => o.ev > 0);
    return { avgEv, best, allPositive };
  }, [filtered]);

  const freshest = Math.min(...opportunities.map((o) => o.secondsAgo + elapsed));
  const snapshotLabel = new Date(data.snapshotAt).toISOString().replace("T", " ").slice(0, 16) + " UTC";

  const resetFilters = () => {
    setLeague("ALL");
    setBetType("ALL");
    setSort("ev");
  };

  return (
    <Shell snapshotLabel={snapshotLabel}>
      <div className="mx-auto max-w-[1400px] px-4 pb-16 sm:px-6">
        {/* ── Page header ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line py-6">
          <div>
            <div className="flex items-center gap-2">
              <Label>Deal flow</Label>
              <span className="inline-flex items-center gap-1.5 rounded-sm border border-pos/40 bg-pos/10 px-1.5 py-0.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pos opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-pos" />
                </span>
                <span className="num text-[9px] font-semibold uppercase tracking-[0.14em] text-pos">
                  Updated {formatAgo(freshest)}
                </span>
              </span>
              {stats.allPositive ? (
                <span className="num rounded-sm border border-pos/30 bg-pos/5 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-pos/90">
                  +EV only
                </span>
              ) : null}
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-fg">+EV opportunity board</h1>
            <p className="mt-1.5 max-w-2xl text-[12px] leading-relaxed text-mut">
              Every market where our model's probability differs from the book's implied probability by
              enough to beat the vig. Priced, timed and ranked by expected return — a market with no
              positive expectation never reaches this board. The decision is yours.
            </p>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:grid-cols-4">
            <StatTile
              label="Cards"
              value={filtered.length}
              sub={`of ${opportunities.length} on the board`}
            />
            <StatTile
              label="Avg EV"
              value={`${stats.avgEv >= 0 ? "+" : "−"}${Math.abs(stats.avgEv).toFixed(1)}%`}
              sub="per unit staked"
              tone={stats.avgEv >= 0 ? "pos" : "neg"}
            />
            <StatTile
              label="Best"
              value={stats.best ? `+${stats.best.ev.toFixed(1)}%` : "—"}
              sub={stats.best ? `${stats.best.league} · ${stats.best.betType}` : "no cards"}
              tone="gold"
            />
            <StatTile
              label="No edge"
              value={data.excluded.length}
              sub="kept off the board"
              tone="neg"
            />
          </div>
        </div>

        {/* ── Filters ─────────────────────────────────────────────────── */}
        <div className="sticky top-14 z-30 -mx-4 border-b border-line bg-ink/95 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:px-6">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-[0.12em] text-mut2">League</span>
                <Segmented options={LAUNCH_LEAGUES} value={league} onChange={setLeague} allLabel="All" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-[0.12em] text-mut2">Market</span>
                <Segmented options={BET_TYPES} value={betType} onChange={setBetType} allLabel="All" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.12em] text-mut2">Sort</span>
              <div className="flex items-center gap-1">
                {SORTS.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    aria-pressed={sort === s.key}
                    onClick={() => setSort(s.key)}
                    className={`rounded-sm border px-2 py-1 text-[10px] transition-colors ${
                      sort === s.key
                        ? "border-info/50 bg-info/15 text-info"
                        : "border-line bg-panel text-mut hover:text-fg"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={resetFilters}
                className="num ml-1 text-[10px] uppercase tracking-[0.1em] text-mut2 hover:text-fg"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* ── Cards ───────────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="mt-10 rounded-md border border-line bg-panel p-8 text-center">
            <p className="text-[13px] text-fg">No markets match that filter in the sample set.</p>
            <p className="mt-1 text-[12px] text-mut">
              Try a different league or market type — the demo dataset covers NFL and NBA.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="num mt-4 rounded-sm border border-line2 px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-mut hover:text-fg"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((o) => (
              <OpportunityCard
                key={o.id}
                opportunity={o}
                agoSeconds={o.secondsAgo + elapsed}
                onLoadIntoCalculator={(id) => navigate({ to: "/calculator", search: { opp: id } })}
              />
            ))}
          </div>
        )}

        <div className="mt-8 grid gap-3 rounded-md border border-line bg-panel p-4 text-[11px] leading-relaxed text-mut2 sm:grid-cols-3">
          <p>
            <span className="text-mut">How to read this board.</span> Edge is our probability minus the
            book's implied probability, in percentage points. EV is the expected return per unit staked at
            the quoted price.
          </p>
          <p>
            <span className="text-mut">Prices move.</span> The open → now trace shows how the market has
            repriced since the line opened: it is the book's implied probability then and now, per card.
            A number quoted here is not a number you will get.
          </p>
          <p>
            <span className="text-mut">Sample data.</span> These cards come from the seeded demonstration
            dataset ({data.provider.label}), not a live feed. No card is a recommendation to bet.
            {data.excluded.length > 0
              ? ` ${data.excluded.length} seeded market${data.excluded.length === 1 ? "" : "s"} with no positive expectation ${data.excluded.length === 1 ? "is" : "are"} held off this board.`
              : ""}
          </p>
        </div>
      </div>

      {/* Persistent compliance strip */}
      <div className="sticky bottom-0 z-30 border-t border-line bg-ink2/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 sm:px-6">
          <span className="num rounded-sm border border-gold/40 bg-gold/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-gold">
            Demo data
          </span>
          <p className="text-[10px] leading-relaxed text-mut2">{DISCLAIMER}</p>
        </div>
      </div>
    </Shell>
  );
}
