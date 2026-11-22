<script lang="ts">
  import rss from "@tabler/icons/outline/rss.svg?url";
  import { logRssPath } from "../log/constants";
</script>

<!--
  フィードは XML なのでクライアント遷移させず、プリロードもしない。
  SvelteKit のデータ取得に巻き込まないための指定。
-->
<a
  class="rss"
  data-sveltekit-preload-data="off"
  data-sveltekit-reload
  href={logRssPath}
  type="application/rss+xml"
  style:--rss-icon={`url("${rss}")`}
>
  <span aria-hidden="true" class="icon"></span>
  <span>RSS で購読</span>
</a>

<style>
  .rss {
    display: inline-flex;
    gap: 0.45rem;
    align-items: center;
    padding: 0.375rem 0.75rem;
    font-size: 0.85rem;
    color: inherit;
    text-decoration: none;
    background: var(--home-nav-background);
    border: 1px solid var(--home-nav-border);
    border-radius: 0.35rem;
  }

  .rss:hover {
    background: var(--home-nav-current);
  }

  .rss:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 4px;
  }

  .icon {
    inline-size: 0.875rem;
    block-size: 0.875rem;
    background-color: currentColor;
    mask-image: var(--rss-icon);
    mask-repeat: no-repeat;
    mask-position: center;
    mask-size: contain;
  }
</style>
