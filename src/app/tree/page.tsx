import { FamilyTree, LockViewportOnMobile } from "@/components/TreeViewer";

type SearchParams = Promise<{ root?: string }>;

/**
 * Tree viewer page. Optional query: ?root=@I123@ to load with that person as root.
 */
export default async function TreePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const initialRootId = params.root?.trim() || null;

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
          <FamilyTree key={initialRootId ?? "default"} initialRootId={initialRootId} />
        </main>
      </div>
    </>
  );
}
