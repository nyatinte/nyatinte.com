import { shouldStartArticleTransition } from "./view-transition";

interface Activation {
  entry?: { url?: string | URL | null } | null;
  from?: { url?: string | URL | null } | null;
}

type TransitionEvent = Event & {
  viewTransition?: { skipTransition: () => void };
  activation?: Activation | null;
};

function pathnameOf(url: string | URL | null | undefined) {
  if (!url) {
    return;
  }
  if (url instanceof URL) {
    return url.pathname;
  }
  const base = "https://nyatinte.com";
  if (URL.canParse(url, base)) {
    return new URL(url, base).pathname;
  }
}

export function skipUnrelatedDocumentTransition(event: Event) {
  const { viewTransition, activation } = event as TransitionEvent;
  const from = pathnameOf(activation?.from?.url);
  const to = pathnameOf(activation?.entry?.url);

  if (
    !(viewTransition && from && to) ||
    shouldStartArticleTransition(from, to)
  ) {
    return;
  }

  viewTransition.skipTransition();
}

export function registerDocumentTransitionGuards() {
  window.addEventListener("pageswap", skipUnrelatedDocumentTransition);
  window.addEventListener("pagereveal", skipUnrelatedDocumentTransition);

  return () => {
    window.removeEventListener("pageswap", skipUnrelatedDocumentTransition);
    window.removeEventListener("pagereveal", skipUnrelatedDocumentTransition);
  };
}
