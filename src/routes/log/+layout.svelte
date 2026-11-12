<script lang="ts">
  let { children } = $props();
</script>

<div class="log">
  {@render children()}
</div>

<style>
  :global(html:has(.log)),
  :global(body:has(.log)) {
    background: var(--home-background);
  }

  .log {
    min-block-size: 100svh;
    padding-block-start: 7rem;
    color: var(--home-foreground);
    color-scheme: var(--home-scheme, light dark);
    background: var(--home-background);
  }

  @media (width <= 700px) {
    .log {
      padding-block-end: 6rem;
    }
  }
</style>
