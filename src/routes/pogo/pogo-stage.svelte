<script lang="ts">
  import type { Point2D } from "../../lib/pogo/svg-terrain";

  let {
    debugPolygons = [],
    stageHeight,
    stageWidth,
  }: {
    debugPolygons?: ReadonlyArray<ReadonlyArray<Point2D>>;
    stageHeight: number;
    stageWidth: number;
  } = $props();
</script>

<svg
  aria-hidden="true"
  class="pogo-stage"
  height={stageHeight}
  viewBox="0 0 {stageWidth} {stageHeight}"
  width={stageWidth}
>
  <path
    class="pogo-terrain"
    d="M 100 860 L 360 860 L 390 770 L 650 770 L 650 980 L 100 980 Z"
    data-terrain
  />
  <path
    class="pogo-terrain"
    d="M 740 650 L 980 650 L 1080 580 L 1320 580 L 1380 140 L 1720 140 L 1720 980 L 740 980 Z"
    data-terrain
  />

  {#each debugPolygons as polygon, index (index)}
    <polygon
      class="pogo-debug-terrain"
      points={polygon.map((point) => `${point.x},${point.y}`).join(" ")}
    />
  {/each}

  <line
    class="pogo-start-pad"
    stroke-width="4"
    x1="160"
    x2="280"
    y1="860"
    y2="860"
  />
  <text class="pogo-label" x="175" y="842">START</text>
  <text class="pogo-label" x="1115" y="560">285° BOOST →</text>

  <rect class="pogo-goal-zone" height="20" width="320" x="1390" y="120" />
  <line
    class="pogo-flag-pole"
    stroke-width="3"
    x1="1560"
    x2="1560"
    y1="55"
    y2="140"
  />
  <polygon class="pogo-flag" points="1560,55 1612,72 1560,90" />
  <text class="pogo-label" x="1485" y="110">GOAL</text>

  <line
    class="pogo-kill-line"
    stroke-dasharray="10 8"
    stroke-width="2"
    x1="0"
    x2={stageWidth}
    y1={stageHeight - 4}
    y2={stageHeight - 4}
  />
</svg>
