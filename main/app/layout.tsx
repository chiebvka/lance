import DeployButton from "@/components/deploy-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import HeaderAuth from "@/components/header-auth";
import { Toaster } from "@/components/ui/sonner";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import Link from "next/link";
import "./globals.css";
import Header from "@/components/header";
import QueryProvider from "./_components/QueryProvider";
import { baseUrl } from "@/utils/universal";
import type { Metadata } from "next";
import { createPageMetadata, siteConfig } from "@/lib/seo";
import SeoStructuredData from "@/components/SeoStructuredData";

// const defaultUrl = process.env.VERCEL_URL
//   ? `https://${process.env.VERCEL_URL}`
//   : "http://localhost:3000";

export const metadata: Metadata = createPageMetadata({
  title: siteConfig.name,
  description:
    "BexForte is an all‑in‑one manager for client work: organize customers, send walls, collect feedback, manage projects, invoices and receipts.",
  path: "/",
});

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground ">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <main className="min-h-screen flex flex-col items-center">
              <div className="flex-1 w-full flex flex-col gap-20 items-center">
              <NuqsAdapter>
                {children}
                <SeoStructuredData />
              </NuqsAdapter>
      
{/* 
                <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
                  <p>
                    Powered by{" "}
                    <a
                      href="https://www.bexoni.com/"
                      target="_blank"
                      className="font-bold text-bexoni hover:underline"
                      rel="noreferrer"
                    >
                      Bexoni Labs
                    </a>
                  </p>
                  <ThemeSwitcher />
                </footer> */}
              </div>
            </main>
          </QueryProvider>
          <Toaster  position="bottom-left" />
        </ThemeProvider>
      </body>
    </html>
  );
}
