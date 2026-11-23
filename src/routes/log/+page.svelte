<script lang="ts">
  import { page } from "$app/state";
  import JsonLd from "../../lib/components/json-ld.svelte";
  import LogArticleTitle from "../../lib/components/log-article-title.svelte";
  import LogSearch from "../../lib/components/log-search.svelte";
  import PageMeta from "../../lib/components/page-meta.svelte";
  import Pagination from "../../lib/components/pagination.svelte";
  import RssLink from "../../lib/components/rss-link.svelte";
  import { logDescription, logTitle } from "../../lib/log/constants";
  import { formatLogDate } from "../../lib/log/format-date";
  import { logPageTitle } from "../../lib/log/pagination";
  import {
    articleDateTransitionName,
    articleTransitionName,
  } from "../../lib/log/view-transition";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
  const title = $derived(logPageTitle(data.currentPage));
  const searching = $derived(
    (page.url.searchParams.get("q") ?? "").trim() !== ""
  );
</script>

<JsonLd graphs={data.jsonLd} />
<PageMeta
  canonicalUrl={data.canonicalUrl}
  description={logDescription}
  image={data.image}
  {title}
/>

<main class="log-index">
  <h1>{logTitle}</h1>
  <p class="lead">{logDescription}</p>
  <div class="subscribe"><RssLink /></div>
  <LogSearch />
  {#if !searching}
    {#if data.articles.length === 0}
      <p>記事はまだありません。</p>
    {:else}
      <!-- Safari drops the list role when list-style is none. -->
      <ol role="list">
        {#each data.articles as article (article.slug)}
          <li>
            <time
              datetime={article.date}
              style:view-transition-name={articleDateTransitionName(article.slug)}
              >{formatLogDate(article.date)}</time
            >
            <LogArticleTitle
              href={`/log/${article.slug}`}
              title={article.title}
              transitionName={articleTransitionName(article.slug)}
            />
            <p>{article.description}</p>
          </li>
        {/each}
      </ol>
      {#if data.totalPages > 1}
        <Pagination
          currentPage={data.currentPage}
          totalPages={data.totalPages}
        />
      {/if}
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
    margin: 0.8rem 0 1rem;
    font-size: 1.05rem;
  }

  .subscribe {
    margin: 0 0 2.5rem;
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

  li p {
    margin: 0;
  }
</style>
