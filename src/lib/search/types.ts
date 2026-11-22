export type SearchStatus =
  | "idle"
  | "loading"
  | "ready"
  | "empty"
  | "unavailable"
  | "error";

export interface SearchSegment {
  mark: boolean;
  text: string;
}

export interface SearchResult {
  excerptSegments: SearchSegment[];
  slug: string;
  title: string;
  url: string;
}

export interface SearchResponse {
  message?: string;
  results: SearchResult[];
  status: Exclude<SearchStatus, "idle" | "loading">;
}
