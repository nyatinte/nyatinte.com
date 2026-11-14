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
    <!-- JSON は stringify し、< を \u003c に逃がしている。{@html} は JSON-LD の script を head に出すために必要。 -->
    <!-- svelte-vitals-disable-next-line security/raw-html -->
    {@html jsonLdScript(graph)}
  {/each}
</svelte:head>
