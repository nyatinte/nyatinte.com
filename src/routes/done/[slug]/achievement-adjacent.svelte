<script lang="ts">
  type Entry = { slug: string; title: string } | null;
  let { previous, next }: { previous: Entry; next: Entry } = $props();
</script>

<nav aria-label="前後の実績" class="adjacent">
  {#if previous}
    <a href={`/done/${previous.slug}`}
      ><span>新しい記録</span><strong>{previous.title}</strong></a
    >
  {:else}
    <span></span>
  {/if}
  {#if next}
    <a class="next" href={`/done/${next.slug}`}
      ><span>古い記録</span><strong>{next.title}</strong></a
    >
  {/if}
</nav>

<style>
  @layer components {
    @scope (.adjacent) {
      :scope {
        display: block grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.75rem;
        margin-block-start: 1.5rem;
        @media (width <= 35rem) {
          grid-template-columns: 1fr;
        }
      }
      a {
        display: block flex;
        flex-direction: column;
        gap: 0.5rem;
        min-inline-size: 0;
        padding: 1rem;
        color: oklch(30% 0.025 155);
        text-decoration: none;
        border: 1px solid oklch(87% 0.01 145);
        border-radius: 0.375rem;
        &:hover {
          background: oklch(95% 0.015 150);
        }
      }
      span {
        font-size: clamp(0.75rem, 0.73rem + 0.08cqi, 0.8125rem);
        color: oklch(48% 0.02 150);
      }
      strong {
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: clamp(0.8125rem, 0.8rem + 0.05cqi, 0.875rem);
        font-weight: 600;
        white-space: nowrap;
      }
      .next {
        text-align: end;
      }
    }
  }
</style>
