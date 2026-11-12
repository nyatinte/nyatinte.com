import { expect, test } from "vite-plus/test";
import { homeThemeMessage, nextHomeTheme } from "./home-theme";

test("switches an explicit home theme and labels it", () => {
  expect(nextHomeTheme("dark")).toBe("light");
  expect(nextHomeTheme("light")).toBe("dark");
  expect(homeThemeMessage("dark")).toBe("ダークモードに切り替えました");
  expect(homeThemeMessage("light")).toBe("ライトモードに切り替えました");
});
