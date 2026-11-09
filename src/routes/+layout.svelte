<script lang="ts">
  let { children } = $props();
</script>

{@render children()}

<style>
  @layer base {
    :global(*) {
      box-sizing: border-box;
    }
    :global(html) {
      font-family:
        "M PLUS 1p", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif;
      -webkit-font-smoothing: antialiased;
      font-synthesis: none;
      color-scheme: light;
      text-rendering: optimizeLegibility;
    }
    :global(body) {
      margin: 0;
      color: oklch(32% 0.025 150);
      background: oklch(98% 0.006 100);
    }
  }
</style>
