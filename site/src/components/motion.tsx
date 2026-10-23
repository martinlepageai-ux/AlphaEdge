import { useEffect, useRef, useState } from "react";

/**
 * Single source of truth for "is motion allowed".
 * Starts false so SSR markup and first paint are always the static, readable
 * version; the effect upgrades the page only when the user has not asked for
 * reduced motion.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return reduced;
}

/** True once the element has entered the viewport (or immediately, no motion). */
export function useInView<T extends HTMLElement>(rootMargin = "0px 0px -8% 0px") {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) {
      setInView(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced, rootMargin]);

  return { ref, inView };
}

/**
 * Staggered entrance. One 12px lift, once, when the block is first seen.
 * Under reduced motion it renders visible and static — no transform at all.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article" | "header" | "footer";
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    document.documentElement.dataset.motion = "on";
    return () => {
      delete document.documentElement.dataset.motion;
    };
  }, [reduced]);

  const props = {
    ref,
    className: `reveal ${inView ? "is-in" : ""} ${className}`,
    style: { ["--reveal-delay" as string]: `${delay}ms` } as React.CSSProperties,
  };
  return <Tag {...props}>{children}</Tag>;
}

/**
 * Counts up to `value` once, on first view. Renders the final value on the
 * server and at first paint, so the number is never missing and never wrong.
 */
export function CountUp({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 900,
  className = "",
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLSpanElement>();
  const reduced = usePrefersReducedMotion();
  const [shown, setShown] = useState(value);

  useEffect(() => {
    if (reduced || !inView) {
      setShown(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(from + (value - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setShown(value);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduced, value, duration]);

  const text = shown.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span ref={ref} className={className} aria-label={`${prefix}${value.toFixed(decimals)}${suffix}`}>
      <span aria-hidden>
        {prefix}
        {text}
        {suffix}
      </span>
    </span>
  );
}
