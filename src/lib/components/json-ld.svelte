<script lang="ts">
  type JsonLdGraph = Record<string, unknown>;

  let { graphs }: { graphs: readonly JsonLdGraph[] } = $props();

  const closeScript = ["</", "script>"].join("");

  function jsonLdScript(graph: JsonLdGraph) {
    const payload = JSON.stringify(graph).replaceAll("<", "\\u003c");
    return `<script type="application/ld+json">${payload}${closeScript}`;
  }
</script>

<svelte:head>
  {#each graphs as graph, index (`${index}:${graph["@type"] ?? "graph"}`)}
    {@html jsonLdScript(graph)}
  {/each}
</svelte:head>
