export interface TocVisibilityInput {
  articleBottom: number;
  headingPositions: { id: string; top: number }[];
  viewportHeight: number;
}

export interface TocVisibility {
  activeId: string;
  visible: boolean;
}

/** First heading must reach this fraction of the viewport before the scrubber appears. */
export const showThresholdRatio = 0.4;

/** Hide the scrubber once the article bottom is above this fraction of the viewport. */
export const hideThresholdRatio = 0.35;

/** Headings at or above this fraction have entered the reading zone; the last of those is active. */
export const readingZoneRatio = 0.2;

export function getTocVisibility({
  articleBottom,
  headingPositions,
  viewportHeight,
}: TocVisibilityInput): TocVisibility {
  const showThreshold = viewportHeight * showThresholdRatio;
  const hideThreshold = viewportHeight * hideThresholdRatio;
  const [first] = headingPositions;
  if (!first || first.top > showThreshold || articleBottom < hideThreshold) {
    return { activeId: "", visible: false };
  }

  const readingZone = viewportHeight * readingZoneRatio;
  const [active] = [...headingPositions]
    .filter(({ top }) => top <= readingZone)
    .sort((left, right) => right.top - left.top);
  return { activeId: active?.id ?? first.id, visible: true };
}
