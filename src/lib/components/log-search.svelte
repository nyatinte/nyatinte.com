<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import type {
    SearchResponse,
    SearchResult,
    SearchStatus,
  } from "../search/types";
  import LogArticleTitle from "./log-article-title.svelte";

  const engineLabel = "zbsearch";
  const loadEngine = () =>
    import("../search/zb-client").then((module) => module.searchZbSearch);

  const query = $derived(page.url.searchParams.get("q") ?? "");
  let settledQuery = $state("");
  let status = $state<SearchStatus>("idle");
  let message = $state("");
  let results = $state<SearchResult[]>([]);
  let inputElement = $state<HTMLInputElement>();
  let enginePromise: Promise<
    (value: string) => Promise<SearchResponse>
  > | null = null;
  let requestSeq = 0;

  function engine() {
    enginePromise ??= loadEngine().catch((error: unknown) => {
      enginePromise = null;
      throw error;
    });
    return enginePromise;
  }

  function reset() {
    requestSeq += 1;
    results = [];
    settledQuery = "";
    status = "idle";
    message = "";
  }

  async function refresh(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
      reset();
      return;
    }
    requestSeq += 1;
    const seq = requestSeq;
    status = "loading";
    message = "";
    try {
      const search = await engine();
      const response = await search(trimmed);
      if (seq !== requestSeq) {
        return;
      }
      const {
        results: nextResults,
        status: nextStatus,
        message: nextMessage,
      } = response;
      results = nextResults;
      status = nextStatus;
      message = nextMessage ?? "";
      settledQuery = trimmed;
    } catch {
      if (seq !== requestSeq) {
        return;
      }
      results = [];
      status = "error";
      message = "検索に失敗しました";
      settledQuery = trimmed;
    }
  }

  function updateQuery(value: string) {
    const next = new URL(page.url.href);
    if (value.trim()) {
      next.searchParams.set("q", value);
    } else {
      next.searchParams.delete("q");
    }
    // SvelteKit 3 の replaceState は page.shallow.url しか更新しないため、
    // page.url を正本に保つ goto でスクロールとフォーカスを維持したまま置き換える。
    goto(next, { replace: true, reset: false }).catch((error: unknown) => {
      if (
        error instanceof Error &&
        (error.message === "navigation aborted" ||
          error.message === "navigation cancelled")
      ) {
        // 次の入力やページ遷移がこの URL 同期を中断した場合は最新の状態を優先する。
        return;
      }
      throw error;
    });
  }

  function onInput(event: Event) {
    updateQuery((event.currentTarget as HTMLInputElement).value);
  }

  function clear() {
    updateQuery("");
    inputElement?.focus();
  }

  $effect(() => {
    refresh(query);
  });

  function onFocus() {
    engine().catch(() => {
      // The input handler reports a broken engine.
    });
  }

  const statusText = $derived.by(() => {
    if (status === "loading") {
      return "検索中…";
    }
    if (status === "ready") {
      return `${results.length} 件見つかりました`;
    }
    if (status === "empty") {
      return "一致する記事はありません";
    }
    return message;
  });
</script>

<section
  aria-label="記事を検索"
  class="log-search"
  data-search-engine={engineLabel}
  data-search-query={settledQuery}
  data-search-status={status}
>
  <label class="log-search-label" for="log-search-input">記事を検索</label>
  <div class="log-search-field">
    <input
      autocomplete="off"
      id="log-search-input"
      name="q"
      onfocus={onFocus}
      oninput={onInput}
      placeholder="記事を検索..."
      type="search"
      value={query}
      bind:this={inputElement}
    >
    {#if query !== ""}
      <button
        aria-label="検索語を消す"
        class="log-search-clear"
        onclick={clear}
        type="button"
      >
        ×
      </button>
    {/if}
  </div>
  <p aria-live="polite" class="log-search-status" role="status">
    {statusText}
  </p>
  {#if settledQuery !== "" && results.length > 0}
    <!-- biome-ignore lint/a11y/noRedundantRoles: Safari drops the list role when list-style is none. -->
    <ol class="log-search-results" data-search-results role="list">
      {#each results as item (item.slug)}
        <li data-search-result-slug={item.slug}>
          <LogArticleTitle href={item.url} title={item.title} />
          {#if item.excerptSegments.length > 0}
            <p class="log-search-excerpt">
              {#each item.excerptSegments as segment}
                {#if segment.mark}
                  <mark>{segment.text}</mark>
                {:else}
                  {segment.text}
                {/if}
              {/each}
            </p>
          {/if}
        </li>
      {/each}
    </ol>
  {:else if status === "empty"}
    <p class="log-search-empty"><a href="/log">すべての記事を見る</a></p>
  {/if}
</section>

<style>
  .log-search {
    margin: 0 0 2rem;
  }

  .log-search-label {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    white-space: nowrap;
    clip-path: inset(50%);
  }

  .log-search-field {
    position: relative;
  }

  input {
    box-sizing: border-box;
    width: 100%;
    padding: 0.7rem 0.9rem;
    padding-inline-end: 2.75rem;
    font: inherit;
    color: inherit;
    background: var(--home-nav-background);
    border: 1px solid var(--home-nav-border);
    border-radius: 0.5rem;
  }

  input:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }

  input::-webkit-search-cancel-button {
    display: none;
  }

  .log-search-clear {
    position: absolute;
    inset-block-start: 50%;
    inset-inline-end: 0.3rem;
    display: grid;
    place-items: center;
    inline-size: 2.25rem;
    block-size: 2.25rem;
    font-size: 1.1rem;
    line-height: 1;
    color: inherit;
    cursor: pointer;
    background: none;
    border: 0;
    border-radius: 999px;
    translate: 0 -50%;
  }

  .log-search-clear:hover {
    color: var(--home-accent);
  }

  .log-search-clear:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }

  .log-search-status {
    min-height: 1.4rem;
    margin: 0.5rem 0 0;
    font-size: 0.85rem;
  }

  .log-search-results {
    display: grid;
    gap: 1rem;
    padding: 0;
    margin: 1rem 0 0;
    list-style: none;
  }

  .log-search-empty a:hover {
    color: var(--home-accent);
  }

  .log-search-empty {
    margin: 0.5rem 0 0;
  }

  .log-search-excerpt {
    margin: 0.25rem 0 0;
    font-size: 0.9rem;
  }

  mark {
    color: var(--home-background);
    background: var(--home-accent);
  }
</style>
