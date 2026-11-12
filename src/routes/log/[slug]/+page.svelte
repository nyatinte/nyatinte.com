<script lang="ts">
  import ArticleToc from "../../../lib/components/article-toc.svelte";
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

<div class="layout">
  <main class="article">
    <div class="article-header">
      <p class="back"><a href="/log">ログへ</a></p>
      <h1 style:view-transition-name={articleTransitionName(data.article.slug)}>
        {data.article.title}
      </h1>
      <div class="article-meta">
        <div class="dates">
          <time datetime={data.article.date}
            >{formatLogDate(data.article.date)}</time
          >
          {#if data.article.updated}
            <p class="updated">
              更新
              <time datetime={data.article.updated}
                >{formatLogDate(data.article.updated)}</time
              >
            </p>
          {/if}
        </div>
        <CopyMdxButton source={data.article.source} />
      </div>
    </div>
    <div class="article-body" data-log-article-end>
      <p class="description">{data.article.description}</p>
      {#if Body}
        <div class="prose">
          <Body />
        </div>
      {/if}
    </div>
  </main>
  {#if data.headings.length}
    <ArticleToc headings={data.headings} />
  {/if}
</div>

<style>
  .layout {
    position: relative;
  }
  .article {
    width: min(40rem, calc(100vw - 2.5rem));
    padding-block: 0.5rem 4rem;
    margin-inline: auto;
  }

  .article-header,
  .article-body {
    grid-column: 2;
    width: min(40rem, calc(100vw - 2.5rem));
    margin-inline: auto;
  }

  .back {
    margin: 0 0 1.5rem;
  }

  .back a {
    color: inherit;
  }

  .dates time,
  .updated {
    font-size: 0.9rem;
  }

  .updated {
    margin: 0.35rem 0 0;
  }

  h1 {
    margin: 0.6rem 0 0.5rem;
    font-size: clamp(2rem, 1.5rem + 2vw, 3.2rem);
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: -0.04em;
  }

  .article-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: center;
    justify-content: space-between;
    margin-block-end: 1rem;
  }

  .dates {
    min-width: 0;
  }

  @media (max-width: 1149px) {
    .article-body {
      padding-inline-end: 2rem;
    }
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
    scroll-margin-block-start: 6rem;
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

  @media (min-width: 1150px) {
    .layout {
      display: grid;
      grid-template-columns: minmax(1rem, 1fr) minmax(0, 40rem) minmax(
          10rem,
          14rem
        ) minmax(1rem, 1fr);
      column-gap: 2rem;
    }

    .article {
      display: contents;
    }

    .article-header {
      grid-row: 1;
      padding-block-start: 0.5rem;
    }

    .article-body {
      grid-row: 2;
      padding-block-end: 4rem;
    }
  }

  :global(html) {
    scroll-behavior: smooth;
  }

  @media (prefers-reduced-motion: reduce) {
    :global(html) {
      scroll-behavior: auto;
    }
  }

  a:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 4px;
  }
</style>
