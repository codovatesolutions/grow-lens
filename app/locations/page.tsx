import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin } from "lucide-react";
import { SchemaMarkup } from "@/components/SEO/Metadata";

const locations = [
  { slug: "bangalore", name: "Bangalore", region: "Karnataka", desc: "Topical SEO campaigns, Google Ads, and custom Web Development in Bangalore." },
  { slug: "hyderabad", name: "Hyderabad", region: "Telangana", desc: "Acquire high-quality startup and enterprise leads in Hitech City, Hyderabad." },
  { slug: "mysore", name: "Mysore", region: "Karnataka", desc: "Local Business search optimizations and maps rankings in Mysuru." },
  { slug: "chennai", name: "Chennai", region: "Tamil Nadu", desc: "Drive customer calls, maps visibility, and B2B growth in Chennai." }
];

export default function LocationsIndex() {
  return (
    <div className="min-h-screen bg-background text-foreground py-20 px-6">
      {/* Schema */}
      <SchemaMarkup
        type="WebPage"
        data={{
          name: "Our Served Locations Directory | LensGrowth",
          description: "Find local SEO, Google Ads, and digital marketing services in Bangalore, Hyderabad, Mysore, and Chennai.",
        }}
      />

      <div className="max-w-6xl mx-auto text-center mb-16">
        <h1 className="font-display text-4xl sm:text-6xl font-black mb-6 tracking-tight">
          Serving Local Markets in <span className="text-primary">India</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
          Unlock maps rankings, regional keywords, and local search visibility for your brick-and-mortar or multi-branch business.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {locations.map((loc, idx) => (
          <div
            key={idx}
            className="p-6 border border-border rounded-xl bg-card/40 hover:border-primary/50 transition-all duration-300 flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-md bg-primary/10 grid place-items-center mb-5 group-hover:bg-primary/20 transition-colors">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold mb-1">{loc.name}</h3>
              <span className="text-xs uppercase tracking-wider text-muted-foreground mb-3 block">{loc.region}</span>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">{loc.desc}</p>
            </div>
            <Link href={`/locations/${loc.slug}`}>
              <Button variant="ghost" className="p-0 text-primary hover:text-primary/80 gap-2 hover:bg-transparent group-hover:translate-x-1 transition-transform">
                Explore local strategy <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
