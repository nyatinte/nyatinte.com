import { expect, test } from "vite-plus/test";
import { homeThemeMessage, nextHomeTheme } from "./home-theme";

test("Given 明示的なホームテーマ、When テーマを切り替えると、Then 次のテーマと通知文を返す", () => {
  expect(nextHomeTheme("dark")).toBe("light");
  expect(nextHomeTheme("light")).toBe("dark");
  expect(homeThemeMessage("dark")).toBe("ダークモードに切り替えました");
  expect(homeThemeMessage("light")).toBe("ライトモードに切り替えました");
});
