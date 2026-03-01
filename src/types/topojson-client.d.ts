declare module "topojson-client" {
  import type { Topology, GeometryObject } from "topojson-specification";
  import type { FeatureCollection } from "geojson";

  export function feature<T extends GeometryObject>(
    topology: Topology,
    object: T
  ): FeatureCollection | { type: string; features: unknown[] };
}
