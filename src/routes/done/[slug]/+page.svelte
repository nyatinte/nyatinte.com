<script lang="ts">
  import SiteHeader from "../../../lib/components/site-header.svelte";
  import {
    createXIntentUrl,
    createXPostDraft,
  } from "../../../lib/share/x-post";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
  let xPostDraft = $derived(
    createXPostDraft({
      summary: data.entry.summary,
      title: data.entry.title,
      url: data.canonicalUrl,
    })
  );
  let xIntentUrl = $derived(createXIntentUrl(xPostDraft));

  const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "long",
    timeZone: "UTC",
  });

  function formatDate(value: string) {
    return dateFormatter.format(new Date(`${value}T00:00:00.000Z`));
  }

  function tagHref(value: string) {
    const params = new URLSearchParams({ tag: value });
    return `/done?${params.toString()}`;
  }
</script>

<svelte:head>
  <title>{data.entry.title} | nyatinte.com</title>
  <meta content={data.entry.summary} name="description">
  <link href={data.canonicalUrl} rel="canonical">
  <meta content={data.entry.title} property="og:title">
  <meta content={data.entry.summary} property="og:description">
  <meta content={data.canonicalUrl} property="og:url">
  <meta content="article" property="og:type">
  <meta content={data.ogImageUrl} property="og:image">
  <meta content="1200" property="og:image:width">
  <meta content="630" property="og:image:height">
  <meta content="nyatinte.com の実績記録" property="og:image:alt">
  <meta content={data.entry.publishedAt} property="article:published_time">
  <meta content="summary_large_image" name="twitter:card">
</svelte:head>

<div class="site-shell">
  <SiteHeader>
    <a class="back-link" href="/done">実績一覧へ</a>
  </SiteHeader>

  <main>
    <article>
      <header class="entry-header">
        <p class="eyebrow">やったこと <span>—</span> 実績の記録</p>
        <h1>{data.entry.title}</h1>
        <p class="summary">{data.entry.summary}</p>
        <div class="entry-meta">
          <time datetime={data.entry.occurredAt}
            >{formatDate(data.entry.occurredAt)}</time
          >
          <span>公開日 {formatDate(data.entry.publishedAt.slice(0, 10))}</span>
        </div>
        {#if data.entry.tags.length > 0}
          <ul aria-label="タグ" class="entry-tags">
            {#each data.entry.tags as tag (tag.normalized)}
              <li><a href={tagHref(tag.normalized)}>{tag.name}</a></li>
            {/each}
          </ul>
        {/if}
      </header>

      {#if data.entry.coverImageUrl}
        <figure class="cover">
          <img alt={data.entry.title} src={data.entry.coverImageUrl}>
        </figure>
      {/if}

      {#if data.entry.bodyMarkdown}
        <!-- `bodyHtml` is rendered server-side and sanitized with sanitize-html. -->
        <div class="markdown">{@html data.bodyHtml}</div>
      {/if}

      <section aria-labelledby="share-title" class="share-panel">
        <h2 id="share-title">Xへの投稿文面案</h2>
        <p class="share-draft">{xPostDraft}</p>
        <a href={xIntentUrl} rel="noopener noreferrer" target="_blank">
          この文面でXを開く
        </a>
      </section>

      {#if data.entry.links.length > 0}
        <section aria-labelledby="links-title" class="related-links">
          <h2 id="links-title">関連リンク</h2>
          <ul>
            {#each data.entry.links as link (link.id)}
              <li>
                <a href={link.url} rel="noopener noreferrer" target="_blank">
                  {link.label ?? link.url}
                </a>
              </li>
            {/each}
          </ul>
        </section>
      {/if}
    </article>

    <nav aria-label="前後の実績" class="adjacent">
      {#if data.previous}
        <a class="adjacent-link previous" href={`/done/${data.previous.slug}`}>
          <span>新しい記録</span>
          <strong>{data.previous.title}</strong>
        </a>
      {:else}
        <span></span>
      {/if}
      {#if data.next}
        <a class="adjacent-link next" href={`/done/${data.next.slug}`}>
          <span>古い記録</span>
          <strong>{data.next.title}</strong>
        </a>
      {/if}
    </nav>
  </main>

  <footer class="site-footer">
    <a href="/done">← 実績一覧に戻る</a>
    <span>nyatinte.com</span>
  </footer>
</div>

<style>
  .site-shell {
    width: min(100% - 40px, 760px);
    margin: 0 auto;
  }

  .back-link,
  .site-footer a {
    font-size: 12px;
    color: #176c57;
    text-underline-offset: 3px;
  }

  .entry-header {
    padding: 58px 0 34px;
    border-bottom: 1px solid #deded6;
  }

  .eyebrow,
  .entry-meta,
  .site-footer {
    font-size: 12px;
    color: #5d665e;
    letter-spacing: 0.04em;
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

  .share-panel {
    padding: 20px;
    margin-top: 42px;
    background: #f7f8f4;
    border: 1px solid #deded6;
    border-radius: 8px;
  }

  .share-panel h2 {
    margin: 0 0 10px;
    font-size: 15px;
    color: #24352e;
  }

  .share-draft {
    margin: 0 0 14px;
    font-size: 14px;
    line-height: 1.8;
    color: #3c463f;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
  }

  .share-panel a {
    font-size: 13px;
    font-weight: 650;
    color: #176c57;
    text-underline-offset: 3px;
  }

  h1 {
    margin-bottom: 12px;
    font-size: clamp(30px, 6vw, 44px);
    font-weight: 700;
    line-height: 1.35;
    color: #1e2d26;
    letter-spacing: -0.055em;
    overflow-wrap: anywhere;
  }

  .summary {
    margin-bottom: 19px;
    font-size: 16px;
    line-height: 1.85;
    color: #505950;
    overflow-wrap: anywhere;
  }

  .entry-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 15px;
    font-size: 11px;
  }

  .entry-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    padding: 0;
    margin: 17px 0 0;
    list-style: none;
  }

  .entry-tags a {
    display: inline-flex;
    align-items: center;
    min-height: 26px;
    padding: 3px 10px;
    font-size: 11px;
    color: #4c5d51;
    text-decoration: none;
    border: 1px solid #d9ded6;
    border-radius: 999px;
  }

  .entry-tags a:hover {
    background: #edf3ed;
    border-color: #8caf98;
  }

  .cover {
    margin: 28px 0 0;
  }

  .cover img {
    display: block;
    width: 100%;
    max-height: 480px;
    object-fit: cover;
    background: #e9ebe4;
    border-radius: 8px;
  }

  .markdown {
    padding: 30px 0 12px;
    font-size: 15px;
    line-height: 1.9;
    color: #334139;
    overflow-wrap: anywhere;
  }

  .markdown :global(h1),
  .markdown :global(h2),
  .markdown :global(h3),
  .markdown :global(h4) {
    margin: 1.8em 0 0.65em;
    font-size: 1.35em;
    font-weight: 700;
    line-height: 1.5;
    color: #20332a;
    letter-spacing: -0.03em;
  }

  .markdown :global(h1:first-child),
  .markdown :global(h2:first-child),
  .markdown :global(h3:first-child),
  .markdown :global(h4:first-child) {
    margin-top: 0;
  }

  .markdown :global(p),
  .markdown :global(ul),
  .markdown :global(ol),
  .markdown :global(blockquote),
  .markdown :global(pre) {
    margin: 0 0 1.15em;
  }

  .markdown :global(ul),
  .markdown :global(ol) {
    padding-left: 1.5em;
  }

  .markdown :global(li + li) {
    margin-top: 0.25em;
  }

  .markdown :global(a) {
    color: #176c57;
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
  }

  .markdown :global(blockquote) {
    padding: 2px 0 2px 16px;
    margin-left: 0;
    color: #626a63;
    border-left: 2px solid #8caf98;
  }

  .markdown :global(code) {
    padding: 0.12em 0.35em;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.88em;
    background: #eaece6;
    border-radius: 4px;
  }

  .markdown :global(pre) {
    padding: 16px 18px;
    overflow-x: auto;
    line-height: 1.65;
    color: #f0f1e9;
    background: #24332c;
    border-radius: 7px;
  }

  .markdown :global(pre code) {
    padding: 0;
    font-size: 0.86em;
    color: inherit;
    background: none;
  }

  .markdown :global(img) {
    display: block;
    max-width: 100%;
    height: auto;
    margin: 20px auto;
    border-radius: 6px;
  }

  .related-links {
    padding: 22px 0;
    margin: 20px 0 0;
    border-top: 1px solid #deded6;
  }

  .related-links h2 {
    margin-bottom: 12px;
    font-size: 14px;
    color: #26362e;
  }

  .related-links ul {
    padding-left: 1.3em;
    margin: 0;
    font-size: 13px;
    line-height: 1.8;
    color: #176c57;
  }

  .adjacent {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin-top: 25px;
  }

  .adjacent-link {
    display: flex;
    flex-direction: column;
    gap: 7px;
    min-width: 0;
    padding: 14px 16px;
    color: #24352e;
    text-decoration: none;
    border: 1px solid #d8ded7;
    border-radius: 6px;
  }

  .adjacent-link:hover {
    background: #edf3ed;
  }

  .adjacent-link span {
    font-size: 10px;
    color: #5d665e;
  }

  .adjacent-link strong {
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 13px;
    font-weight: 650;
    white-space: nowrap;
  }

  .next {
    text-align: right;
  }

  .site-footer {
    display: flex;
    gap: 16px;
    justify-content: space-between;
    padding: 23px 0 34px;
    margin-top: 35px;
    font-size: 11px;
    border-top: 1px solid #deded6;
  }

  @media (max-width: 560px) {
    .site-shell {
      width: min(100% - 32px, 760px);
    }

    .entry-header {
      padding: 43px 0 28px;
    }

    .summary {
      font-size: 15px;
    }

    .markdown {
      font-size: 14px;
    }

    .adjacent {
      grid-template-columns: 1fr;
    }

    .site-footer {
      flex-direction: column;
    }
  }
</style>
