export const copyFeedback = {
  failure: "コピーできませんでした",
  success: "コピーしました",
} as const;

export type ClipboardWriter = (text: string) => Promise<void>;

function writeToClipboard(text: string) {
  return navigator.clipboard.writeText(text);
}

export async function copyText(text: string, write?: ClipboardWriter) {
  try {
    await (write ?? writeToClipboard)(text);
    return copyFeedback.success;
  } catch {
    return copyFeedback.failure;
  }
}
