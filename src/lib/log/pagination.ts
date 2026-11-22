import { logTitle } from "./constants";

export const LOG_PAGE_SIZE = 10;

const positiveIntegerPattern = /^[1-9]\d*$/u;

export type LogPageParam =
  | { kind: "absent" }
  | { kind: "invalid" }
  | { kind: "page"; page: number };

export type PaginationItem = number | "ellipsis";

export function parseLogPageParam(value: string | null): LogPageParam {
  if (value === null) {
    return { kind: "absent" };
  }
  if (!positiveIntegerPattern.test(value)) {
    return { kind: "invalid" };
  }
  const page = Number(value);
  if (!Number.isSafeInteger(page)) {
    return { kind: "invalid" };
  }
  return { kind: "page", page };
}

export function logPageCount(totalArticles: number, pageSize = LOG_PAGE_SIZE) {
  return Math.max(1, Math.ceil(totalArticles / pageSize));
}

export function paginateArticles<T>(
  items: readonly T[],
  page: number,
  pageSize = LOG_PAGE_SIZE
) {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function logPageHref(page: number) {
  return page === 1 ? "/log" : `/log?page=${page}`;
}

export function logPageTitle(currentPage: number) {
  return currentPage > 1
    ? `${logTitle}（${currentPage}ページ目） | nyatinte.com`
    : `${logTitle} | nyatinte.com`;
}

function visiblePageNumbers(currentPage: number, totalPages: number) {
  const pages = new Set([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);
  return [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right);
}

export function paginationItems(
  currentPage: number,
  totalPages: number
): PaginationItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: PaginationItem[] = [];
  let previousPage = 0;
  for (const page of visiblePageNumbers(currentPage, totalPages)) {
    if (page - previousPage > 1) {
      items.push("ellipsis");
    }
    items.push(page);
    previousPage = page;
  }
  return items;
}
