<script lang="ts">
  import check from "@tabler/icons/outline/check.svg?url";
  import { tick } from "svelte";
  import { copyFeedback, copyText } from "../clipboard";

  let { icon, label, text }: { icon: string; label: string; text: string } =
    $props();

  const resetDelay = 2000;
  // どの text への結果かを覚えておき、text が変わったら表示を戻す。
  let result = $state<{ message: string; text: string } | null>(null);
  const message = $derived(result?.text === text ? result.message : "");
  const currentIcon = $derived(message === copyFeedback.success ? check : icon);
  const currentLabel = $derived(message || label);

  // 結果は少し表示してから元のラベルへ戻す。表示中に再度コピーしたら引き直す。
  $effect(() => {
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
    const next = await copyText(text);
    // 同じ文言が続いても読み上げられるように、いったん空にする。
    result = null;
    await tick();
    result = { message: next, text };
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
