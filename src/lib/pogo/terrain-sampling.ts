import type { Point2D } from "./coords";

export type SampledTerrain = {
  readonly closed: boolean;
  readonly points: Array<Point2D>;
};

export function pathToSvgMatrix(path: SVGPathElement): DOMMatrix | null {
  const svg = path.ownerSVGElement;
  if (!svg) {
    return null;
  }
  const svgMatrix = svg.getScreenCTM();
  const pathMatrix = path.getScreenCTM();
  if (!svgMatrix || !pathMatrix) {
    return null;
  }
  return svgMatrix.inverse().multiply(pathMatrix);
}

export function sampleSvgPath(
  path: SVGPathElement,
  spacingPx: number,
): SampledTerrain {
  const matrix = pathToSvgMatrix(path);
  const totalLength = path.getTotalLength();
  if (!matrix || totalLength <= 0) {
    return { closed: false, points: [] };
  }

  const stepCount = Math.max(2, Math.ceil(totalLength / spacingPx));
  const points: Array<Point2D> = [];
  for (let index = 0; index <= stepCount; index += 1) {
    const local = path.getPointAtLength((index / stepCount) * totalLength);
    const transformed = new DOMPoint(local.x, local.y).matrixTransform(matrix);
    points.push({ x: transformed.x, y: transformed.y });
  }

  const start = points[0];
  const end = points.at(-1)!;
  return {
    closed: Math.hypot(end.x - start.x, end.y - start.y) < spacingPx,
    points,
  };
}

export function sampleTerrainPaths(
  worldElement: HTMLElement,
  spacingPx: number,
  selector = "path[data-terrain]",
): Array<SampledTerrain> {
  const paths = worldElement.querySelectorAll<SVGPathElement>(selector);
  return Array.from(paths, (path) => sampleSvgPath(path, spacingPx));
}
