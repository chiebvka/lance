import Link from "next/link";
import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Walls,Paths, Feedback, Invoices, Projects & Receipts Preview",
  description:
    "Public preview pages for BexForte: share walls, paths, feedback forms, invoices, projects and receipts with your customers.",
});

export default async function Layout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <div className="max-w-7xl w-full  items-start">
        <main className=" w-full ">
            {children}
        </main>
        <span className="flex fixed bottom-2 left-6 w-full text-sm justify-start ">Powered by<Link href="https://bexforte.com" target="_blank" className="text-primary ml-1"> bexforte</Link> </span>
      </div>
    );
  }