<script lang="ts">
  import github from "@tabler/icons/outline/brand-github.svg?url";
  import x from "@tabler/icons/outline/brand-x.svg?url";
  import house from "@tabler/icons/outline/home.svg?url";
  import moonIcon from "@tabler/icons/outline/moon.svg?url";
  import notebook from "@tabler/icons/outline/notebook.svg?url";
  import sunIcon from "@tabler/icons/outline/sun.svg?url";
  import { page } from "$app/state";

  const isHome = $derived(page.url.pathname === "/");
  const isLogIndex = $derived(
    page.url.pathname === "/log" || page.url.pathname === "/log/"
  );
  const isLogArticle = $derived(
    page.url.pathname.startsWith("/log/") && !isLogIndex
  );
  const isLog = $derived(isLogIndex || isLogArticle);
  const logAriaCurrent = $derived.by(() => {
    if (isLogIndex) {
      return "page";
    }
    if (isLogArticle) {
      return "location";
    }
  });

  let { toggleTheme }: { toggleTheme: () => void } = $props();
</script>

<header class="header">
  <a class="wordmark" href="/">nyatinte.com</a>
  <nav aria-label="メインナビゲーション" class="navigation">
    <a
      aria-current={isHome ? "page" : undefined}
      aria-label="ホーム"
      href="/"
      title="ホーム"
      class:current={isHome}
    >
      <span
        aria-hidden="true"
        class="icon"
        style:mask-image={`url("${house}")`}
      ></span>
      <span class="sr-only">ホーム</span>
    </a>
    <a aria-label="GitHub" href="https://github.com/nyatinte" title="GitHub">
      <span
        aria-hidden="true"
        class="icon"
        style:mask-image={`url("${github}")`}
      ></span>
      <span class="sr-only">GitHub</span>
    </a>
    <a
      aria-label="X: @nyatinte"
      href="https://x.com/nyatinte"
      title="X: @nyatinte"
    >
      <span
        aria-hidden="true"
        class="icon"
        style:mask-image={`url("${x}")`}
      ></span>
      <span class="sr-only">X: @nyatinte</span>
    </a>
    <button
      aria-label="ライト・ダークを切り替え"
      class="theme-toggle"
      onclick={toggleTheme}
      title="ライト・ダークを切り替え"
      type="button"
    >
      <span
        aria-hidden="true"
        class="icon"
        style:mask-image={`url("${sunIcon}")`}
      ></span>
      <span
        aria-hidden="true"
        class="icon"
        style:mask-image={`url("${moonIcon}")`}
      ></span>
    </button>
    <a
      aria-current={logAriaCurrent}
      aria-label="ログ"
      href="/log"
      title="ログ"
      class:current={isLog}
    >
      <span
        aria-hidden="true"
        class="icon"
        style:mask-image={`url("${notebook}")`}
      ></span>
      <span class="sr-only">ログ</span>
    </a>
  </nav>
</header>

<style>
  @layer components {
    @scope (.header) {
      :scope {
        position: absolute;
        inset: 0 0 auto;
        z-index: 2;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 2rem clamp(2rem, 6vw, 6rem);
        view-transition-name: site-header;
      }
      .wordmark {
        font-size: 1.125rem;
        font-weight: 700;
        color: inherit;
        letter-spacing: -0.04em;
        text-decoration: none;
      }
      .navigation {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }
      .navigation a,
      .navigation button {
        display: flex;
        align-items: center;
        justify-content: center;
        min-inline-size: 3rem;
        block-size: 3rem;
        color: inherit;
        text-decoration: none;
        cursor: pointer;
        background: transparent;
        border: 0;
        border-radius: 3rem;
      }
      .navigation a:hover,
      .navigation button:hover,
      .navigation .current {
        background: var(--home-nav-background);
      }
      .theme-toggle {
        gap: 0.125rem;
      }
      .icon {
        inline-size: 1.25rem;
        block-size: 1.25rem;
        background: currentColor;
        mask-repeat: no-repeat;
        mask-position: center;
        mask-size: contain;
      }
      .theme-toggle .icon {
        inline-size: 0.9rem;
        block-size: 0.9rem;
      }
      @media (forced-colors: active) {
        .icon {
          forced-color-adjust: none;
          background: CanvasText;
        }
      }
      .sr-only {
        position: absolute;
        inline-size: 1px;
        block-size: 1px;
        overflow: hidden;
        font-family: sans-serif;
        white-space: nowrap;
        clip-path: inset(50%);
      }
      a:focus-visible,
      button:focus-visible {
        outline: 2px solid currentColor;
        outline-offset: 4px;
      }
      @media (height <= 420px) {
        :scope {
          position: relative;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .navigation {
          position: static;
          transform: none;
        }
      }
      @media (width <= 700px) {
        :scope {
          padding: 1.5rem;
        }
        .navigation {
          position: fixed;
          inset-block-end: max(1rem, env(safe-area-inset-bottom));
          inset-inline-start: 50%;
          gap: 0.25rem;
          padding: 0.375rem;
          background: var(--home-nav-background);
          border: 1px solid var(--home-nav-border);
          border-radius: 3rem;
          transform: translateX(-50%);
        }
        .navigation .current {
          background: var(--home-nav-current);
        }
        @media (height <= 420px) {
          .navigation {
            position: static;
            transform: none;
          }
        }
      }
      @media (width < 240px) {
        .navigation {
          flex-wrap: wrap;
          justify-content: center;
          max-inline-size: calc(100vw - 1rem);
        }
      }
      @media (width <= 380px) {
        @media (height <= 420px) {
          :scope {
            padding-inline: 0.25rem;
          }
        }
        .navigation {
          gap: 0;
          padding: 0.125rem;
        }
        .navigation a,
        .navigation button {
          min-inline-size: 2.75rem;
          block-size: 2.75rem;
        }
      }
    }
  }
</style>
