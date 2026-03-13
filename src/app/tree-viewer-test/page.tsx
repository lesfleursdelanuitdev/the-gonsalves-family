import { FamilyTree, LockViewportOnMobile } from "@/components/TreeViewer";

/**
 * Test page for the descendancy chart (FamilyTree) in isolation.
 * Visit /tree-viewer-test to debug layout and styling.
 * On mobile the wrapper is locked to the viewport so modals/drawers don't cause resize.
 */
export default function TreeViewerTestPage() {
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
        <main style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <FamilyTree />
        </main>
      </div>
    </>
  );
}
