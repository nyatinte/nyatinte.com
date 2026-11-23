<script lang="ts">
  import arrowUp from "@tabler/icons/outline/arrow-up.svg?url";
  import { backToTopScrollBehavior, shouldShowBackToTop } from "../back-to-top";

  let scrollY = $state(0);
  const visible = $derived(shouldShowBackToTop(scrollY));

  function prefersReducedMotion() {
    return matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function backToTop() {
    window.scrollTo({
      behavior: backToTopScrollBehavior(prefersReducedMotion()),
      top: 0,
    });
    document
      .querySelector<HTMLElement>("header .wordmark")
      ?.focus({ preventScroll: true });
  }
</script>

<svelte:window bind:scrollY />

<button
  aria-label="ページの先頭へ戻る"
  class="back-to-top"
  hidden={!visible}
  onclick={backToTop}
  title="ページの先頭へ戻る"
  type="button"
  style:--back-to-top-icon={`url("${arrowUp}")`}
>
  <span aria-hidden="true" class="icon"></span>
</button>

<style>
  @layer components {
    .back-to-top {
      position: fixed;
      inset-block-end: max(1.5rem, env(safe-area-inset-bottom));
      inset-inline-end: max(1.5rem, env(safe-area-inset-right));
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: center;
      inline-size: 3rem;
      block-size: 3rem;
      color: inherit;
      cursor: pointer;
      background: var(--home-nav-background);
      border: 1px solid var(--home-nav-border);
      border-radius: 3rem;
    }
    .back-to-top[hidden] {
      display: none;
    }
    .back-to-top:hover {
      background: var(--home-nav-current);
    }
    .back-to-top:focus-visible {
      outline: 2px solid currentcolor;
      outline-offset: 4px;
    }
    .icon {
      inline-size: 1.25rem;
      block-size: 1.25rem;
      background: currentcolor;
      mask-image: var(--back-to-top-icon);
      mask-repeat: no-repeat;
      mask-position: center;
      mask-size: contain;
    }
    @media (forced-colors: active) {
      .icon {
        forced-color-adjust: none;
        background: CanvasText;
      }
    }
    @media (width <= 700px) and (height > 420px) {
      .back-to-top {
        inset-block-end: calc(max(1rem, env(safe-area-inset-bottom)) + 4.5rem);
        inset-inline-end: max(1rem, env(safe-area-inset-right));
      }
    }
    @media (height <= 420px) {
      .back-to-top {
        inset-block-end: max(0.75rem, env(safe-area-inset-bottom));
        inset-inline-end: max(0.75rem, env(safe-area-inset-right));
      }
    }
  }
</style>
