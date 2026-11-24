<script lang="ts">
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import { SvelteSet } from "svelte/reactivity";
  import PageMeta from "../../lib/components/page-meta.svelte";
  import {
    GRID_CELL_PX,
    GRID_MAX_X,
    GRID_MAX_Y,
    GRID_MIN_X,
    GRID_MIN_Y,
    MAX_FRAME_DT_MS,
    TERRAIN_SAMPLE_STEP_PX,
  } from "../../lib/pogo/constants";
  import { createCameraState, updateCamera } from "../../lib/pogo/camera";
  import type { Point2D } from "../../lib/pogo/coords";
  import {
    cameraPanDirectionX,
    cameraPanDirectionY,
  } from "../../lib/pogo/keys";
  import type { PogoSimulation, PogoSnapshot } from "../../lib/pogo/simulate-types";
  import { sampleTerrainPaths } from "../../lib/pogo/terrain-sampling";
  import { mergeTune, type PogoTuneOverrides } from "../../lib/pogo/tune";
  import type { PageProps } from "./$types";
  import PogoHud from "./pogo-hud.svelte";
  import PogoStage from "./pogo-stage.svelte";
  import PogoTuneGate from "./pogo-tune-gate.svelte";
  import {
    BODY_HEIGHT,
    BODY_WIDTH,
    GOAL_ZONE,
    SPAWN,
    STAGE_BOUNDS,
    STAGE_HEIGHT,
    STAGE_WIDTH,
    STICK_WIDTH,
    TIP_SIZE,
  } from "./stage-layout";
  import "./pogo.css";

  let { data }: PageProps = $props();

  const debugEnabled = $derived(page.url.searchParams.get("debug") === "1");
  const tuneEnabled = $derived(debugEnabled || page.url.searchParams.get("tune") === "1");

  let viewportEl: HTMLDivElement | undefined = $state();
  let worldEl: HTMLDivElement | undefined = $state();
  let bodyEl: HTMLDivElement | undefined = $state();
  let stickEl: HTMLDivElement | undefined = $state();
  let tipEl: HTMLDivElement | undefined = $state();

  let boostReady = $state(false);
  let ouch = $state(false);
  let reachedGoal = $state(false);
  let respawns = $state(0);
  let physicsStepCount = $state(0);
  let debugPolygons: ReadonlyArray<ReadonlyArray<Point2D>> = $state([]);
  let ready = $state(false);
  let loadFailed = $state(false);
  let tuneOverrides: PogoTuneOverrides = $state({});
  const tunables = $derived(mergeTune(tuneOverrides));

  let simulation: PogoSimulation | null = null;

  function applyTune(next: PogoTuneOverrides): void {
    tuneOverrides = next;
    simulation?.setTune(next);
  }

  const pressedKeys = new SvelteSet<string>();

  function keyName(event: KeyboardEvent): string {
    if (event.code === "Space" || event.key === " ") {
      return "Space";
    }
    return event.code;
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    const key = keyName(event);
    if (
      key === "Space" ||
      key === "ArrowUp" ||
      key === "ArrowDown" ||
      key === "ArrowLeft" ||
      key === "ArrowRight"
    ) {
      event.preventDefault();
    }
    if (event.code === "KeyR" && !event.repeat && simulation) {
      simulation.respawn();
      return;
    }
    pressedKeys.add(key);
  }

  function handleKeyUp(event: KeyboardEvent): void {
    if (keyName(event) === "Space") {
      event.preventDefault();
    }
    pressedKeys.delete(keyName(event));
  }

  function handleWindowBlur(): void {
    if (!document.hasFocus()) {
      pressedKeys.clear();
    }
  }

  onMount(() => {
    if (!viewportEl || !worldEl || !bodyEl || !stickEl || !tipEl) {
      return;
    }

    const currentViewport = viewportEl;
    const currentWorld = worldEl;
    const currentBody = bodyEl;
    const currentStick = stickEl;
    const currentTip = tipEl;

    let disposed = false;
    let rafId = 0;
    let lastTimestamp = 0;
    const camera = createCameraState(SPAWN);

    function applyTransforms(snapshot: PogoSnapshot, dtSec: number): void {
      const body = snapshot.body;
      const tip = snapshot.tip;
      const stickLength = Math.hypot(tip.x - body.x, tip.y - body.y);

      currentBody.style.transform = `translate3d(${(body.x - BODY_WIDTH / 2).toFixed(2)}px, ${(body.y - BODY_HEIGHT / 2).toFixed(2)}px, 0) rotate(${body.angleRad.toFixed(4)}rad)`;
      currentStick.style.transform = `translate3d(${(body.x - STICK_WIDTH / 2).toFixed(2)}px, ${body.y.toFixed(2)}px, 0) rotate(${body.angleRad.toFixed(4)}rad)`;
      currentStick.style.blockSize = `${stickLength.toFixed(2)}px`;
      currentTip.style.transform = `translate3d(${(tip.x - TIP_SIZE / 2).toFixed(2)}px, ${(tip.y - TIP_SIZE / 2).toFixed(2)}px, 0)`;

      const panDirectionX = cameraPanDirectionX(pressedKeys);
      const panDirectionY = cameraPanDirectionY(pressedKeys);
      const view = updateCamera(camera, {
        dtSec,
        panDirectionX,
        panDirectionY,
        resetCount: snapshot.resetCount,
        targetX: body.x,
        targetY: body.y,
        viewportHeight: currentViewport.clientHeight,
        viewportWidth: currentViewport.clientWidth,
      });
      currentWorld.style.transform = `translate3d(${view.offsetX}px, ${view.offsetY}px, 0)`;
    }

    async function start(): Promise<void> {
      currentWorld.style.transform = "none";
      const terrain = sampleTerrainPaths(currentWorld, TERRAIN_SAMPLE_STEP_PX);
      try {
        const { createPogoSimulation } =
          await import("../../lib/pogo/simulate");
        const sim = await createPogoSimulation({
          goalZone: GOAL_ZONE,
          spawn: SPAWN,
          stageBounds: STAGE_BOUNDS,
          terrain,
        });
        if (disposed) {
          sim.destroy();
          return;
        }
        simulation = sim;
        sim.setTune(tuneOverrides);
        debugPolygons = sim.getTerrainPolylines();
        ready = true;

        const tick = (timestamp: number): void => {
          if (disposed) {
            return;
          }
          const dtMs = lastTimestamp === 0 ? 0 : timestamp - lastTimestamp;
          lastTimestamp = timestamp;

          const snapshot = sim.step(dtMs, {
            jump: pressedKeys.has("Space"),
            left: pressedKeys.has("KeyA"),
            right: pressedKeys.has("KeyD"),
          });

          boostReady = snapshot.boostReady;
          ouch = snapshot.ouch;
          reachedGoal = snapshot.reachedGoal;
          respawns = snapshot.respawns;
          physicsStepCount = snapshot.physicsStepCount;

          applyTransforms(
            snapshot,
            Math.min(MAX_FRAME_DT_MS, Math.max(0, dtMs)) / 1000,
          );
          rafId = requestAnimationFrame(tick);
        };

        rafId = requestAnimationFrame(tick);
      } catch {
        loadFailed = true;
      }
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
  <PogoHud
    {boostReady}
    {debugEnabled}
    onRespawn={() => simulation?.respawn()}
    {physicsStepCount}
    {reachedGoal}
    {respawns}
  />

  <PogoTuneGate
    enabled={tuneEnabled}
    onChange={applyTune}
    onReset={() => applyTune({})}
    values={tunables}
  />

  <div
    aria-label="ポゴ物理ステージ"
    bind:this={viewportEl}
    class="pogo-viewport"
  >
    {#if !ready}
      <p
        class="pogo-loading"
        role={loadFailed ? "alert" : "status"}
        aria-live="polite"
      >
        {loadFailed
          ? "物理エンジンを読み込めませんでした。再読み込みしてください。"
          : "物理エンジンを読み込み中..."}
      </p>
    {/if}
    <div bind:this={worldEl} class="pogo-world" id="world">
      <div
        aria-hidden="true"
        class="pogo-grid"
        style:background-size="{GRID_CELL_PX}px {GRID_CELL_PX}px"
        style:block-size="{GRID_MAX_Y - GRID_MIN_Y}px"
        style:inline-size="{GRID_MAX_X - GRID_MIN_X}px"
        style:inset-block-start="{GRID_MIN_Y}px"
        style:inset-inline-start="{GRID_MIN_X}px"
      ></div>
      <PogoStage
        debugPolygons={debugEnabled ? debugPolygons : []}
        stageHeight={STAGE_HEIGHT}
        stageWidth={STAGE_WIDTH}
      />
      <div
        bind:this={tipEl}
        class="pogo-tip"
        data-boost-ready={boostReady}
        data-ouch={ouch}
      ></div>
      <div
        bind:this={stickEl}
        class="pogo-stick"
        data-boost-ready={boostReady}
        data-ouch={ouch}
      ></div>
      <div
        bind:this={bodyEl}
        class="pogo-body"
        data-boost-ready={boostReady}
        data-ouch={ouch}
      ></div>
    </div>
  </div>
</main>
