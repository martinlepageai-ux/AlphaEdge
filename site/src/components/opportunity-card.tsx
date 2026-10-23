import { Link } from "@tanstack/react-router";
import type { EnrichedOpportunity } from "~/lib/providers";
import { formatAmerican, formatDecimal, formatProbability } from "~/lib/odds";
import { Chip, InformationalOnly, Label, Sparkline, formatAgo } from "./ui";

function ConfidenceBar({ value }: { value: number }) {
  const tone = value >= 70 ? "bg-pos" : value >= 55 ? "bg-info" : "bg-gold";
  return (
    <div className="flex items-center gap-1.5" title={`Model confidence ${value}/100`}>
      <div className="h-1 w-10 overflow-hidden rounded-full bg-line2">
        <div className={`h-full ${tone}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
      <span className="num text-[11px] text-mut">{value}</span>
    </div>
  );
}

export function OpportunityCard({
  opportunity: o,
  agoSeconds,
  onLoadIntoCalculator,
}: {
  opportunity: EnrichedOpportunity;
  agoSeconds: number;
  onLoadIntoCalculator?: (id: string) => void;
}) {
  const positive = o.ev > 0;
  const moved = o.movementPoints >= 0;

  return (
    <article className="group flex flex-col rounded-md border border-line bg-panel transition-colors hover:border-line2">
      {/* Top rail: market identity */}
      <div className="flex items-center gap-1.5 border-b border-line/70 px-3 py-2">
        <Chip tone="info">{o.league}</Chip>
        <Chip>{o.betType}</Chip>
        <span className="num ml-auto text-[10px] text-mut2">{o.book}</span>
      </div>

      <div className="px-3 pt-2.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[12px] font-medium leading-snug text-fg">{o.matchup}</h3>
          <span className="num shrink-0 text-[10px] text-mut2">{o.startLabel}</span>
        </div>
        <div className="mt-1.5 flex items-baseline justify-between gap-2">
          <span className="num text-[15px] font-semibold text-fg">{o.selection}</span>
          <span className="num text-[12px] text-mut">
            {formatAmerican(o.bookOdds)}
            <span className="text-mut2"> / {formatDecimal(o.decimalOdds)}</span>
          </span>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="mt-2.5 grid grid-cols-3 divide-x divide-line/70 border-y border-line/70">
        <div className="px-3 py-2">
          <Label>Model</Label>
          <div className="num mt-0.5 text-[13px] text-fg">{formatProbability(o.modelProbability)}</div>
        </div>
        <div className="px-3 py-2">
          <Label>Implied</Label>
          <div className="num mt-0.5 text-[13px] text-mut">{formatProbability(o.impliedProbability)}</div>
        </div>
        <div className="px-3 py-2">
          <Label>Edge</Label>
          <div className={`num mt-0.5 text-[13px] ${positive ? "text-pos" : "text-neg"}`}>
            {o.edgePoints >= 0 ? "+" : "−"}
            {Math.abs(o.edgePoints).toFixed(1)} pts
          </div>
        </div>
      </div>

      {/* EV + line movement */}
      <div className="flex items-end justify-between gap-2 px-3 py-2.5">
        <div>
          <Label>Expected value</Label>
          <div
            className={`num mt-0.5 text-xl font-semibold leading-none ${positive ? "text-pos" : "text-neg"}`}
          >
            {positive ? "+" : "−"}
            {Math.abs(o.ev).toFixed(1)}%
          </div>
          <div className="mt-1 text-[10px] text-mut2">per unit staked</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Sparkline points={o.lineHistory} up={moved} />
          <div className="num text-[9px] text-mut2">
            open {formatProbability(o.openImplied)} → now {formatProbability(o.impliedProbability)}
          </div>
        </div>
      </div>

      {/* Footer rail */}
      <div className="mt-auto flex items-center gap-2 border-t border-line/70 px-3 py-2">
        <ConfidenceBar value={o.confidence} />
        <span className="text-[10px] text-mut2">conf.</span>
        <span className="num ml-auto text-[10px] text-mut2">{formatAgo(agoSeconds)}</span>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-line/70 px-3 py-1.5">
        <InformationalOnly />
        {onLoadIntoCalculator ? (
          <button
            type="button"
            onClick={() => onLoadIntoCalculator(o.id)}
            className="num text-[10px] uppercase tracking-[0.1em] text-info/80 transition-colors hover:text-info"
          >
            Size in calculator →
          </button>
        ) : (
          <Link
            to="/calculator"
            className="num text-[10px] uppercase tracking-[0.1em] text-info/80 transition-colors hover:text-info"
          >
            Size in calculator →
          </Link>
        )}
      </div>
    </article>
  );
}
