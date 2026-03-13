export type { TreeNodeViewSet, ConnectorLinesProps, SpouseJoinLinesProps, PersonNodeViewProps, UnionNodeViewProps } from "./types";
export { registerTreeNodeViewSet, getTreeNodeViewSet } from "./registry";
export { registerDescendancyViewSet } from "./descendancy";

import { registerDescendancyViewSet } from "./descendancy";
registerDescendancyViewSet();
