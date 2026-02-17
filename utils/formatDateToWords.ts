export function formatDateToWords(
  isoString: string,
  options?: {
    showMinute?: boolean;
    showHour?: boolean;
    showHourAndMinuteOnly?: boolean;
  },
): string {
  if (!isoString) return "";

  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";

  const {
    showMinute = false,
    showHour = false,
    showHourAndMinuteOnly = false,
  } = options || {};

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
  if (showHourAndMinuteOnly) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  return date.toLocaleString("en-US", formatOptions);
}
