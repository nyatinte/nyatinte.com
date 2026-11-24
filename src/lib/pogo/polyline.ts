import type { Point2D } from "./coords";

export type PolylineGeometry = {
  readonly vertices: Float32Array;
  readonly indices: Uint32Array;
};

function distance(a: Point2D, b: Point2D): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function filterPolylinePoints(
  points: ReadonlyArray<Point2D>,
  minEdgePx: number,
  closed: boolean,
): Array<Point2D> {
  const filtered: Array<Point2D> = [];
  for (const point of points) {
    const prev = filtered.at(-1);
    if (!prev || distance(prev, point) >= minEdgePx) {
      filtered.push(point);
    }
  }
  if (
    closed &&
    filtered.length > 1 &&
    distance(filtered[0], filtered.at(-1)!) < minEdgePx
  ) {
    filtered.pop();
  }
  return filtered;
}

export function buildPolylineGeometry(
  points: ReadonlyArray<Point2D>,
  closed: boolean,
  minEdgePx: number,
): PolylineGeometry | null {
  const filtered = filterPolylinePoints(points, minEdgePx, closed);
  const minVertexCount = closed ? 3 : 2;
  if (filtered.length < minVertexCount) {
    return null;
  }

  const vertices = new Float32Array(filtered.length * 2);
  filtered.forEach((point, index) => {
    vertices[index * 2] = point.x;
    vertices[index * 2 + 1] = point.y;
  });

  const segmentCount = closed ? filtered.length : filtered.length - 1;
  const indices = new Uint32Array(segmentCount * 2);
  for (let index = 0; index < segmentCount; index += 1) {
    indices[index * 2] = index;
    indices[index * 2 + 1] = (index + 1) % filtered.length;
  }

  return { indices, vertices };
}

export function toRapierPolyline(
  geometry: PolylineGeometry,
  convert: (point: Point2D) => Point2D,
): PolylineGeometry {
  const vertices = new Float32Array(geometry.vertices.length);
  for (let index = 0; index < geometry.vertices.length; index += 2) {
    const point = convert({
      x: geometry.vertices[index],
      y: geometry.vertices[index + 1],
    });
    vertices[index] = point.x;
    vertices[index + 1] = point.y;
  }
  return { indices: geometry.indices, vertices };
}
