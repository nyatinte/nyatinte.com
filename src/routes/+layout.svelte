<script lang="ts">
  import "../lib/styles/home-tokens.css";

  let { children } = $props();
</script>

{@render children()}

<style>
  @font-face {
    font-family: "M PLUS 1p";
    src: url("../lib/assets/fonts/mplus1p-regular.woff2") format("woff2");
    font-style: normal;
    font-weight: 400 500;
    font-display: swap;
    unicode-range: U+0100-10FFFF;
  }
  @font-face {
    font-family: "M PLUS 1p";
    src: url("../lib/assets/fonts/mplus1p-bold.woff2") format("woff2");
    font-style: normal;
    font-weight: 600 900;
    font-display: swap;
    unicode-range: U+0100-10FFFF;
  }
  @font-face {
    font-family: "M PLUS 1p";
    src: url("../lib/assets/fonts/mplus1p-regular-latin.woff2") format("woff2");
    font-style: normal;
    font-weight: 400 500;
    font-display: optional;
    unicode-range: U+0000-00FF;
  }
  @font-face {
    font-family: "M PLUS 1p";
    src: url("../lib/assets/fonts/mplus1p-bold-latin.woff2") format("woff2");
    font-style: normal;
    font-weight: 600 900;
    font-display: optional;
    unicode-range: U+0000-00FF;
  }
  @layer base {
    :global(*) {
      box-sizing: border-box;
    }
    :global(html) {
      font-family:
        "M PLUS 1p", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif;
      -webkit-font-smoothing: antialiased;
      font-synthesis: none;
      color-scheme: light;
      text-rendering: optimizeLegibility;
    }
    :global(body) {
      margin: 0;
      color: oklch(32% 0.025 150);
      background: oklch(98% 0.006 100);
    }
  }
</style>
