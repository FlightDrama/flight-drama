import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
// image-gen-v3 Thu Jun  4 14:05:07 UTC 2026
// war-block + cleanup Fri Jun  5 09:36:49 UTC 2026
