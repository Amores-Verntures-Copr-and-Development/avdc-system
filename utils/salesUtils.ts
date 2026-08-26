interface SalesStatusOptions {
  label: string;
  value: string;
  bg: string;
  color: string;
  border: string;
  dot: string;
}
export const salesStatusOptions: SalesStatusOptions[] = [
  {
    label: "Pending",
    value: "pending",
    bg: "bg-gray-50",
    color: "text-gray-700",
    border: "border-gray-200",
    dot: "bg-gray-500",
  },
  {
    label: "Pending Approval",
    value: "pending_approval",
    bg: "bg-orange-50",
    color: "text-orange-700",
    border: "border-orange-200",
    dot: "bg-orange-500",
  },
  {
    label: "Rejected",
    value: "rejected",
    bg: "bg-red-50",
    color: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
  },
  {
    label: "Completed",
    value: "completed",
    bg: "bg-green-50",
    color: "text-green-700",
    border: "border-green-200",
    dot: "bg-green-500",
  },
  {
    label: "Failed",
    value: "failed",
    bg: "bg-red-50",
    color: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
  },
  {
    label: "Refunded",
    value: "refunded",
    bg: "bg-red-50",
    color: "text-red-800",
    border: "border-red-200",
    dot: "bg-red-500",
  },
  {
    label: "Cancelled",
    value: "cancelled",
    bg: "bg-gray-100",
    color: "text-gray-600",
    border: "border-gray-300",
    dot: "bg-gray-400",
  },
];

export function getSalesStatusOption(value: string): SalesStatusOptions {
  const option = salesStatusOptions.find((opt) => opt.value === value);
  return (
    option ?? {
      label: "Unknown",
      value,
      bg: "bg-gray-100",
      color: "text-gray-700",
      dot: "bg-gray-500",
      border: "border-gray-300",
    }
  );
}
