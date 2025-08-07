import Link from "next/link";

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