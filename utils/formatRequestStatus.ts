import { RequestStatus } from "@/types/request";

interface RequestStatusProps {
  status: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export function getRequestStatusFormat(
  status: RequestStatus
): RequestStatusProps {
  switch (status) {
    case "pending":
      return {
        status: "Pending",
        bgClass: "bg-gray-100",
        textClass: "text-gray-700 ",
        borderClass: "border border-gray-200",
      };
    case "in_progress":
      return {
        status: "In Progress",
        bgClass: "bg-blue-100",
        textClass: "text-blue-700 ",
        borderClass: "border border-blue-200",
      };
    case "approved":
      return {
        status: "Approved",
        bgClass: "bg-red-100",
        textClass: "text-red-700 ",
        borderClass: "border border-red-200",
      };
    case "delivered":
      return {
        status: "Delivered",
        bgClass: "bg-yellow-100",
        textClass: "text-yellow-700 ",
        borderClass: "border border-yellow-200",
      };
    case "received":
      return {
        status: "Received",
        bgClass: "bg-green-100",
        textClass: "text-green-700 ",
        borderClass: "border border-green-200",
      };
    case "completed":
      return {
        status: "Completed",
        bgClass: "bg-pink-100",
        textClass: "text-primary-1",
        borderClass: "border border-pink-200",
      };
    default:
      return {
        status: "Pending",
        bgClass: "bg-red-100",
        textClass: "text-red-700 ",
        borderClass: "border border-red-200",
      };
  }
}
