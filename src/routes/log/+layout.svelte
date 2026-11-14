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
    transition: background-color var(--home-theme-duration)
      var(--home-theme-easing);
  }

  .log {
    min-block-size: 100svh;
    padding-block-start: 7rem;
    color: var(--home-foreground);
    color-scheme: var(--home-scheme, light dark);
    background: var(--home-background);
    transition:
      color var(--home-theme-duration) var(--home-theme-easing),
      background-color var(--home-theme-duration) var(--home-theme-easing);
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
    .log,
    :global(html:has(.log)),
    :global(body:has(.log)) {
      transition: none;
    }

    :global(:root::view-transition-old(*)),
    :global(:root::view-transition-new(*)) {
      animation: none;
    }
  }
</style>
