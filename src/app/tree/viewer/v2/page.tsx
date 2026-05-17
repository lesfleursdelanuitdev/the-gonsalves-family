import { FamilyTree } from "@/components/TreeViewer/v2/FamilyTree";
import { LockViewportOnMobile } from "@/components/TreeViewer";
import type { ChartViewStrategyName } from "@/genealogy-visualization-engine";
import { parseTreeViewerUrlParams } from "@/lib/treeViewerUrl";

type SearchParams = Promise<{
  root?: string;
  chart?: string;
  depth?: string;
  card?: string;
  cardVariant?: string;
  cardSize?: string;
  partners?: string;
  spouse?: string;
  family?: string;
  famc?: string;
  ppg?: string;
}>;

export default async function TreeV2Page({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const initialRootId = params.root?.trim() || null;
  const chartParam = params.chart?.trim().toLowerCase();
  const initialChartStrategy: ChartViewStrategyName =
    chartParam === "pedigree"
      ? "pedigree"
      : chartParam === "fan_chart" || chartParam === "fan-chart" || chartParam === "fanchart"
        ? "fan_chart"
      : chartParam === "vertical_pedigree" ||
          chartParam === "vertical-pedigree" ||
          chartParam === "verticalpedigree"
        ? "vertical_pedigree"
        : "descendancy";

  const parsedUrl = parseTreeViewerUrlParams({
    depth: params.depth,
    card: params.card,
    cardVariant: params.cardVariant,
    cardSize: params.cardSize,
    partners: params.partners,
    spouse: params.spouse,
    family: params.family,
    famc: params.famc,
    ppg: params.ppg,
  });

  const mountKey = [
    initialRootId ?? "default",
    initialChartStrategy,
    parsedUrl.initialUrlDepth ?? "",
    parsedUrl.initialPersonCardLayout ?? "",
    parsedUrl.initialPersonCardVariant ?? "",
    parsedUrl.initialCompactCardSize ?? "",
    parsedUrl.initialPartnersUrl ?? "",
    parsedUrl.initialRevealSpouseXref ?? "",
    parsedUrl.initialFamilyXref ?? "",
    parsedUrl.initialPedigreeFamcFamilyXref ?? "",
    parsedUrl.initialParentPairGap ?? "",
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
            initialChartStrategy={initialChartStrategy}
            initialUrlDepth={parsedUrl.initialUrlDepth}
            initialPersonCardLayout={parsedUrl.initialPersonCardLayout}
            initialPersonCardVariant={parsedUrl.initialPersonCardVariant}
            initialCompactCardSize={parsedUrl.initialCompactCardSize}
            initialPartnersUrl={parsedUrl.initialPartnersUrl}
            initialRevealSpouseXref={parsedUrl.initialRevealSpouseXref}
            initialFamilyXref={parsedUrl.initialFamilyXref}
            initialPedigreeFamcFamilyXref={parsedUrl.initialPedigreeFamcFamilyXref}
            initialParentPairGap={parsedUrl.initialParentPairGap}
          />
        </main>
      </div>
    </>
  );
}
