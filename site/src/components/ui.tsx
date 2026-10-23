import { useEffect, useMemo, useRef, useState } from "react";

export const DISCLAIMER =
  "For informational purposes only. Not financial advice. Gambling involves risk. Please gamble responsibly. Past performance is not indicative of future results.";

export function Panel({
  children,
  className = "",
  as: Tag = "section",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
}) {
  return (
    <Tag
      className={`rounded-md border border-line bg-panel/80 ${className}`}
    >
      {children}
    </Tag>
  );
}

export function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`text-[10px] font-medium uppercase tracking-[0.14em] text-mut2 ${className}`}
    >
      {children}
    </span>
  );
}

export function Chip({
  children,
  tone = "neutral",
  className = "",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "pos" | "neg" | "gold" | "info";
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral: "border-line2 text-mut bg-panel2",
    pos: "border-pos/40 text-pos bg-pos/10",
    neg: "border-neg/40 text-neg bg-neg/10",
    gold: "border-gold/40 text-gold bg-gold/10",
    info: "border-info/40 text-info bg-info/10",
  };
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * Line-movement sparkline: open → current implied probability.
 * Deliberately thin and flat — a data trace, not a casino chart.
 */
export function Sparkline({
  points,
  up,
  width = 132,
  height = 34,
}: {
  points: number[];
  up: boolean;
  width?: number;
  height?: number;
}) {
  const { path, area, last } = useMemo(() => {
    const safe = points.length > 1 ? points : [points[0] ?? 50, points[0] ?? 50];
    const min = Math.min(...safe);
    const max = Math.max(...safe);
    const pad = Math.max((max - min) * 0.35, 0.25);
    const lo = min - pad;
    const hi = max + pad;
    const x = (i: number) => (i / (safe.length - 1)) * (width - 2) + 1;
    const y = (v: number) => height - 2 - ((v - lo) / (hi - lo)) * (height - 4);
    const d = safe.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(" ");
    const a = `${d} L${width - 1},${height} L1,${height} Z`;
    return { path: d, area: a, last: { x: x(safe.length - 1), y: y(safe[safe.length - 1]) } };
  }, [points, width, height]);

  const stroke = up ? "#26d98a" : "#ff5f6d";
  const fill = up ? "#26d98a18" : "#ff5f6d18";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Line movement, ${points[0]?.toFixed(1)}% to ${points[points.length - 1]?.toFixed(1)}% implied probability`}
      className="overflow-visible"
    >
      <path d={area} fill={fill} />
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.4} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last.x} cy={last.y} r={1.9} fill={stroke} />
    </svg>
  );
}

/** Larger sparkline used for the track-record equity curve. */
export function EquityCurve({ values }: { values: number[] }) {
  const w = 640;
  const h = 120;
  const { line, area, zeroY } = useMemo(() => {
    const min = Math.min(0, ...values);
    const max = Math.max(0, ...values);
    const span = max - min || 1;
    const x = (i: number) => (i / Math.max(values.length - 1, 1)) * w;
    const y = (v: number) => h - ((v - min) / span) * h;
    const d = values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(" ");
    return {
      line: d,
      area: `${d} L${w},${h} L0,${h} Z`,
      zeroY: y(0),
    };
  }, [values]);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-24 w-full" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#26d98a" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#26d98a" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="0" y1={zeroY} x2={w} y2={zeroY} stroke="#26333f" strokeWidth="1" strokeDasharray="3 3" />
      <path d={area} fill="url(#eq)" />
      <path d={line} fill="none" stroke="#26d98a" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function StatTile({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: "neutral" | "pos" | "neg" | "gold";
}) {
  const valueTone =
    tone === "pos" ? "text-pos" : tone === "neg" ? "text-neg" : tone === "gold" ? "text-gold" : "text-fg";
  return (
    <div className="rounded-md border border-line bg-panel px-3 py-2.5">
      <Label>{label}</Label>
      <div className={`num mt-1 text-lg font-medium leading-none ${valueTone}`}>{value}</div>
      {sub ? <div className="mt-1.5 text-[11px] text-mut2">{sub}</div> : null}
    </div>
  );
}

/** Ticks once per second; returns seconds elapsed since mount. */
export function useElapsedSeconds() {
  const [elapsed, setElapsed] = useState(0);
  const start = useRef<number | null>(null);
  useEffect(() => {
    start.current = Date.now();
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - (start.current ?? Date.now())) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);
  return elapsed;
}

export function formatAgo(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s ago`;
  const hr = Math.floor(m / 60);
  return `${hr}h ${m % 60}m ago`;
}

/** Small inline disclaimer for prediction-bearing surfaces. */
export function InformationalOnly({ className = "" }: { className?: string }) {
  return (
    <span className={`text-[10px] uppercase tracking-[0.1em] text-mut2 ${className}`}>
      Informational only · not a bet offer
    </span>
  );
}
