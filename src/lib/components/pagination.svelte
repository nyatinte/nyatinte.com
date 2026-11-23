<script lang="ts">
  import { logPageHref, paginationItems } from "../log/pagination";

  let { currentPage, totalPages }: { currentPage: number; totalPages: number } =
    $props();

  const pages = $derived(paginationItems(totalPages));
</script>

<nav aria-label="ページネーション" class="pagination">
  <!-- Safari drops the list role when list-style is none. -->
  <ol role="list">
    <li>
      {#if currentPage > 1}
        <a
          aria-label={`前へ（${currentPage - 1}ページ目）`}
          href={logPageHref(currentPage - 1)}
          rel="prev">前へ</a
        >
      {:else}
        <span aria-disabled="true" class="disabled">前へ</span>
      {/if}
    </li>
    {#each pages as page (page)}
      <li>
        {#if page === currentPage}
          <span aria-current="page"
            >{page}<span class="sr-only">ページ目</span></span
          >
        {:else}
          <a aria-label={`${page}ページ目`} href={logPageHref(page)}>{page}</a>
        {/if}
      </li>
    {/each}
    <li>
      {#if currentPage < totalPages}
        <a
          aria-label={`次へ（${currentPage + 1}ページ目）`}
          href={logPageHref(currentPage + 1)}
          rel="next">次へ</a
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

  li > a,
  li > span {
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
