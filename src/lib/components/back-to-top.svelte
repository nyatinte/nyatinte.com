<script lang="ts">
  import arrowUp from "@tabler/icons/outline/arrow-up.svg?url";
  import { backToTopScrollBehavior, shouldShowBackToTop } from "../back-to-top";

  let scrollY = $state(0);
  const visible = $derived(shouldShowBackToTop(scrollY));

  function prefersReducedMotion() {
    return matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  // 先頭へ戻るとボタンは隠れるため、フォーカスを見出しへ移して読み上げ位置を保つ。
  function focusPageStart() {
    const heading = document.querySelector<HTMLElement>("main h1");
    if (!heading) {
      return;
    }
    heading.tabIndex = -1;
    heading.addEventListener(
      "blur",
      () => {
        heading.removeAttribute("tabindex");
      },
      { once: true }
    );
    heading.focus({ preventScroll: true });
  }

  function backToTop() {
    window.scrollTo({
      behavior: backToTopScrollBehavior(prefersReducedMotion()),
      top: 0,
    });
    focusPageStart();
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
    /* 作者の display 指定は hidden 属性より優先されるため、明示的に消す。 */
    .back-to-top[hidden] {
      display: none;
    }
    .back-to-top:hover {
      background: var(--home-nav-current);
    }
    .back-to-top:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: 4px;
    }
    .icon {
      inline-size: 1.25rem;
      block-size: 1.25rem;
      background: currentColor;
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
    /* モバイルの下部固定ナビの上へ逃がす。 */
    @media (width <= 700px) and (height > 420px) {
      .back-to-top {
        inset-block-end: calc(max(1rem, env(safe-area-inset-bottom)) + 4.5rem);
        inset-inline-end: max(1rem, env(safe-area-inset-right));
      }
    }
    /* 高さが低いとナビは通常配置に戻るので、元の位置へ下げる。 */
    @media (height <= 420px) {
      .back-to-top {
        inset-block-end: max(0.75rem, env(safe-area-inset-bottom));
        inset-inline-end: max(0.75rem, env(safe-area-inset-right));
      }
    }
  }
</style>
