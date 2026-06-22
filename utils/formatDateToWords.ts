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

export const formatDateTimeLocal = (isoDate: string) => {
  if (!isoDate) return "";

  const d = new Date(isoDate);

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
};

export const toMySQLDateTime = (dateTimeLocal: string) => {
  if (!dateTimeLocal) return null;

  const d = new Date(dateTimeLocal);

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
};
