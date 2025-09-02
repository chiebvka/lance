import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "BexForte – Client operations hub",
  description:
    "Docs, pricing, terms, policy, branding assets and product updates for BexForte.",
  path: "/",
});
import Header from "@/components/header";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Footer from "@/components/footer";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-7xl w-full border-2 border-green-500 mt-24 md:mt-28 items-start">
      <main className="min-h-screen  w-full ">
        <div className=" w-full ">
          <Header />
          <div className=" w-full  p-5">
            {children}
          </div>
          <Footer />
        </div>
      </main>
    </div>
  );
}
