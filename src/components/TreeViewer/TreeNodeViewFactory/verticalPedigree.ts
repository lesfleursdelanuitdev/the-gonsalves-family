/**
 * Vertical pedigree: same cards as pedigree; connectors grow upward from child to parents.
 */

import { registerTreeNodeViewSet } from "./registry";
import { SpouseJoinLines } from "../../DescendancyChart/Connectors";
import { VerticalPedigreeConnectorLines } from "../../DescendancyChart/Connectors/VerticalPedigreeConnectorLines";
import { PersonCard } from "../../DescendancyChart/FamilyTreeNodes/PersonNodeView";
import { PedigreeEmptyUnion } from "../../DescendancyChart/FamilyTreeNodes/PedigreeEmptyUnion";

const VERTICAL_PEDIGREE_STRATEGY = "vertical_pedigree";

export function registerVerticalPedigreeViewSet(): void {
  registerTreeNodeViewSet(VERTICAL_PEDIGREE_STRATEGY, {
    ConnectorLines: VerticalPedigreeConnectorLines,
    SpouseJoinLines,
    PersonNodeView: PersonCard,
    UnionNodeView: PedigreeEmptyUnion,
  });
}
