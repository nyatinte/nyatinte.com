<script lang="ts">
  import { onMount, tick } from "svelte";
  import type { Snippet } from "svelte";
  import { type HomeTheme, readAppliedHomeTheme } from "../home-theme";

  let { href, children }: { href: string; children?: Snippet } = $props();

  const widgetsUrl = "https://platform.twitter.com/widgets.js";

  let theme = $state<HomeTheme | null>(null);
  let wrapper = $state<HTMLDivElement>();

  function readTheme(): HomeTheme {
    return (
      readAppliedHomeTheme() ??
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    );
  }

  function loadWidgets(wrapper: HTMLElement | undefined) {
    if (!wrapper) {
      return;
    }
    const twttr = (
      window as Window & {
        twttr?: {
          widgets?: { load: (element: HTMLElement) => Promise<void> };
        };
      }
    ).twttr;
    if (twttr?.widgets) {
      void twttr.widgets.load(wrapper);
      return;
    }
    if (document.querySelector(`script[src="${widgetsUrl}"]`)) {
      return;
    }
    const script = document.createElement("script");
    script.async = true;
    script.src = widgetsUrl;
    document.head.insertAdjacentElement("beforeend", script);
  }

  onMount(() => {
    theme = readTheme();
    const observer = new MutationObserver(() => {
      const next = readTheme();
      if (next === theme) {
        return;
      }
      theme = next;
      void tick().then(() => loadWidgets(wrapper));
    });
    observer.observe(document.documentElement, {
      attributeFilter: ["data-home-theme"],
      attributes: true,
    });
    void tick().then(() => loadWidgets(wrapper));
    return () => observer.disconnect();
  });
</script>

{#key theme}
  <div bind:this={wrapper}>
    <blockquote class="twitter-tweet" data-theme={theme ?? undefined}>
      {@render children?.()}
      <a {href}>{href}</a>
    </blockquote>
  </div>
{/key}
