import RBush from "rbush";

export interface BBoxEntry {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  id: number;
}

export interface ViewportBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

function computeBBox(feature: GeoJSON.Feature): [number, number, number, number] | null {
  if (!feature.geometry) return null;

  const geom = feature.geometry;

  const processCoords = (coords: unknown): number[] => {
    if (!Array.isArray(coords)) return [];
    if (coords.length === 0) return [];
    if (typeof coords[0] === "number") return coords as number[];
    return coords.flatMap((c) => processCoords(c));
  };

  if (geom.type === "GeometryCollection") return null;

  const flat = processCoords((geom as GeoJSON.Geometry & { coordinates: unknown }).coordinates);

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (let i = 0; i < flat.length; i += 2) {
    const x = flat[i];
    const y = flat[i + 1];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  if (!isFinite(minX)) return null;

  return [minX, minY, maxX, maxY];
}

export function buildIndex(features: GeoJSON.Feature[]): RBush<BBoxEntry> {
  const tree = new RBush<BBoxEntry>(16);
  const entries: BBoxEntry[] = [];

  for (let i = 0; i < features.length; i++) {
    const bbox = computeBBox(features[i]);
    if (bbox) {
      entries.push({
        minX: bbox[0],
        minY: bbox[1],
        maxX: bbox[2],
        maxY: bbox[3],
        id: i,
      });
    }
  }

  tree.load(entries);
  return tree;
}

export function queryBounds(
  tree: RBush<BBoxEntry>,
  bounds: ViewportBounds,
): BBoxEntry[] {
  return tree.search({
    minX: bounds.west,
    minY: bounds.south,
    maxX: bounds.east,
    maxY: bounds.north,
  });
}
