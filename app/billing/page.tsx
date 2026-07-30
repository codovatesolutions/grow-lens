"use client";

import Shell from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { CreditCard, Check, Sparkles, Zap, ShieldCheck, ArrowUpRight } from "lucide-react";

export default function BillingPage() {
  const plans = [
    {
      name: "Starter / Free",
      price: "$0",
      period: "forever",
      desc: "Perfect for exploring website scans and basic audit metrics.",
      features: [
        "3 Scans per month",
        "Overall score & top 5 fixes",
        "Basic security audit",
        "Community support",
      ],
      current: true,
    },
    {
      name: "Business Pro",
      price: "$49",
      period: "/ month",
      desc: "Comprehensive conversion, SEO, and security audits for growth teams.",
      features: [
        "Unlimited Scans",
        "Deep Security & Vulnerabilities Audit",
        "Board of 13 Expert Agents Simulation",
        "Lead Extraction & CSV Export",
        "Custom White-Label PDF Reports",
        "Priority Support",
      ],
      popular: true,
      current: false,
    },
    {
      name: "Agency",
      price: "$199",
      period: "/ month",
      desc: "Built for marketing agencies, consultants, and enterprise teams.",
      features: [
        "Everything in Business Pro",
        "Unlimited Team Members",
        "Client Access Portals",
        "Automated Scheduled Monitoring",
        "Custom API Integrations",
        "Dedicated Account Manager",
      ],
      current: false,
    },
  ];

  return (
    <Shell>
      <div className="space-y-6" data-testid="billing-page">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary" /> Plans & Billing
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your subscription plan, scan quotas, and invoice history.
          </p>
        </div>

        {/* Current Plan Overview Card */}
        <Card className="p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-primary font-bold">Current Subscription</span>
              <h2 className="font-display text-xl font-bold mt-1">Business Pro Plan (Trial)</h2>
            </div>
            <Badge className="bg-emerald-500 text-white font-mono text-xs px-3 py-1">Active</Badge>
          </div>
          <div className="space-y-2 max-w-md">
            <div className="flex justify-between text-xs font-medium">
              <span>Monthly Scan Quota</span>
              <span>18 / 50 Scans Used</span>
            </div>
            <Progress value={36} className="h-2" />
          </div>
        </Card>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 pt-2">
          {plans.map((plan, idx) => (
            <Card
              key={idx}
              className={`p-6 flex flex-col justify-between relative transition-all ${
                plan.popular ? "border-primary shadow-lg ring-1 ring-primary" : "border-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-3 py-0.5 rounded-full">
                  Most Popular
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <h3 className="font-display text-lg font-bold">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{plan.desc}</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-3xl font-black">{plan.price}</span>
                  <span className="text-xs text-muted-foreground">{plan.period}</span>
                </div>
                <div className="space-y-2 pt-2 border-t border-border">
                  {plan.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                className="w-full mt-6"
                variant={plan.current ? "outline" : plan.popular ? "default" : "secondary"}
                onClick={() => toast.success(`Selected ${plan.name}`)}
              >
                {plan.current ? "Current Plan" : `Upgrade to ${plan.name}`}
              </Button>
            </Card>
          ))}
        </div>

        {/* Invoices */}
        <Card className="p-6 space-y-4">
          <h3 className="font-display font-bold text-base">Billing & Invoice History</h3>
          <div className="divide-y divide-border text-xs">
            <div className="py-3 flex justify-between items-center font-medium text-muted-foreground">
              <span>Date</span>
              <span>Description</span>
              <span>Amount</span>
              <span>Receipt</span>
            </div>
            <div className="py-3 flex justify-between items-center">
              <span>July 1, 2026</span>
              <span>Business Pro Plan - Monthly</span>
              <span className="font-mono font-semibold">$49.00</span>
              <Button variant="ghost" size="sm" onClick={() => toast.info("Downloading receipt PDF...")}>
                PDF
              </Button>
            </div>
            <div className="py-3 flex justify-between items-center">
              <span>June 1, 2026</span>
              <span>Business Pro Plan - Monthly</span>
              <span className="font-mono font-semibold">$49.00</span>
              <Button variant="ghost" size="sm" onClick={() => toast.info("Downloading receipt PDF...")}>
                PDF
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </Shell>
  );
}
