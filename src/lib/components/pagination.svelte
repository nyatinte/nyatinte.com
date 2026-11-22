<script lang="ts">
  import { logPageHref, paginationItems } from "../log/pagination";

  let { currentPage, totalPages }: { currentPage: number; totalPages: number } =
    $props();

  const items = $derived(paginationItems(currentPage, totalPages));
</script>

<nav aria-label="ページネーション" class="pagination">
  <!-- biome-ignore lint/a11y/noRedundantRoles: Safari drops the list role when list-style is none. -->
  <ol role="list">
    <li>
      {#if currentPage > 1}
        <a
          aria-label={`前のページ（${currentPage - 1}ページ目）`}
          href={logPageHref(currentPage - 1)}
          rel="prev"
          >前へ</a
        >
      {:else}
        <span aria-disabled="true" class="disabled">前へ</span>
      {/if}
    </li>
    {#each items as item}
      <li>
        {#if item === "ellipsis"}
          <span aria-hidden="true" class="ellipsis">…</span>
        {:else if item === currentPage}
          <span aria-current="page"
            >{item}<span class="sr-only">ページ目</span></span
          >
        {:else}
          <a aria-label={`${item}ページ目`} href={logPageHref(item)}>{item}</a>
        {/if}
      </li>
    {/each}
    <li>
      {#if currentPage < totalPages}
        <a
          aria-label={`次のページ（${currentPage + 1}ページ目）`}
          href={logPageHref(currentPage + 1)}
          rel="next"
          >次へ</a
        >
      {:else}
        <span aria-disabled="true" class="disabled">次へ</span>
      {/if}
    </li>
  </ol>
</nav>

<style>
  .pagination {
    margin-block-start: 3.5rem;
  }

  ol {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    justify-content: center;
    padding: 0;
    margin: 0;
    list-style: none;
  }

  li {
    display: flex;
  }

  a,
  span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-inline-size: 2.75rem;
    min-block-size: 2.75rem;
    padding-inline: 0.75rem;
    font-variant-numeric: tabular-nums;
    color: inherit;
    text-decoration: none;
    border: 1px solid transparent;
    border-radius: 999px;
  }

  a:hover {
    background: var(--home-nav-background);
    border-color: var(--home-nav-border);
  }

  [aria-current="page"] {
    font-weight: 700;
    background: var(--home-nav-current);
    border-color: var(--home-nav-border);
  }

  .ellipsis {
    min-inline-size: 1.5rem;
    padding-inline: 0;
  }

  .disabled {
    opacity: 0.55;
  }

  .sr-only {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    white-space: nowrap;
    clip-path: inset(50%);
  }

  a:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 4px;
  }

  @media (forced-colors: active) {
    [aria-current="page"] {
      border-color: CanvasText;
    }
  }
</style>
