export type StockStatus = "No Stock" | "Low Stock" | "Good" | "Out of Stock";

interface InventoryStatusInfo {
  status: StockStatus;
  bgClass: string;
  textClass: string;
}

export function getInventoryStatus(quantity: number, min: number): StockStatus {
  if (quantity <= 0) return "No Stock";
  if (quantity < min) return "Low Stock";
  return "Good";
}

export function getInventoryStatusInfo(
  quantity: number,
  min: number
): InventoryStatusInfo {
  const status = getInventoryStatus(quantity, min);

  switch (status) {
    case "No Stock":
      return {
        status: "Out of Stock",
        bgClass: "bg-red-100",
        textClass: "text-red-700 ",
      };
    case "Low Stock":
      return {
        status,
        bgClass: "bg-yellow-100",
        textClass: "text-yellow-700",
      };
    default:
      return {
        status,
        bgClass: "bg-green-100",
        textClass: "text-green-700",
      };
  }
}
