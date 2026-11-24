<script lang="ts">
  import { onMount } from "svelte";
  import { SvelteSet } from "svelte/reactivity";
  import PageMeta from "../../lib/components/page-meta.svelte";
  import { CAMERA_PAN_SPEED, W_S_CAMERA_PAN } from "../../lib/pogo/constants";
  import type { PogoSimulation, PogoSnapshot } from "../../lib/pogo/simulate";
  import { sampleTerrainPaths } from "../../lib/pogo/svg-terrain";
  import type { PageProps } from "./$types";
  import PogoStage from "./pogo-stage.svelte";
  import "./pogo.css";

  let { data }: PageProps = $props();

  const STAGE_WIDTH = 1840;
  const STAGE_HEIGHT = 1040;
  const SPAWN = { x: 220, y: 800 } as const;
  const GOAL_ZONE = {
    maxX: 1710,
    maxY: 170,
    minX: 1385,
    minY: 50,
  } as const;
  const STAGE_BOUNDS = {
    maxX: 1760,
    maxY: 980,
    minX: 80,
    minY: 80,
  } as const;

  const PLAYER_HALF_W = 18;
  const PLAYER_BASE_PIVOT_Y = 36;
  const PAN_LIMIT = 320;

  let viewportEl: HTMLDivElement | undefined = $state();
  let worldEl: HTMLDivElement | undefined = $state();
  let playerEl: HTMLDivElement | undefined = $state();
  let resetButtonEl: HTMLButtonElement | undefined = $state();

  let boostReady = $state(false);
  let ouch = $state(false);
  let reachedGoal = $state(false);
  let respawns = $state(0);
  let ready = $state(false);

  let simulation: PogoSimulation | null = null;
  let lastKnownRespawns = 0;

  const pressedKeys = new SvelteSet<string>();

  function isPanUpPressed(): boolean {
    return (
      pressedKeys.has("ArrowUp") || (W_S_CAMERA_PAN && pressedKeys.has("KeyW"))
    );
  }

  function isPanDownPressed(): boolean {
    return (
      pressedKeys.has("ArrowDown") ||
      (W_S_CAMERA_PAN && pressedKeys.has("KeyS"))
    );
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    if (
      event.code === "Space" ||
      event.code === "ArrowUp" ||
      event.code === "ArrowDown" ||
      event.code === "ArrowLeft" ||
      event.code === "ArrowRight"
    ) {
      event.preventDefault();
    }
    if (event.code === "KeyR" && !event.repeat && simulation) {
      simulation.respawn();
      return;
    }
    pressedKeys.add(event.code);
  }

  function handleKeyUp(event: KeyboardEvent): void {
    if (event.code === "Space") {
      event.preventDefault();
    }
    pressedKeys.delete(event.code);
  }

  function handleWindowBlur(): void {
    pressedKeys.clear();
  }

  function handleRespawnClick(): void {
    resetButtonEl?.blur();
    simulation?.respawn();
  }

  onMount(() => {
    if (!viewportEl || !worldEl || !playerEl) {
      return;
    }

    const currentViewport = viewportEl;
    const currentWorld = worldEl;
    const currentPlayer = playerEl;

    let disposed = false;
    let rafId = 0;
    let panX = 0;
    let panY = 0;
    let camX: number = SPAWN.x;
    let camY: number = SPAWN.y;
    let hasCameraAnchor = false;
    let lastTimestamp = 0;

    function applyTransforms(
      snapshot: PogoSnapshot,
      pivotY: number,
      dtSec: number,
    ): void {
      currentPlayer.style.transform = `translate3d(${(snapshot.x - PLAYER_HALF_W).toFixed(2)}px, ${(snapshot.y - pivotY).toFixed(2)}px, 0) rotate(${snapshot.angleRad.toFixed(4)}rad)`;

      const panDirX =
        (pressedKeys.has("ArrowRight") ? 1 : 0) -
        (pressedKeys.has("ArrowLeft") ? 1 : 0);
      const panDirY = (isPanDownPressed() ? 1 : 0) - (isPanUpPressed() ? 1 : 0);

      if (panDirX !== 0) {
        panX = Math.max(
          -PAN_LIMIT,
          Math.min(PAN_LIMIT, panX + panDirX * CAMERA_PAN_SPEED * dtSec),
        );
      } else {
        panX *= Math.max(0, 1 - 6 * dtSec);
      }

      if (panDirY !== 0) {
        panY = Math.max(
          -PAN_LIMIT,
          Math.min(PAN_LIMIT, panY + panDirY * CAMERA_PAN_SPEED * dtSec),
        );
      } else {
        panY *= Math.max(0, 1 - 6 * dtSec);
      }

      const targetX = snapshot.x + panX;
      const targetY = snapshot.y + panY;

      if (!hasCameraAnchor || snapshot.respawns !== lastKnownRespawns) {
        camX = targetX;
        camY = targetY;
        hasCameraAnchor = true;
        lastKnownRespawns = snapshot.respawns;
      } else {
        const lerp = 1 - Math.exp(-8 * dtSec);
        camX += (targetX - camX) * lerp;
        camY += (targetY - camY) * lerp;
      }

      const vpW = currentViewport.clientWidth;
      const vpH = currentViewport.clientHeight;
      const offsetX = Math.round(vpW / 2 - camX);
      const offsetY = Math.round(vpH / 2 - camY);
      currentWorld.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
    }

    async function start(): Promise<void> {
      currentWorld.style.transform = "none";
      const terrainPolygons = sampleTerrainPaths(currentWorld);
      const { createPogoSimulation } = await import("../../lib/pogo/simulate");
      if (disposed) {
        return;
      }

      const sim = createPogoSimulation({
        goalZone: GOAL_ZONE,
        spawn: SPAWN,
        stageBounds: STAGE_BOUNDS,
        terrainPolygons,
      });
      simulation = sim;

      const pivotY = PLAYER_BASE_PIVOT_Y + sim.pivotOffsetY;
      currentPlayer.style.transformOrigin = `${PLAYER_HALF_W}px ${pivotY.toFixed(2)}px`;
      ready = true;

      const tick = (timestamp: number): void => {
        if (disposed) {
          return;
        }
        const dtMs =
          lastTimestamp === 0 ? 16.67 : Math.min(50, timestamp - lastTimestamp);
        lastTimestamp = timestamp;

        const snapshot = sim.step(dtMs, {
          jump: pressedKeys.has("Space"),
          left: pressedKeys.has("KeyA"),
          right: pressedKeys.has("KeyD"),
        });

        boostReady = snapshot.boostReady;
        ouch = snapshot.ouch;
        if (snapshot.reachedGoal) {
          reachedGoal = true;
        }
        respawns = snapshot.respawns;

        applyTransforms(snapshot, pivotY, dtMs / 1000);
        rafId = requestAnimationFrame(tick);
      };

      rafId = requestAnimationFrame(tick);
    }

    void start();

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      simulation?.destroy();
      simulation = null;
    };
  });
</script>

<svelte:window
  onblur={handleWindowBlur}
  onkeydown={handleKeyDown}
  onkeyup={handleKeyUp}
/>

<PageMeta
  canonicalUrl={data.canonicalUrl}
  description="Pogostuck 風の 285° ブースト・自動バウンド物理 PoC"
  image={data.image}
  ogTitle="ポゴ PoC"
  title="ポゴ — nyatinte"
/>

<main class="pogo-page">
  <header class="pogo-hud">
    <div class="pogo-status">
      <h1>ポゴ PoC</h1>
      <span class="pogo-badge" data-active={boostReady}>
        {boostReady ? "BOOST READY (285°)" : "285° でブースト"}
      </span>
      {#if reachedGoal}
        <span class="pogo-goal-badge">GOAL!</span>
      {/if}
      <span class="pogo-counter">落下回数: {respawns}</span>
    </div>
    <div class="pogo-controls">
      <span><kbd>A</kbd> / <kbd>D</kbd> 回転</span>
      <span><kbd>Space</kbd> チャージ</span>
      <span><kbd>W</kbd> / <kbd>S</kbd> / 矢印 カメラ先読み</span>
      <span><kbd>R</kbd> 戻る</span>
      <button
        bind:this={resetButtonEl}
        class="pogo-reset"
        onclick={handleRespawnClick}
        type="button"
      >
        スタートへ戻す
      </button>
    </div>
  </header>

  <div
    aria-label="ポゴ物理ステージ"
    bind:this={viewportEl}
    class="pogo-viewport"
  >
    {#if !ready}
      <p class="pogo-loading">物理エンジンを読み込み中...</p>
    {/if}
    <div bind:this={worldEl} class="pogo-world" id="world">
      <PogoStage stageHeight={STAGE_HEIGHT} stageWidth={STAGE_WIDTH} />
      <div
        bind:this={playerEl}
        class="pogo-player"
        data-boost-ready={boostReady}
        data-ouch={ouch}
      ></div>
    </div>
  </div>
</main>
