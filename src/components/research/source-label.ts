import type { PublicSource } from "@/lib/research/load-public-sources";

export function sourceDisplayLabel(source: PublicSource): string {
  return source.title?.trim() || source.xref;
}
