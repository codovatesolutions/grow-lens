"use client";

import { useState } from "react";
import Shell from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Store, Code, Copy, Check, Sparkles, Layout, CreditCard, MessageSquare, ShieldCheck } from "lucide-react";

export default function MarketplacePage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success("Component code copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const assets = [
    {
      id: "hero-1",
      title: "High-Converting Hero Section with Trust Badges",
      category: "Hero Sections",
      conversion_boost: "+24% Conversion Lift",
      desc: "Clean, high-contrast hero section with headline, subheadline, dual CTAs, and SSL trust markers.",
      code: `<section className="py-16 px-6 bg-background text-center space-y-6">
  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
    🚀 Built for Maximum Conversion
  </div>
  <h1 className="font-display text-4xl sm:text-5xl font-black text-foreground max-w-3xl mx-auto leading-tight">
    Clarity over hype. Turn visitors into paying customers.
  </h1>
  <p className="text-base text-muted-foreground max-w-xl mx-auto">
    Automated conversion, SEO, and security audits powered by AI experts.
  </p>
  <div className="flex justify-center gap-3 pt-2">
    <button className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-bold shadow-lg hover:opacity-90">
      Start Free Audit &rarr;
    </button>
    <button className="px-6 py-3 rounded-lg border border-border text-foreground font-semibold hover:bg-muted">
      Watch Demo
    </button>
  </div>
</section>`,
    },
    {
      id: "pricing-1",
      title: "3-Tier High-Contrast Pricing Table",
      category: "Pricing Tables",
      conversion_boost: "+18% Revenue Lift",
      desc: "Optimized 3-column pricing card matrix with featured tier highlight, feature checkmarks, and clear CTAs.",
      code: `<div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto py-8">
  <div className="p-6 rounded-xl border border-border bg-card space-y-4">
    <h3 className="text-lg font-bold">Starter</h3>
    <div className="text-3xl font-black">$0<span className="text-xs text-muted-foreground">/mo</span></div>
    <ul className="text-xs space-y-2 text-muted-foreground">
      <li>✓ 3 Free Audits</li>
      <li>✓ Basic Security Check</li>
    </ul>
  </div>
  <div className="p-6 rounded-xl border-2 border-primary bg-card space-y-4 shadow-xl relative">
    <div className="bg-primary text-primary-foreground text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full absolute -top-3 left-6">Most Popular</div>
    <h3 className="text-lg font-bold">Business Pro</h3>
    <div className="text-3xl font-black">$49<span className="text-xs text-muted-foreground">/mo</span></div>
    <ul className="text-xs space-y-2 text-muted-foreground">
      <li>✓ Unlimited AI Audits</li>
      <li>✓ Security & Vulnerabilities Audit</li>
      <li>✓ 13 AI Agents Boardroom</li>
    </ul>
  </div>
</div>`,
    },
    {
      id: "trust-1",
      title: "Security & Trust Verification Banner",
      category: "Trust & Security",
      conversion_boost: "+15% Trust Boost",
      desc: "SSL, HSTS, and GDPR compliance trust badge row for footer or checkout pages.",
      code: `<div className="flex flex-wrap items-center justify-center gap-6 p-4 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground font-mono">
  <div className="flex items-center gap-1.5"><span className="text-emerald-500 font-bold">✓</span> 256-Bit SSL Encrypted</div>
  <div className="flex items-center gap-1.5"><span className="text-emerald-500 font-bold">✓</span> GDPR & CCPA Compliant</div>
  <div className="flex items-center gap-1.5"><span className="text-emerald-500 font-bold">✓</span> HSTS Strict Security</div>
</div>`,
    },
  ];

  return (
    <Shell>
      <div className="space-y-6 max-w-6xl mx-auto" data-testid="marketplace-page">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Store className="w-6 h-6 text-primary" /> Growth Asset Marketplace
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Ready-made high-converting UI components pre-designed in React + Tailwind CSS.
            </p>
          </div>
        </div>

        {/* Asset Cards Grid */}
        <div className="grid gap-6">
          {assets.map((asset) => (
            <Card key={asset.id} className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="uppercase font-mono text-[10px]">
                      {asset.category}
                    </Badge>
                    <Badge className="bg-emerald-500 text-white font-mono text-[10px]">
                      {asset.conversion_boost}
                    </Badge>
                  </div>
                  <h3 className="font-display text-xl font-bold mt-1.5">{asset.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{asset.desc}</p>
                </div>

                <Button
                  variant="outline"
                  onClick={() => copyCode(asset.id, asset.code)}
                  className="flex items-center gap-2 self-start sm:self-auto shrink-0"
                >
                  {copiedId === asset.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  {copiedId === asset.id ? "Copied!" : "Copy Code"}
                </Button>
              </div>

              {/* Code Preview */}
              <div className="bg-muted/60 p-4 rounded-lg border border-border/60 font-mono text-xs overflow-x-auto whitespace-pre leading-relaxed max-h-56">
                {asset.code}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Shell>
  );
}
