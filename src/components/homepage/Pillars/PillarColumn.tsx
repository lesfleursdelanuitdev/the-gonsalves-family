"use client";

import { FindFamilySection } from "./sections/FindFamilySection";
import { ReadHistoriesSection } from "./sections/ReadHistoriesSection";
import { ViewMediaSection } from "./sections/ViewMediaSection";
import type { PillarSectionProps } from "./sections/types";

export function PillarColumn(props: PillarSectionProps) {
  switch (props.index) {
    case 0:
      return <FindFamilySection {...props} />;
    case 1:
      return <ReadHistoriesSection {...props} />;
    case 2:
      return <ViewMediaSection {...props} />;
    default:
      return null;
  }
}
