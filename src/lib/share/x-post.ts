export interface XPostDraftInput {
  summary: string;
  title: string;
  url: string;
}

export function createXPostDraft({ title, summary, url }: XPostDraftInput) {
  return `${title}\n\n${summary}\n\n${url}`;
}

export function createXIntentUrl(draft: string) {
  const intent = new URL("https://twitter.com/intent/tweet");
  intent.searchParams.set("text", draft);
  return intent.href;
}
