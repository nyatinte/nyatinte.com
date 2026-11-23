import { expect, test, vi } from "vite-plus/test";
import { skipUnrelatedDocumentTransition } from "./document-transition";

function event(from: string | undefined, to: string | undefined) {
  const skipTransition = vi.fn();
  return {
    event: Object.assign(new Event("pageswap"), {
      activation:
        from && to
          ? {
              entry: { url: `https://nyatinte.com${to}` },
              from: { url: `https://nyatinte.com${from}` },
            }
          : null,
      viewTransition: { skipTransition },
    }),
    skipTransition,
  };
}

test("keeps the list-to-article document transition", () => {
  const { event: ev, skipTransition } = event("/log", "/log/template");
  skipUnrelatedDocumentTransition(ev);
  expect(skipTransition).not.toHaveBeenCalled();
});

test("keeps the article-to-list document transition", () => {
  const { event: ev, skipTransition } = event("/log/template", "/log");
  skipUnrelatedDocumentTransition(ev);
  expect(skipTransition).not.toHaveBeenCalled();
});

test("keeps the list-to-article transition from a paginated list", () => {
  const { event: ev, skipTransition } = event("/log?page=2", "/log/template");
  skipUnrelatedDocumentTransition(ev);
  expect(skipTransition).not.toHaveBeenCalled();
});

test("keeps the article-to-list transition back to a paginated list", () => {
  const { event: ev, skipTransition } = event("/log/template", "/log?page=2");
  skipUnrelatedDocumentTransition(ev);
  expect(skipTransition).not.toHaveBeenCalled();
});

test("skips the transition between log list pages", () => {
  const { event: ev, skipTransition } = event("/log", "/log?page=2");
  skipUnrelatedDocumentTransition(ev);
  expect(skipTransition).toHaveBeenCalledOnce();
});

test("does nothing when the activation API is missing", () => {
  const { event: ev, skipTransition } = event(undefined, undefined);
  skipUnrelatedDocumentTransition(ev);
  expect(skipTransition).not.toHaveBeenCalled();
});

test("keeps the list-to-article transition when activation URLs are URL objects", () => {
  const skipTransition = vi.fn();
  const ev = Object.assign(new Event("pageswap"), {
    activation: {
      entry: { url: new URL("https://nyatinte.com/log/template") },
      from: { url: new URL("https://nyatinte.com/log") },
    },
    viewTransition: { skipTransition },
  });
  skipUnrelatedDocumentTransition(ev);
  expect(skipTransition).not.toHaveBeenCalled();
});
