/**
 * Pedigree reuses descendancy node and connector components (same ChartNode shapes).
 */

import { registerTreeNodeViewSet } from "./registry";
import { PedigreeConnectorLines, SpouseJoinLines } from "../../DescendancyChart/Connectors";
import { PersonCard } from "../../DescendancyChart/FamilyTreeNodes/PersonNodeView";
import { PedigreeEmptyUnion } from "../../DescendancyChart/FamilyTreeNodes/PedigreeEmptyUnion";

const PEDIGREE_STRATEGY = "pedigree";

export function registerPedigreeViewSet(): void {
  registerTreeNodeViewSet(PEDIGREE_STRATEGY, {
    ConnectorLines: PedigreeConnectorLines,
    SpouseJoinLines,
    PersonNodeView: PersonCard,
    UnionNodeView: PedigreeEmptyUnion,
  });
}
