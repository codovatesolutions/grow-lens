"use client";

import { useEffect, useState } from "react";
import Shell from "@/components/Shell";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { CreditCard, Check, ShieldCheck, ArrowUpRight } from "lucide-react";

export default function BillingPage() {
  const [subData, setSubData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);

  const loadBilling = async () => {
    try {
      const { data } = await api.get("/billing/subscription");
      setSubData(data);
    } catch (err: any) {
      toast.error("Failed to load subscription status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBilling();
  }, []);

  const handleUpgrade = async (planId: string) => {
    setUpgradingPlan(planId);
    try {
      const { data } = await api.post("/billing/create-checkout", { plan_id: planId });
      if (data.checkout_url) {
        toast.success(`Redirecting to checkout for ${planId.toUpperCase()} plan...`);
        if (data.mode === 'stripe') {
          window.location.href = data.checkout_url;
        } else {
          toast.success(`Plan upgraded to ${planId.toUpperCase()}!`);
          await loadBilling();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Checkout initiation failed");
    } finally {
      setUpgradingPlan(null);
    }
  };

  const currentPlanId = subData?.plan_id || "free";
  const limits = subData?.limits || { scansPerDay: 5, growthTeamPerDay: 1 };
  const usage = subData?.usage || { scans_count: 0, growth_team_calls: 0 };
  const pctUsed = Math.min(100, Math.round(((usage.scans_count || 0) / (limits.scansPerDay || 5)) * 100));

  const plans = [
    {
      id: "free",
      name: "Starter / Free",
      price: "$0",
      period: "forever",
      desc: "Ideal for individual website scan exploration and basic audit metrics.",
      features: [
        `${limits.scansPerDay || 5} Scans per day limit`,
        "Overall score & top 5 fixes",
        "Basic security headers audit",
        "Community support",
      ],
      current: currentPlanId === "free",
    },
    {
      id: "pro",
      name: "Business Pro",
      price: "$49",
      period: "/ month",
      desc: "Comprehensive conversion, SEO, security audits, and AI Growth Team for teams.",
      features: [
        "50 Scans per day limit",
        "Deep Security & Vulnerabilities Audit",
        "13-Agent AI Growth Board Panel",
        "SSRF & Security Header Inspection",
        "Shareable Executive PDF & Web Reports",
        "Priority Support",
      ],
      popular: true,
      current: currentPlanId === "pro",
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "$199",
      period: "/ month",
      desc: "Built for marketing agencies, consultants, and high-volume enterprise teams.",
      features: [
        "Everything in Business Pro",
        "500 Scans per day limit",
        "100 AI Growth Team Panel runs / day",
        "Dedicated API Quotas & Custom Integrations",
        "Automated DB Backups & Entitlement SLA",
        "Dedicated Account Support",
      ],
      current: currentPlanId === "enterprise",
    },
  ];

  return (
    <Shell>
      <div className="space-y-6" data-testid="billing-page">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary" /> Subscription & Plan Entitlements
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your subscription plan, API quota entitlements, and billing status.
          </p>
        </div>

        {/* Current Plan Overview Card */}
        <Card className="p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-primary font-bold">Active Subscription</span>
              <h2 className="font-display text-xl font-bold mt-1 uppercase">
                {currentPlanId} Plan
              </h2>
            </div>
            <Badge className="bg-emerald-500 text-white font-mono text-xs px-3 py-1 uppercase">
              {subData?.subscription?.status || "Active"}
            </Badge>
          </div>
          <div className="space-y-2 max-w-md">
            <div className="flex justify-between text-xs font-medium">
              <span>Daily Scan Quota Usage</span>
              <span>{usage.scans_count || 0} / {limits.scansPerDay || 5} Scans Used Today</span>
            </div>
            <Progress value={pctUsed} className="h-2" />
          </div>
        </Card>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 pt-2">
          {plans.map((plan) => (
            <Card
              key={plan.id}
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
                disabled={plan.current || upgradingPlan === plan.id}
                onClick={() => handleUpgrade(plan.id)}
              >
                {plan.current
                  ? "Current Active Plan"
                  : upgradingPlan === plan.id
                  ? "Processing..."
                  : `Upgrade to ${plan.name}`}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </Shell>
  );
}
