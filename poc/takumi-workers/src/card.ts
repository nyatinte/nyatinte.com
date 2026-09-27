import { layoutTags, type TextLayout } from "./layout";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/u;
export const OGP_FONT_FAMILY = "M PLUS 1p";

export interface AchievementCardContent {
  occurredAt: string;
  tags: readonly string[];
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatOccurredAt(value: string): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (
    !DATE_ONLY.test(value) ||
    Number.isNaN(date.valueOf()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new RangeError("Expected a valid YYYY-MM-DD date");
  }

  return value.replaceAll("-", "/");
}

function linesHtml(lines: readonly string[]): string {
  return lines
    .map(
      (line) => `<div style="white-space: nowrap;">${escapeHtml(line)}</div>`
    )
    .join("");
}

export function createImageHtml(
  title: TextLayout,
  summary: TextLayout,
  content: AchievementCardContent
): string {
  const tagHtml = layoutTags(content.tags).map(
    (tag) =>
      `<div style="box-sizing: border-box; max-width: 184px; overflow: hidden; padding: 8px 15px; border: 1px solid #465166; border-radius: 20px; background: #202735; color: #d9dfeb; font-size: 17px; line-height: 1.2; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(tag)}</div>`
  );

  return `
<div lang="ja" style="position: relative; box-sizing: border-box; display: flex; flex-direction: column; width: 1200px; height: 630px; padding: 58px 68px 54px 88px; background: linear-gradient(135deg, #11151d, #1a2230); color: #f5f3ed; font-family: '${OGP_FONT_FAMILY}'; font-weight: 700;">
  <div style="position: absolute; top: 48px; bottom: 48px; left: 36px; width: 5px; border-radius: 3px; background: #ffbe70;"></div>
  <div style="display: flex; align-items: center; justify-content: space-between;">
    <div style="display: flex; align-items: center; gap: 14px;">
      <div style="width: 13px; height: 13px; border-radius: 50%; background: #ffbe70;"></div>
      <div style="font-size: 27px; line-height: 1;"><span>nyatinte.com</span><span style="margin-left: 9px; color: #929bad;">/done</span></div>
    </div>
    <div style="color: #aeb6c5; font-size: 20px;">${formatOccurredAt(content.occurredAt)}</div>
  </div>
  <div style="display: flex; flex: 1; flex-direction: column; justify-content: center; padding-top: 22px;">
    <div style="font-size: ${title.fontSize}px; line-height: 1.24; letter-spacing: 0.01em;">${linesHtml(title.lines)}</div>
    <div style="margin-top: 25px; color: #b5bdcb; font-size: ${summary.fontSize}px; line-height: 1.5;">${linesHtml(summary.lines)}</div>
  </div>
  <div style="display: flex; align-items: center; justify-content: space-between;">
    <div style="display: flex; align-items: center; gap: 11px; max-width: 580px; min-width: 0; overflow: hidden;">${tagHtml.join("")}</div>
    <div style="display: flex; align-items: center; gap: 11px; color: #d4dae4; font-size: 20px;">
      <div style="display: flex; width: 36px; height: 36px; align-items: center; justify-content: center; border: 1px solid #68758b; border-radius: 12px; color: #ffbe70; font-size: 15px;">ny</div>
      <span>@nyatinte</span>
    </div>
  </div>
</div>`;
}
