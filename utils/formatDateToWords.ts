export function formatDateToWords(
  isoString: string,
  options?: { showMinute?: boolean; showHour?: boolean }
): string {
  if (!isoString) return "";

  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";

  const { showMinute = false, showHour = false } = options || {};

  const formatOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour12: true,
  };

  if (showMinute) {
    formatOptions.minute = "2-digit";
  }
  if (showHour) {
    formatOptions.hour = "numeric";
  }

  return date.toLocaleString("en-US", formatOptions);
}
