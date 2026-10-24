import { useEffect, useState } from "react";

const STORAGE_KEY = "alphaedge.age-verified.v1";

/**
 * Client-side 21+ self-attestation stored locally, not identity/age verification.
 * It can be bypassed; SSR content remains accessible without this overlay.
 * Renders nothing during SSR/first paint so the server and client markup match.
 */
export function AgeGate() {
  const [status, setStatus] = useState<"checking" | "locked" | "open" | "declined">("checking");

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      stored = null;
    }
    setStatus(stored === "yes" ? "open" : "locked");
  }, []);

  useEffect(() => {
    if (status !== "locked") return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [status]);

  if (status === "checking" || status === "open") return null;

  const accept = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "yes");
    } catch {
      /* storage unavailable — gate still dismisses for this session */
    }
    setStatus("open");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/97 px-4 backdrop-blur-sm"
    >
      <div className="grid-lines w-full max-w-lg rounded-lg border border-line bg-panel p-6 shadow-2xl sm:p-8">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-[1px] bg-gold" aria-hidden />
          <span className="num text-[11px] font-medium tracking-[0.18em] text-gold">ALPHAEDGE</span>
          <span className="ml-auto rounded-sm border border-line2 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-mut2">
            Age verification
          </span>
        </div>

        <h1 id="age-gate-title" className="mt-6 text-2xl font-semibold tracking-tight text-fg">
          You must be 21 or older.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-mut">
          AlphaEdge Sports Intelligence is an analytics and information product for adults aged 21 and
          over. We do not accept wagers, hold funds, or take a position on any game. Everything we
          publish is informational only and is not financial advice.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-mut">
          Gambling involves risk. Only stake what you can afford to lose. If gambling is affecting your
          life, help is available at{" "}
          <a
            href="https://www.ncpgambling.org/help-treatment/national-helpline-1-800-522-4700/"
            target="_blank"
            rel="noreferrer noopener"
            className="text-info underline decoration-info/40 underline-offset-2 hover:decoration-info"
          >
            1-800-522-4700
          </a>
          .
        </p>

        {status === "declined" ? (
          <div className="mt-6 rounded-md border border-neg/40 bg-neg/10 p-4">
            <p className="text-sm text-fg">
              Access is limited to adults 21 and over. You are welcome to close this tab.
            </p>
          </div>
        ) : (
          <div className="mt-7 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={accept}
              className="num flex-1 rounded-sm border border-gold/50 bg-gold/15 px-4 py-2.5 text-xs font-medium uppercase tracking-[0.12em] text-gold transition-colors hover:bg-gold/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
            >
              I am 21 or older — continue
            </button>
            <button
              type="button"
              onClick={() => setStatus("declined")}
              className="flex-1 rounded-sm border border-line2 px-4 py-2.5 text-xs font-medium uppercase tracking-[0.12em] text-mut transition-colors hover:border-mut2 hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-line2"
            >
              I am under 21
            </button>
          </div>
        )}

        <p className="mt-5 border-t border-line pt-4 text-[11px] leading-relaxed text-mut2">
          By continuing you confirm you are of legal age in your jurisdiction and that you understand
          this product supplies analysis, not betting services.
        </p>
      </div>
    </div>
  );
}
