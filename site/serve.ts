// Serve the built app without changing any other process. Build before starting.
import { realpath } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { readServerConfig } from "./server/config.ts";

try {
  const { host, port, allowedHosts } = readServerConfig(process.env);
  const clientDir = await realpath(resolve(import.meta.dir, "dist/client"));
  const entry = pathToFileURL(resolve(import.meta.dir, "dist/server/server.js")).href;
  const { default: handler } = await import(entry);
  if (typeof handler?.fetch !== "function") throw new Error("Built server must export a fetch handler.");

  Bun.serve({
    port,
    hostname: host,
    idleTimeout: 255,
    async fetch(req) {
      const url = new URL(req.url);
      if (!allowedHosts.includes(url.hostname.toLowerCase())) {
        return new Response("Host not allowed", { status: 403 });
      }
      let pathname: string;
      try { pathname = decodeURIComponent(url.pathname); }
      catch { return new Response("Invalid path", { status: 400 }); }
      if (pathname !== "/") {
        const filePath = await realpath(resolve(clientDir, `.${pathname}`)).catch(() => null);
        if (filePath?.startsWith(clientDir + sep)) {
          const file = Bun.file(filePath);
          if (await file.exists()) return new Response(file);
        }
      }
      return handler.fetch(req);
    },
  });
  const displayHost = host.includes(":") ? `[${host}]` : host;
  console.log(`AlphaEdge serving on http://${displayHost}:${port}`);
} catch (error) {
  const code = (error as NodeJS.ErrnoException).code;
  if (code === "EADDRINUSE") {
    console.error("AlphaEdge could not start: PORT is already in use. Leave that process running and choose another PORT.");
  } else {
    console.error("AlphaEdge could not start:", error instanceof Error ? error.message : String(error));
  }
  process.exitCode = 1;
}
