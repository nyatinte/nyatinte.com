<script lang="ts">
  import github from "@tabler/icons/outline/brand-github.svg?url";
  import x from "@tabler/icons/outline/brand-x.svg?url";
  import moonIcon from "@tabler/icons/outline/moon.svg?url";
  import sunIcon from "@tabler/icons/outline/sun.svg?url";
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import {
    homeThemeMessage,
    nextHomeTheme,
    persistHomeTheme,
    readAppliedHomeTheme,
  } from "../home-theme";
  import { HOME_THEME_COLOR } from "../home-theme-color";

  let theme = $state<"light" | "dark" | null>(null);
  let themeMessage = $state("");
  const onIndex = $derived(page.url.pathname === "/log");

  onMount(() => {
    theme = readAppliedHomeTheme();
  });

  function toggleTheme() {
    theme = nextHomeTheme(theme);
    themeMessage = homeThemeMessage(theme);
    persistHomeTheme(theme);
  }
</script>

<svelte:head>
  <meta content="light dark" name="color-scheme">
  {#if theme === null}
    <meta
      content={HOME_THEME_COLOR.light}
      media="(prefers-color-scheme: light)"
      name="theme-color"
    >
    <meta
      content={HOME_THEME_COLOR.dark}
      media="(prefers-color-scheme: dark)"
      name="theme-color"
    >
  {:else}
    <meta content={HOME_THEME_COLOR[theme]} name="theme-color">
  {/if}
</svelte:head>

<header class="log-header">
  <a class="wordmark" href="/">nyatinte.com</a>
  <nav aria-label="メインナビゲーション">
    <a aria-current={onIndex ? "page" : undefined} href="/log">ログ</a>
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
      onclick={toggleTheme}
      title="ライト・ダークを切り替え"
      type="button"
    >
      <span
        aria-hidden="true"
        class="icon theme-icon"
        style:mask-image={`url("${sunIcon}")`}
      ></span>
      <span
        aria-hidden="true"
        class="icon theme-icon"
        style:mask-image={`url("${moonIcon}")`}
      ></span>
    </button>
  </nav>
  <span aria-live="polite" class="theme-announcement">{themeMessage}</span>
</header>

<style>
  .log-header {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem 1.5rem;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem clamp(1.25rem, 4vw, 2.5rem);
  }

  .wordmark {
    font-size: 1.125rem;
    font-weight: 700;
    color: inherit;
    letter-spacing: -0.04em;
    text-decoration: none;
  }

  nav {
    display: flex;
    gap: 0.35rem;
    align-items: center;
  }

  nav a,
  nav button {
    display: flex;
    align-items: center;
    justify-content: center;
    min-inline-size: 2.75rem;
    block-size: 2.75rem;
    padding-inline: 0.85rem;
    font: inherit;
    color: inherit;
    text-decoration: none;
    cursor: pointer;
    background: transparent;
    border: 0;
    border-radius: 999px;
  }

  nav a:hover,
  nav button:hover,
  nav a[aria-current="page"] {
    background: var(--home-nav-background);
  }

  .icon {
    inline-size: 1.25rem;
    block-size: 1.25rem;
    background: currentColor;
    mask-repeat: no-repeat;
    mask-position: center;
    mask-size: contain;
  }

  .theme-icon {
    inline-size: 0.9rem;
    block-size: 0.9rem;
  }

  .sr-only,
  .theme-announcement {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    white-space: nowrap;
    clip-path: inset(50%);
  }

  a:focus-visible,
  button:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 4px;
  }

  @media (forced-colors: active) {
    .icon {
      forced-color-adjust: none;
      background: CanvasText;
    }
  }
</style>
