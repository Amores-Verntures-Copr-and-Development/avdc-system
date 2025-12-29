export function formatQuantityByUnit(
  value: number | string,
  unit: string
): string {
  if (value === null || value === undefined) return "0";

  const num = Number(value);
  if (isNaN(num)) return "0";

  const decimalUnits = ["kg", "gal"]; // units that allow decimals
  const isDecimalUnit = decimalUnits.includes(unit.toLowerCase());

  if (isDecimalUnit) {
    // Convert number to string without rounding
    const str = num.toString();
    const [intPart, decPart] = str.split(".");

    if (!decPart || Number(decPart) === 0) {
      return intPart; // e.g., 1.00 → "1"
    }

    // Truncate to max 2 decimals, remove trailing zeros
    const truncated = decPart.slice(0, 2).replace(/0+$/, "");
    return truncated ? `${intPart}.${truncated}` : intPart;
  }

  // Discrete units: show as whole number
  return Math.trunc(num).toString();
}
