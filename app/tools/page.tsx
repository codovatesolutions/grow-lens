import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Search, BarChart } from "lucide-react";
import { SchemaMarkup } from "@/components/SEO/Metadata";

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-20 px-6">
      <SchemaMarkup
        type="WebPage"
        data={{
          name: "Free SEO Tools & Analyzers | LensGrowth",
          description: "Scan your website performance, technical schema, and check keyword density with our free tool suite.",
        }}
      />
      <div className="max-w-4xl mx-auto text-center mb-16">
        <h1 className="font-display text-4xl sm:text-6xl font-black mb-6">Free SEO & Marketing <span className="text-primary">Tools</span></h1>
        <p className="text-muted-foreground text-lg">Generate instant technical scans and performance ratings for your domain.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div className="p-6 border border-border rounded-xl bg-card/40 hover:border-primary/50 transition-colors flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-md bg-primary/10 grid place-items-center mb-4 text-primary">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="font-display text-xl font-bold mb-2">Instant SEO Scanner</h3>
            <p className="text-sm text-muted-foreground mb-6">Paste your URL and check Core Web Vitals, mobile viewport sizes, and schema coverage.</p>
          </div>
          <Link href="/signup">
            <Button className="w-full gap-2">Start Scan <ArrowRight className="w-4 h-4" /></Button>
          </Link>
        </div>

        <div className="p-6 border border-border rounded-xl bg-card/40 hover:border-primary/50 transition-colors flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-md bg-primary/10 grid place-items-center mb-4 text-primary">
              <BarChart className="w-5 h-5" />
            </div>
            <h3 className="font-display text-xl font-bold mb-2">Keyword Density Analyzer</h3>
            <p className="text-sm text-muted-foreground mb-6">Check topic cluster frequencies and optimize content copies for topical authority.</p>
          </div>
          <Link href="/signup">
            <Button variant="outline" className="w-full gap-2">Launch Analyzer <ArrowRight className="w-4 h-4" /></Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
