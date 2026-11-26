import { uniqueHeadingId } from "./toc";

interface MarkdownNode {
  children?: Array<MarkdownNode>;
  data?: { hProperties?: Record<string, string> };
  depth?: number;
  type?: string;
  url?: string;
  value?: string;
}
interface MarkdownTree {
  children?: Array<MarkdownNode>;
  type: string;
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
            "",
        )
        .join("");
      const id = uniqueHeadingId(title || "section", used);
      node.data ??= {};
      node.data.hProperties = {
        ...node.data.hProperties,
        id,
      };
      node.children = [
        ...(node.children ?? []),
        {
          children: [],
          data: {
            hProperties: {
              "aria-label": `『${title}』へのリンク`,
              className: "heading-anchor",
              href: `#${id}`,
            },
          },
          type: "link",
          url: `#${id}`,
        },
      ];
    }
  };
}
