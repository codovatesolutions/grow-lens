import React from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SchemaMarkup } from "@/components/SEO/Metadata";
import { CTASection } from "@/components/CTA/CTASection";
import Link from "next/link";

interface BlogPostData {
  title: string;
  desc: string;
  date: string;
  content: string[];
}

const blogsContent: Record<string, BlogPostData> = {
  "why-is-my-website-not-getting-traffic": {
    title: "Why Is My Website Not Getting Traffic? (And How to Fix It)",
    desc: "Discover why your search engine traffic is low, and learn steps to fix indexation, build authority, and boost rankings.",
    date: "Aug 06, 2026",
    content: [
      "Low website traffic is one of the most frustrating challenges digital businesses face. You have invested hours writing articles, polishing designs, and purchasing domains, yet your analytics remains a flat line.",
      "The most common culprit is a lack of search indexability. If search engine crawlers cannot easily find, index, and parse your layout structure, you will not display on results pages. Check your Google Search Console coverage logs to verify if indexation blocks exist.",
      "Another factor is ignoring topical authority. Google does not rank single, isolated keywords anymore. Modern algorithms prioritize domains showing complete coverages for specific themes. Group your content into clusters and connect related topics using structured links.",
      "Lastly, speed matters. Websites failing Core Web Vitals degrade search rankings. Optimize image assets into WebP format, implement code-splitting, and leverage fast edge content delivery networks."
    ]
  },
  "how-can-i-generate-more-business-leads": {
    title: "How Can I Generate More Business Leads from SEO?",
    desc: "Stop optimization for vanity keywords. Build conversion funnels and lead magnets to scale your inbound inquiries.",
    date: "Aug 04, 2026",
    content: [
      "Many agencies celebrate high search rankings, but rankings alone do not pay bills. To grow, you need search traffic that translates directly into qualified leads.",
      "First, analyze keyword intents. Optimize for transactional or commercial queries ('SEO Company in Bangalore') rather than purely educational phrases. These high-intent terms reach buyers ready to make purchase decisions.",
      "Second, construct compelling lead magnets. Offer free tools, customized templates, or audit sheets in exchange for email addresses. This captures top-of-funnel prospects who aren't ready to buy immediately.",
      "Third, implement conversion rate optimization. Place prominent buttons on mobile views, integrate quick WhatsApp chats, and design clean forms that take under a minute to complete."
    ]
  },
  "how-to-get-customers-from-google": {
    title: "How to Get Customers from Google: The Complete Blueprint",
    desc: "A step-by-step roadmap to rank for local map packs, Google search queries, and drive high-intent shoppers to buy.",
    date: "Jul 30, 2026",
    content: [
      "Google handles billions of searches daily. To capture this pool of customers, you need a multi-layered search presence.",
      "For local businesses, the Google Maps 3-Pack is the most valuable target. Keep your Name, Address, and Phone consistent, post updates, and establish a systematic customer review process.",
      "For national reach, focus on building informational keyword hub pages that answer user pain points. Once trust is built, steer visitors to core service pages with calls to action.",
      "Integrate search ads (PPC) alongside organic search. Paid ads capture instant top-of-page real estate, while SEO builds compounding long-term traffic."
    ]
  },
  "why-is-my-google-ranking-dropping": {
    title: "Why is My Google Ranking Dropping? Diagnosis Guide",
    desc: "Learn how to diagnose algorithm updates, check technical SEO crawl issues, and rebuild your domain authority.",
    date: "Jul 25, 2026",
    content: [
      "A sudden drop in search rankings can cause panic. The key is methodical diagnosis before making hasty edits.",
      "Check Google Search Console search metrics. Is the decline widespread, or isolated to a few key pages? If it is isolated, look for manual index blocks, redirect issues, or competitor page updates.",
      "Cross-reference the drop date with major Google core algorithm updates. If it aligns, review Google's official advice. Focus on improving content quality, credibility, and ensuring high-quality mobile speeds.",
      "Audit backlinks for spam. Clean up toxic link networks and focus on earning real authority placements through high-quality outreach and linkable assets."
    ]
  },
  "website-that-converts-visitors-into-customers": {
    title: "How to Build a Website That Converts Visitors Into Customers",
    desc: "Explore high-converting copy layouts, micro-interactions, exit-intent hooks, and fast edge-page builds.",
    date: "Jul 18, 2026",
    content: [
      "A beautiful website is useless if visitors leave without taking action. High-converting design merges clean aesthetics with conversion psychology.",
      "Keep layouts clean with strong contrast on Call to Actions. Minimize cognitive load by limiting form fields to name, email, and website url.",
      "Employ exit-intent overlays. Offer free audits or downloads when users navigate away, capturing leads that would otherwise be lost.",
      "Leverage social proof. Place testimonials, reviews, client case studies, and trust badges near call-to-actions to ease decision anxiety."
    ]
  }
};

export async function generateStaticParams() {
  return Object.keys(blogsContent).map((slug) => ({
    slug,
  }));
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = blogsContent[slug];

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Schema */}
      <SchemaMarkup
        type="Article"
        data={{
          title: post.title,
          description: post.desc,
          datePublished: new Date(post.date).toISOString(),
          subType: "BlogPosting"
        }}
      />
      <SchemaMarkup
        type="Breadcrumb"
        data={{
          links: [
            { name: "Home", url: "https://lensgrowth.com" },
            { name: "Blog", url: "https://lensgrowth.com/blog" },
            { name: post.title, url: `https://lensgrowth.com/blog/${slug}` },
          ],
        }}
      />

      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link href="/blog">
          <Button variant="ghost" size="sm" className="gap-2 mb-8 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Button>
        </Link>

        <header className="mb-8">
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4" /> {post.date}</span>
            <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> LensGrowth Team</span>
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-black leading-tight tracking-tight mb-4">
            {post.title}
          </h1>
          <p className="text-muted-foreground text-lg sm:text-xl leading-relaxed italic">
            {post.desc}
          </p>
        </header>

        <article className="prose prose-neutral dark:prose-invert max-w-none text-base sm:text-lg leading-relaxed space-y-6 border-t border-border pt-8">
          {post.content.map((paragraph, idx) => (
            <p key={idx} className="text-muted-foreground leading-relaxed">
              {paragraph}
            </p>
          ))}
        </article>

        {/* Dynamic Internal Links Block */}
        <div className="mt-16 p-6 border border-border/80 rounded-xl bg-card/40">
          <h3 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Need localized growth solutions?
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            We provide targeted marketing across cities in India. Explore our local services:
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/locations/bangalore" className="text-xs px-3 py-1.5 border border-border rounded-full hover:border-primary transition-colors bg-background">Bangalore SEO</Link>
            <Link href="/locations/hyderabad" className="text-xs px-3 py-1.5 border border-border rounded-full hover:border-primary transition-colors bg-background">Hyderabad SEO</Link>
            <Link href="/locations/mysore" className="text-xs px-3 py-1.5 border border-border rounded-full hover:border-primary transition-colors bg-background">Mysore SEO</Link>
            <Link href="/locations/chennai" className="text-xs px-3 py-1.5 border border-border rounded-full hover:border-primary transition-colors bg-background">Chennai SEO</Link>
          </div>
        </div>
      </div>

      <CTASection />
    </div>
  );
}
