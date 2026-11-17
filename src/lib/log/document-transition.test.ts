import { expect, test, vi } from "vite-plus/test";
import { skipUnrelatedDocumentTransition } from "./document-transition";

function event(from: string | undefined, to: string | undefined) {
  const skipTransition = vi.fn();
  return {
    event: {
      activation:
        from && to
          ? {
              entry: { url: `https://nyatinte.com${to}` },
              from: { url: `https://nyatinte.com${from}` },
            }
          : null,
      viewTransition: { skipTransition },
    } as unknown as Event,
    skipTransition,
  };
}

test("ログ一覧から記事へ移動するとき、遷移をスキップしない", () => {
  // Given: ログ一覧から記事へ移動するとき
  // When: document transition を判定すると
  const { event: ev, skipTransition } = event("/log", "/log/template");
  skipUnrelatedDocumentTransition(ev);
  // Then
  expect(skipTransition).not.toHaveBeenCalled();
});

test("記事からログ一覧へ移動するとき、遷移をスキップしない", () => {
  // Given: 記事からログ一覧へ移動するとき
  // When: document transition を判定すると
  const { event: ev, skipTransition } = event("/log/template", "/log");
  skipUnrelatedDocumentTransition(ev);
  // Then
  expect(skipTransition).not.toHaveBeenCalled();
});

test("遷移 API がないとき、何もしない", () => {
  // Given: 遷移 API がないとき
  // When: document transition を判定すると
  const { event: ev, skipTransition } = event(undefined, undefined);
  skipUnrelatedDocumentTransition(ev);
  // Then
  expect(skipTransition).not.toHaveBeenCalled();
});
