<script lang="ts">
  import type { JsonLdGraph } from "../server/agent-ready/json-ld";

  let { graphs }: { graphs: ReadonlyArray<JsonLdGraph> } = $props();

  const closeScript = ["</", "script>"].join("");

  function jsonLdScript(graph: JsonLdGraph) {
    const payload = JSON.stringify(graph).replaceAll("<", String.raw`\u003c`);
    return `<script type="application/ld+json">${payload}${closeScript}`;
  }
</script>

<svelte:head>
  {#each graphs as graph, index (`${index}:${graph["@type"] ?? "graph"}`)}
    <!-- Svelte の <svelte:head> は <script> 内の式を展開しないため、JSON-LD は {@html} で出す。 -->
    <!-- svelte-vitals-disable-next-line security/raw-html -->
    {@html jsonLdScript(graph)}
  {/each}
</svelte:head>
