const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  dateStyle: "long",
  timeZone: "UTC",
});

export function formatLogDate(value: string) {
  return dateFormatter.format(new Date(`${value}T00:00:00.000Z`));
}

export function rssDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`).toUTCString();
}
