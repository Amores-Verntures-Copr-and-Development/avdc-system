export type MovementStatus = "in" | "out";

interface MovementType {
  type: MovementStatus;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export function getMovementType(type: MovementStatus): MovementType {
  switch (type) {
    case "in":
      return {
        type,
        bgClass: "bg-green-100",
        textClass: "text-green-700 ",
        borderClass: "border border-green-200",
      };
    case "out":
      return {
        type,
        bgClass: "bg-red-100",
        textClass: "text-red-700 ",
        borderClass: "border border-red-200",
      };
  }
}
