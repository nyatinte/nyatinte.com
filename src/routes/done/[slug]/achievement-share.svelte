<script lang="ts">
  let { draft, url }: { draft: string; url: string } = $props();
</script>

<section aria-labelledby="share-title" class="share-panel">
  <h2 id="share-title">Xへの投稿文面案</h2>
  <p class="share-draft">{draft}</p>
  <a href={url} rel="noopener noreferrer" target="_blank">この文面でXを開く</a>
</section>

<style>
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
</style>
