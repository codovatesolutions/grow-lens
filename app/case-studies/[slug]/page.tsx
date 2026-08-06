import React from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, TrendingUp, BarChart3, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SchemaMarkup } from "@/components/SEO/Metadata";
import { CTASection } from "@/components/CTA/CTASection";
import Link from "next/link";

interface CaseStudyData {
  title: string;
  desc: string;
  metric: string;
  challenge: string;
  strategy: string;
  results: string[];
}

const caseStudiesContent: Record<string, CaseStudyData> = {
  "hospital-seo-bangalore": {
    title: "140% Increase in Patient Bookings for Multi-Specialty Hospital",
    desc: "Discover how we restructured the medical content hub and won competitive search rankings in Bangalore.",
    metric: "+140% Bookings",
    challenge: "The hospital website was structurally slow, failing Core Web Vitals, and missing structured schemas. Local patient searches were captured by aggregator medical profiles rather than the clinic website directly.",
    strategy: "We rebuilt key landing pages in Next.js, added doctors specific JSON-LD schemas, and created 15 high-quality content hubs targeting specific medical symptoms.",
    results: [
      "140% rise in organic appointment forms inside 4 months.",
      "97% desktop Google PageSpeed rating.",
      "1st page rankings for over 50 local clinical terms."
    ]
  },
  "saas-lead-generation": {
    title: "How We Scaled a B2B SaaS Startup Inbound Leads by 3.5x",
    desc: "A breakdown of programmatic landing page setups and search marketing bid automation.",
    metric: "3.5x Leads",
    challenge: "The startup was running broad, low-relevancy paid search campaigns resulting in high CPL and junk leads.",
    strategy: "We redesigned landing pages targeting transactional terms, added interactive pricing elements, and set up precise conversion goals in GTM.",
    results: [
      "3.5x growth in qualified demo requests.",
      "42% drop in Cost Per Lead (CPL).",
      "Seamless HubSpot CRM sync."
    ]
  }
};

export async function generateStaticParams() {
  return Object.keys(caseStudiesContent).map((slug) => ({
    slug,
  }));
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = caseStudiesContent[slug];

  if (!content) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Schema */}
      <SchemaMarkup
        type="WebPage"
        data={{
          name: content.title,
          description: content.desc,
        }}
      />
      <SchemaMarkup
        type="Breadcrumb"
        data={{
          links: [
            { name: "Home", url: "https://lensgrowth.com" },
            { name: "Case Studies", url: "https://lensgrowth.com/case-studies" },
            { name: content.title.split("|")[0], url: `https://lensgrowth.com/case-studies/${slug}` },
          ],
        }}
      />

      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link href="/case-studies">
          <Button variant="ghost" size="sm" className="gap-2 mb-8 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back to Case Studies
          </Button>
        </Link>

        <header className="mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-semibold mb-4">
            <TrendingUp className="w-3.5 h-3.5" /> {content.metric}
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-black leading-tight tracking-tight mb-4">
            {content.title}
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            {content.desc}
          </p>
        </header>

        <div className="space-y-8 border-t border-border pt-8">
          <div>
            <h2 className="font-display text-xl font-bold mb-3">The Challenge</h2>
            <p className="text-muted-foreground leading-relaxed">{content.challenge}</p>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold mb-3">Our Strategy</h2>
            <p className="text-muted-foreground leading-relaxed">{content.strategy}</p>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold mb-3">The Results</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 leading-relaxed">
              {content.results.map((res, idx) => (
                <li key={idx}>{res}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <CTASection />
    </div>
  );
}
