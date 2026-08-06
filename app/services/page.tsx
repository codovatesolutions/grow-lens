import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Telescope, Sparkles, Globe, Target, Shield, Mail, MessageSquare, Megaphone, Edit3 } from "lucide-react";
import { SchemaMarkup } from "@/components/SEO/Metadata";

const services = [
  { slug: "seo", title: "Search Engine Optimization (SEO)", icon: Telescope, desc: "Increase rankings, build topical authority, and capture search intent traffic." },
  { slug: "local-seo", title: "Local SEO", icon: Globe, desc: "Dominate Google Maps, 3-packs, and local searches in your target cities." },
  { slug: "technical-seo", title: "Technical SEO", icon: Shield, desc: "Fix indexing issues, speed optimization, dynamic schemas, and Core Web Vitals." },
  { slug: "google-ads", title: "Google Ads (PPC)", icon: Target, desc: "Instant high-intent traffic, optimized ad bids, and B2B lead generation campaigns." },
  { slug: "meta-ads", title: "Meta Ads (Facebook & IG)", icon: Megaphone, desc: "Social media visual campaigns targeting demographical interest profiles." },
  { slug: "website-development", title: "Website Development", icon: Sparkles, desc: "Next.js speed-focused web design engineered for maximum user conversion." },
  { slug: "lead-generation", title: "Lead Generation", icon: Mail, desc: "Multi-channel pipelines, custom lead magnets, and automated appointments." },
  { slug: "branding", title: "Branding & Identity", icon: Edit3, desc: "Premium logo systems, guidelines, and corporate identity guidelines." },
  { slug: "ai-marketing", title: "AI Marketing", icon: MessageSquare, desc: "Content automation, predictive targeting pipelines, and workflow scripts." },
];

export default function ServicesIndex() {
  return (
    <div className="min-h-screen bg-background text-foreground py-20 px-6">
      {/* Schema */}
      <SchemaMarkup
        type="WebPage"
        data={{
          name: "Growth Services Directory | LensGrowth",
          description: "Explore LensGrowth expert marketing services, including SEO, Google Ads, Meta campaigns, and high-performance Web Development.",
        }}
      />

      <div className="max-w-6xl mx-auto text-center mb-16">
        <h1 className="font-display text-4xl sm:text-6xl font-black mb-6 tracking-tight">
          Our Marketing & Growth <span className="text-primary">Services</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
          High-impact SEO campaigns, social media ads, and custom digital infrastructure designed to build authority and drive revenue.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {services.map((svc, idx) => {
          const IconComponent = svc.icon;
          return (
            <div
              key={idx}
              className="p-6 border border-border rounded-xl bg-card/40 hover:border-primary/50 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-md bg-primary/10 grid place-items-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <IconComponent className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display text-xl font-bold mb-3">{svc.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">{svc.desc}</p>
              </div>
              <Link href={`/services/${svc.slug}`}>
                <Button variant="ghost" className="p-0 text-primary hover:text-primary/80 gap-2 hover:bg-transparent group-hover:translate-x-1 transition-transform">
                  Learn more <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
