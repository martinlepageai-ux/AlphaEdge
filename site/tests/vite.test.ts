import { expect, test } from "bun:test";
import { resolveConfig } from "vite";
import { readServerConfig } from "../server/config";

test("Vite development and preview apply the shared host restrictions and strict port", async () => {
  const config = await resolveConfig({ configFile: new URL("../vite.config.ts", import.meta.url).pathname }, "serve");
  const expected = readServerConfig(process.env);
  for (const server of [config.server, config.preview]) {
    expect(server.host).toBe(expected.host);
    expect(server.port).toBe(expected.port);
    if (!Array.isArray(server.allowedHosts)) throw new Error("Vite must use an explicit allowlist");
    expect(new Set(server.allowedHosts)).toEqual(new Set(expected.allowedHosts));
    expect(server.strictPort).toBe(true);
  }
  expect(config.server.hmr).not.toEqual({ clientPort: 443 });
});
