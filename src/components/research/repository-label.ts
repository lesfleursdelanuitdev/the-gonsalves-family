import type { PublicRepository } from "@/lib/research/load-public-repositories";

export function repositoryDisplayLabel(repo: PublicRepository): string {
  const parts = [repo.name, repo.city, repo.state, repo.country].filter(Boolean);
  if (parts.length > 0) return parts.join(", ");
  return repo.xref;
}
