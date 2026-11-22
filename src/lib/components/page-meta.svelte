<script lang="ts">
  import type { ResolvedOgImage } from "../log/og-image";

  let {
    canonicalUrl,
    description,
    image,
    ogTitle,
    ogType = "website",
    title,
  }: {
    canonicalUrl: string;
    description: string;
    image: ResolvedOgImage;
    ogTitle?: string;
    ogType?: "article" | "website";
    title: string;
  } = $props();

  const shareTitle = $derived(ogTitle ?? title);
</script>

<svelte:head>
  <title>{title}</title>
  <meta content={description} name="description">
  <link href={canonicalUrl} rel="canonical">
  <link
    href="https://nyatinte.com/log/rss.xml"
    rel="alternate"
    title="ログ"
    type="application/rss+xml"
  >
  <meta content={shareTitle} property="og:title">
  <meta content={description} property="og:description">
  <meta content={canonicalUrl} property="og:url">
  <meta content={ogType} property="og:type">
  <meta content={image.url} property="og:image">
  {#if image.type}
    <meta content={image.type} property="og:image:type">
  {/if}
  {#if image.width}
    <meta content={image.width} property="og:image:width">
  {/if}
  {#if image.height}
    <meta content={image.height} property="og:image:height">
  {/if}
  <meta content={image.alt} property="og:image:alt">
  <meta content="summary_large_image" name="twitter:card">
  <meta content="@nyatinte" name="twitter:site">
  <meta content={shareTitle} name="twitter:title">
  <meta content={description} name="twitter:description">
  <meta content={image.url} name="twitter:image">
  <meta content={image.alt} name="twitter:image:alt">
</svelte:head>
