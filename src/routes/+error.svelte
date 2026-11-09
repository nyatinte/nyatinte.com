<script lang="ts">
  let { error: failure } = $props();

  function getTitle(code?: App.Error["code"]) {
    if (code === "GONE") {
      return "この実績は削除されています";
    }
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

<main class="error-page">
  <a class="wordmark" href="/done">nyatinte.com</a>
  <p class="eyebrow">nyatinte.com <span>—</span> 実績の記録</p>
  <h1>{getTitle(failure.code)}</h1>
  <p class="message">{failure.message}</p>
  <a class="back-link" href="/done">実績一覧へ戻る</a>
</main>

<style>
  .error-page {
    display: grid;
    align-content: center;
    justify-items: center;
    min-height: 100svh;
    padding: 32px 20px;
    color: #26362e;
    text-align: center;
  }

  .wordmark {
    font-size: 15px;
    font-weight: 750;
    color: #24352e;
    text-decoration: none;
  }

  h1 {
    margin: 0 0 8px;
    font-size: clamp(24px, 5vw, 34px);
    letter-spacing: -0.04em;
  }

  .message {
    margin: 0 0 22px;
    font-size: 14px;
    color: #667068;
  }

  .back-link {
    padding: 9px 14px;
    font-size: 13px;
    color: #245b47;
    text-decoration: none;
    border: 1px solid #d8ded7;
    border-radius: 6px;
  }

  .back-link:hover {
    background: #edf3ed;
  }
</style>
