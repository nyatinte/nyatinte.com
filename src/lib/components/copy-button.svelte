<script lang="ts">
  import check from "@tabler/icons/outline/check.svg?url";
  import { tick } from "svelte";
  import { copyFeedback, copyText } from "../clipboard";

  let { icon, label, text }: { icon: string; label: string; text: string } =
    $props();

  const resetDelay = 2000;
  let result = $state<{ message: string; text: string } | null>(null);
  const message = $derived(result?.text === text ? result.message : "");
  const currentIcon = $derived(message === copyFeedback.success ? check : icon);
  const currentLabel = $derived(message || label);

  $effect(() => {
    if (result && result.text !== text) {
      result = null;
      return;
    }
    if (!message) {
      return;
    }
    const timer = setTimeout(() => {
      result = null;
    }, resetDelay);
    return () => {
      clearTimeout(timer);
    };
  });

  async function copy() {
    const target = text;
    const next = await copyText(target);
    if (text !== target) {
      return;
    }
    result = null;
    await tick();
    result = { message: next, text: target };
  }
</script>

<button class="share-action" onclick={copy} type="button">
  <span
    aria-hidden="true"
    class="share-action-icon"
    style:mask-image={`url("${currentIcon}")`}
  ></span>
  <span>{currentLabel}</span>
</button>
<p aria-live="polite" class="share-action-status">{message}</p>
