<script lang="ts">
  import diffIcon from "@tabler/icons/outline/file-diff.svg?url";
  import editIcon from "@tabler/icons/outline/edit.svg?url";
  import resetIcon from "@tabler/icons/outline/restore.svg?url";
  import { onMount } from "svelte";
  import { z } from "zod/v4";
  import {
    applyEdits,
    createArticlePatch,
    extractBlocks,
  } from "../log/preview-edit";
  import CopyButton from "./copy-button.svelte";

  let { source, slug }: { source: string; slug: string } = $props();

  const draftSchema = z.record(z.string(), z.string());
  const storageKey = $derived(
    `nyatinte-preview-edit:${slug}:${__PREVIEW_SHA__}:${__PREVIEW_PR__}`,
  );
  const blocks = $derived(extractBlocks(source));
  let editing = $state(false);
  let edits = $state<Record<string, string>>({});

  const changedCount = $derived(
    blocks.reduce((count, block, index) => {
      const draft = edits[String(index)];
      return draft !== undefined && draft !== block.text ? count + 1 : count;
    }, 0),
  );

  const editedBlocks = $derived(
    new Map(
      Object.entries(edits)
        .map(([index, text]) => [Number(index), text] as const)
        .filter(([index, text]) => blocks[index]?.text !== text),
    ),
  );

  const patch = $derived(
    createArticlePatch({
      after: applyEdits(source, editedBlocks),
      before: source,
      pr: __PREVIEW_PR__,
      sha: __PREVIEW_SHA__,
      slug,
    }),
  );

  function readDrafts(key: string) {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return {};
    }
    try {
      const parsed = draftSchema.safeParse(JSON.parse(raw));
      if (!parsed.success) {
        return {};
      }
      return Object.fromEntries(
        Object.entries(parsed.data).filter(
          ([index]) => blocks[Number(index)]?.editable,
        ),
      );
    } catch {
      return {};
    }
  }

  function saveDrafts(next: Record<string, string>) {
    localStorage.setItem(storageKey, JSON.stringify(next));
  }

  function update(index: number, original: string, value: string) {
    const next = { ...edits };
    if (value === original) {
      delete next[String(index)];
    } else {
      next[String(index)] = value;
    }
    edits = next;
    saveDrafts(next);
  }

  function reset() {
    if (!confirm("下書きを破棄しますか？")) {
      return;
    }
    localStorage.removeItem(storageKey);
    edits = {};
  }

  function autoGrow(node: HTMLTextAreaElement, value: string) {
    const resize = () => {
      node.style.height = "auto";
      node.style.height = `${node.scrollHeight}px`;
    };
    resize();
    let current = value;
    const onInput = () => {
      resize();
    };
    node.addEventListener("input", onInput);
    return {
      destroy() {
        node.removeEventListener("input", onInput);
      },
      update(next: string) {
        if (next !== current) {
          current = next;
          resize();
        }
      },
    };
  }

  onMount(() => {
    edits = readDrafts(storageKey);
  });
</script>

<section aria-label="記事の編集" class="editor">
  <div class="toolbar">
    <button
      aria-expanded={editing}
      class="share-action"
      onclick={() => {
        editing = !editing;
      }}
      type="button"
    >
      <span
        aria-hidden="true"
        class="share-action-icon"
        style:mask-image={`url("${editIcon}")`}
      ></span>
      <span>{editing ? "編集を閉じる" : "編集"}</span>
    </button>
    {#if editing}
      <p class="count">変更 {changedCount} 件</p>
      <button class="share-action" onclick={reset} type="button">
        <span
          aria-hidden="true"
          class="share-action-icon"
          style:mask-image={`url("${resetIcon}")`}
        ></span>
        <span>リセット</span>
      </button>
      {#if changedCount === 0}
        <p class="notice">変更はありません</p>
      {:else if patch}
        <CopyButton icon={diffIcon} label="差分をコピー" text={patch} />
      {/if}
    {/if}
  </div>
  {#if editing}
    <div class="blocks">
      {#each blocks as block, index (block.start)}
        {#if block.editable}
          <label class="block">
            <span class="block-label">ブロック {index + 1}</span>
            <textarea
              oninput={(event) => {
                update(index, block.text, event.currentTarget.value);
              }}
              use:autoGrow={edits[String(index)] ?? block.text}
              value={edits[String(index)] ?? block.text}></textarea>
          </label>
        {:else}
          <details class="block readonly">
            <summary>編集できないブロック</summary>
            <pre>{block.text}</pre>
          </details>
        {/if}
      {/each}
    </div>
  {/if}
</section>

<style>
  .editor {
    margin-block-end: 1.5rem;
  }

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
  }

  .toolbar :global(.share-action) {
    min-block-size: 2.75rem;
  }

  .count {
    margin: 0;
    font-size: 0.9rem;
  }

  .notice {
    padding: 0.5rem 0.75rem;
    margin: 0;
    font-size: 0.9rem;
    background: var(--home-nav-background);
    border: 1px solid var(--home-nav-border);
    border-radius: 0.35rem;
  }

  .blocks {
    display: grid;
    gap: 1rem;
    margin-block-start: 1rem;
  }

  .block {
    display: grid;
    gap: 0.35rem;
    min-inline-size: 0;
  }

  .block-label {
    font-size: 0.8rem;
    opacity: 0.7;
  }

  textarea {
    box-sizing: border-box;
    inline-size: 100%;
    min-block-size: 5rem;
    padding: 0.75rem;
    font: inherit;
    font-size: 1rem;
    line-height: 1.6;
    color: inherit;
    field-sizing: content;
    background: var(--home-nav-background);
    border: 1px solid var(--home-nav-border);
    border-radius: 0.5rem;
  }

  textarea:focus-visible {
    outline: 2px solid currentcolor;
    outline-offset: 2px;
  }

  .readonly summary {
    display: flex;
    align-items: center;
    min-block-size: 2.75rem;
    padding: 0.5rem 0.75rem;
    font-size: 0.9rem;
    cursor: pointer;
    background: var(--home-nav-background);
    border: 1px solid var(--home-nav-border);
    border-radius: 0.5rem;
  }

  .readonly pre {
    padding: 0.75rem;
    margin: 0.5rem 0 0;
    overflow: auto;
    font-size: 0.8rem;
    background: var(--home-nav-background);
    border: 1px solid var(--home-nav-border);
    border-radius: 0.5rem;
  }
</style>
