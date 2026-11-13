<script lang="ts">
  import { onMount } from "svelte";
  import {
    homeThemeMessage,
    nextHomeTheme,
    persistHomeTheme,
    readAppliedHomeTheme,
  } from "../home-theme";
  import { HOME_THEME_COLOR } from "../home-theme-color";
  import HomeNavigation from "./home-navigation.svelte";

  let theme = $state<"light" | "dark" | null>(null);
  let themeMessage = $state("");

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

<HomeNavigation {toggleTheme} />
<span aria-live="polite" class="theme-announcement">{themeMessage}</span>

<style>
  .theme-announcement {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    white-space: nowrap;
    clip-path: inset(50%);
  }
</style>
