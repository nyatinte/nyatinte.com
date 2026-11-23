interface TocVisibilityInput {
  headingPositions: Array<{ id: string; top: number }>;
  scrollMargin?: number;
  viewportHeight: number;
}

interface TocVisibility {
  activeId: string;
  visible: boolean;
}

const showThresholdRatio = 0.4;

const readingZoneRatio = 0.2;

export function getTocVisibility({
  headingPositions,
  viewportHeight,
  scrollMargin = 96,
}: TocVisibilityInput): TocVisibility {
  const showThreshold = viewportHeight * showThresholdRatio;
  const [first] = headingPositions;
  if (!first) {
    return { activeId: "", visible: false };
  }

  const readingZone = Math.max(viewportHeight * readingZoneRatio, scrollMargin);
  const [active] = [...headingPositions]
    .filter(({ top }) => top <= readingZone)
    .sort((left, right) => right.top - left.top);
  const last = headingPositions.at(-1);
  const visible = first.top <= showThreshold && (last?.top ?? -1) >= 0;
  return { activeId: active?.id ?? first.id, visible };
}
