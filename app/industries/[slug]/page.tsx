import React from "react";
import { notFound } from "next/navigation";
import { CheckCircle2, ArrowRight, ShieldCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FAQAccordion } from "@/components/FAQ/FAQAccordion";
import { CTASection } from "@/components/CTA/CTASection";
import { SchemaMarkup } from "@/components/SEO/Metadata";
import Link from "next/link";

interface IndustryData {
  name: string;
  heroTitle: string;
  heroSub: string;
  offerings: string[];
  faqs: { q: string; a: string }[];
}

const industriesContent: Record<string, IndustryData> = {
  "hospitals": {
    name: "Hospitals",
    heroTitle: "Healthcare Growth: Digital Marketing for Hospitals",
    heroSub: "Acquire patient bookings, rank for localized medical searches, and build absolute clinical authority.",
    offerings: [
      "SEO for Hospitals",
      "Marketing for Hospitals",
      "Lead Generation for Hospitals",
      "Hospital Website Development"
    ],
    faqs: [
      { q: "How does Hospital SEO help acquire patients?", a: "By targeting high-intent medical conditions, doctor directory queries, and localized hospital search queries to drive appointments." },
      { q: "Do you comply with medical privacy standards?", a: "Yes, we ensure patient forms and lead capture channels adhere to standard medical and healthcare data practices." }
    ]
  },
  "doctors": {
    name: "Doctors",
    heroTitle: "Grow Your Practice: SEO & Digital Marketing for Doctors",
    heroSub: "Connect with patients looking for your medical specialty. Build trust and fill your appointment calendar.",
    offerings: [
      "SEO for Doctors",
      "Google Ads for Doctors",
      "Doctor Profile Optimization",
      "Medical Copywriting"
    ],
    faqs: [
      { q: "How long does doctor SEO take?", a: "Usually 3 to 6 months to dominate localized doctor listings and local doctor map searches." },
      { q: "Can you manage our Google Business Profile?", a: "Yes, we handle complete practitioner profile listings and localized citation builds." }
    ]
  },
  "clinics": {
    name: "Clinics",
    heroTitle: "SEO & Lead Generation for Medical Clinics",
    heroSub: "Drive walk-ins and consultation bookings to your dental, cosmetic, or general practice clinic.",
    offerings: [
      "SEO for Clinics",
      "Google Ads for Clinics",
      "Lead Generation for Clinics",
      "Medical Website Development"
    ],
    faqs: [
      { q: "What advertising works best for clinics?", a: "Local search ads coupled with targeted Google Maps optimization yields the fastest inquiries." },
      { q: "Do you design clinic websites?", a: "Yes, we construct fast, clean, patient-friendly websites that feature simple appointment bookings." }
    ]
  },
  "restaurants": {
    name: "Restaurants",
    heroTitle: "Local SEO & Restaurant Digital Marketing",
    heroSub: "Get found by local food lovers. Rank for local dining keywords and increase tables booked.",
    offerings: [
      "Local SEO for Restaurants",
      "Google Business Profile for Restaurants",
      "Instagram & Social Ads",
      "Restaurant Website Design"
    ],
    faqs: [
      { q: "How does Local SEO help restaurants?", a: "It ranks your kitchen for 'food near me' or cuisine-specific search terms in your city." },
      { q: "Can you help with maps promotions?", a: "Yes, we promote special events, reviews, and post optimizations directly on Google Maps." }
    ]
  },
  "lawyers": {
    name: "Lawyers",
    heroTitle: "Legal Lead Generation: SEO for Law Firms",
    heroSub: "Win high-value client listings. Rank for legal consultations and competitive criminal, corporate, or family law terms.",
    offerings: [
      "SEO for Lawyers",
      "Lead Generation for Law Firms",
      "PPC Ad Campaigns for Lawyers",
      "Legal Authority Copywriting"
    ],
    faqs: [
      { q: "Is legal marketing competitive?", a: "Extremely. Legal CPCs are among the highest. That is why building organic topical authority is vital." },
      { q: "How do you verify legal leads?", a: "We use forms detailing case details to pre-qualify and filter out low-value inquiries." }
    ]
  },
  "real-estate": {
    name: "Real Estate",
    heroTitle: "Real Estate Marketing: Drive Premium Property Leads",
    heroSub: "Get in front of property buyers and sellers. Build conversion-optimized landing pages that close sales.",
    offerings: [
      "SEO for Real Estate",
      "Google Ads for Property Launches",
      "Lead Generation for Real Estate Agents",
      "Property Website Portals"
    ],
    faqs: [
      { q: "How do you capture property buyers?", a: "Using geo-targeted search campaigns, social media video walks, and downloadable neighborhood brochures." },
      { q: "Can you run campaign ads for new project launches?", a: "Yes, we set up rapid lead capture systems specifically for new apartment or community launches." }
    ]
  },
  "interior-designers": {
    name: "Interior Designers",
    heroTitle: "Client Acquisition for Interior Designers",
    heroSub: "Showcase your luxury design portfolio to homeowners searching for premium interior architecture.",
    offerings: [
      "SEO for Interior Designers",
      "Branding for Interior Designers",
      "Instagram Portfolio Ads",
      "High-End Studio Websites"
    ],
    faqs: [
      { q: "How do interior designers get premium clients?", a: "By combining highly visual portfolios with local SEO for affluent neighborhoods." },
      { q: "Do you design image-rich websites?", a: "Yes, our web builds use fast WebP assets to show ultra-clear portfolios without sacrificing speeds." }
    ]
  },
  "startups": {
    name: "Startups",
    heroTitle: "Growth Hacking & Brand Building for Startups",
    heroSub: "Scale from seed to Series A. Rapidly build search visibility and acquire users with AI marketing and SEO.",
    offerings: [
      "SEO for Startups",
      "Lead Generation for SaaS & Tech",
      "AI Marketing Automations",
      "Startup Branding Systems"
    ],
    faqs: [
      { q: "Why is SEO crucial for early-stage startups?", a: "It offers a compounding traffic channel that lowers user acquisition costs (CAC) over the long run." },
      { q: "Do you help with product launch marketing?", a: "Yes, we build hype lists, landing pages, and lead funnels for Product Hunt or public beta releases." }
    ]
  },
  "manufacturers": {
    name: "Manufacturers",
    heroTitle: "B2B Lead Generation for Manufacturers & Industrial Services",
    heroSub: "Connect with procurement officers, distributors, and bulk purchasers globally.",
    offerings: [
      "B2B SEO for Manufacturers",
      "Lead Generation for Factory Orders",
      "Industrial Website Design",
      "Global Search Optimization"
    ],
    faqs: [
      { q: "How do procurement officers find manufacturers?", a: "They search for technical specs, material grades, or factory capabilities. We build pages answering these." },
      { q: "Do you support global export marketing?", a: "Yes, we optimize websites to rank across international markets." }
    ]
  },
  "gyms": {
    name: "Gyms & Fitness Studios",
    heroTitle: "Local Marketing & Member Signups for Gyms",
    heroSub: "Fill your fitness studio, Pilates class, or crossfit box with monthly members.",
    offerings: [
      "Local SEO for Gyms",
      "Lead Generation for Fitness Signups",
      "Instagram & Local Meta Ads",
      "Gym Website Development"
    ],
    faqs: [
      { q: "How do gyms get local signups?", a: "By running free-pass offers via localized social ads and optimizing for 'gym near me' maps queries." },
      { q: "Can we track membership bookings?", a: "Yes, we connect signup buttons with fitness booking portals or CRM databases." }
    ]
  }
};

export async function generateStaticParams() {
  return Object.keys(industriesContent).map((slug) => ({
    slug,
  }));
}

export default async function IndustryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = industriesContent[slug];

  if (!content) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Schema */}
      <SchemaMarkup
        type="WebPage"
        data={{
          name: `${content.name} Growth Marketing Services | LensGrowth`,
          description: content.heroSub,
        }}
      />
      <SchemaMarkup
        type="Breadcrumb"
        data={{
          links: [
            { name: "Home", url: "https://lensgrowth.com" },
            { name: "Industries", url: "https://lensgrowth.com/industries" },
            { name: content.name, url: `https://lensgrowth.com/industries/${slug}` },
          ],
        }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border py-20 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(var(--primary-rgb),0.08),transparent)] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="text-xs uppercase tracking-[0.25em] text-primary mb-4 font-semibold">
            Industry Solutions
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight max-w-4xl mx-auto">
            {content.heroTitle}
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {content.heroSub}
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <a href="#consultation">
              <Button size="lg" className="gap-2">
                Get Industry Action Plan <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
            <Link href="/industries">
              <Button size="lg" variant="outline">All Industries</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Offerings / Custom Solutions Grid */}
      <section className="py-20 border-b border-border bg-card/10">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-display text-2xl sm:text-3xl font-black text-center mb-12 tracking-tight">
            Targeted Campaigns Built for {content.name}
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {content.offerings.map((offering, idx) => (
              <div key={idx} className="p-6 border border-border rounded-xl bg-card/50 backdrop-blur flex items-center justify-between group hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 grid place-items-center text-primary font-bold">
                    ✓
                  </div>
                  <h3 className="font-display text-lg font-bold">{offering}</h3>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Component */}
      <FAQAccordion faqs={content.faqs} title={`Frequently Asked Questions: Marketing for ${content.name}`} />

      {/* CTA Section */}
      <CTASection />
    </div>
  );
}
