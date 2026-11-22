<script lang="ts">
  import xIcon from "@tabler/icons/outline/brand-x.svg?url";
  import linkIcon from "@tabler/icons/outline/link.svg?url";
  import { xShareUrl } from "../share";
  import CopyButton from "./copy-button.svelte";

  let { title, url }: { title: string; url: string } = $props();
  const shareUrl = $derived(xShareUrl({ title, url }));
</script>

<!-- biome-ignore lint/a11y/useSemanticElements: fieldset はフォームの部品をまとめる要素で、共有リンクのまとまりには合わない。 -->
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
  <CopyButton icon={linkIcon} label="リンクをコピー" text={url} />
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
