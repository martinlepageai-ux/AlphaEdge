import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { DISCLAIMER } from "./ui";
import { AgeGate } from "./age-gate";

const NAV = [
  { to: "/", label: "Overview", note: "What this is" },
  { to: "/dashboard", label: "Deal Flow", note: "The board" },
  { to: "/calculator", label: "EV Calculator", note: "Price a bet" },
  { to: "/track-record", label: "Track Record", note: "Graded picks" },
] as const;

const TERMINAL_ROUTES = ["/dashboard", "/calculator", "/track-record"];

function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      className="group flex items-center gap-2.5 rounded-sm py-1"
      aria-label="AlphaEdge Sports Intelligence — home"
    >
      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center border border-line2 bg-panel2">
        <span className="numeral text-[13px] leading-none text-fg">AE</span>
        <span
          className="absolute -bottom-px left-0 h-px w-full bg-acc"
          aria-hidden
        />
      </span>
      <span className="flex flex-col leading-none">
        <span className="headline text-[15px] tracking-[-0.01em] text-fg">
          AlphaEdge
        </span>
        {compact ? null : (
          <span className="num mt-1 hidden text-[8.5px] uppercase tracking-[0.24em] text-mut2 sm:block">
            Sports Intelligence
          </span>
        )}
      </span>
    </Link>
  );
}

export function Header({ snapshotLabel }: { snapshotLabel?: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  // Esc closes, focus returns to the trigger. Tab is trapped inside the panel.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!nodes || nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>("a[href], button")?.focus();
    }, 0);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(t);
    };
  }, [open, close]);

  const isTerminal = TERMINAL_ROUTES.includes(pathname);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:inline-flex focus:items-center focus:border focus:border-acc focus:bg-ink focus:px-4 focus:py-3 focus:text-[12px] focus:font-semibold focus:uppercase focus:tracking-[0.12em] focus:text-acc"
      >
        Skip to content
      </a>

      <header
        className="sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur-md supports-[backdrop-filter]:bg-ink/75"
        data-surface={isTerminal ? "terminal" : "marketing"}
      >
        {/* Terminal routes get a hairline accent rail: one glance tells you which
            side of the product you are on. */}
        <div
          className={`h-px w-full ${isTerminal ? "bg-acc/70" : "bg-transparent"}`}
          aria-hidden
        />
        <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-5 px-4 sm:px-6 lg:px-8">
          <Wordmark />

          {isTerminal ? (
            <span className="num hidden items-center gap-1.5 border border-line2 bg-panel px-2 py-1 text-[9px] uppercase tracking-[0.16em] text-mut sm:inline-flex">
              <span className="h-1 w-1 bg-acc" aria-hidden />
              Member terminal
            </span>
          ) : (
            <span className="num hidden text-[9px] uppercase tracking-[0.16em] text-mut2 sm:inline">
              NFL · NBA
            </span>
          )}

          <nav aria-label="Primary" className="ml-auto hidden items-stretch self-stretch md:flex">
            {NAV.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={active ? "page" : undefined}
                  className={`group relative flex items-center px-3 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors duration-[var(--dur-fast)] ${
                    active ? "text-fg" : "text-mut hover:text-fg"
                  }`}
                >
                  {item.label}
                  <span
                    aria-hidden
                    className={`absolute inset-x-2 bottom-0 h-[2px] origin-left transition-transform duration-[var(--dur-normal)] ease-[var(--ease-spring-out)] ${
                      active
                        ? "scale-x-100 bg-acc"
                        : "scale-x-0 bg-line2 group-hover:scale-x-100"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <span
              className="num hidden items-center gap-1.5 border border-gold/40 bg-gold/[0.07] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-gold lg:inline-flex"
              title="Every figure on this site comes from a seeded sample dataset — not live odds, not real results."
            >
              <span className="h-1 w-1 bg-gold" aria-hidden />
              Demonstration data
            </span>
            {snapshotLabel ? (
              <span className="num hidden text-[10px] text-mut2 xl:inline">{snapshotLabel}</span>
            ) : null}

            <Link
              to="/dashboard"
              className="num hidden min-h-9 items-center border border-acc/50 bg-acc/10 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-acc transition-colors duration-[var(--dur-fast)] hover:bg-acc/20 sm:inline-flex"
            >
              Enter the terminal
            </Link>

            <button
              ref={triggerRef}
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className="flex h-11 w-11 items-center justify-center border border-line2 bg-panel text-fg md:hidden"
            >
              <span className="relative block h-3 w-4" aria-hidden>
                <span
                  className={`absolute left-0 h-[1.5px] w-4 bg-current transition-transform duration-[var(--dur-fast)] ${
                    open ? "top-[5px] rotate-45" : "top-0"
                  }`}
                />
                <span
                  className={`absolute left-0 top-[5px] h-[1.5px] w-4 bg-current transition-opacity duration-[var(--dur-fast)] ${
                    open ? "opacity-0" : "opacity-100"
                  }`}
                />
                <span
                  className={`absolute left-0 h-[1.5px] w-4 bg-current transition-transform duration-[var(--dur-fast)] ${
                    open ? "top-[5px] -rotate-45" : "top-[10px]"
                  }`}
                />
              </span>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open ? (
          <div className="md:hidden">
            <button
              type="button"
              tabIndex={-1}
              aria-hidden
              onClick={close}
              className="fixed inset-0 top-[57px] z-30 bg-ink2/70 backdrop-blur-[2px]"
            />
            <div
              id="mobile-menu"
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Site menu"
              className="relative z-40 border-t border-line bg-ink"
            >
              <nav aria-label="Primary mobile" className="mx-auto max-w-[1440px] px-4 py-2">
                <ul>
                  {NAV.map((item) => {
                    const active = pathname === item.to;
                    return (
                      <li key={item.to} className="border-b border-line/70 last:border-0">
                        <Link
                          to={item.to}
                          onClick={() => setOpen(false)}
                          aria-current={active ? "page" : undefined}
                          className="flex min-h-[56px] items-center justify-between gap-3 py-2"
                        >
                          <span className="flex flex-col">
                            <span
                              className={`text-[15px] font-medium ${
                                active ? "text-acc" : "text-fg"
                              }`}
                            >
                              {item.label}
                            </span>
                            <span className="text-[11px] text-mut2">{item.note}</span>
                          </span>
                          <span
                            className={`num text-[10px] uppercase tracking-[0.14em] ${
                              active ? "text-acc" : "text-mut2"
                            }`}
                            aria-hidden
                          >
                            {active ? "● here" : "→"}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                <div className="flex items-center justify-between gap-3 py-3">
                  <span className="num inline-flex items-center gap-1.5 border border-gold/40 bg-gold/[0.07] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-gold">
                    <span className="h-1 w-1 bg-gold" aria-hidden />
                    Demonstration data
                  </span>
                  <button
                    type="button"
                    onClick={close}
                    className="num min-h-11 border border-line2 px-3 text-[10px] uppercase tracking-[0.12em] text-mut"
                  >
                    Close
                  </button>
                </div>
              </nav>
            </div>
          </div>
        ) : null}
      </header>
    </>
  );
}

export function DemoBanner({ snapshotLabel }: { snapshotLabel: string }) {
  return (
    <div className="border-b border-gold/20 bg-gold/[0.05]">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-3 gap-y-1 px-4 py-1.5 sm:px-6 lg:px-8">
        <span className="num text-[9px] font-semibold uppercase tracking-[0.18em] text-gold">
          Demonstration data
        </span>
        <span className="text-[11px] leading-snug text-mut">
          Sample dataset seeded for product review — not live odds, not real picks, not real results.
        </span>
        <span className="num ml-auto hidden text-[10px] text-mut2 sm:inline">
          Snapshot {snapshotLabel}
        </span>
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="mt-0 border-t border-line bg-ink2">
      <div className="mx-auto max-w-[1440px] px-4 pt-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Wordmark />
            <p className="mt-5 max-w-md text-[13px] leading-relaxed text-mut">
              AlphaEdge Sports Intelligence sells analysis and probability estimates. We are not a
              sportsbook, we do not accept deposits or wagers, and we never hold customer funds. You
              place your own bets with licensed operators in your jurisdiction.
            </p>
            <p className="mt-5 max-w-md border border-line bg-panel px-4 py-3 text-[11px] leading-relaxed text-mut">
              <span className="num text-[10px] uppercase tracking-[0.16em] text-fg">
                Responsible gambling.
              </span>{" "}
              Gambling involves risk and is not a way to solve financial problems. If you or someone you
              know needs help, call the National Problem Gambling Helpline at{" "}
              <span className="num text-fg">1-800-522-4700</span> (US), 24 hours a day. Must be 21+.
            </p>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 md:contents">
            <div>
              <h2 className="num text-[10px] font-semibold uppercase tracking-[0.18em] text-mut2">
                Product
              </h2>
              <ul className="mt-4 space-y-3 text-[13px]">
                {NAV.slice(1).map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className="text-mut transition-colors duration-[var(--dur-fast)] hover:text-fg"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    to="/"
                    hash="pricing"
                    className="text-mut transition-colors duration-[var(--dur-fast)] hover:text-fg"
                  >
                    Membership
                  </Link>
                </li>
                <li>
                  <Link
                    to="/"
                    hash="guardrails"
                    className="text-mut transition-colors duration-[var(--dur-fast)] hover:text-fg"
                  >
                    Guardrails
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="num text-[10px] font-semibold uppercase tracking-[0.18em] text-mut2">
                Disclosure
              </h2>
              <p className="mt-4 text-[11px] leading-relaxed text-mut2">
                Affiliate disclosure: AlphaEdge may earn a commission when a subscriber opens an account
                with a partner sportsbook. Commercial relationships never influence model output, and
                every opportunity card shows the book whose price was quoted. Full disclosure text will
                appear here at launch.
              </p>
              <p className="mt-3 text-[11px] leading-relaxed text-mut2">
                No third-party audit has been performed on the figures shown in this demonstration
                build.
              </p>
            </div>
          </nav>
        </div>

        <div className="mt-12 select-none overflow-hidden" aria-hidden>
          <div className="headline translate-y-[0.12em] text-[clamp(2.5rem,11vw,9rem)] leading-[0.8] text-fg/[0.06]">
            AlphaEdge
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-line">
        <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8">
          <p className="max-w-4xl text-[11px] leading-relaxed text-mut2">{DISCLAIMER}</p>
          <p className="num mt-2 text-[10px] leading-relaxed text-mut2">
            © 2026 AlphaEdge Sports Intelligence · 21+ only · Information product, not a sportsbook ·
            Demonstration build — sample data
          </p>
        </div>
      </div>
    </footer>
  );
}

/** Page chrome: skip link, header, demo banner, age gate, footer. */
export function Shell({
  children,
  snapshotLabel,
}: {
  children: React.ReactNode;
  snapshotLabel?: string;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-ink">
      <AgeGate />
      <Header snapshotLabel={snapshotLabel} />
      <DemoBanner snapshotLabel={snapshotLabel ?? "2026-10-23 18:42 UTC"} />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <Footer />
    </div>
  );
}
