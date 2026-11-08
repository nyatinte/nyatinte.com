<script lang="ts">
  let {
    tags,
    selected,
  }: { tags: { name: string; normalized: string }[]; selected: string[] } =
    $props();
</script>

<section aria-labelledby="filter-title" class="filter">
  <div class="heading">
    <h2 id="filter-title">タグで絞り込む</h2>
    {#if selected.length > 0}
      <a href="/done">すべて表示</a>
    {/if}
  </div>
  {#if tags.length > 0}
    <form action="/done" method="GET">
      <fieldset>
        <legend class="visually-hidden">表示するタグ</legend>
        {#each tags as tag (tag.normalized)}
          <label
            ><input
              checked={selected.includes(tag.normalized)}
              name="tag"
              type="checkbox"
              value={tag.normalized}
            ><span>{tag.name}</span></label
          >
        {/each}
      </fieldset>
      <button type="submit">絞り込む</button>
    </form>
  {:else}
    <p>タグはまだありません。</p>
  {/if}
</section>

<style>
  @layer components {
    @scope (.filter) {
      :scope {
        padding-block: 1.5rem;
        border-block: 1px solid oklch(88% 0.01 100);
      }
      .heading {
        display: block flex;
        gap: 1rem;
        align-items: baseline;
        justify-content: space-between;
        margin-block-end: 1rem;
      }
      h2 {
        margin: 0;
        font-size: clamp(0.8125rem, 0.8rem + 0.05cqi, 0.875rem);
        font-weight: 600;
      }
      a {
        font-size: clamp(0.75rem, 0.73rem + 0.08cqi, 0.8125rem);
        color: oklch(43% 0.08 155);
        text-underline-offset: 0.2em;
      }
      fieldset {
        display: block flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        padding: 0;
        margin: 0;
        border: 0;
      }
      label {
        position: relative;
        cursor: pointer;
      }
      input {
        position: absolute;
        inline-size: 1px;
        block-size: 1px;
        opacity: 0;
      }
      label span {
        display: inline flex;
        align-items: center;
        min-block-size: 2rem;
        padding: 0.25rem 0.75rem;
        font-size: clamp(0.75rem, 0.73rem + 0.08cqi, 0.8125rem);
        color: oklch(40% 0.025 150);
        background: oklch(99% 0.005 100);
        border: 1px solid oklch(87% 0.01 145);
        border-radius: 0.5rem;
      }
      input:checked + span {
        color: oklch(35% 0.07 155);
        background: oklch(95% 0.025 150);
        border-color: oklch(50% 0.08 155);
      }
      input:focus-visible + span {
        outline: 3px solid oklch(70% 0.09 155);
        outline-offset: 2px;
      }
      button {
        padding: 0.5rem 1rem;
        margin-block-start: 1rem;
        font: inherit;
        font-size: clamp(0.8125rem, 0.8rem + 0.05cqi, 0.875rem);
        color: oklch(100% 0 0);
        cursor: pointer;
        background: oklch(42% 0.07 155);
        border: 0;
        border-radius: 0.375rem;
        &:hover {
          background: oklch(34% 0.06 155);
        }
      }
      p {
        margin: 0;
        font-size: clamp(0.8125rem, 0.8rem + 0.05cqi, 0.875rem);
        color: oklch(52% 0.015 145);
      }
      .visually-hidden {
        position: absolute;
        inline-size: 1px;
        block-size: 1px;
        overflow: hidden;
        white-space: nowrap;
        clip-path: inset(50%);
      }
    }
  }
</style>
