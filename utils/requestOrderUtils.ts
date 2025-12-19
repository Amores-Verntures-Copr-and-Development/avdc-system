interface RequestStatusOption {
  label: string;
  value: string;
  bg: string;
  color: string;
  border: string;
  dot: string;
}
export const requestStatusOptions: RequestStatusOption[] = [
  {
    label: "Pending",
    value: "pending",
    bg: "bg-gray-50",
    color: "text-gray-700",
    border: "border-gray-200",
    dot: "bg-gray-500",
  },
  {
    label: "In Progress",
    value: "in_progress",
    bg: "bg-blue-50",
    color: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
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
    label: "Rejected",
    value: "rejected",
    bg: "bg-red-50",
    color: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
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
    label: "Cancelled",
    value: "cancelled",
    bg: "bg-gray-50",
    color: "text-gray-700",
    border: "border-gray-200",
    dot: "bg-gray-500",
  },
  {
    label: "Completed",
    value: "completed",
    bg: "bg-primary-1/20",
    color: "text-primary-1",
    border: "border-primary-1/50",
    dot: "bg-primary-1",
  },
];

export function getRequestStatusOption(value: string): RequestStatusOption {
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
