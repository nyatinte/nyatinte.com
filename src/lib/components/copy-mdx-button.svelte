<script lang="ts">
  import clipboard from "@tabler/icons/outline/clipboard.svg?url";
  import CopyButton from "./copy-button.svelte";

  let { source }: { source: string } = $props();
</script>

<CopyButton icon={clipboard} label="Markdown をコピー" text={source} />
