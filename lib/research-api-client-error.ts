/**
 * Human-readable extract from `/api/research/*` JSON error bodies (proxy + upstream).
 */

export function messageFromResearchErrorJson(data: unknown, status: number): string {
  if (!data || typeof data !== "object") return `Research request failed (${status}).`;
  const o = data as Record<string, unknown>;
  const line1 = typeof o.error === "string" ? o.error : `HTTP ${status}`;
  const extras: string[] = [];
  if (typeof o.upstream === "string") extras.push(`Target: ${o.upstream}`);
  if (typeof o.hint === "string") extras.push(o.hint);
  if (typeof o.detail === "string") extras.push(o.detail);
  if (typeof o.cause === "string") extras.push(`(${o.cause})`);
  return extras.length ? `${line1} — ${extras.join(" ")}` : line1;
}
