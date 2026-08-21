interface PurchaseStatusOption {
  label: string;
  value: string;
  bg: string;
  color: string;
  border: string;
  dot: string;
}
export const requestStatusOptions: PurchaseStatusOption[] = [
  {
    label: "Pending",
    value: "pending",
    bg: "bg-gray-50",
    color: "text-gray-700",
    border: "border-gray-200",
    dot: "bg-gray-500",
  },

  {
    label: "Approved",
    value: "approved",
    bg: "bg-cyan-50",
    color: "text-cyan-700",
    border: "border-cyan-200",
    dot: "bg-cyan-500",
  },
  {
    label: "Sent",
    value: "sent",
    bg: "bg-amber-100",
    color: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  {
    label: "Delivered",
    value: "delivered",
    bg: "bg-violet-50",
    color: "text-violet-700",
    border: "border-violet-200",
    dot: "bg-violet-500",
  },
  {
    label: "Received",
    value: "received",
    bg: "bg-emerald-50",
    color: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  {
    label: "Completed",
    value: "completed",
    bg: "bg-primary-1/20",
    color: "text-primary-1",
    border: "border-primary-1/50",
    dot: "bg-primary-1",
  },
  {
    label: "Not Ordered",
    value: "not_ordered",
    bg: "bg-red-100",
    color: "text-red-600",
    border: "border-red-1/50",
    dot: "bg-red-500",
  },
  {
    label: "Received Store",
    value: "received_store",
    bg: "bg-blue-100",
    color: "text-blue-600",
    border: "border-blue-1/50",
    dot: "bg-blue-500",
  },
  // Only reachable via reqItemStatus (not a poItemStatus enum value), but
  // defined here too so both fields share one color per status - shown
  // side by side in views like ReceivedPOView, two different colors for
  // the same word ("Removed"/"Partial") would be confusing.
  {
    label: "Removed",
    value: "removed",
    bg: "bg-red-100",
    color: "text-red-600",
    border: "border-red-1/50",
    dot: "bg-red-500",
  },
  {
    label: "Partial",
    value: "partial",
    bg: "bg-indigo-50",
    color: "text-indigo-700",
    border: "border-indigo-200",
    dot: "bg-indigo-500",
  },
  {
    label: "Complete",
    value: "complete",
    bg: "bg-primary-1/20",
    color: "text-primary-1",
    border: "border-primary-1/50",
    dot: "bg-primary-1",
  },
];

export function getPurchaseStatusOption(value: string): PurchaseStatusOption {
  const option = requestStatusOptions.find((opt) => opt.value === value);
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
