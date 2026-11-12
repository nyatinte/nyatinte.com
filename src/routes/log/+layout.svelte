<script lang="ts">
  import { onNavigate } from "$app/navigation";
  import LogHeader from "../../lib/components/log-header.svelte";
  import { shouldStartArticleTransition } from "../../lib/log/view-transition";

  let { children } = $props();

  onNavigate((navigation) => {
    if (!navigation.to) {
      return;
    }
    const from = navigation.from?.url.pathname ?? "";
    if (!shouldStartArticleTransition(from, navigation.to.url.pathname)) {
      return;
    }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    if (typeof document.startViewTransition !== "function") {
      return;
    }
    return new Promise((resolve) => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });
</script>

<div class="log">
  <LogHeader />
  {@render children()}
</div>

<style>
  :global(html:has(.log)),
  :global(body:has(.log)) {
    background: var(--home-background);
  }

  .log {
    min-block-size: 100svh;
    color: var(--home-foreground);
    color-scheme: var(--home-scheme, light dark);
    background: var(--home-background);
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
