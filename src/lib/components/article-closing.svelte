<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    image = "/images/chick-penguin.png",
    children,
  }: {
    image?: string;
    children: Snippet;
  } = $props();
</script>

<div class="closing-message">
  <img alt="" height="128" src={image} width="90" />
  <p>{@render children()}</p>
</div>

<style>
  .closing-message {
    display: flex;
    gap: 0.5rem;
    align-items: flex-start;
    margin: 2rem 0;
  }
  .closing-message img {
    flex: 0 0 auto;
    width: clamp(3.75rem, 16vw, 5.625rem);
    height: auto;
    margin-top: 1.4rem;
  }
  .closing-message p {
    position: relative;
    margin: 0;
    padding: 1rem 1.35rem;
    background: var(--home-nav-background);
    border-radius: 1.4rem;
  }
  .closing-message p::before {
    position: absolute;
    top: 1.6rem;
    left: -0.7rem;
    width: 1rem;
    height: 1rem;
    clip-path: polygon(100% 0, 100% 100%, 0 100%);
    content: "";
    background: var(--home-nav-background);
  }
</style>
