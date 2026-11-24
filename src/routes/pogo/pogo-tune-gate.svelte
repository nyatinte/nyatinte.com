<script lang="ts">
  import type { PogoTunables, PogoTuneOverrides } from "../../lib/pogo/tune";

  let {
    enabled,
    values,
    onChange,
    onReset,
  }: {
    enabled: boolean;
    values: PogoTunables;
    onChange: (next: PogoTuneOverrides) => void;
    onReset: () => void;
  } = $props();
</script>

{#if enabled}
  {#await import("./pogo-tune.svelte") then tune}
    <tune.default {values} {onChange} {onReset} />
  {/await}
{/if}
