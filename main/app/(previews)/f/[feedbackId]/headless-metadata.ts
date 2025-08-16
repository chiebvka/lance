import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export function getFeedbackMetadata(id?: string): Metadata {
  return createPageMetadata({
    title: "Feedback Form",
    description:
      "Share your feedback securely. Attach files and submit details in minutes.",
    path: id ? `/f/${id}` : undefined,
  });
}


