<script lang="ts">
  import clipboard from "@tabler/icons/outline/clipboard.svg?url";
  import { tick } from "svelte";

  let { source }: { source: string } = $props();
  let message = $state("");

  async function copySource() {
    let next = "コピーできませんでした";
    try {
      await navigator.clipboard.writeText(source);
      next = "コピーしました";
    } catch {
      next = "コピーできませんでした";
    }
    message = "";
    await tick();
    message = next;
  }
</script>

<button
  class="copy"
  onclick={copySource}
  type="button"
  style:--clipboard-icon={`url("${clipboard}")`}
>
  <span aria-hidden="true" class="copy-icon"></span>
  <span>{message || "Markdown をコピー"}</span>
</button>
<p aria-live="polite" class="copy-status">{message}</p>

<style>
  .copy {
    display: inline-flex;
    flex: 0 0 auto;
    gap: 0.5rem;
    align-items: center;
    padding: 0.375rem 0.75rem;
    font: inherit;
    font-size: 0.8rem;
    color: inherit;
    cursor: pointer;
    background: var(--home-nav-background);
    border: 1px solid var(--home-nav-border);
    border-radius: 0.35rem;
  }

  .copy-icon {
    inline-size: 0.875rem;
    block-size: 0.875rem;
    background-color: currentColor;
    mask-image: var(--clipboard-icon);
    mask-repeat: no-repeat;
    mask-position: center;
    mask-size: contain;
  }

  .copy:hover {
    background: var(--home-nav-current);
  }

  .copy:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 4px;
  }

  .copy-status {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    white-space: nowrap;
    border: 0;
    clip: rect(0, 0, 0, 0);
  }
</style>
