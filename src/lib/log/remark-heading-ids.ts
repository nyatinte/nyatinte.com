import { uniqueHeadingId } from "./toc";

interface HeadingNode {
  children?: Array<{ value?: string; children?: Array<{ value?: string }> }>;
  data?: { hProperties?: Record<string, string> };
  depth?: number;
}
interface MarkdownTree {
  children?: HeadingNode[];
}

export function remarkHeadingIds() {
  return (tree: MarkdownTree) => {
    const used = new Map<string, number>();
    for (const node of tree.children ?? []) {
      if (node.depth !== 2 && node.depth !== 3) {
        continue;
      }
      const title = (node.children ?? [])
        .map(
          (child) =>
            child.value ??
            child.children?.map((part) => part.value ?? "").join("") ??
            ""
        )
        .join("");
      node.data ??= {};
      node.data.hProperties = {
        ...node.data.hProperties,
        id: uniqueHeadingId(title || "section", used),
      };
    }
  };
}
