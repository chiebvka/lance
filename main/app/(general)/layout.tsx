import Header from "@/components/header";
import { ThemeSwitcher } from "@/components/theme-switcher";

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

        
        </div>
      </main>
    </div>
  );
}
