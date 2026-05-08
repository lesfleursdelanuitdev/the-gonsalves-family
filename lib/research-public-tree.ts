import { resolveTreeId } from "@/lib/tree";

/**
 * Tree UUID allowed for `/api/research/*` on the public site.
 * The research proxy is unauthenticated — we only allow the configured public tree
 * so callers cannot probe other trees via guessed UUIDs.
 *
 * Set `PUBLIC_RESEARCH_TREE_ID` (or reuse `PUBLIC_STORY_TREE_ID`) in `.env.local`;
 * otherwise resolves the default public tree by name (see `TREE_NAME` in `lib/tree`).
 */
export async function getPublicResearchTreeId(): Promise<string | null> {
  const fromEnv =
    process.env.PUBLIC_RESEARCH_TREE_ID?.trim() ||
    process.env.PUBLIC_STORY_TREE_ID?.trim();
  if (fromEnv) return fromEnv;
  return resolveTreeId();
}
