import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isParkable(type: string): boolean {
  return type !== "clearway" && type !== "loading" && type !== "permit";
}
