import type { Pillar } from "@/data/pillars";

export interface PillarSectionProps {
  pillar: Pillar;
  index: number;
  mounted: boolean;
  isSectionInView: boolean;
}
