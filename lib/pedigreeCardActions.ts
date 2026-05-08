/**
 * Declarative person-card overflow actions for horizontal pedigree and vertical pedigree.
 * Descendancy uses {@link buildActionButtons} in PersonNodeView instead.
 */

import type { DescendancyPerson, PersonCardAction } from "@/genealogy-visualization-engine";
import {
  IconBaby,
  IconChevronUp,
  IconFoldVertical,
  IconGitBranchPlus,
  IconHome,
  IconUnfoldVertical,
  IconUsers,
} from "@/components/TreeViewer/Misc/SvgIcons";

export type PedigreeActionBtn = {
  Icon: typeof IconUsers | typeof IconUnfoldVertical;
  title: string;
  action: PersonCardAction;
};

/**
 * @param generationIndex — 0 = chart root, −1 = parents, −2 = grandparents, …
 * @param globalMinGeneration — minimum index across the rendered pedigree (most negative = outermost column)
 */
export function getPedigreeCardActions(
  _person: DescendancyPerson,
  opts: {
    isRoot: boolean;
    generationIndex: number;
    globalMinGeneration: number;
    hasMultipleFamiliesAsChild: boolean;
    /** False when pedigree depth is already at the API cap. */
    showExpandAncestors: boolean;
    /** True when ancestor collapse is active at this person’s node (undo with “Show ancestors”). */
    isAncestorCollapseTarget: boolean;
  }
): PedigreeActionBtn[] {
  const {
    isRoot,
    generationIndex,
    globalMinGeneration,
    hasMultipleFamiliesAsChild,
    showExpandAncestors,
    isAncestorCollapseTarget,
  } = opts;
  const isLastRenderedColumn = generationIndex === globalMinGeneration;
  const isNotLastRenderedColumn = generationIndex > globalMinGeneration;

  const buttons: PedigreeActionBtn[] = [];

  if (isAncestorCollapseTarget) {
    buttons.push({
      Icon: IconUnfoldVertical,
      title: "Show ancestors",
      action: "pedigreeRestoreAncestors",
    });
  }

  if (hasMultipleFamiliesAsChild && (isNotLastRenderedColumn || isAncestorCollapseTarget)) {
    buttons.push({
      Icon: IconGitBranchPlus,
      title: "Choose parent family",
      action: "pedigreeChooseParentFamily",
    });
  }
  if (isNotLastRenderedColumn && !isAncestorCollapseTarget) {
    buttons.push({
      Icon: IconFoldVertical,
      title: "Collapse ancestors",
      action: "pedigreeCollapseAncestors",
    });
  }
  if (isRoot) {
    buttons.push({
      Icon: IconUsers,
      title: "Show siblings",
      action: "pedigreeShowSiblingsRoot",
    });
    buttons.push({
      Icon: IconBaby,
      title: "Show children",
      action: "pedigreeShowChildrenRoot",
    });
  }
  if (isLastRenderedColumn && showExpandAncestors) {
    buttons.push({
      Icon: IconChevronUp,
      title: "Expand ancestors",
      action: "pedigreeExpandAncestors",
    });
  }
  if (!isRoot) {
    buttons.push({
      Icon: IconHome,
      title: "Re-root here",
      action: "pedigreeReroot",
    });
  }
  return buttons;
}
