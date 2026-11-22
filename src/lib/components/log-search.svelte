<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import type {
    SearchResponse,
    SearchResult,
    SearchStatus,
  } from "../search/types";

  const engineLabel = "zbsearch";
  const loadEngine = () =>
    import("../search/zb-client").then((module) => module.searchZbSearch);

  const query = $derived(page.url.searchParams.get("q") ?? "");
  let settledQuery = $state("");
  let status = $state<SearchStatus>("idle");
  let message = $state("");
  let results = $state<SearchResult[]>([]);
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

  function onInput(event: Event) {
    const { value } = event.currentTarget as HTMLInputElement;
    const next = new URL(page.url.href);
    if (value.trim()) {
      next.searchParams.set("q", value);
    } else {
      next.searchParams.delete("q");
    }
    // SvelteKit 3 の replaceState は page.shallow.url しか更新しないため、
    // page.url を正本に保つ goto でスクロールとフォーカスを維持したまま置き換える。
    goto(next, { replace: true, reset: false });
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
  <input
    autocomplete="off"
    id="log-search-input"
    name="q"
    onfocus={onFocus}
    oninput={onInput}
    placeholder="記事を検索..."
    type="search"
    value={query}
  >
  <p aria-live="polite" class="log-search-status" role="status">
    {statusText}
  </p>
  {#if settledQuery !== "" && results.length > 0}
    <!-- biome-ignore lint/a11y/noRedundantRoles: Safari drops the list role when list-style is none. -->
    <ol class="log-search-results" data-search-results role="list">
      {#each results as item (item.slug)}
        <li data-search-result-slug={item.slug}>
          <a href={item.url}>{item.title}</a>
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

  input {
    box-sizing: border-box;
    width: 100%;
    padding: 0.7rem 0.9rem;
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

  .log-search-results a {
    color: inherit;
    text-decoration-thickness: 1px;
    text-underline-offset: 0.18em;
  }

  .log-search-results a:hover,
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
