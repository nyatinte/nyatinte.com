<script lang="ts">
  let { source }: { source: string } = $props();
  let message = $state("");

  async function copySource() {
    try {
      await navigator.clipboard.writeText(source);
      message = "コピーしました";
    } catch {
      message = "コピーできませんでした";
    }
  }
</script>

<button class="copy" onclick={copySource} type="button">
  MDXをクリップボードにコピー
</button>
<p aria-live="polite" class="copy-status">{message}</p>

<style>
  .copy {
    padding: 0.7rem 1rem;
    margin-block-start: 2.5rem;
    font: inherit;
    color: var(--home-foreground);
    cursor: pointer;
    background: var(--home-nav-background);
    border: 1px solid var(--home-nav-border);
    border-radius: 999px;
  }

  .copy:hover {
    background: var(--home-nav-current);
  }

  .copy:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 4px;
  }

  .copy-status {
    min-block-size: 1.5rem;
    margin: 0.75rem 0 0;
    font-size: 0.9rem;
  }
</style>
