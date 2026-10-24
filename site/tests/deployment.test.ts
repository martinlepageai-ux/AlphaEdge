import { afterAll, expect, test } from "bun:test";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const fixtures: string[] = [];
afterAll(async () => { for (const dir of fixtures) await rm(dir, { recursive: true, force: true }); });
async function run(args: string[], overrides: Record<string, string | undefined> = {}) {
  const dir = await mkdtemp(join(tmpdir(), "alphaedge-deploy-test-")); fixtures.push(dir);
  await mkdir(join(dir, "bin"));
  await cp(new URL("../go-live.sh", import.meta.url), join(dir, "go-live.sh"));
  await writeFile(join(dir, "build-vercel.sh"), '#!/bin/sh\nprintf "build\\n" >> "$AUDIT_LOG"\n');
  await writeFile(join(dir, "bin/vercel"), '#!/bin/sh\nprintf "vercel\\nproject=%s\\nteam=%s\\n" "$VERCEL_PROJECT_ID" "$VERCEL_ORG_ID" >> "$AUDIT_LOG"\nprintf "%s\\n" "$@" >> "$AUDIT_LOG"\n', { mode: 0o755 });
  for (const tool of ["curl", "bun", "bunx", "sudo", "kill"]) {
    await writeFile(join(dir, "bin", tool), '#!/bin/sh\nprintf "FORBIDDEN\\n" >> "$AUDIT_LOG"\nexit 99\n', { mode: 0o755 });
  }
  const child = Bun.spawn(["/bin/bash", "go-live.sh", ...args], {
    cwd: dir,
    env: { PATH: `${dir}/bin:/usr/bin:/bin`, AUDIT_LOG: `${dir}/audit`, ...overrides },
    stdout: "pipe", stderr: "pipe",
  });
  const [code, stdout, stderr] = await Promise.all([child.exited, new Response(child.stdout).text(), new Response(child.stderr).text()]);
  const audit = await readFile(join(dir, "audit"), "utf8").catch(() => "");
  return { code, stdout, stderr, audit };
}
const target = { VERCEL_PROJECT_ID: "prj_TestFixture", VERCEL_ORG_ID: "team_TestFixture" };

test("missing or malformed explicit targets fail before build or CLI execution", async () => {
  for (const env of [{}, { VERCEL_PROJECT_ID: "prj_TestFixture" }, { ...target, VERCEL_ORG_ID: "personal" }, { ...target, VERCEL_PROJECT_ID: "directory-name" }]) {
    const result = await run([], env);
    expect(result.code).not.toBe(0); expect(result.audit).toBe("");
  }
});
test("dry run needs no token and performs no build, discovery, deployment or access changes", async () => {
  const result = await run(["--dry-run"], target);
  expect(result.code).toBe(0); expect(result.audit).toBe("");
  expect(result.stdout).toContain("prj_TestFixture"); expect(result.stdout).toContain("team_TestFixture");
  expect(result.stdout).toContain("Access protection stays unchanged");
});
test("actual invocation requires credentials before building", async () => {
  const result = await run([], target);
  expect(result.code).not.toBe(0); expect(result.stderr).toContain("VERCEL_TOKEN"); expect(result.audit).toBe("");
});
test("mocked deployment pins project and team without public/production/access calls", async () => {
  const result = await run([], { ...target, VERCEL_TOKEN: "test-fixture-only" });
  expect(result.code).toBe(0);
  expect(result.audit.split("\n").slice(0,8)).toEqual(["build", "vercel", "project=prj_TestFixture", "team=team_TestFixture", "deploy", "--prebuilt", "--yes", "--scope"]);
  expect(result.audit).toContain("\nteam_TestFixture\n");
  for (const forbidden of ["FORBIDDEN", "--prod", "--public", "ssoProtection", "--name", "link"]) expect(result.audit).not.toContain(forbidden);
});
test("unknown flags cannot introduce production deployment", async () => {
  const result = await run(["--prod"], target);
  expect(result.code).toBe(2); expect(result.audit).toBe("");
});
