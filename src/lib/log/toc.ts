export interface TocHeading {
  depth: 2 | 3;
  id: string;
  title: string;
}

const frontmatterPattern = /^---\r?\n[\s\S]*?\r?\n---\r?\n/u;
const newlinePattern = /\r?\n/u;
const fencePattern = /^\s*(```|~~~)/u;
const headingPattern = /^(#{2,3})\s+(.+?)\s*#*\s*$/u;
const inlinePattern = /[`*_~]/gu;

export function slugifyHeading(title: string) {
  const slug = title
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/[\s-]+/gu, "-")
    .replace(/^-|-$/gu, "");
  return slug || "section";
}

export function uniqueHeadingId(title: string, used: Map<string, number>) {
  const base = slugifyHeading(title);
  const count = used.get(base) ?? 0;
  used.set(base, count + 1);
  return count ? `${base}-${count}` : base;
}

export function extractHeadings(markdown: string): TocHeading[] {
  const body = markdown.replace(frontmatterPattern, "");
  const used = new Map<string, number>();
  let fence: string | undefined;
  const headings: TocHeading[] = [];
  for (const line of body.split(newlinePattern)) {
    if (fencePattern.test(line)) {
      const marker = line.includes("```") ? "```" : "~~~";
      fence = fence === undefined ? marker : undefined;
      continue;
    }
    if (fence) {
      continue;
    }
    const match = line.match(headingPattern) as RegExpMatchArray | null;
    if (match === null) {
      continue;
    }
    const title = match[2].replace(inlinePattern, "").trim();
    headings.push({
      depth: match[1].length as 2 | 3,
      id: uniqueHeadingId(title, used),
      title,
    });
  }
  return headings;
}
