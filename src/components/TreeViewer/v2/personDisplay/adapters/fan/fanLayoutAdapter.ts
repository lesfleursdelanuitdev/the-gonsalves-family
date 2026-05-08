import type { FanPersonDisplayLayout } from "../../types";

export interface BuildFanPersonLayoutParams {
  startAngle: number;
  endAngle: number;
  innerRadius: number;
  outerRadius: number;
}

export function buildFanPersonLayout(
  params: BuildFanPersonLayoutParams
): FanPersonDisplayLayout {
  return {
    kind: "fan",
    startAngle: params.startAngle,
    endAngle: params.endAngle,
    innerRadius: params.innerRadius,
    outerRadius: params.outerRadius,
  };
}
