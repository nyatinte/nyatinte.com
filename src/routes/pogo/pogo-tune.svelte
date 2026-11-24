<script lang="ts">
  import {
    POGO_TUNE_FIELDS,
    type PogoTunables,
    type PogoTuneOverrides,
  } from "../../lib/pogo/tune";

  let {
    values,
    onChange,
    onReset,
  }: {
    values: PogoTunables;
    onChange: (next: PogoTuneOverrides) => void;
    onReset: () => void;
  } = $props();

  function patch(key: keyof PogoTunables, raw: string): void {
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      return;
    }
    onChange({ ...values, [key]: value });
  }
</script>

<aside class="pogo-tune" data-pogo-tune="true">
  <header class="pogo-tune-header">
    <h2>チューニング</h2>
    <button data-tune-reset type="button" onclick={onReset}>
      既定値に戻す
    </button>
  </header>
  <div class="pogo-tune-list">
    {#each POGO_TUNE_FIELDS as field (field.key)}
      <label class="pogo-tune-row">
        <span class="pogo-tune-label">{field.label}</span>
        <input
          data-tune-key={field.key}
          max={field.max}
          min={field.min}
          oninput={(event) =>
            patch(field.key, (event.currentTarget as HTMLInputElement).value)}
          step={field.step}
          type="range"
          value={values[field.key]}
        />
        <span class="pogo-tune-value" data-tune-value={field.key}>
          {values[field.key]}{field.unit ? ` ${field.unit}` : ""}
        </span>
      </label>
    {/each}
  </div>
</aside>

<style>
  .pogo-tune {
    display: grid;
    gap: 0.6rem;
    padding: 0.75rem 1rem;
    border: 1px solid var(--home-foreground);
    border-radius: 0.75rem;
    background: color-mix(in oklch, var(--home-background) 88%, transparent);
    color: var(--home-foreground);
  }

  .pogo-tune-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .pogo-tune-header h2 {
    margin: 0;
    font-size: 0.95rem;
  }

  .pogo-tune-header button {
    appearance: none;
    border: 1px solid var(--home-foreground);
    border-radius: 999px;
    background: transparent;
    color: inherit;
    padding: 0.2rem 0.7rem;
    cursor: pointer;
  }

  .pogo-tune-list {
    display: grid;
    gap: 0.45rem;
  }

  .pogo-tune-row {
    display: grid;
    grid-template-columns: minmax(8rem, 0.9fr) 1fr minmax(6rem, auto);
    gap: 0.5rem;
    align-items: center;
    font-size: 0.8rem;
  }

  .pogo-tune-value {
    font-variant-numeric: tabular-nums;
    text-align: end;
  }

  input[type="range"] {
    inline-size: 100%;
  }
</style>
