import clsx, { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(...inputs));
}

export const getExpiresAt = (expiresIn: string): string => {
  return new Date(Date.now() + Number(expiresIn) * 1000)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");
};
