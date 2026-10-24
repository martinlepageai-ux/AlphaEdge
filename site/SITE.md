# Your site

This is the team's website. It's a [TanStack Start](https://tanstack.com/start)
app (React + Vite + Tailwind), served on **loopback port 3000 by default**. It starts life as a simple
"coming soon" placeholder (the headline reads the business name from `site.json` at
request time), but it's a real full-stack framework — build it out into the real
site and grow it into a dynamic app without changing hosting or starting a second
server.

## Layout

```
src/
  routes/
    __root.tsx     # the HTML shell: <head>, fonts, global layout
    index.tsx      # the landing page ("/")
  styles/app.css   # Tailwind entrypoint + base styles
vite.config.ts     # defaults to 127.0.0.1:3000
```

Add a page by creating a new file under `src/routes/` — e.g. `about.tsx` becomes
`/about`. Files are routes; the router is generated automatically.

## Serving and shipping

How this site is served and how changes go live **depends on the team's setup**:
your system prompt's **Website** section is the authority — follow it, not this
file. The `package.json` scripts (`publish`, `go-live`) exist for setups whose
Website section tells you to run them; don't run them otherwise. Server logs live
in `.run/`.

## Making it dynamic

The site is static today, but adding backend behavior is one file away — no second
process, no extra port, all served on the same port 3000:

- **Server function** — call server-only code (DB, secrets, fetch) directly from a
  component:

  ```tsx
  import { createServerFn } from "@tanstack/react-start";

  const getMessage = createServerFn().handler(async () => {
    return { message: "Hello from the server" };
  });
  ```

- **API route** — add `src/routes/api/<name>.ts` for a REST endpoint.
- **Slow handlers** — `serve.ts` sets Bun's `idleTimeout` to 255s; keep that line.
  With Bun's default (10s) a handler that waits on an AI provider is cut at ~12s and
  the visitor sees an empty 502. Use `createServerFn({ method: "POST" })` for work
  that costs money, so the gateway never re-sends it, and prefer streaming or a
  start-then-poll pair for anything that regularly runs past ~20s.

## Secrets

Read the owner's secrets from `process.env` in server-only code. Never put them in a
`.env` file: `.env` files are not published, so a value that only lives there is
missing on the live site.

## Adding a database

When the site needs to store data (form submissions, content, accounts), use a
database rather than writing to files:

1. Make sure `DATABASE_URL` is set — `test -n "$DATABASE_URL" && echo set` checks
   without printing the value. If it isn't, call `create_database` if you have it;
   otherwise get one the way your instructions describe.
2. Query it from server-only code with the built-in helper — never from the client:

   ```tsx
   import { createServerFn } from "@tanstack/react-start";
   import { sql } from "~/db";

   const getPosts = createServerFn().handler(async () => {
     const rows = await sql()`select id, title, created_at from posts`;
     // Coerce non-primitive columns before returning — timestamps come back as JS
     // Dates, which React will not render:
     return rows.map((r) => ({ ...r, created_at: String(r.created_at) }));
   });
   ```

For local database use, supply `DATABASE_URL` in the server environment. External
hosting needs its own explicitly authorized runtime configuration; this repository
does not automatically synchronize secrets, provision a database, or restart a host.
The demonstration provider does not require a database.

## Local operation and safeguards

Use the checked-in Bun lockfile: `bun install --frozen-lockfile`, then
`bun run dev` or `bun run build && bun run start`. Development, preview and the
built server default to `127.0.0.1:3000`. If that port is occupied, select another
explicitly, for example `PORT=4312 bun run start`. Startup fails without stopping
or replacing the existing listener. `bun run publish` now builds and serves in
the foreground; it does not background a replacement process or claim success
from a different service already answering on the port.

`HOST` accepts an explicit IP address or `localhost`. Binding to a non-loopback
address is an intentional operator choice, not the default. Host checks permit
only localhost/loopback names unless `ALPHAEDGE_ALLOWED_HOSTS` supplies additional
comma-separated exact hostnames, for example `demo.example.com`. Wildcards,
leading-dot suffix matches, URL schemes and ports are rejected. No public
hosting, reverse proxy, TLS or access controls have been configured by these fixes.

Run `bun test`, `bun run build`, then `bun run typecheck`. The build generates
`src/routeTree.gen.ts`, which is ignored by Git. Tests use disposable local servers
and mock deployment executables; they never deploy or change access settings.

## Explicit deployment target

`go-live.sh` requires an existing `VERCEL_PROJECT_ID` (`prj_...`) and explicit
`VERCEL_ORG_ID` (`team_...`). It does not infer either from the folder name,
account's default team, or the first team returned by an API. Preview the plan
without a token, build or network call:

```bash
VERCEL_PROJECT_ID=prj_example VERCEL_ORG_ID=team_example bash go-live.sh --dry-run
```

An actual deployment additionally requires `VERCEL_TOKEN` and an already installed,
reviewed Vercel CLI. It creates a preview deployment for that explicit target;
it never disables SSO/protection or changes public access. Runtime secrets must
already be configured for that project through a separately authorized process.
No actual deployment has been validated here. Vercel documents the target variables
and scope in [its CLI guidance](https://vercel.com/changelog/faster-predictable-project-linking-in-the-vercel-cli).

## Demo and age-gate limits

The seeded odds and results remain fictional demonstration data. The age overlay
is a client-side self-attestation stored in browser localStorage. It is not
identity or age verification, can be bypassed or modified, and does not prevent
access to server-rendered content, assets or endpoints. It does not establish
jurisdictional eligibility or regulatory compliance. Production access controls
would require a separate design and review.

The track-record break-even tile is the stake-weighted mean of each pick's implied
probability: `sum(units / decimalOdds) / sum(units)`. It is not the reciprocal of
the average displayed price, nor a guarantee of flat P&L at that overall win rate
when the odds and stakes vary. Actual P&L depends on which picks win.
