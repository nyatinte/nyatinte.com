<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import JsonLd from "../../lib/components/json-ld.svelte";
  import LogSearch from "../../lib/components/log-search.svelte";
  import PageMeta from "../../lib/components/page-meta.svelte";
  import { logDescription, logTitle } from "../../lib/log/constants";
  import { formatLogDate } from "../../lib/log/format-date";
  import { searchArticles } from "../../lib/log/search";
  import {
    articleDateTransitionName,
    articleTransitionName,
  } from "../../lib/log/view-transition";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
  const title = `${logTitle} | nyatinte.com`;

  const query = $derived(page.url.searchParams.get("q") ?? "");
  const visibleArticles = $derived(searchArticles(data.articles, query));

  function updateQuery(value: string) {
    const url = new URL(page.url.href);
    if (value.trim()) {
      url.searchParams.set("q", value);
    } else {
      url.searchParams.delete("q");
    }
    goto(url, { replace: true, reset: false });
  }
</script>

<JsonLd graphs={data.jsonLd} />
<PageMeta
  canonicalUrl={data.canonicalUrl}
  description={logDescription}
  imageAlt={data.image.alt}
  imageHeight={data.image.height}
  imageType={data.image.type}
  imageUrl={data.image.url}
  imageWidth={data.image.width}
  {title}
/>

<main class="log-index">
  <h1>{logTitle}</h1>
  <p class="lead">{logDescription}</p>
  {#if data.articles.length === 0}
    <p>記事はまだありません。</p>
  {:else}
    <LogSearch
      onQueryChange={updateQuery}
      {query}
      resultCount={visibleArticles.length}
      totalCount={data.articles.length}
    />
    {#if visibleArticles.length === 0}
      <p class="empty">
        「{query}」に一致する記事はありません。
        <a href="/log">すべての記事を見る</a>
      </p>
    {:else}
      <!-- biome-ignore lint/a11y/noRedundantRoles: Safari drops the list role when list-style is none. -->
      <ol role="list">
        {#each visibleArticles as article (article.slug)}
          <li>
            <time
              datetime={article.date}
              style:view-transition-name={articleDateTransitionName(article.slug)}
              >{formatLogDate(article.date)}</time
            >
            <h2
              style:view-transition-name={articleTransitionName(article.slug)}
            >
              <a href={`/log/${article.slug}`}>{article.title}</a>
            </h2>
            <p>{article.description}</p>
          </li>
        {/each}
      </ol>
    {/if}
  {/if}
</main>

<style>
  .log-index {
    width: min(40rem, calc(100% - 2.5rem));
    padding-block: 1rem 4rem;
    margin-inline: auto;
  }

  h1 {
    margin: 0;
    font-size: clamp(2.5rem, 2rem + 2vw, 4rem);
    font-weight: 400;
    line-height: 1.1;
    letter-spacing: -0.05em;
  }

  .lead {
    margin: 0.8rem 0 2.5rem;
    font-size: 1.05rem;
  }

  .empty {
    margin: 0;
  }

  ol {
    display: grid;
    gap: 2rem;
    padding: 0;
    margin: 0;
    list-style: none;
  }

  time {
    font-size: 0.9rem;
    letter-spacing: 0.01em;
  }

  h2 {
    margin: 0.3rem 0 0.45rem;
    font-size: clamp(1.4rem, 1.2rem + 0.6vw, 1.8rem);
    font-weight: 600;
    line-height: 1.3;
    letter-spacing: -0.03em;
  }

  h2 a {
    color: inherit;
    text-decoration-thickness: 1px;
    text-underline-offset: 0.18em;
  }

  h2 a:hover {
    color: var(--home-accent);
  }

  li p {
    margin: 0;
  }

  a:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 4px;
  }
</style>
