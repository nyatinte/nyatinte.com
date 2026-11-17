import { expect, test } from "vite-plus/test";
import { homeThemeMessage, nextHomeTheme } from "./home-theme";

test("明示的なホームテーマの場合に次のテーマと通知文を返す", () => {
  // Given: 明示的なホームテーマ
  // When: テーマを切り替えると
  // Then
  expect(nextHomeTheme("dark")).toBe("light");
  expect(nextHomeTheme("light")).toBe("dark");
  expect(homeThemeMessage("dark")).toBe("ダークモードに切り替えました");
  expect(homeThemeMessage("light")).toBe("ライトモードに切り替えました");
});
