<script lang="ts">
  type JsonLdGraph = Record<string, unknown>;

  let { graphs }: { graphs: readonly JsonLdGraph[] } = $props();
</script>

<svelte:head>
  {#each graphs as graph, index (`${index}:${graph["@type"] ?? "graph"}`)}
    <script type="application/ld+json">
      {JSON.stringify(graph)}
    </script>
  {/each}
</svelte:head>
