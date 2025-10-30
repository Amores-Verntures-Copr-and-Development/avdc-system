export type POStatus =
  | "pending"
  | "approved"
  | "sent"
  | "received"
  | "completed";

interface POStatusInfo {
  status: POStatus;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export function getPOStatusInfo(status: POStatus): POStatusInfo {
  switch (status) {
    case "pending":
      return {
        status,
        bgClass: "bg-gray-100",
        textClass: "text-gray-700 ",
        borderClass: "border border-gray-200",
      };
    case "approved":
      return {
        status,
        bgClass: "bg-indigo-100",
        textClass: "text-blue-700 ",
        borderClass: "border border-indigo-200",
      };
    case "sent":
      return {
        status,
        bgClass: "bg-orange-100",
        textClass: "text-yellow-700 ",
        borderClass: "border border-orange-200",
      };
    case "received":
      return {
        status,
        bgClass: "bg-purple-100",
        textClass: "text-purple-700 ",
        borderClass: "border border-purple-200",
      };
    case "completed":
      return {
        status,
        bgClass: "bg-teal-100",
        textClass: "text-green-700",
        borderClass: "border border-teal-200",
      };
    default:
      return {
        status,
        bgClass: "bg-gray-100",
        textClass: "text-gray-700",
        borderClass: "border border-gray-200",
      };
  }
}
