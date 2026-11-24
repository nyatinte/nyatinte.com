<script lang="ts">
  import { FIXED_STEP_HZ } from "../../lib/pogo/constants";

  let {
    boostReady,
    debugEnabled,
    onRespawn,
    physicsStepCount,
    reachedGoal,
    respawns,
  }: {
    boostReady: boolean;
    debugEnabled: boolean;
    onRespawn: () => void;
    physicsStepCount: number;
    reachedGoal: boolean;
    respawns: number;
  } = $props();
</script>

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
    {#if debugEnabled}
      <span class="pogo-counter">
        steps: {physicsStepCount} @ {FIXED_STEP_HZ}Hz
      </span>
    {/if}
  </div>
  <div class="pogo-controls">
    <span><kbd>A</kbd> / <kbd>D</kbd> 回転</span>
    <span><kbd>Space</kbd> チャージ</span>
    <span><kbd>W</kbd> / <kbd>S</kbd> / 矢印 カメラ先読み</span>
    <span><kbd>R</kbd> 戻る</span>
    <button
      class="pogo-reset"
      onclick={(event) => {
        event.currentTarget.blur();
        onRespawn();
      }}
      type="button"
    >
      スタートへ戻す
    </button>
  </div>
</header>
