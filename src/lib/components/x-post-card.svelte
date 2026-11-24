<script lang="ts">
  import { onMount } from "svelte";
  import type { Snippet } from "svelte";

  let { href, children }: { href: string; children?: Snippet } = $props();

  const widgetsUrl = "https://platform.twitter.com/widgets.js";

  onMount(() => {
    const twttr = (
      window as Window & {
        twttr?: { widgets?: { load: () => Promise<void> } };
      }
    ).twttr;
    if (twttr?.widgets) {
      void twttr.widgets.load();
      return;
    }
    if (document.querySelector(`script[src="${widgetsUrl}"]`)) {
      return;
    }
    const script = document.createElement("script");
    script.async = true;
    script.src = widgetsUrl;
    document.head.insertAdjacentElement("beforeend", script);
  });
</script>

<div>
  <blockquote class="twitter-tweet">
    {@render children?.()}
    <a {href}>{href}</a>
  </blockquote>
</div>
