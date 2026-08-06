import React from "react";
import { FAQAccordion } from "@/components/FAQ/FAQAccordion";
import { SchemaMarkup } from "@/components/SEO/Metadata";
import { CTASection } from "@/components/CTA/CTASection";

const faqs = [
  { q: "What is LensGrowth?", a: "LensGrowth is an AI-powered SEO and digital marketing agency specializing in building topical authority and driving B2B/local business customer acquisition." },
  { q: "How does the SEO scanner work?", a: "Our scanner analyzes your site's technical structure, page performance, current search rankings, and generates clear action items to improve Google visibility." },
  { q: "Do you offer custom web development?", a: "Yes, we construct fast Next.js websites tailored for search engines and high lead conversions." },
  { q: "Do we get reports regularly?", a: "Yes, we provide transparent dashboards detailing keywords, search impressions, rankings, and lead conversions." }
];

export default function FAQsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-12">
      <SchemaMarkup
        type="WebPage"
        data={{
          name: "Frequently Asked Questions | LensGrowth",
          description: "Got questions about LensGrowth SEO, search ads, and website development services? Get answers here.",
        }}
      />
      <div className="max-w-4xl mx-auto px-6 text-center mb-10">
        <h1 className="font-display text-4xl sm:text-6xl font-black mb-4">FAQ</h1>
        <p className="text-muted-foreground">Everything you need to know about our services and process.</p>
      </div>

      <FAQAccordion faqs={faqs} title="General Questions" />

      <CTASection />
    </div>
  );
}
