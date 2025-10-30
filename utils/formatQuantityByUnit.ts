export function formatQuantityByUnit(
  value: number | string,
  unit: string
): string {
  if (value === null || value === undefined) return "0";

  const num = Number(value);

  // Handle invalid number
  if (isNaN(num)) return "0";

  // Units that can have decimals (you can expand this list)
  const decimalUnits = ["kg", "gal"];

  // Show 2 decimals only for decimal-based units
  if (decimalUnits.includes(unit.toLowerCase())) {
    return num.toFixed(2); // e.g. 1.50 kg
  }

  // Show whole numbers for discrete units
  return Math.round(num).toString(); // e.g. 10 pack
}
