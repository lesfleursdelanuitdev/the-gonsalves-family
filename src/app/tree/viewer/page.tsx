import { FamilyTree } from "@/components/TreeViewer/v2/FamilyTree";
import { LockViewportOnMobile } from "@/components/TreeViewer";

type SearchParams = Promise<{ root?: string; loadSavedHistory?: string; rootName?: string }>;

/**
 * Main tree viewer route: /tree/viewer. Serves v2 tree.
 * Query: root (xref), loadSavedHistory (true|false), rootName (for history label when loadSavedHistory=true).
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
          key={`${initialRootId ?? "default"}-${loadSavedHistory}-${rootName ?? ""}`}
          initialRootId={initialRootId}
          loadSavedHistory={loadSavedHistory}
          rootName={rootName}
        />
        </main>
      </div>
    </>
  );
}
