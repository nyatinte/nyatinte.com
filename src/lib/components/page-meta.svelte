<script lang="ts">
  let {
    canonicalUrl,
    description,
    imageAlt,
    imageHeight,
    imageType,
    imageUrl,
    imageWidth,
    ogType = "website",
    title,
  }: {
    canonicalUrl: string;
    description: string;
    imageAlt: string;
    imageHeight?: string;
    imageType?: string;
    imageUrl: string;
    imageWidth?: string;
    ogType?: "article" | "website";
    title: string;
  } = $props();
</script>

<svelte:head>
  <title>{title}</title>
  <meta content={description} name="description">
  <link href={canonicalUrl} rel="canonical">
  <meta content={title} property="og:title">
  <meta content={description} property="og:description">
  <meta content={canonicalUrl} property="og:url">
  <meta content={ogType} property="og:type">
  <meta content={imageUrl} property="og:image">
  {#if imageType}
    <meta content={imageType} property="og:image:type">
  {/if}
  {#if imageWidth}
    <meta content={imageWidth} property="og:image:width">
  {/if}
  {#if imageHeight}
    <meta content={imageHeight} property="og:image:height">
  {/if}
  <meta content={imageAlt} property="og:image:alt">
  <meta content="summary_large_image" name="twitter:card">
  <meta content={title} name="twitter:title">
  <meta content={description} name="twitter:description">
  <meta content={imageUrl} name="twitter:image">
</svelte:head>
