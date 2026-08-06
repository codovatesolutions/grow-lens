import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, TrendingUp } from "lucide-react";
import { SchemaMarkup } from "@/components/SEO/Metadata";

const caseStudies = [
  {
    slug: "hospital-seo-bangalore",
    title: "140% Increase in Patient Bookings for Multi-Specialty Hospital",
    desc: "How we restructured a healthcare portal, solved local map ranking blocks, and dominated medical search queries.",
    stat: "140% Patient Bookings"
  },
  {
    slug: "saas-lead-generation",
    title: "How We Scaled a B2B SaaS Startup Inbound Leads by 3.5x",
    desc: "A case breakdown of implementing custom content hubs, high-intent landing pages, and Google ads bid structures.",
    stat: "3.5x Inbound Leads"
  }
];

export default function CaseStudiesIndex() {
  return (
    <div className="min-h-screen bg-background text-foreground py-20 px-6">
      {/* Schema */}
      <SchemaMarkup
        type="WebPage"
        data={{
          name: "Client Success Case Studies | LensGrowth",
          description: "Discover how LensGrowth helps hospitals, clinics, startups, and local businesses grow with SEO, Ads, and Web Design.",
        }}
      />

      <div className="max-w-6xl mx-auto text-center mb-16">
        <h1 className="font-display text-4xl sm:text-6xl font-black mb-6 tracking-tight">
          Client Success <span className="text-primary">Stories</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
          See the exact numbers, strategies, and methodologies we used to grow search visibility and lead flow for our partners.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {caseStudies.map((cs, idx) => (
          <div
            key={idx}
            className="p-6 border border-border rounded-xl bg-card/40 hover:border-primary/50 transition-all duration-300 flex flex-col justify-between group"
          >
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-semibold mb-4">
                <TrendingUp className="w-3.5 h-3.5" /> {cs.stat}
              </div>
              <h3 className="font-display text-xl font-bold mb-3">{cs.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">{cs.desc}</p>
            </div>
            <Link href={`/case-studies/${cs.slug}`}>
              <Button variant="ghost" className="p-0 text-primary hover:text-primary/80 gap-2 hover:bg-transparent group-hover:translate-x-1 transition-transform">
                Read case study <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
