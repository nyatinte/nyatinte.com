<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    eyebrow,
    title,
    note,
    children,
  }: {
    eyebrow?: string;
    title: string;
    note?: string;
    children: Snippet;
  } = $props();
</script>

<figure class="thought">
  <figcaption>
    {#if eyebrow}<span class="eyebrow">{eyebrow}</span>{/if}
    <strong>{title}</strong>
  </figcaption>
  {@render children()}
  {#if note}<p class="figure-note">{note}</p>{/if}
</figure>

<style>
  .thought {
    margin: 2rem 0;
    padding: clamp(1.2rem, 4vw, 2rem);
    overflow: hidden;
    background: var(--home-nav-background);
    border: 1px solid var(--home-nav-border);
    border-radius: 1.2rem;
  }
  figcaption {
    display: grid;
    gap: 0.25rem;
  }
  figcaption strong {
    font-size: 1.15rem;
  }
  .figure-note {
    margin: 0;
    font-size: 0.85rem;
    opacity: 0.8;
  }
  .eyebrow {
    color: var(--home-accent);
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.14em;
  }
  @supports (zoom: calc(1px / 1px)) {
    @media (width <= 706px) {
      .thought {
        box-sizing: border-box;
        width: 40rem;
        padding: 2rem;
        zoom: min(1, calc((100vw - 4.5rem) / 40rem));
      }
    }
  }
</style>
