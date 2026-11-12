<script lang="ts">
  import { onMount } from "svelte";
  import type { TocHeading } from "../log/toc";
  import { pulseHaptic } from "../log/toc-haptics";

  let { headings }: { headings: TocHeading[] } = $props();
  let active = $state("");
  let dragging = $state(false);
  let labelIndex = $state(-1);

  function jump(index: number) {
    const heading = headings[index];
    if (!heading) {
      return;
    }
    document.getElementById(heading.id)?.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
    location.hash = heading.id;
  }

  function setIndex(index: number) {
    const heading = headings[index];
    if (!heading) {
      return;
    }
    if (active !== heading.id) {
      pulseHaptic();
    }
    active = heading.id;
    labelIndex = index;
  }

  let labelY = $state(0);

  function selectAt(event: PointerEvent) {
    const rect =
      event.currentTarget instanceof HTMLElement
        ? event.currentTarget.getBoundingClientRect()
        : null;
    if (!rect) {
      return;
    }
    labelY = event.clientY - rect.top;
    setIndex(
      Math.min(
        headings.length - 1,
        Math.floor(
          Math.max(0, (event.clientY - rect.top) / rect.height) *
            headings.length
        )
      )
    );
  }

  onMount(() => {
    active = headings[0]?.id ?? "";
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (!dragging && visible[0]) {
          active = visible[0].target.id;
        }
      },
      { rootMargin: "-15% 0px -75% 0px" }
    );
    for (const heading of headings) {
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    }
    return () => observer.disconnect();
  });
</script>

<input
  aria-hidden="true"
  class="haptic-switch"
  id="toc-haptic-switch"
  tabindex="-1"
  type="checkbox"
  {...{ switch: true }}
>
<nav aria-label="目次" class="toc">
  <h2>目次</h2>
  {#each headings as heading (heading.id)}
    <a
      aria-current={active === heading.id ? "location" : undefined}
      href="#{heading.id}"
      class:nested={heading.depth === 3}
      >{heading.title}</a
    >
  {/each}
</nav>
<div
  aria-hidden="true"
  class="scrubber"
  onpointercancel={() => {
    dragging = false;
  }}
  onpointerdown={(event) => {
    dragging = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    selectAt(event);
  }}
  onpointermove={(event) => {
    if (dragging) {
      selectAt(event);
    }
  }}
  onpointerup={(event) => {
    if (dragging) {
      jump(labelIndex);
    }
    dragging = false;
  }}
>
  {#each headings as heading, index (heading.id)}
    <div
      class:active={active === heading.id}
      class:short={heading.depth === 3}
    ></div>
  {/each}
  {#if dragging && headings[labelIndex]}
    <span class="label" style:top={`${labelY}px`}
      >{headings[labelIndex].title}</span
    >
  {/if}
</div>

<style>
  .haptic-switch {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
  .toc {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
  .toc h2 {
    margin: 0 0 0.7rem;
    font-size: 0.9rem;
  }
  .toc a {
    display: block;
    padding: 0.25rem 0;
    font-size: 0.82rem;
    line-height: 1.4;
    color: inherit;
    text-decoration: none;
  }
  .toc a.nested {
    padding-inline-start: 0.8rem;
    font-size: 0.75rem;
  }
  .toc a[aria-current="location"] {
    color: var(--home-accent);
  }
  .scrubber {
    position: fixed;
    inset-inline-end: 0.35rem;
    top: 40%;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    align-items: end;
    width: 1.7rem;
    padding: 0.5rem 0;
    touch-action: none;
  }
  .scrubber div {
    width: 0.9rem;
    height: 3px;
    background: var(--home-nav-border);
  }
  .scrubber div.short {
    width: 0.6rem;
  }
  .scrubber div.active {
    background: var(--home-accent);
  }
  .label {
    position: absolute;
    inset-inline-end: 2rem;
    width: max-content;
    max-width: 12rem;
    padding: 0.3rem 0.5rem;
    font-size: 0.75rem;
    color: var(--home-foreground);
    background: var(--home-nav-background);
    border: 1px solid var(--home-nav-border);
    transform: translateY(-50%);
  }
  @media (min-width: 1150px) {
    .toc {
      position: sticky;
      top: 2rem;
      display: block;
      grid-row: 1;
      grid-column: 3;
      align-self: start;
      max-height: calc(100vh - 4rem);
      padding-inline-start: 1rem;
      overflow-y: auto;
      border-inline-start: 1px solid var(--home-nav-border);
    }
    .scrubber {
      display: none;
    }
  }
</style>
