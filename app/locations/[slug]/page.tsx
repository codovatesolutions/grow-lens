import React from "react";
import { notFound } from "next/navigation";
import { CheckCircle2, ArrowRight, MapPin, Phone, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FAQAccordion } from "@/components/FAQ/FAQAccordion";
import { CTASection } from "@/components/CTA/CTASection";
import { SchemaMarkup } from "@/components/SEO/Metadata";
import Link from "next/link";

interface LocationData {
  city: string;
  region: string;
  postalCode: string;
  streetAddress: string;
  phone: string;
  heroTitle: string;
  heroSub: string;
  services: string[];
  faqs: { q: string; a: string }[];
}

const locationsContent: Record<string, LocationData> = {
  "bangalore": {
    city: "Bangalore",
    region: "Karnataka",
    postalCode: "560001",
    streetAddress: "M.G. Road, Bengaluru",
    phone: "+91-80-LENSGROW",
    heroTitle: "Digital Marketing Agency & SEO Company in Bangalore",
    heroSub: "Scale your organic search rankings, run high-yielding Google Ads campaigns, and dominate local maps listings in India's Silicon Valley.",
    services: [
      "SEO Company in Bangalore",
      "Digital Marketing Agency in Bangalore",
      "Website Development Company in Bangalore"
    ],
    faqs: [
      { q: "Do you have an office in Bangalore?", a: "Yes, we serve the entire Bangalore area with digital marketing consulting services." },
      { q: "Why hire a local Bangalore SEO agency?", a: "A local agency knows the city's competitive landscape, neighborhood demography, and has local citation partnerships." }
    ]
  },
  "hyderabad": {
    city: "Hyderabad",
    region: "Telangana",
    postalCode: "500081",
    streetAddress: "Hitech City, Hyderabad",
    phone: "+91-40-LENSGROW",
    heroTitle: "Digital Marketing Agency & SEO Company in Hyderabad",
    heroSub: "High-performance marketing campaigns and SEO solutions built to scale startups, IT firms, and healthcare clinics across Hyderabad.",
    services: [
      "SEO Company in Hyderabad",
      "Digital Marketing Agency in Hyderabad",
      "Website Development Company in Hyderabad"
    ],
    faqs: [
      { q: "What is your main SEO focus in Hyderabad?", a: "We focus on building local authority for software, healthcare, real estate, and B2B corporate segments." },
      { q: "How long is your standard contract?", a: "We offer rolling monthly agreements with zero lock-in periods." }
    ]
  },
  "mysore": {
    city: "Mysore",
    region: "Karnataka",
    postalCode: "570001",
    streetAddress: "Devaraj Urs Road, Mysuru",
    phone: "+91-821-LENSGROW",
    heroTitle: "Digital Marketing Agency & SEO Company in Mysore",
    heroSub: "Establish high-impact search rankings, drive map inquiries, and design optimized websites for Mysore businesses.",
    services: [
      "SEO Company in Mysore",
      "Digital Marketing Agency in Mysore",
      "Website Development Company in Mysore"
    ],
    faqs: [
      { q: "How do you help local businesses in Mysore?", a: "We optimize local search rankings, Google Business Profiles, and map packs to attract regional buyers." },
      { q: "Can we book a face-to-face consultation?", a: "Yes, you can schedule a call or meet our local representatives." }
    ]
  },
  "chennai": {
    city: "Chennai",
    region: "Tamil Nadu",
    postalCode: "600001",
    streetAddress: "Anna Salai, Chennai",
    phone: "+91-44-LENSGROW",
    heroTitle: "Digital Marketing Agency & SEO Company in Chennai",
    heroSub: "Grow your customer acquisition and search visibility with tailored organic SEO, web development, and digital marketing in Chennai.",
    services: [
      "SEO Company in Chennai",
      "Digital Marketing Agency in Chennai",
      "Website Development Company in Chennai"
    ],
    faqs: [
      { q: "How does Local SEO benefit Chennai companies?", a: "It places you on top of maps packs and search listings when clients query localized services." },
      { q: "What analytics tracking tools do you set up?", a: "We deploy Google Analytics 4, Search Console, Tag Manager, and Microsoft Clarity." }
    ]
  }
};

export async function generateStaticParams() {
  return Object.keys(locationsContent).map((slug) => ({
    slug,
  }));
}

export default async function LocationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = locationsContent[slug];

  if (!content) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Schema Markups */}
      <SchemaMarkup
        type="LocalBusiness"
        data={{
          name: `LensGrowth ${content.city}`,
          telephone: content.phone,
          streetAddress: content.streetAddress,
          city: content.city,
          region: content.region,
          postalCode: content.postalCode,
        }}
      />
      <SchemaMarkup
        type="Breadcrumb"
        data={{
          links: [
            { name: "Home", url: "https://lensgrowth.com" },
            { name: "Locations", url: "https://lensgrowth.com/locations" },
            { name: content.city, url: `https://lensgrowth.com/locations/${slug}` },
          ],
        }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border py-20 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(var(--primary-rgb),0.08),transparent)] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="text-xs uppercase tracking-[0.25em] text-primary mb-4 font-semibold inline-flex items-center gap-1.5 justify-center">
            <MapPin className="w-4 h-4" /> Serving {content.city}
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
                Book Consultation in {content.city} <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
            <Link href="/locations">
              <Button size="lg" variant="outline">All Cities</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Local Services Cluster */}
      <section className="py-20 border-b border-border bg-card/10">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-display text-2xl sm:text-3xl font-black text-center mb-12 tracking-tight">
            Our Search Rankings and Services in {content.city}
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {content.services.map((svc, idx) => (
              <div key={idx} className="p-6 border border-border rounded-xl bg-card/60 backdrop-blur text-center hover:border-primary/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/10 grid place-items-center mx-auto mb-4 text-primary">
                  <Building className="w-5 h-5" />
                </div>
                <h3 className="font-display text-lg font-bold mb-2">{svc}</h3>
                <p className="text-xs text-muted-foreground">High-performance SEO execution for {content.city} firms.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Office details */}
      <section className="py-20 border-b border-border">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-display text-2xl sm:text-3xl font-black mb-6 tracking-tight">Contact {content.city} Office</h2>
          <div className="inline-flex flex-col sm:flex-row items-center gap-6 p-6 border border-border rounded-xl bg-card/40">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold">{content.streetAddress}, {content.region} - {content.postalCode}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold">{content.phone}</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Component */}
      <FAQAccordion faqs={content.faqs} title={`Frequently Asked Questions: SEO in ${content.city}`} />

      {/* CTA Section */}
      <CTASection />
    </div>
  );
}
