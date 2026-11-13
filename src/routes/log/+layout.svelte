<script lang="ts">
  import { onMount } from "svelte";
  import { registerDocumentTransitionGuards } from "../../lib/log/document-transition";

  let { children } = $props();

  onMount(registerDocumentTransitionGuards);
</script>

<div class="log">
  {@render children()}
</div>

<style>
  @media (prefers-reduced-motion: no-preference) {
    @view-transition {
      navigation: auto;
    }
  }

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
      padding-block-start: 5rem;
      padding-block-end: 6rem;
    }
  }

  @media (height <= 420px) {
    .log {
      padding-block-start: 0;
      padding-block-end: 0;
    }
  }

  :global(:root::view-transition-group(*)) {
    animation-duration: 240ms;
  }

  @media (prefers-reduced-motion: reduce) {
    :global(:root::view-transition-old(*)),
    :global(:root::view-transition-new(*)) {
      animation: none;
    }
  }
</style>
