import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Stethoscope, Utensils, Scale, Home, Sparkles, Zap, Factory, Dumbbell, UserCheck } from "lucide-react";
import { SchemaMarkup } from "@/components/SEO/Metadata";

const industries = [
  { slug: "hospitals", name: "Hospitals", icon: Building2, desc: "Lead generation, medical compliance, and hospital local SEO campaigns." },
  { slug: "doctors", name: "Doctors", icon: Stethoscope, desc: "Practitioner ranking profiles, private clinic search reach, and listings." },
  { slug: "clinics", name: "Clinics", icon: UserCheck, desc: "Targeted localized map packs, patient reviews, and clinic site builds." },
  { slug: "restaurants", name: "Restaurants", icon: Utensils, desc: "Increase footfalls, tables booked, and rank for local dining searches." },
  { slug: "lawyers", name: "Lawyers", icon: Scale, desc: "High-value B2C/B2B legal consultation leads and law firm authority." },
  { slug: "real-estate", name: "Real Estate", icon: Home, desc: "High-intent buyer leads, property launch landing pages, and search optimization." },
  { slug: "interior-designers", name: "Interior Designers", icon: Sparkles, desc: "Affluent client listings and premium interactive design portfolios." },
  { slug: "startups", name: "Startups", icon: Zap, desc: "Compounding organic user acquisition channels from pre-seed to scale." },
  { slug: "manufacturers", name: "Manufacturers", icon: Factory, desc: "B2B spec searches, international distribution inquiries, and catalog SEO." },
  { slug: "gyms", name: "Gyms & Studios", icon: Dumbbell, desc: "Increase studio memberships and capture local fitness search intents." },
];

export default function IndustriesIndex() {
  return (
    <div className="min-h-screen bg-background text-foreground py-20 px-6">
      {/* Schema */}
      <SchemaMarkup
        type="WebPage"
        data={{
          name: "Industry SEO & Growth Marketing Directory | LensGrowth",
          description: "Learn how LensGrowth customizes marketing strategies for healthcare, legal, retail, real estate, startups, and manufacturing industries.",
        }}
      />

      <div className="max-w-6xl mx-auto text-center mb-16">
        <h1 className="font-display text-4xl sm:text-6xl font-black mb-6 tracking-tight">
          Specialized Industry <span className="text-primary">Marketing</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
          No generic advice. We deploy custom digital marketing frameworks designed specifically for your vertical's target audience and business metrics.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {industries.map((ind, idx) => {
          const IconComponent = ind.icon;
          return (
            <div
              key={idx}
              className="p-6 border border-border rounded-xl bg-card/40 hover:border-primary/50 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-md bg-primary/10 grid place-items-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <IconComponent className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display text-xl font-bold mb-3">{ind.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">{ind.desc}</p>
              </div>
              <Link href={`/industries/${ind.slug}`}>
                <Button variant="ghost" className="p-0 text-primary hover:text-primary/80 gap-2 hover:bg-transparent group-hover:translate-x-1 transition-transform">
                  View industry strategy <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
