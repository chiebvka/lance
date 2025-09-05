import type { Metadata } from "next";

export type CreatePageMetadataOptions = {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
  keywords?: string[];
};

export const siteConfig = {
  name: "BexForte",
  domain: "bexforte.com",
  url: "https://bexforte.com",
  creator: "Bexoni Labs",
  twitter: "@bexforte",
  themeColor: "hsl(267, 95.2%, 63.3%)",
  defaultDescription:
    "BexForte is an all‑in‑one client operations suite to manage projects, walls, links, feedback, invoices and receipts in one place.",
} as const;

export function createPageMetadata(options: CreatePageMetadataOptions): Metadata {
  const {
    title,
    description = siteConfig.defaultDescription,
    path = "/",
    image,
    noIndex = false,
    keywords = [
      "BexForte",
      "client portal",
      "project handover",
      "invoices",
      "receipts",
      "feedback",
      "link in bio",
      "wall",
      "client management",
    ],
  } = options;

  const url = `${siteConfig.url}${path}`;
  const ogImage = image || `${siteConfig.url}/opengraph-image.png`;

  const metadata: Metadata = {
    title: {
      default: `${title} – ${siteConfig.name}`,
      template: "%s – BexForte",
    },
    description,
    keywords,
    metadataBase: new URL(siteConfig.url),
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: siteConfig.name,
      title: title,
      description,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      creator: siteConfig.twitter,
      title: title,
      description,
      images: [ogImage],
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
      },
    },
    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon.ico",
      apple: "/favicon.ico",
    },
    category: "business",
    creator: siteConfig.creator,
    authors: [{ name: siteConfig.creator }],
  };

  return metadata;
}


