import React from "react";
import { FooterConfig } from "@/lib/footer-config";

interface Props {
  config: FooterConfig;
  siteUrl?: string;
}

export function FooterStructuredData({ config, siteUrl = "https://lifemeeting.com" }: Props) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: config.brand.name,
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description: config.brand.tagline,
    foundingDate: "2024",
    sameAs: Object.values(config.social).filter(Boolean),
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        url: `${siteUrl}/contact`,
        availableLanguage: ["English", "Hindi", "German", "French"],
      },
    ],
    address: {
      "@type": "PostalAddress",
      addressCountry: "US",
    },
  };

  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: config.brand.name,
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: config.brand.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, iOS, Android",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
    </>
  );
}
