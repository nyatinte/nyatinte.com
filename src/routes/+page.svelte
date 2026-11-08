<svelte:head>
  <title>nyatinte.com</title>
  <meta content="nyatinte の、やったことを記録する場所。" name="description">
</svelte:head>

<div class="page">
  <header>
    <a class="site-name" href="/">nyatinte.com</a>
    <a class="header-link" href="/done"
      >やったこと <span aria-hidden="true">↗</span></a
    >
  </header>

  <main>
    <div class="intro">
      <p class="eyebrow">nyatinte の記録</p>
      <h1>やったことを、<br>ひとつずつ。</h1>
      <p class="description">
        つくったもの、試したこと、できるようになったこと。<br>日々の小さな実績をここに残しています。
      </p>
      <a class="action" href="/done"
        >やったことを見る <span aria-hidden="true">→</span></a
      >
    </div>
    <div aria-hidden="true" class="mark">
      <div class="mark-inner">
        <span>やったこと</span><span class="mark-check">✓</span
        ><span>記録して、つづける</span>
      </div>
    </div>
  </main>

  <footer><span>nyatinte.com</span><span>記録は、ここから</span></footer>
</div>

<style>
  @layer components {
    @scope (.page) {
      :scope {
        display: flex;
        flex-direction: column;
        min-block-size: 100svh;
        container-type: inline-size;
        font-family: "M PLUS 1p", sans-serif;
        color: oklch(28% 0.01 150);
        background: oklch(96% 0.01 100);
      }
      header,
      footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        inline-size: min(100% - 4rem, 75rem);
        margin-inline: auto;
      }
      header {
        block-size: 5.5rem;
        border-block-end: 1px solid oklch(86% 0.01 100);
      }
      a {
        color: inherit;
        text-decoration: none;
      }
      a:focus-visible {
        outline: 2px solid oklch(44% 0.08 155);
        outline-offset: 5px;
      }
      .site-name {
        font-size: 18px;
        font-weight: 600;
      }
      .header-link {
        font-size: 14px;
      }
      .header-link span {
        margin-left: 8px;
      }
      main {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 64px;
        align-items: center;
        inline-size: min(100% - 4rem, 75rem);
        padding-block: clamp(4.5rem, 2rem + 5cqi, 6rem);
        margin: auto;
      }
      .eyebrow {
        margin: 0 0 28px;
        font-size: 14px;
        color: oklch(49% 0.02 150);
      }
      h1 {
        margin: 0;
        font-size: clamp(2.5rem, 1.5rem + 4cqi, 4.25rem);
        font-weight: 500;
        line-height: 1.45;
        letter-spacing: -0.04em;
        text-wrap: balance;
      }
      .description {
        margin: 28px 0 36px;
        font-size: 15px;
        line-height: 2;
        color: oklch(49% 0.02 150);
        text-wrap: pretty;
      }
      .action {
        display: inline-flex;
        gap: 56px;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        font-size: 14px;
        color: oklch(100% 0 0);
        background: oklch(43% 0.07 155);
      }
      .action:hover {
        background: oklch(35% 0.06 155);
      }
      .mark {
        display: grid;
        place-items: center;
        justify-self: end;
        inline-size: 100%;
        max-inline-size: 27.5rem;
        aspect-ratio: 1;
        background: oklch(93% 0.015 120);
        border: 1px solid oklch(86% 0.01 100);
      }
      .mark-inner {
        display: flex;
        flex-direction: column;
        gap: 20px;
        align-items: center;
        justify-content: center;
        inline-size: 68%;
        aspect-ratio: 1;
        font-size: 13px;
        color: oklch(43% 0.07 155);
        border: 1px solid oklch(73% 0.03 145);
      }
      .mark-check {
        display: grid;
        place-items: center;
        inline-size: 6rem;
        block-size: 6rem;
        font-size: 48px;
        line-height: 1;
        color: oklch(96% 0.01 100);
        background: oklch(43% 0.07 155);
        border-radius: 50%;
      }
      footer {
        min-block-size: 5rem;
        font-size: 12px;
        color: oklch(52% 0.02 150);
        border-block-start: 1px solid oklch(86% 0.01 100);
      }
      @container (width <= 43.75rem) {
        header,
        footer,
        main {
          inline-size: calc(100% - 2.5rem);
        }
        header {
          block-size: 4.5rem;
        }
        main {
          grid-template-columns: 1fr;
          gap: 48px;
          padding-block: 72px;
        }
        .description br {
          display: none;
        }
        .mark {
          justify-self: start;
          max-inline-size: 22.5rem;
        }
      }
    }
  }
</style>
