import z from "zod/v4";

export const acceptHeaderSchema = z.string().min(1);

function tokenizeAccept(accept: string) {
  return accept
    .split(",")
    .map((part) => part.trim().split(";")[0]?.trim().toLowerCase() ?? "")
    .filter(Boolean);
}

export function acceptIncludesMarkdown(accept: string): boolean {
  return tokenizeAccept(accept).some((media) => media === "text/markdown");
}

export function wantsMarkdown(request: Request): boolean {
  const accept = request.headers.get("accept");
  if (!(accept && acceptHeaderSchema.safeParse(accept).success)) {
    return false;
  }
  return acceptIncludesMarkdown(accept);
}
