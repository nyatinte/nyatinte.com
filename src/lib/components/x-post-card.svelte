<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    href,
    author,
    handle,
    avatar,
    text = "",
    image,
    imageAlt,
    date,
    children,
  }: {
    href: string;
    author: string;
    handle: string;
    avatar: string;
    text?: string;
    image: string;
    imageAlt: string;
    date: string;
    children?: Snippet;
  } = $props();
</script>

<figure class="x-post-card">
  <a aria-label={`X の ${author} のポストを開く`} {href}>
    <header>
      <img alt="" class="avatar" src={avatar} />
      <span class="author"
        ><strong>{author}</strong><small>@{handle}</small></span
      >
      <span aria-hidden="true" class="mark">𝕏</span>
    </header>
    {#if text}<p>{text}</p>{:else}
      <p>{@render children?.()}</p>
    {/if}
    <img alt={imageAlt} class="post-image" src={image} />
    <small class="date">{date} · Xで見る</small>
  </a>
</figure>

<style>
  .x-post-card {
    margin: 1.5rem 0;
    overflow: hidden;
    background: var(--home-nav-background);
    border: 1px solid var(--home-nav-border);
    border-radius: 1rem;
  }
  a {
    display: grid;
    gap: 0.8rem;
    padding: 1rem;
    color: inherit;
    text-decoration: none;
  }
  header {
    display: flex;
    gap: 0.65rem;
    align-items: center;
  }
  .avatar {
    width: 2.5rem;
    height: 2.5rem;
    object-fit: cover;
    border-radius: 50%;
  }
  .author {
    display: grid;
    gap: 0.1rem;
  }
  .author small,
  .date {
    font-size: 0.75rem;
    color: var(--home-accent);
  }
  .mark {
    margin-left: auto;
    font-size: 1.3rem;
    font-weight: 700;
  }
  p,
  a :global(p) {
    margin: 0;
    white-space: pre-line;
  }
  .post-image {
    display: block;
    width: 100%;
    height: auto;
    border: 1px solid var(--home-nav-border);
    border-radius: 0.75rem;
  }
  .date {
    opacity: 0.85;
  }
</style>
