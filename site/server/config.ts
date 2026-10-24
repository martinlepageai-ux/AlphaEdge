import { isIP } from "node:net";

export type ServerEnvironment = Record<string, string | undefined>;

/** Exact hostnames only: no URLs, ports, wildcards or suffix-wide permissions. */
export function readServerConfig(env: ServerEnvironment, defaultPort = 3000) {
  const host = env.HOST ?? "127.0.0.1";
  if (host !== "localhost" && !isIP(host)) {
    throw new Error("HOST must be localhost or an explicit IP address.");
  }
  const rawPort = env.PORT ?? String(defaultPort);
  const port = Number(rawPort);
  if (!/^\d+$/.test(rawPort) || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }
  const extraHosts = (env.ALPHAEDGE_ALLOWED_HOSTS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  for (const name of extraHosts) {
    if (!/^(?=.{1,253}$)[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(name) ||
        name.split(".").some((label) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) {
      throw new Error("ALPHAEDGE_ALLOWED_HOSTS must contain exact hostnames, without URLs, ports or wildcards.");
    }
  }
  return { host, port, allowedHosts: [...new Set(["localhost", "127.0.0.1", "[::1]", ...extraHosts])] };
}
