<script lang="ts">
  import latinBold from "../lib/assets/fonts/mplus1p-bold-latin.woff2";
  import latinRegular from "../lib/assets/fonts/mplus1p-regular-latin.woff2";
  import IcebergScene from "../lib/components/iceberg-scene.svelte";
  import JsonLd from "../lib/components/json-ld.svelte";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
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

<main class="home">
  <IcebergScene />
  <h1>
    Hello<span class="dot">.</span><span class="intro">I'm nyatinte</span>
  </h1>
</main>

<style>
  @layer components {
    :global(html:has(.home)) {
      background: var(--home-background);
    }
    @scope (.home) {
      :scope {
        --aurora-opacity: var(--home-initial-aurora-opacity, 0);
        position: relative;
        min-block-size: max(100svh, 32rem);
        overflow: hidden;
        background: var(--home-background);
        isolation: isolate;
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
        view-transition-name: home-title;
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
