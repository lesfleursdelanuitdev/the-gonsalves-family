/**
 * Register the descendancy strategy's view components.
 * Called once so getTreeNodeViewSet("descendancy") returns ConnectorLines, SpouseJoinLines, PersonCard, UnionRow.
 */

import { registerTreeNodeViewSet } from "./registry";
import { ConnectorLines, SpouseJoinLines } from "../../DescendancyChart/Connectors";
import { PersonCard } from "../../DescendancyChart/FamilyTreeNodes/PersonNodeView";
import { UnionRow } from "../../DescendancyChart/FamilyTreeNodes/UnionNodeView";

const DESCENDANCY_STRATEGY = "descendancy";

export function registerDescendancyViewSet(): void {
  registerTreeNodeViewSet(DESCENDANCY_STRATEGY, {
    ConnectorLines,
    SpouseJoinLines,
    PersonNodeView: PersonCard,
    UnionNodeView: UnionRow,
  });
}
