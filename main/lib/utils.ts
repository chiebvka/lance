import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Json } from "@/types/supabase";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safeParseJsonArray(json: Json | null | undefined): any[] {
  if (!json) {
    return [];
  }
  if (Array.isArray(json)) {
    return json;
  }
  if (typeof json === "string") {
    try {
      const parsed = JSON.parse(json);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Failed to parse JSON string:", error);
      return [];
    }
  }
  return [];
}
