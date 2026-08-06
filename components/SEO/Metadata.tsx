import React from "react";

export interface SchemaProps {
  type: "Organization" | "LocalBusiness" | "Service" | "FAQ" | "Breadcrumb" | "WebSite" | "Article" | "WebPage";
  data: any;
}

export function SchemaMarkup({ type, data }: SchemaProps) {
  let schema: any = null;

  const baseContext = {
    "@context": "https://schema.org",
  };

  switch (type) {
    case "Organization":
      schema = {
        ...baseContext,
        "@type": "Organization",
        "name": "LensGrowth",
        "url": "https://lensgrowth.com",
        "logo": "https://lensgrowth.com/logolensgrowth.jpeg",
        "sameAs": [
          "https://x.com/lensgrowth",
          "https://linkedin.com/company/lensgrowth"
        ],
        ...data
      };
      break;

    case "LocalBusiness":
      schema = {
        ...baseContext,
        "@type": "LocalBusiness",
        "name": data.name || "LensGrowth",
        "image": "https://lensgrowth.com/logolensgrowth.jpeg",
        "priceRange": "$$",
        "telephone": data.telephone || "+91-80-LENSGROW",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": data.streetAddress || "M.G. Road",
          "addressLocality": data.city || "Bangalore",
          "addressRegion": data.region || "Karnataka",
          "postalCode": data.postalCode || "560001",
          "addressCountry": "IN"
        },
        ...data
      };
      break;

    case "Service":
      schema = {
        ...baseContext,
        "@type": "Service",
        "serviceType": data.serviceType,
        "provider": {
          "@type": "Organization",
          "name": "LensGrowth"
        },
        "description": data.description,
        "areaServed": data.areaServed || "Worldwide",
        ...data
      };
      break;

    case "FAQ":
      schema = {
        ...baseContext,
        "@type": "FAQPage",
        "mainEntity": data.faqs.map((faq: { q: string; a: string }) => ({
          "@type": "Question",
          "name": faq.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.a
          }
        }))
      };
      break;

    case "Breadcrumb":
      schema = {
        ...baseContext,
        "@type": "BreadcrumbList",
        "itemListElement": data.links.map((link: { name: string; url: string }, index: number) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": link.name,
          "item": link.url
        }))
      };
      break;

    case "WebSite":
      schema = {
        ...baseContext,
        "@type": "WebSite",
        "name": "LensGrowth",
        "url": "https://lensgrowth.com",
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://lensgrowth.com/blog?q={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      };
      break;

    case "Article":
      schema = {
        ...baseContext,
        "@type": data.subType || "BlogPosting",
        "headline": data.title,
        "image": data.image || "https://lensgrowth.com/logolensgrowth.jpeg",
        "datePublished": data.datePublished || new Date().toISOString(),
        "author": {
          "@type": "Organization",
          "name": "LensGrowth"
        },
        "publisher": {
          "@type": "Organization",
          "name": "LensGrowth",
          "logo": {
            "@type": "ImageObject",
            "url": "https://lensgrowth.com/logolensgrowth.jpeg"
          }
        },
        "description": data.description
      };
      break;

    case "WebPage":
      schema = {
        ...baseContext,
        "@type": "WebPage",
        "name": data.name,
        "description": data.description,
        "publisher": {
          "@type": "Organization",
          "name": "LensGrowth"
        }
      };
      break;

    default:
      break;
  }

  if (!schema) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
