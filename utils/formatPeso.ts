export function formatPeso(value: number | string | null | undefined): string {
  const num = Number(value);
  if (isNaN(num)) return "₱0.00";

  return `₱${num.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
