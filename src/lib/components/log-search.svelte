<script lang="ts">
  import searchIcon from "@tabler/icons/outline/search.svg?url";
  import xIcon from "@tabler/icons/outline/x.svg?url";
  import { untrack } from "svelte";

  let {
    onQueryChange,
    query,
    resultCount,
    totalCount,
  }: {
    onQueryChange: (query: string) => void;
    query: string;
    resultCount: number;
    totalCount: number;
  } = $props();

  const statusMessage = $derived(
    query.trim()
      ? `${resultCount} 件の記事が見つかりました。`
      : `${totalCount} 件の記事があります。`
  );

  // 入力のたびに読み上げが割り込まないよう、件数の通知は少し待ってから更新する。
  // 初期表示の件数はそのままだと読み上げられるので、同じ値から始める。
  let announced = $state(untrack(() => statusMessage));
  let input: HTMLInputElement | undefined = $state();

  $effect(() => {
    const message = statusMessage;
    const timer = setTimeout(() => {
      announced = message;
    }, 300);
    return () => clearTimeout(timer);
  });

  function clearQuery() {
    onQueryChange("");
    input?.focus();
  }

  function handleInput(event: Event) {
    const target = event.currentTarget;
    if (target instanceof HTMLInputElement) {
      onQueryChange(target.value);
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape" && query) {
      event.preventDefault();
      clearQuery();
    }
  }
</script>

<search class="log-search">
  <form action="/log" method="get" onsubmit={(event) => event.preventDefault()}>
    <label class="sr-only" for="log-search-input">ログを検索</label>
    <div class="field">
      <span
        aria-hidden="true"
        class="icon"
        style:mask-image={`url("${searchIcon}")`}
      ></span>
      <input
        autocomplete="off"
        enterkeyhint="search"
        id="log-search-input"
        name="q"
        oninput={handleInput}
        onkeydown={handleKeydown}
        placeholder="タイトルや説明から検索"
        type="search"
        value={query}
        bind:this={input}
      >
      {#if query}
        <button
          aria-label="検索キーワードをクリア"
          onclick={clearQuery}
          title="検索キーワードをクリア"
          type="button"
        >
          <span
            aria-hidden="true"
            class="icon"
            style:mask-image={`url("${xIcon}")`}
          ></span>
        </button>
      {/if}
    </div>
  </form>
  <p aria-atomic="true" aria-live="polite" class="sr-only" role="status">
    {announced}
  </p>
</search>

<style>
  @layer components {
    @scope (.log-search) {
      :scope {
        display: block;
        margin-block-end: 2rem;
      }
      form {
        margin: 0;
      }
      .field {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        padding: 0.25rem;
        padding-inline-start: 0.9rem;
        background: var(--home-nav-background);
        border: 1px solid var(--home-nav-border);
        border-radius: 3rem;
      }
      .field:has(input:focus-visible) {
        outline: 2px solid currentColor;
        outline-offset: 2px;
      }
      input {
        flex: 1 1 auto;
        min-inline-size: 0;
        block-size: 2.75rem;
        padding: 0;
        font: inherit;
        color: inherit;
        background: transparent;
        border: 0;
      }
      input:focus-visible {
        outline: none;
      }
      input::placeholder {
        color: currentColor;
        opacity: 0.6;
      }
      input::-webkit-search-cancel-button {
        appearance: none;
      }
      .icon {
        flex: 0 0 auto;
        inline-size: 1.1rem;
        block-size: 1.1rem;
        background: currentColor;
        mask-repeat: no-repeat;
        mask-position: center;
        mask-size: contain;
      }
      button {
        display: flex;
        flex: 0 0 auto;
        align-items: center;
        justify-content: center;
        inline-size: 2.75rem;
        block-size: 2.75rem;
        padding: 0;
        color: inherit;
        cursor: pointer;
        background: transparent;
        border: 0;
        border-radius: 50%;
      }
      button:hover {
        background: var(--home-nav-current);
      }
      button:focus-visible {
        outline: 2px solid currentColor;
        outline-offset: 2px;
      }
      @media (forced-colors: active) {
        .icon {
          forced-color-adjust: none;
          background: CanvasText;
        }
      }
      .sr-only {
        position: absolute;
        inline-size: 1px;
        block-size: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        white-space: nowrap;
        border: 0;
        clip: rect(0, 0, 0, 0);
      }
    }
  }
</style>
