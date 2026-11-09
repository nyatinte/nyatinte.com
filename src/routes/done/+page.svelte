<script lang="ts">
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();

  const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "long",
    timeZone: "UTC",
  });

  function formatDate(value: string) {
    return dateFormatter.format(new Date(`${value}T00:00:00.000Z`));
  }

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
  <header class="site-header">
    <a class="wordmark" href="/done">nyatinte.com</a>
    <span class="header-label">やったこと</span>
  </header>

  <main>
    <section aria-labelledby="page-title" class="intro">
      <p class="eyebrow">LOGBOOK <span>—</span> 取り組みの記録</p>
      <h1 id="page-title">やったこと</h1>
      <p class="intro-copy">小さな前進を、日付と一緒に記録しています。</p>
    </section>

    <section aria-labelledby="filter-title" class="filter">
      <div class="filter-heading">
        <h2 id="filter-title">タグで絞り込む</h2>
        {#if data.selectedTags.length > 0}
          <a href="/done">すべて表示</a>
        {/if}
      </div>
      {#if data.availableTags.length > 0}
        <form action="/done" method="GET">
          <fieldset>
            <legend class="visually-hidden">表示するタグ</legend>
            {#each data.availableTags as tag (tag.normalized)}
              <label class="tag-option">
                <input
                  checked={data.selectedTags.includes(tag.normalized)}
                  name="tag"
                  type="checkbox"
                  value={tag.normalized}
                >
                <span>{tag.name}</span>
              </label>
            {/each}
          </fieldset>
          <button type="submit">絞り込む</button>
        </form>
      {:else}
        <p class="empty-tags">タグはまだありません。</p>
      {/if}
    </section>

    <section aria-label="実績一覧" class="entries">
      {#if data.items.length > 0}
        <ol>
          {#each data.items as item (item.id)}
            <li>
              <article class="entry">
                {#if item.coverImageUrl}
                  <div class="cover">
                    <img
                      alt={item.title}
                      loading="lazy"
                      src={item.coverImageUrl}
                    >
                  </div>
                {/if}
                <div class="entry-content">
                  <div class="entry-meta">
                    <time datetime={item.occurredAt}
                      >{formatDate(item.occurredAt)}</time
                    >
                    {#if item.bodyMarkdown}
                      <span class="detail-indicator">詳細あり</span>
                    {/if}
                  </div>
                  <h2><a href={`/done/${item.slug}`}>{item.title}</a></h2>
                  <p class="summary">{item.summary}</p>
                  {#if item.tags.length > 0}
                    <ul aria-label="タグ" class="entry-tags">
                      {#each item.tags as tag (tag.normalized)}
                        <li>{tag.name}</li>
                      {/each}
                    </ul>
                  {/if}
                </div>
              </article>
            </li>
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

  <footer class="site-footer">
    <span>nyatinte.com</span>
    <span>記録は新しい日付から表示しています。</span>
  </footer>
</div>

<style>
  .site-shell {
    width: min(100% - 40px, 760px);
    margin: 0 auto;
  }

  .site-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 72px;
    border-bottom: 1px solid #deded6;
  }

  .wordmark {
    font-size: 15px;
    font-weight: 750;
    color: #24352e;
    letter-spacing: -0.03em;
    text-decoration: none;
  }

  .header-label,
  .eyebrow,
  .entry-meta,
  .site-footer {
    font-size: 12px;
    color: #5d665e;
    letter-spacing: 0.04em;
  }

  .intro {
    padding: 64px 0 42px;
  }

  .eyebrow {
    margin: 0 0 13px;
    font-weight: 650;
  }

  .eyebrow span {
    padding: 0 5px;
    color: #18866c;
  }

  h1,
  h2,
  p {
    margin-top: 0;
  }

  h1 {
    margin-bottom: 10px;
    font-size: clamp(34px, 7vw, 48px);
    font-weight: 700;
    line-height: 1.2;
    color: #1e2d26;
    letter-spacing: -0.06em;
  }

  .intro-copy {
    margin: 0;
    font-size: 15px;
    line-height: 1.8;
    color: #626a63;
  }

  .filter {
    padding: 21px 0 24px;
    border-top: 1px solid #deded6;
    border-bottom: 1px solid #deded6;
  }

  .filter-heading {
    display: flex;
    gap: 16px;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 15px;
  }

  .filter-heading h2 {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    color: #26362e;
  }

  .filter-heading a,
  .empty-state a {
    font-size: 12px;
    color: #176c57;
    text-underline-offset: 3px;
  }

  form fieldset {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 0;
    border: 0;
  }

  .tag-option {
    position: relative;
    cursor: pointer;
  }

  .tag-option input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
  }

  .tag-option span,
  .entry-tags li {
    display: inline-flex;
    align-items: center;
    min-height: 30px;
    padding: 4px 11px;
    font-size: 12px;
    line-height: 1.4;
    color: #4c5d51;
    background: #fffefa;
    border: 1px solid #d9ded6;
    border-radius: 999px;
  }

  .tag-option input:checked + span {
    color: #14563f;
    background: #eaf3ed;
    border-color: #237b62;
  }

  .tag-option input:focus-visible + span {
    outline: 3px solid #83c4a5;
    outline-offset: 2px;
  }

  form button {
    padding: 8px 15px;
    margin-top: 15px;
    font: inherit;
    font-size: 13px;
    font-weight: 650;
    color: white;
    cursor: pointer;
    background: #1c604b;
    border: 0;
    border-radius: 6px;
  }

  form button:hover {
    background: #154c3b;
  }

  .empty-tags {
    margin: 0;
    font-size: 13px;
    color: #70766f;
  }

  .entries ol,
  .entry-tags {
    padding: 0;
    margin: 0;
    list-style: none;
  }

  .entry {
    position: relative;
    display: grid;
    grid-template-columns: 4px minmax(0, 1fr);
    gap: 22px;
    padding: 25px 0 27px;
    border-bottom: 1px solid #e5e4dc;
  }

  .entry::before {
    position: absolute;
    top: 28px;
    bottom: 28px;
    left: 0;
    width: 2px;
    content: "";
    background: #87b69d;
    border-radius: 2px;
  }

  .entry:has(.cover) {
    grid-template-columns: minmax(0, 1fr) 132px;
  }

  .entry:has(.cover)::before {
    left: 0;
  }

  .entry-content {
    grid-column: 2;
    min-width: 0;
  }

  .entry:has(.cover) .entry-content {
    grid-column: 1;
    padding-left: 26px;
  }

  .entry-meta {
    display: flex;
    gap: 11px;
    align-items: center;
    margin-bottom: 7px;
    font-size: 11px;
  }

  .detail-indicator {
    padding-left: 10px;
    border-left: 1px solid #d1d5cf;
  }

  .entry h2 {
    margin: 0 0 7px;
    font-size: 19px;
    font-weight: 700;
    line-height: 1.55;
    color: #202f27;
    letter-spacing: -0.025em;
  }

  .entry h2 a {
    color: inherit;
    text-decoration: none;
    text-decoration-color: #8aaf99;
    text-underline-offset: 4px;
  }

  .entry h2 a:hover {
    color: #176c57;
    text-decoration: underline;
  }

  .summary {
    margin: 0;
    font-size: 14px;
    line-height: 1.8;
    color: #505950;
    overflow-wrap: anywhere;
  }

  .entry-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 13px;
  }

  .entry-tags li {
    min-height: 25px;
    padding: 3px 9px;
    font-size: 11px;
    color: #59665c;
    background: transparent;
  }

  .cover {
    grid-row: 1;
    grid-column: 2;
    align-self: center;
    overflow: hidden;
    background: #e9ebe4;
    border-radius: 6px;
  }

  .cover img {
    display: block;
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
  }

  .empty-state {
    padding: 38px 20px;
    color: #626a63;
    text-align: center;
    border-bottom: 1px solid #e5e4dc;
  }

  .empty-state p {
    margin-bottom: 9px;
    font-size: 14px;
  }

  .more-link {
    display: flex;
    gap: 9px;
    justify-content: center;
    padding: 12px;
    margin: 25px 0 5px;
    font-size: 13px;
    font-weight: 650;
    color: #255d49;
    text-decoration: none;
    border: 1px solid #d8ded7;
    border-radius: 6px;
  }

  .more-link:hover {
    background: #edf3ed;
  }

  .site-footer {
    display: flex;
    gap: 16px;
    justify-content: space-between;
    padding: 28px 0 36px;
    font-size: 11px;
    border-top: 1px solid #deded6;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    white-space: nowrap;
    clip: rect(0, 0, 0, 0);
    clip-path: inset(50%);
  }

  @media (max-width: 560px) {
    .site-shell {
      width: min(100% - 32px, 760px);
    }

    .site-header {
      height: 62px;
    }

    .intro {
      padding: 47px 0 31px;
    }

    .entry {
      gap: 15px;
      padding: 22px 0 24px;
    }

    .entry:has(.cover) {
      grid-template-columns: minmax(0, 1fr) 88px;
    }

    .entry h2 {
      font-size: 17px;
    }

    .summary {
      font-size: 13px;
    }

    .site-footer {
      flex-direction: column;
    }
  }
</style>
