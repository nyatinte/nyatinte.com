<script lang="ts">
  import type { Snippet } from "svelte";

  let { children }: { children: Snippet } = $props();
</script>

<header class="site-header">
  <a class="wordmark" href="/">nyatinte.com</a>
  {@render children()}
</header>

<style>
  @layer components {
    @scope (.site-header) {
      :scope {
        display: block flex;
        align-items: center;
        justify-content: space-between;
        block-size: 4.5rem;
        border-block-end: 1px solid oklch(88% 0.008 100);

        @media (width <= 35rem) {
          block-size: 3.875rem;
        }
      }

      .wordmark {
        font-size: clamp(0.9375rem, 0.92rem + 0.08cqi, 1rem);
        font-weight: 600;
        color: oklch(30% 0.025 155);
        text-decoration: none;
      }
    }
  }
</style>
