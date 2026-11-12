import { minLength, pipe, safeParse, string } from "valibot";

const acceptHeaderSchema = pipe(string(), minLength(1));

interface AcceptRange {
  q: number;
  type: string;
}

function parseAccept(accept: string): AcceptRange[] {
  return accept
    .split(",")
    .map((part) => {
      const sections = part
        .trim()
        .split(";")
        .map((segment) => segment.trim());
      const type = sections[0]?.toLowerCase() ?? "";
      const qParam = sections.find((segment) => segment.startsWith("q="));
      const q = qParam ? Number.parseFloat(qParam.slice(2)) : 1;
      return {
        q: Number.isFinite(q) ? q : 0,
        type,
      };
    })
    .filter((range) => range.type && range.q > 0);
}

function quality(type: string, ranges: AcceptRange[]): number {
  return ranges.find((range) => range.type === type)?.q ?? 0;
}

export function prefersMarkdown(accept: string): boolean {
  const ranges = parseAccept(accept);
  const markdownQuality = quality("text/markdown", ranges);
  if (markdownQuality <= 0) {
    return false;
  }
  const htmlQuality = quality("text/html", ranges);
  if (htmlQuality <= 0) {
    return true;
  }
  return markdownQuality > htmlQuality;
}

export function wantsMarkdown(request: Request): boolean {
  const accept = request.headers.get("accept");
  if (!(accept && safeParse(acceptHeaderSchema, accept).success)) {
    return false;
  }
  return prefersMarkdown(accept);
}
