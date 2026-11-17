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

test("Given ログ一覧から記事へ移動するとき、When document transition を判定すると、Then 遷移をスキップしない", () => {
  const { event: ev, skipTransition } = event("/log", "/log/template");
  skipUnrelatedDocumentTransition(ev);
  expect(skipTransition).not.toHaveBeenCalled();
});

test("Given 記事からログ一覧へ移動するとき、When document transition を判定すると、Then 遷移をスキップしない", () => {
  const { event: ev, skipTransition } = event("/log/template", "/log");
  skipUnrelatedDocumentTransition(ev);
  expect(skipTransition).not.toHaveBeenCalled();
});

test("Given 遷移 API がないとき、When document transition を判定すると、Then 何もしない", () => {
  const { event: ev, skipTransition } = event(undefined, undefined);
  skipUnrelatedDocumentTransition(ev);
  expect(skipTransition).not.toHaveBeenCalled();
});
