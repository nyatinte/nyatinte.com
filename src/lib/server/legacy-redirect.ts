export function legacyDoneLocation(pathname: string): "/log" | null {
  if (pathname === "/done" || pathname.startsWith("/done/")) {
    return "/log";
  }
  return null;
}
