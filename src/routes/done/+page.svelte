<script lang="ts">
  import SiteHeader from "../../lib/components/site-header.svelte";
  import type { PageProps } from "./$types";
  import AchievementCard from "./achievement-card.svelte";
  import AchievementFilter from "./achievement-filter.svelte";

  let { data }: PageProps = $props();

  function nextPageHref() {
    const params = new URLSearchParams();
    for (const tag of data.selectedTags) {
      params.append("tag", tag);
    }
    if (data.nextCursor) {
      params.set("cursor", data.nextCursor);
    }
    return `/done?${params.toString()}`;
  }
</script>

<svelte:head>
  <title>やったこと | nyatinte.com</title>
  <meta
    content="nyatinte が取り組んだことを、日付とタグでまとめています。"
    name="description"
  >
  <link href={data.canonicalUrl} rel="canonical">
  <meta content="やったこと | nyatinte.com" property="og:title">
  <meta
    content="nyatinte が取り組んだことを、日付とタグでまとめています。"
    property="og:description"
  >
  <meta content={data.canonicalUrl} property="og:url">
  <meta content="website" property="og:type">
  <meta content={data.ogImageUrl} property="og:image">
  <meta content="1200" property="og:image:width">
  <meta content="630" property="og:image:height">
  <meta content="nyatinte.com の実績一覧" property="og:image:alt">
  <meta content="summary_large_image" name="twitter:card">
</svelte:head>

<div class="site-shell">
  <SiteHeader><span class="header-label">やったこと</span></SiteHeader>
  <main>
    <section aria-labelledby="page-title" class="intro">
      <p class="eyebrow">LOGBOOK <span>—</span> 取り組みの記録</p>
      <h1 id="page-title">やったこと</h1>
      <p class="intro-copy">小さな前進を、日付と一緒に記録しています。</p>
    </section>
    <AchievementFilter selected={data.selectedTags} tags={data.availableTags} />
    <section aria-label="実績一覧" class="entries">
      {#if data.items.length > 0}
        <ol>
          {#each data.items as item (item.id)}
            <li><AchievementCard {item} /></li>
          {/each}
        </ol>
      {:else}
        <div class="empty-state">
          <p>
            {data.selectedTags.length > 0
    ? "条件に合う記録はありません。"
    : "実績はまだありません。"}
          </p>
          {#if data.selectedTags.length > 0}
            <a href="/done">絞り込みを解除</a>
          {/if}
        </div>
      {/if}
      {#if data.nextCursor}
        <a class="more-link" href={nextPageHref()}
          >もっと見る <span aria-hidden="true">↓</span></a
        >
      {/if}
    </section>
  </main>
  <footer>
    <span>nyatinte.com</span><span>記録は新しい日付から表示しています。</span>
  </footer>
</div>

<style>
  @layer components {
    @scope (.site-shell) to (.filter, .entry) {
      :scope {
        inline-size: min(100% - 2.5rem, 47.5rem);
        margin-inline: auto;
      }
      .header-label,
      .eyebrow,
      footer {
        font-size: clamp(0.75rem, 0.73rem + 0.08cqi, 0.8125rem);
        color: oklch(48% 0.02 150);
      }
      .intro {
        padding-block: clamp(3rem, 2rem + 3cqi, 4rem)
          clamp(2rem, 1rem + 2cqi, 2.75rem);
      }
      .eyebrow {
        margin: 0 0 0.75rem;
        font-weight: 600;
        span {
          color: oklch(50% 0.1 155);
        }
      }
      h1 {
        margin: 0 0 0.75rem;
        font-size: clamp(2.125rem, 1.5rem + 3cqi, 3rem);
        font-weight: 600;
        line-height: 1.2;
        color: oklch(27% 0.025 150);
        text-wrap: balance;
      }
      .intro-copy {
        margin: 0;
        font-size: clamp(0.9375rem, 0.9rem + 0.1cqi, 1rem);
        line-height: 1.8;
        color: oklch(48% 0.02 150);
        text-wrap: pretty;
      }
      ol {
        padding: 0;
        margin: 0;
        list-style: none;
      }
      .empty-state {
        padding: 2.5rem 1.25rem;
        color: oklch(48% 0.02 150);
        text-align: center;
        border-block-end: 1px solid oklch(90% 0.008 100);
        p {
          margin: 0 0 0.5rem;
        }
        a {
          color: oklch(43% 0.08 155);
        }
      }
      .more-link {
        display: block flex;
        gap: 0.5rem;
        justify-content: center;
        padding: 0.75rem;
        margin-block: 1.5rem 0.25rem;
        color: oklch(40% 0.07 155);
        text-decoration: none;
        border: 1px solid oklch(87% 0.01 145);
        border-radius: 0.375rem;
        &:hover {
          background: oklch(95% 0.015 150);
        }
      }
      footer {
        display: block flex;
        gap: 1rem;
        justify-content: space-between;
        padding-block: 1.75rem 2.25rem;
        border-block-start: 1px solid oklch(88% 0.01 100);
        @media (width <= 35rem) {
          flex-direction: column;
        }
      }
    }
  }
</style>
