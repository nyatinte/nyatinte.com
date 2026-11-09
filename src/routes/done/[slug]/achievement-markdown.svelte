<script lang="ts">
  let { html }: { html: string } = $props();
</script>

<!-- The server sanitizes Markdown before it reaches this component. -->
<div class="markdown">{@html html}</div>

<style>
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
</style>
