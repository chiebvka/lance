import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "BexForte – All in one operations hub",
  description:
    "Streamline your business operations with BexForte's comprehensive suite: invoice management, project tracking, receipt organization, client management, collaborative walls, feedback collection, and automated workflows. Get paid faster, manage projects better, and grow your business with one powerful platform.",
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
    <div className="max-w-7xl w-full mt-24 md:mt-28 items-start">
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
