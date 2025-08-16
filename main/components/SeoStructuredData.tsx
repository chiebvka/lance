export default function SeoStructuredData() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "BexForte",
    url: "https://bexforte.com",
    logo: "https://bexforte.com/lance.ico",
    founder: {
      "@type": "Organization",
      name: "Bexoni Labs",
    },
    sameAs: [
      "https://bexforte.com",
    ],
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "BexForte",
    url: "https://bexforte.com",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://bexforte.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
    </>
  );
}


