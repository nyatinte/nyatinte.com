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
    background: var(--home-background);
  }

  @media (width <= 700px) {
    .log {
      padding-block: 5rem 6rem;
    }
  }

  @media (height <= 420px) {
    .log {
      padding-block: 0;
    }
  }
</style>
