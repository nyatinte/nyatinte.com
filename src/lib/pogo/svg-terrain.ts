import { PATH_SAMPLE_SPACING } from "./constants";

export type Point2D = {
  readonly x: number;
  readonly y: number;
};

function distanceSq(a: Point2D, b: Point2D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function sampleSvgPathToWorld(
  path: SVGPathElement,
  worldElement: HTMLElement,
  spacing = PATH_SAMPLE_SPACING,
): Array<Point2D> {
  const pathCtm = path.getScreenCTM();
  if (!pathCtm) {
    return [];
  }

  const worldRect = worldElement.getBoundingClientRect();
  const pathToWorld = new DOMMatrix()
    .translate(worldRect.left, worldRect.top)
    .inverse()
    .multiply(pathCtm);

  const totalLength = path.getTotalLength();
  if (totalLength <= 0) {
    return [];
  }

  const steps = Math.max(3, Math.ceil(totalLength / spacing));
  const rawPoints: Array<Point2D> = [];

  for (let i = 0; i < steps; i += 1) {
    const svgPt = path.getPointAtLength((i / steps) * totalLength);
    const transformed = new DOMPoint(svgPt.x, svgPt.y).matrixTransform(
      pathToWorld,
    );
    rawPoints.push({ x: transformed.x, y: transformed.y });
  }

  const startSvg = path.getPointAtLength(0);
  const endSvg = path.getPointAtLength(totalLength);
  if (
    Math.hypot(endSvg.x - startSvg.x, endSvg.y - startSvg.y) >
    spacing * 0.5
  ) {
    const transformedEnd = new DOMPoint(endSvg.x, endSvg.y).matrixTransform(
      pathToWorld,
    );
    rawPoints.push({ x: transformedEnd.x, y: transformedEnd.y });
  }

  const minSq = 0.5 * 0.5;
  const filtered: Array<Point2D> = [];
  for (const point of rawPoints) {
    const prev = filtered.at(-1);
    if (!prev || distanceSq(prev, point) >= minSq) {
      filtered.push(point);
    }
  }

  if (
    filtered.length > 2 &&
    distanceSq(filtered[0], filtered.at(-1)!) < minSq
  ) {
    filtered.pop();
  }

  return filtered;
}

export function sampleTerrainPaths(
  worldElement: HTMLElement,
  selector = "path[data-terrain]",
  spacing = PATH_SAMPLE_SPACING,
): Array<Array<Point2D>> {
  const paths = worldElement.querySelectorAll<SVGPathElement>(selector);
  const polygons: Array<Array<Point2D>> = [];

  for (const path of paths) {
    const points = sampleSvgPathToWorld(path, worldElement, spacing);
    if (points.length >= 3) {
      polygons.push(points);
    }
  }

  return polygons;
}
