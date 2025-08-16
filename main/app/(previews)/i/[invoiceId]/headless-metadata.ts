import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export function getInvoiceMetadata(id?: string): Metadata {
  return createPageMetadata({
    title: "Invoice",
    description: "View, pay and download your invoice.",
    path: id ? `/i/${id}` : undefined,
  });
}


