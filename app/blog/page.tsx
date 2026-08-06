import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, CalendarDays } from "lucide-react";
import { SchemaMarkup } from "@/components/SEO/Metadata";

const blogPosts = [
  {
    slug: "why-is-my-website-not-getting-traffic",
    title: "Why Is My Website Not Getting Traffic? (And How to Fix It)",
    desc: "Understand the core reasons behind low website visitors and simple technical steps to recover your organic reach.",
    date: "Aug 06, 2026"
  },
  {
    slug: "how-can-i-generate-more-business-leads",
    title: "How Can I Generate More Business Leads from SEO?",
    desc: "Stop optimization for vanity keywords. Build conversion funnels and lead magnets to scale your inbound inquiries.",
    date: "Aug 04, 2026"
  },
  {
    slug: "how-to-get-customers-from-google",
    title: "How to Get Customers from Google: The Complete Blueprint",
    desc: "A step-by-step roadmap to rank for local map packs, Google search queries, and drive high-intent shoppers to buy.",
    date: "Jul 30, 2026"
  },
  {
    slug: "why-is-my-google-ranking-dropping",
    title: "Why is My Google Ranking Dropping? Diagnosis Guide",
    desc: "Learn how to diagnose algorithm updates, check technical SEO crawl issues, and rebuild your domain authority.",
    date: "Jul 25, 2026"
  },
  {
    slug: "website-that-converts-visitors-into-customers",
    title: "How to Build a Website That Converts Visitors Into Customers",
    desc: "Explore high-converting copy layouts, micro-interactions, exit-intent hooks, and fast edge-page builds.",
    date: "Jul 18, 2026"
  }
];

export default function BlogIndex() {
  return (
    <div className="min-h-screen bg-background text-foreground py-20 px-6">
      {/* Schema */}
      <SchemaMarkup
        type="WebPage"
        data={{
          name: "LensGrowth Authority Blog | SEO & Growth Marketing",
          description: "Read expert guides on search engine optimization, local SEO, high-converting websites, paid search ads, and conversion optimization.",
        }}
      />

      <div className="max-w-6xl mx-auto text-center mb-16">
        <h1 className="font-display text-4xl sm:text-6xl font-black mb-6 tracking-tight">
          Growth & SEO <span className="text-primary">Blog</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
          Actionable tactics and expert breakdowns on building topical authority, scaling leads, and driving business revenue.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {blogPosts.map((post, idx) => (
          <div
            key={idx}
            className="p-6 border border-border rounded-xl bg-card/40 hover:border-primary/50 transition-all duration-300 flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                <CalendarDays className="w-3.5 h-3.5" />
                <span>{post.date}</span>
                <span>•</span>
                <span>SEO Guide</span>
              </div>
              <h3 className="font-display text-xl font-bold mb-3 line-clamp-2">{post.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6 line-clamp-3">{post.desc}</p>
            </div>
            <Link href={`/blog/${post.slug}`}>
              <Button variant="ghost" className="p-0 text-primary hover:text-primary/80 gap-2 hover:bg-transparent group-hover:translate-x-1 transition-transform">
                Read post <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
