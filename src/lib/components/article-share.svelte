<script lang="ts">
  import xIcon from "@tabler/icons/outline/brand-x.svg?url";
  import { xShareUrl } from "../share";

  let { title, url }: { title: string; url: string } = $props();
  const shareUrl = $derived(xShareUrl({ title, url }));
</script>

<div aria-label="記事の共有" class="share" role="group">
  <a
    class="share-action"
    href={shareUrl}
    rel="noopener noreferrer"
    target="_blank"
  >
    <span
      aria-hidden="true"
      class="share-action-icon"
      style:mask-image={`url("${xIcon}")`}
    ></span>
    <span
      >X でシェア<span class="share-action-sr">（新しいタブで開く）</span></span
    >
  </a>
</div>

<style>
  .share {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    padding-block-start: 1.5rem;
    margin-block-start: 2.5rem;
    border-block-start: 1px solid var(--home-nav-border);
  }
</style>
