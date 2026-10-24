import { afterAll, describe, expect, test } from "bun:test";
import { cp, mkdir, mkdtemp, rm, writeFile, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readServerConfig } from "../server/config";

const fixture = await mkdtemp(join(tmpdir(), "alphaedge-server-test-"));
await mkdir(join(fixture, "dist/client"), { recursive: true });
await mkdir(join(fixture, "dist/server"), { recursive: true });
await cp(new URL("../serve.ts", import.meta.url), join(fixture, "serve.ts"));
await cp(new URL("../server", import.meta.url), join(fixture, "server"), { recursive: true });
await writeFile(join(fixture, "dist/server/server.js"), 'export default {fetch: () => new Response("SSR fixture")};');
await writeFile(join(fixture, "dist/client/test.css"), "body{color:red}");
await writeFile(join(fixture, "private.txt"), "private fixture");
await symlink(join(fixture, "private.txt"), join(fixture, "dist/client/escape.txt"));
afterAll(() => rm(fixture, { recursive: true, force: true }));

function launch(port: number) {
  return Bun.spawn([process.execPath, "serve.ts"], {
    cwd: fixture,
    env: { PATH: process.env.PATH, PORT: String(port), HOST: "127.0.0.1" },
    stdout: "pipe", stderr: "pipe",
  });
}

describe("local server safeguards", () => {
  test("defaults to loopback and an exact host allowlist", () => {
    expect(readServerConfig({})).toEqual({host:"127.0.0.1",port:3000,allowedHosts:["localhost","127.0.0.1","[::1]"]});
    expect(readServerConfig({ PORT: "4312", ALPHAEDGE_ALLOWED_HOSTS: "demo.example.com" }).allowedHosts).toContain("demo.example.com");
  });
  test("rejects invalid ports and broad host permissions", () => {
    for (const PORT of ["0", "65536", "3.2", "abc", "", "-1"]) expect(() => readServerConfig({ PORT })).toThrow();
    for (const ALPHAEDGE_ALLOWED_HOSTS of ["*", ".example.com", "https://example.com", "example.com:3000", "foo..com"]) expect(() => readServerConfig({ ALPHAEDGE_ALLOWED_HOSTS })).toThrow();
  });
  test("occupied port fails quickly and leaves its listener untouched", async () => {
    const owner = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch: () => new Response("original owner") });
    const child = launch(owner.port!);
    const timer = setTimeout(() => child.kill(), 4000);
    try {
      expect(await child.exited).toBe(1);
      const error = await new Response(child.stderr).text();
      expect(error).toContain("already in use");
      expect(await fetch(owner.url).then(r => r.text())).toBe("original owner");
    } finally { clearTimeout(timer); child.kill(); owner.stop(true); }
  });
  test("explicit free port serves SSR/assets and rejects unlisted hosts", async () => {
    const reservation = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch: () => new Response() });
    const port = reservation.port!;
    reservation.stop(true);
    const child = launch(port);
    try {
      let ready = false;
      for (let i = 0; i < 60; i++) {
        try { if ((await fetch(`http://127.0.0.1:${port}`)).ok) { ready = true; break; } } catch { /* wait for startup */ }
        await Bun.sleep(25);
      }
      expect(ready).toBe(true);
      expect(await fetch(`http://127.0.0.1:${port}`).then(r => r.text())).toBe("SSR fixture");
      expect(await fetch(`http://127.0.0.1:${port}/test.css`).then(r => r.text())).toContain("color:red");
      expect((await fetch(`http://127.0.0.1:${port}`, { headers: { Host: "attacker.example" } })).status).toBe(403);
      expect(await fetch(`http://127.0.0.1:${port}/escape.txt`).then(r => r.text())).not.toContain("private fixture");
    } finally { child.kill(); await child.exited; }
  });
});
