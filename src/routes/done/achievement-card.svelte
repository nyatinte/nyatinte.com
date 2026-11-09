<script lang="ts">
  import type { AchievementRecord } from "../../lib/server/achievement/records";

  let { item }: { item: AchievementRecord } = $props();
  const formatter = new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "long",
    timeZone: "UTC",
  });
</script>

<article class="entry">
  {#if item.coverImageUrl}
    <div class="cover">
      <img alt={item.title} loading="lazy" src={item.coverImageUrl}>
    </div>
  {/if}
  <div class="content">
    <div class="meta">
      <time datetime={item.occurredAt}
        >{formatter.format(new Date(`${item.occurredAt}T00:00:00.000Z`))}</time
      >
      {#if item.bodyMarkdown}
        <span>詳細あり</span>
      {/if}
    </div>
    <h2><a href={`/done/${item.slug}`}>{item.title}</a></h2>
    <p>{item.summary}</p>
    {#if item.tags.length > 0}
      <ul aria-label="タグ">
        {#each item.tags as tag (tag.normalized)}
          <li>{tag.name}</li>
        {/each}
      </ul>
    {/if}
  </div>
</article>

<style>
  @layer components {
    @scope (.entry) {
      :scope {
        position: relative;
        display: block grid;
        grid-template-columns: 4px minmax(0, 1fr);
        gap: 1.5rem;
        padding-block: 1.5rem;
        border-block-end: 1px solid oklch(90% 0.008 100);
        &::before {
          position: absolute;
          inset-block: 1.75rem;
          inset-inline-start: 0;
          inline-size: 2px;
          content: "";
          background: oklch(73% 0.05 155);
        }
        &:has(.cover) {
          grid-template-columns: minmax(0, 1fr) 8rem;
        }
        @media (width <= 35rem) {
          gap: 1rem;
          &:has(.cover) {
            grid-template-columns: minmax(0, 1fr) 5.5rem;
          }
        }
      }
      .content {
        grid-column: 2;
        min-inline-size: 0;
      }
      :scope:has(.cover) .content {
        grid-column: 1;
        padding-inline-start: 1.75rem;
      }
      .meta {
        display: block flex;
        gap: 0.75rem;
        align-items: center;
        margin-block-end: 0.5rem;
        font-size: clamp(0.75rem, 0.73rem + 0.08cqi, 0.8125rem);
        color: oklch(48% 0.02 150);
      }
      .meta span {
        padding-inline-start: 0.75rem;
        border-inline-start: 1px solid oklch(84% 0.01 150);
      }
      h2 {
        margin: 0 0 0.5rem;
        font-size: clamp(1.0625rem, 0.95rem + 0.3cqi, 1.1875rem);
        font-weight: 600;
        line-height: 1.55;
        color: oklch(27% 0.025 150);
        text-wrap: balance;
      }
      a {
        color: inherit;
        text-decoration: none;
        &:hover {
          color: oklch(43% 0.08 155);
          text-decoration: underline;
          text-underline-offset: 0.25em;
        }
      }
      p {
        margin: 0;
        font-size: clamp(0.875rem, 0.84rem + 0.1cqi, 0.9375rem);
        line-height: 1.8;
        color: oklch(42% 0.02 150);
        text-wrap: pretty;
        overflow-wrap: anywhere;
      }
      ul {
        display: block flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        padding: 0;
        margin: 0.75rem 0 0;
        list-style: none;
      }
      li {
        padding: 0.25rem 0.5rem;
        font-size: clamp(0.75rem, 0.73rem + 0.08cqi, 0.8125rem);
        color: oklch(46% 0.025 150);
        border: 1px solid oklch(87% 0.01 145);
        border-radius: 0.5rem;
      }
      .cover {
        grid-row: 1;
        grid-column: 2;
        align-self: center;
        overflow: hidden;
        background: oklch(93% 0.01 120);
        border-radius: 0.375rem;
      }
      img {
        display: block flow;
        inline-size: 100%;
        aspect-ratio: 4 / 3;
        object-fit: cover;
      }
    }
  }
</style>
