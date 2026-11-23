<script lang="ts">
  import type { Snippet } from "svelte";

  let { children }: { children: Snippet } = $props();
</script>

<div class="spaces-flow">
  {@render children()}
</div>

<style>
  .spaces-flow {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    justify-content: space-between;
    margin: 1.8rem 0;
  }
  .spaces-flow :global(div) {
    display: grid;
    gap: 0.4rem;
    text-align: center;
  }
  .spaces-flow :global(small) {
    font-size: 0.7rem;
  }
  .spaces-flow :global(strong) {
    font-size: 0.85rem;
  }
  .spaces-flow :global(.flow-center) {
    padding: 1rem;
    background: var(--home-background);
    border: 1px solid var(--home-nav-border);
    border-radius: 50%;
  }
  .spaces-flow :global(.flow-arrow) {
    color: var(--home-accent);
    font-size: 1.4rem;
  }
  @media (width <= 540px) {
    .spaces-flow {
      flex-direction: column;
    }
    .spaces-flow :global(.flow-arrow) {
      transform: rotate(90deg);
    }
  }
  @supports (zoom: calc(1px / 1px)) {
    @media (width <= 706px) {
      .spaces-flow {
        flex-direction: row;
      }
      .spaces-flow :global(.flow-arrow) {
        transform: none;
      }
    }
  }
</style>
