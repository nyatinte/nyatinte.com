import { describe, expect, it } from "vite-plus/test";
import type { Point2D } from "./coords";
import {
  buildPolylineGeometry,
  filterPolylinePoints,
  toRapierPolyline,
} from "./polyline";

const SQUARE: Array<Point2D> = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 10 },
  { x: 0, y: 10 },
  { x: 0, y: 0 },
];

describe("filterPolylinePoints", () => {
  it("drops consecutive edges shorter than the minimum", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 0.5, y: 0 },
      { x: 4, y: 0 },
      { x: 4.5, y: 0 },
    ];
    expect(filterPolylinePoints(points, 2, false)).toEqual([
      { x: 0, y: 0 },
      { x: 4, y: 0 },
    ]);
  });

  it("removes the duplicated closing point of a closed path", () => {
    expect(filterPolylinePoints(SQUARE, 0.5, true)).toHaveLength(4);
  });
});

describe("buildPolylineGeometry", () => {
  it("closes a closed path with a last-to-first segment", () => {
    const geometry = buildPolylineGeometry(SQUARE, true, 0.5);
    expect(geometry).not.toBeNull();
    expect(Array.from(geometry!.vertices)).toEqual([
      0, 0, 10, 0, 10, 10, 0, 10,
    ]);
    expect(Array.from(geometry!.indices)).toEqual([0, 1, 1, 2, 2, 3, 3, 0]);
  });

  it("keeps an open polyline open", () => {
    const geometry = buildPolylineGeometry(SQUARE.slice(0, 3), false, 0.5);
    expect(Array.from(geometry!.indices)).toEqual([0, 1, 1, 2]);
  });

  it("rejects paths without enough edges", () => {
    expect(buildPolylineGeometry([{ x: 0, y: 0 }], false, 0.5)).toBeNull();
    expect(
      buildPolylineGeometry(
        [
          { x: 0, y: 0 },
          { x: 5, y: 0 },
        ],
        true,
        0.5,
      ),
    ).toBeNull();
  });

  it("converts vertex positions without touching the indices", () => {
    const geometry = buildPolylineGeometry(SQUARE, true, 0.5)!;
    const converted = toRapierPolyline(geometry, (point) => ({
      x: point.x / 100,
      y: -point.y / 100,
    }));
    const expected = [0, 0, 0.1, 0, 0.1, -0.1, 0, -0.1];
    Array.from(converted.vertices).forEach((value, index) => {
      expect(value).toBeCloseTo(expected[index], 5);
    });
    expect(Array.from(converted.indices)).toEqual(Array.from(geometry.indices));
  });
});
