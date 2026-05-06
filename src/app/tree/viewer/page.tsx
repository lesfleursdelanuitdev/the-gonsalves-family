import { FamilyTree } from "@/components/TreeViewer/v2/FamilyTree";
import { LockViewportOnMobile } from "@/components/TreeViewer";
import type { ChartViewStrategyName } from "@/genealogy-visualization-engine";
import { parseTreeViewerUrlParams } from "@/lib/treeViewerUrl";

type SearchParams = Promise<{
  root?: string;
  loadSavedHistory?: string;
  rootName?: string;
  chart?: string;
  depth?: string;
  card?: string;
  partners?: string;
}>;

/**
 * Main tree viewer route: /tree/viewer. Serves v2 tree.
 * Query: root, chart, depth, card, partners, loadSavedHistory, rootName (see `lib/treeViewerUrl.ts`).
 */
export default async function TreeViewerPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const initialRootId = params.root?.trim() || null;
  const loadSavedHistory = params.loadSavedHistory?.toLowerCase() === "true";
  const rootName = params.rootName?.trim() || null;
  const chartParam = params.chart?.trim().toLowerCase();
  const initialChartStrategy: ChartViewStrategyName =
    chartParam === "pedigree"
      ? "pedigree"
      : chartParam === "vertical_pedigree" ||
          chartParam === "vertical-pedigree" ||
          chartParam === "verticalpedigree"
        ? "vertical_pedigree"
        : "descendancy";

  const parsedUrl = parseTreeViewerUrlParams({
    depth: params.depth,
    card: params.card,
    partners: params.partners,
  });
  const skipUrlViewOverrides = Boolean(loadSavedHistory && initialRootId != null);
  const initialUrlDepth = skipUrlViewOverrides ? null : parsedUrl.initialUrlDepth;
  const initialPartnersUrl = skipUrlViewOverrides ? null : parsedUrl.initialPartnersUrl;
  const initialPersonCardLayout = parsedUrl.initialPersonCardLayout;

  const mountKey = [
    initialRootId ?? "default",
    loadSavedHistory,
    rootName ?? "",
    initialChartStrategy,
    initialUrlDepth ?? "",
    initialPersonCardLayout ?? "",
    initialPartnersUrl ?? "",
  ].join("-");

  return (
    <>
      <LockViewportOnMobile />
      <style>{`
        .tree-viewer-page {
          flex: 1;
          height: var(--app-height, 100vh);
          min-height: 100vh;
          max-height: var(--app-height, 100vh);
          overflow: hidden;
          width: 100%;
          display: flex;
          flex-direction: column;
        }
        @media (max-width: 640px) {
          .tree-viewer-page {
            position: fixed;
            top: 0;
            left: 0;
            width: var(--mobile-viewport-width, 100dvw);
            height: var(--app-height, var(--mobile-viewport-height, 100dvh));
            min-height: 100dvh;
            max-width: var(--mobile-viewport-width, 100dvw);
            max-height: var(--app-height, var(--mobile-viewport-height, 100dvh));
            overflow: hidden;
            overscroll-behavior: none;
          }
        }
      `}</style>
      <div className="tree-viewer-page bg-bg">
        <main
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <FamilyTree
            key={mountKey}
            initialRootId={initialRootId}
            loadSavedHistory={loadSavedHistory}
            rootName={rootName}
            initialChartStrategy={initialChartStrategy}
            initialUrlDepth={initialUrlDepth}
            initialPersonCardLayout={initialPersonCardLayout}
            initialPartnersUrl={initialPartnersUrl}
          />
        </main>
      </div>
    </>
  );
}
