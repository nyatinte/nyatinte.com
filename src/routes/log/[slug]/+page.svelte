<script lang="ts">
  import CopyMdxButton from "../../../lib/components/copy-mdx-button.svelte";
  import JsonLd from "../../../lib/components/json-ld.svelte";
  import PageMeta from "../../../lib/components/page-meta.svelte";
  import { articleComponent } from "../../../lib/log/components";
  import { formatLogDate } from "../../../lib/log/format-date";
  import { articleTransitionName } from "../../../lib/log/view-transition";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
  const title = $derived(`${data.article.title} | nyatinte.com`);
  const Body = $derived(articleComponent(data.article.slug));
</script>

<JsonLd graphs={data.jsonLd} />
<PageMeta
  canonicalUrl={data.canonicalUrl}
  description={data.article.description}
  imageAlt={data.image.alt}
  imageHeight={data.image.height}
  imageType={data.image.type}
  imageUrl={data.image.url}
  imageWidth={data.image.width}
  ogType="article"
  {title}
/>

<main class="article">
  <p class="back"><a href="/log">ログへ</a></p>
  <time datetime={data.article.date}>{formatLogDate(data.article.date)}</time>
  {#if data.article.updated}
    <p class="updated">
      更新
      <time datetime={data.article.updated}
        >{formatLogDate(data.article.updated)}</time
      >
    </p>
  {/if}
  <h1 style:view-transition-name={articleTransitionName(data.article.slug)}>
    {data.article.title}
  </h1>
  <p class="description">{data.article.description}</p>
  {#if Body}
    <div class="prose">
      <Body />
    </div>
  {/if}
  <CopyMdxButton source={data.article.source} />
</main>

<style>
  .article {
    width: min(40rem, calc(100% - 2.5rem));
    padding-block: 0.5rem 4rem;
    margin-inline: auto;
  }

  .back {
    margin: 0 0 1.5rem;
  }

  .back a {
    color: inherit;
  }

  time,
  .updated {
    font-size: 0.9rem;
  }

  .updated {
    margin: 0.35rem 0 0;
  }

  h1 {
    margin: 0.6rem 0 0.8rem;
    font-size: clamp(2rem, 1.5rem + 2vw, 3.2rem);
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: -0.04em;
  }

  .description {
    margin: 0 0 2rem;
    font-size: 1.05rem;
  }

  .prose :global(p),
  .prose :global(ul),
  .prose :global(ol),
  .prose :global(pre),
  .prose :global(blockquote) {
    margin: 0 0 1rem;
  }

  .prose :global(h2),
  .prose :global(h3) {
    margin: 2rem 0 0.7rem;
    font-weight: 600;
    line-height: 1.3;
    letter-spacing: -0.03em;
  }

  .prose :global(a) {
    color: inherit;
  }

  .prose :global(a:hover) {
    color: var(--home-accent);
  }

  .prose :global(code) {
    padding: 0.1em 0.3em;
    background: var(--home-nav-background);
    border-radius: 0.3rem;
  }

  .prose :global(pre) {
    padding: 1rem;
    overflow: auto;
    background: var(--home-nav-background);
    border-radius: 0.6rem;
  }

  .prose :global(pre code) {
    padding: 0;
    background: transparent;
  }

  .prose :global(img) {
    max-inline-size: 100%;
    block-size: auto;
  }

  a:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 4px;
  }
</style>
