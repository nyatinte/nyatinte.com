<script lang="ts">
  import { onMount } from "svelte";
  import latinBold from "../lib/assets/fonts/mplus1p-bold-latin.woff2";
  import latinRegular from "../lib/assets/fonts/mplus1p-regular-latin.woff2";
  import HomeNavigation from "../lib/components/home-navigation.svelte";
  import IcebergScene from "../lib/components/iceberg-scene.svelte";
  import JsonLd from "../lib/components/json-ld.svelte";
  import {
    homeThemeMessage,
    nextHomeTheme,
    persistHomeTheme,
    readAppliedHomeTheme,
  } from "../lib/home-theme";
  import { HOME_THEME_COLOR } from "../lib/home-theme-color";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();

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
</script>

<JsonLd graphs={data.jsonLd} />

<svelte:head>
  <title>nyatinte</title>
  <meta content={data.siteDescription} name="description">
  <link href={data.canonicalUrl} rel="canonical">
  <meta content="nyatinte.com" property="og:title">
  <meta content={data.siteDescription} property="og:description">
  <meta content={data.canonicalUrl} property="og:url">
  <meta content="website" property="og:type">
  <meta content={data.ogImageUrl} property="og:image">
  <meta content="image/png" property="og:image:type">
  <meta content="1200" property="og:image:width">
  <meta content="630" property="og:image:height">
  <meta
    content="氷河にいる親子ペンギンと nyatinte.com の文字"
    property="og:image:alt"
  >
  <meta content="summary_large_image" name="twitter:card">
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
  <link
    as="image"
    fetchpriority="high"
    href="/images/adult-penguin.png"
    rel="preload"
  >
  <link as="image" href="/images/chick-penguin.png" rel="preload">
  <link
    as="font"
    crossorigin="anonymous"
    href={latinRegular}
    rel="preload"
    type="font/woff2"
  >
  <link
    as="font"
    crossorigin="anonymous"
    href={latinBold}
    rel="preload"
    type="font/woff2"
  >
</svelte:head>

<main
  class="home"
  style:--orbit-turn={orbitTurn === null ? undefined : `${orbitTurn}deg`}
  class:day={theme === "light"}
  class:night={theme === "dark"}
>
  <IcebergScene />
  <HomeNavigation {toggleTheme} />
  <span aria-live="polite" class="theme-announcement">{themeMessage}</span>
  <h1>
    Hello<span class="dot">.</span><span class="intro">I'm nyatinte</span>
  </h1>
</main>

<style>
  @layer components {
    :global(html:has(.home)),
    :global(body:has(.home)) {
      background: var(--home-background);
    }
    @scope (.home) {
      :scope {
        --orbit-turn: var(--home-initial-orbit, 0deg);
        --aurora-opacity: var(--home-initial-aurora-opacity, 0);
        position: relative;
        min-block-size: max(100svh, 32rem);
        overflow: hidden;
        color: var(--home-foreground);
        color-scheme: var(--home-scheme, light dark);
        background: var(--home-background);
        isolation: isolate;
        transition:
          color 1.5s ease-in-out,
          background-color 1.5s ease-in-out;
      }
      :scope.day {
        --orbit-turn: 0deg;
        color-scheme: light;
      }
      :scope.night {
        --orbit-turn: 180deg;
        --aurora-opacity: 0.22;
        color-scheme: dark;
      }
      h1 {
        position: absolute;
        inset-block-start: 30%;
        inset-inline-start: clamp(2rem, 8vw, 8rem);
        margin: 0;
        font-size: clamp(4rem, 3rem + 6vw, 9rem);
        font-weight: 400;
        line-height: 1;
        letter-spacing: -0.06em;
      }
      .theme-announcement {
        position: absolute;
        inline-size: 1px;
        block-size: 1px;
        overflow: hidden;
        white-space: nowrap;
        clip-path: inset(50%);
      }
      h1 .dot {
        color: var(--home-accent);
      }
      h1 .intro {
        display: block;
        margin-block-start: 0.4em;
        font-size: clamp(1.5rem, 1rem + 2vw, 3rem);
        letter-spacing: -0.03em;
      }
      @media (prefers-reduced-motion: reduce) {
        :scope {
          transition: none;
        }
      }
      @media (width <= 700px) {
        h1 {
          inset-block-start: 22%;
          inset-inline-start: 1.5rem;
          font-size: clamp(4rem, 2rem + 10vw, 6rem);
        }
      }
    }
  }
</style>
