import type { ReactNode } from "react";
import { HeadContent, Outlet, Scripts, createRootRoute, Link } from "@tanstack/react-router";
import appCss from "../styles/app.css?url";
// Self-hosted variable fonts — bundled at build time, zero runtime font requests.
import "@fontsource-variable/archivo/standard.css";
import "@fontsource-variable/inter/index.css";
import "@fontsource-variable/jetbrains-mono/index.css";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      {
        title: "AlphaEdge Sports Intelligence — probability, price, edge",
      },
      {
        name: "description",
        content:
          "Model-derived win probabilities, +EV opportunity cards and bankroll sizing for analytical bettors. We don't take bets — we sell the edge. 21+ information product.",
      },
      { name: "theme-color", content: "#070a0d" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
    ],
  }),
  notFoundComponent: NotFound,
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-dvh bg-ink">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="num text-[11px] uppercase tracking-[0.2em] text-mut2">404</span>
      <h1 className="text-xl font-semibold text-fg">That screen isn't part of the terminal.</h1>
      <Link
        to="/"
        className="num border border-line2 px-4 py-3 text-[11px] uppercase tracking-[0.12em] text-mut hover:text-fg"
      >
        Back to overview
      </Link>
    </div>
  );
}
