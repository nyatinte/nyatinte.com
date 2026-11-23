<script lang="ts">
  let {
    href,
    title,
    transitionName,
  }: { href: string; title: string; transitionName?: string } = $props();
</script>

<h2 style:view-transition-name={transitionName}>
  <a {href}>{title}</a>
</h2>

<style>
  h2 {
    margin: 0.3rem 0 0.45rem;
    font-size: clamp(1.4rem, 1.2rem + 0.6vw, 1.8rem);
    font-weight: 600;
    line-height: 1.3;
    letter-spacing: -0.03em;
  }

  h2 a {
    color: inherit;
    text-decoration-thickness: 1px;
    text-underline-offset: 0.18em;
  }

  h2 a:hover {
    color: var(--home-accent);
  }

  a:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 4px;
  }
</style>
