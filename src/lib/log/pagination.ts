import { logTitle } from "./constants";

export const LOG_PAGE_SIZE = 10;

const positiveIntegerPattern = /^[1-9]\d*$/u;

export type LogPageParam =
  | { kind: "absent" }
  | { kind: "invalid" }
  | { kind: "page"; page: number };

export function parseLogPageParam(value: string | null): LogPageParam {
  if (value === null) {
    return { kind: "absent" };
  }
  if (!positiveIntegerPattern.test(value)) {
    return { kind: "invalid" };
  }
  return { kind: "page", page: Number(value) };
}

export function logPageCount(totalArticles: number, pageSize = LOG_PAGE_SIZE) {
  return Math.max(1, Math.ceil(totalArticles / pageSize));
}

export function paginateArticles<T>(
  items: ReadonlyArray<T>,
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

export function paginationItems(totalPages: number) {
  return Array.from({ length: totalPages }, (_, index) => index + 1);
}
