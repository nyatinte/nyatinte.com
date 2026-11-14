<script lang="ts">
  import "../lib/styles/theme-transition.css";
  import "../lib/styles/home-tokens.css";
  import { onMount } from "svelte";
  import { onNavigate } from "$app/navigation";
  import { page } from "$app/state";
  import HomeNavigation from "../lib/components/home-navigation.svelte";
  import {
    homeThemeMessage,
    nextHomeTheme,
    persistHomeTheme,
    readAppliedHomeTheme,
  } from "../lib/home-theme";
  import { HOME_THEME_COLOR } from "../lib/home-theme-color";
  import {
    homeTransitionDirection,
    shouldStartArticleTransition,
  } from "../lib/log/view-transition";

  let { children } = $props();
  let theme = $state<"light" | "dark" | null>(null);
  let themeMessage = $state("");
  let orbitTurn = $state<number | null>(null);

  onMount(() => {
    theme = readAppliedHomeTheme();
  });

  function toggleTheme() {
    theme = nextHomeTheme(theme);
    orbitTurn = (orbitTurn ?? (theme === "light" ? 180 : 0)) + 180;
    themeMessage = homeThemeMessage(theme);
    persistHomeTheme(theme);
  }

  onNavigate((navigation) => {
    if (!navigation.to) {
      return;
    }
    const from = navigation.from?.url.pathname ?? "";
    const to = navigation.to.url.pathname;
    const direction = homeTransitionDirection(from, to);
    if (
      !(direction || shouldStartArticleTransition(from, to)) ||
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      typeof document.startViewTransition !== "function"
    ) {
      return;
    }

    return new Promise((resolve) => {
      if (direction) {
        document.documentElement.dataset.homeTransition = direction;
      }
      const transition = document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
      transition.finished.finally(() => {
        if (
          direction &&
          document.documentElement.dataset.homeTransition === direction
        ) {
          delete document.documentElement.dataset.homeTransition;
        }
      });
    });
  });
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

<div
  class="site"
  style:--orbit-turn={orbitTurn === null ? undefined : `${orbitTurn}deg`}
>
  {#if page.status < 400}
    <HomeNavigation {toggleTheme} />
    <span aria-live="polite" class="theme-announcement">{themeMessage}</span>
  {/if}
  {@render children()}
</div>

<style>
  @font-face {
    font-family: "M PLUS 1p";
    src: url("../lib/assets/fonts/mplus1p-regular.woff2") format("woff2");
    font-style: normal;
    font-weight: 400 500;
    font-display: swap;
    unicode-range: U+0100-10FFFF;
  }
  @font-face {
    font-family: "M PLUS 1p";
    src: url("../lib/assets/fonts/mplus1p-bold.woff2") format("woff2");
    font-style: normal;
    font-weight: 600 900;
    font-display: swap;
    unicode-range: U+0100-10FFFF;
  }
  @font-face {
    font-family: "M PLUS 1p";
    src: url("../lib/assets/fonts/mplus1p-regular-latin.woff2") format("woff2");
    font-style: normal;
    font-weight: 400 500;
    font-display: optional;
    unicode-range: U+0000-00FF;
  }
  @font-face {
    font-family: "M PLUS 1p";
    src: url("../lib/assets/fonts/mplus1p-bold-latin.woff2") format("woff2");
    font-style: normal;
    font-weight: 600 900;
    font-display: optional;
    unicode-range: U+0000-00FF;
  }
  .site {
    position: relative;
    color: var(--home-foreground);
    color-scheme: var(--home-scheme, light dark);
  }
  .theme-announcement {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    white-space: nowrap;
    clip-path: inset(50%);
  }

  :global(:root::view-transition) {
    background-color: var(--home-background);
  }

  :global(:root::view-transition-group(*)) {
    animation-duration: 240ms;
  }

  :global(:root[data-home-transition]::view-transition-group(*)) {
    animation-duration: 670ms;
  }

  :global(:root::view-transition-group(site-header)) {
    z-index: 10;
  }

  :global(:root[data-home-transition="out"]::view-transition-old(scene-back)),
  :global(:root[data-home-transition="out"]::view-transition-old(scene-middle)),
  :global(:root[data-home-transition="out"]::view-transition-old(scene-front)) {
    animation: scene-out 550ms both cubic-bezier(0.4, 0, 1, 1);
  }
  :global(:root[data-home-transition="in"]::view-transition-new(scene-back)),
  :global(:root[data-home-transition="in"]::view-transition-new(scene-middle)),
  :global(:root[data-home-transition="in"]::view-transition-new(scene-front)) {
    animation: scene-in 600ms both cubic-bezier(0, 0, 0.2, 1);
  }
  :global(:root[data-home-transition]::view-transition-old(scene-middle)),
  :global(:root[data-home-transition]::view-transition-new(scene-middle)) {
    animation-delay: 35ms;
  }
  :global(:root[data-home-transition]::view-transition-old(scene-front)),
  :global(:root[data-home-transition]::view-transition-new(scene-front)) {
    animation-delay: 70ms;
  }
  :global(:root[data-home-transition]::view-transition-old(home-title)),
  :global(:root[data-home-transition]::view-transition-new(home-title)),
  :global(:root[data-home-transition]::view-transition-old(cloud-left)),
  :global(:root[data-home-transition]::view-transition-new(cloud-left)) {
    --travel-x: -100vw;
  }
  :global(:root[data-home-transition]::view-transition-old(cloud-right)),
  :global(:root[data-home-transition]::view-transition-new(cloud-right)) {
    --travel-x: 100vw;
  }
  :global(:root[data-home-transition]::view-transition-old(scene-aurora)),
  :global(:root[data-home-transition]::view-transition-new(scene-aurora)),
  :global(:root[data-home-transition]::view-transition-old(scene-sky)),
  :global(:root[data-home-transition]::view-transition-new(scene-sky)) {
    --travel-y: -100vh;
  }
  :global(:root[data-home-transition]::view-transition-old(scene-sky)),
  :global(:root[data-home-transition]::view-transition-new(scene-sky)) {
    clip-path: inset(0 0 45% 0);
  }
  :global(:root[data-home-transition="out"]::view-transition-old(home-title)),
  :global(:root[data-home-transition="out"]::view-transition-old(cloud-left)),
  :global(:root[data-home-transition="out"]::view-transition-old(cloud-right)),
  :global(:root[data-home-transition="out"]::view-transition-old(scene-aurora)),
  :global(:root[data-home-transition="out"]::view-transition-old(scene-sky)) {
    animation: detail-out 550ms both cubic-bezier(0.4, 0, 1, 1);
  }
  :global(:root[data-home-transition="in"]::view-transition-new(home-title)),
  :global(:root[data-home-transition="in"]::view-transition-new(cloud-left)),
  :global(:root[data-home-transition="in"]::view-transition-new(cloud-right)),
  :global(:root[data-home-transition="in"]::view-transition-new(scene-aurora)),
  :global(:root[data-home-transition="in"]::view-transition-new(scene-sky)) {
    animation: detail-in 600ms both cubic-bezier(0, 0, 0.2, 1);
  }
  @keyframes detail-out {
    to {
      transform: translate(var(--travel-x, 0), var(--travel-y, 0));
    }
  }
  @keyframes detail-in {
    from {
      transform: translate(var(--travel-x, 0), var(--travel-y, 0));
    }
  }
  @keyframes scene-out {
    to {
      transform: translateY(100vh);
    }
  }
  @keyframes scene-in {
    from {
      transform: translateY(100vh);
    }
  }

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
