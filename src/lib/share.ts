const xIntentUrl = "https://x.com/intent/post";
const siteName = "nyatinte.com";

export interface XShare {
  title: string;
  url: string;
}

export function xShareText(title: string) {
  return `${title} | ${siteName}`;
}

export function xShareUrl({ title, url }: XShare) {
  const params = new URLSearchParams({ text: xShareText(title), url });
  return `${xIntentUrl}?${params.toString()}`;
}
