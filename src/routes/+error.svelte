<script lang="ts">
  let { error: failure } = $props();

  function getTitle(code?: App.Error["code"]) {
    if (code === "NOT_FOUND") {
      return "ページが見つかりません";
    }
    return "ページを表示できません";
  }
</script>

<svelte:head>
  <title>{getTitle(failure.code)} | nyatinte.com</title>
  <meta content="noindex" name="robots">
</svelte:head>

<main class="log error-page">
  <a class="wordmark" href="/">nyatinte.com</a>
  <h1>{getTitle(failure.code)}</h1>
  <p class="message">{failure.message}</p>
  <a class="back-link" href="/log">ログへ戻る</a>
</main>

<style>
  .error-page {
    display: grid;
    align-content: center;
    justify-items: center;
    min-block-size: 100svh;
    padding: 2rem 1.25rem;
    color: var(--home-foreground, oklch(32% 0.025 150));
    text-align: center;
    background: var(--home-background, oklch(98% 0.006 100));
  }

  .wordmark {
    margin-block-end: 1.5rem;
    font-size: 1.125rem;
    font-weight: 700;
    color: inherit;
    letter-spacing: -0.04em;
    text-decoration: none;
  }

  h1 {
    margin: 0 0 0.5rem;
    font-size: clamp(1.5rem, 1.2rem + 1vw, 2.125rem);
    font-weight: 600;
    letter-spacing: -0.04em;
  }

  .message {
    margin: 0 0 1.4rem;
  }

  .back-link {
    padding: 0.6rem 0.9rem;
    color: inherit;
    text-decoration: none;
    border: 1px solid var(--home-nav-border, oklch(37% 0.05 232 / 14%));
    border-radius: 999px;
  }

  .back-link:hover {
    background: var(--home-nav-background, oklch(97% 0.01 211 / 86%));
  }

  a:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 4px;
  }
</style>
