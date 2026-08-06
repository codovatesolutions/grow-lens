"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Telescope, ArrowRight, Globe, Sparkles, CheckCircle2, BarChart3, MailPlus,
  Users, CalendarDays, LucideIcon
} from "lucide-react";

interface StatProps {
  k: string;
  v: string;
}

const Stat = ({ k, v }: StatProps) => (
  <div className="p-6">
    <div className="font-display text-4xl font-black">{v}</div>
    <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-1">{k}</div>
  </div>
);

interface FeatureProps {
  icon: LucideIcon;
  title: string;
  body: string;
}

const Feature = ({ icon: Icon, title, body }: FeatureProps) => (
  <div className="p-6 flex flex-col gap-3">
    <div className="w-10 h-10 rounded-md bg-primary/10 grid place-items-center">
      <Icon className="w-5 h-5 text-primary" />
    </div>
    <h3 className="font-display text-lg font-semibold">{title}</h3>
    <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
  </div>
);

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logolensgrowth.jpeg" alt="LensGrowth Logo" className="w-7 h-7 rounded-md object-cover border border-border" />
            <span className="font-display text-lg font-bold">
              LensGrowth<span className="text-primary">.</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" data-testid="landing-login-btn">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" data-testid="landing-signup-btn">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="border-b border-border relative overflow-hidden">
        <div className="hero-glow" />
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28 grid md:grid-cols-12 gap-10 relative z-10">
          <div className="md:col-span-7">
            <div className="text-xs uppercase tracking-[0.25em] text-primary mb-6 font-semibold">AI-powered growth agency</div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tighter">
              Digital Marketing Agency That Delivers
              <span className="text-primary"> Business Growth </span>
            </h1>
            <h2 className="mt-6 text-xl md:text-2xl text-foreground font-semibold leading-relaxed">
              Grow Faster With SEO, Google Ads, AI Marketing & Lead Generation
            </h2>
            <p className="mt-4 text-base text-muted-foreground max-w-2xl leading-relaxed">
              Paste a URL or a social link. LensGrowth AI reads it, scores it 0&ndash;100, and tells you in plain English what to fix, what to post, and how to win the next 30 days.
            </p>
            <div className="mt-8 flex wrap gap-3">
              <Link href="/signup">
                <Button size="lg" className="gap-2" data-testid="hero-signup-btn">
                  Start free scan <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <a href="#how">
                <Button size="lg" variant="outline" data-testid="hero-how-btn">How it works</Button>
              </a>
            </div>
            <div className="mt-8 flex items-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> No credit card</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Plain-English reports</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Public data only</span>
            </div>
          </div>

          <div className="md:col-span-5 flex items-center">
            <div className="w-full border border-border rounded-xl bg-card/60 backdrop-blur p-6 shadow-2xl">
              <div className="flex items-center justify-between text-xs text-muted-foreground pb-4 border-b border-border">
                <span className="font-mono uppercase">Live Demo</span>
                <span className="font-mono text-primary font-bold">Score 82</span>
              </div>
              <div className="mt-4 space-y-3">
                <div className="text-xs text-muted-foreground font-mono">https://acme-bakery.com</div>
                <h3 className="font-display font-semibold text-base">Top fix: weak above-the-fold CTA</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your hero has 3 competing buttons. Cut to one: <strong className="text-foreground">&ldquo;Order today&rsquo;s bread&rdquo;</strong>. Mobile bounce drops ~12% in similar sites.
                </p>
                <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                  <div className="p-2 border border-border rounded">
                    <div className="font-bold">7/10</div>
                    <div className="text-[10px] text-muted-foreground">Trust</div>
                  </div>
                  <div className="p-2 border border-border rounded">
                    <div className="font-bold">6/10</div>
                    <div className="text-[10px] text-muted-foreground">SEO</div>
                  </div>
                  <div className="p-2 border border-border rounded">
                    <div className="font-bold">4/10</div>
                    <div className="text-[10px] text-muted-foreground">CTA</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Two modes. One growth engine.</h2>
          <div className="grid md:grid-cols-2 gap-px bg-border border border-border mt-10">
            <div className="bg-card p-8">
              <Globe className="w-6 h-6 text-primary" />
              <h3 className="font-display text-2xl font-bold mt-4">Business Mode</h3>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">Paste a website. We analyze the homepage, CTAs, trust elements, navigation, SEO, and contact paths. You get a score, 5 prioritized fixes, 3 personalized outreach emails, and a lead list.</p>
              <ul className="mt-5 space-y-2 text-sm">
                {["0-100 conversion score","Top 5 fixes with the 'why'","3 outreach email drafts","Sales pitch angles","Public contact extraction"].map(x=>(
                  <li key={x} className="flex gap-2 items-start"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0"/>{x}</li>
                ))}
              </ul>
            </div>
            <div className="bg-card p-8">
              <Sparkles className="w-6 h-6 text-accent" />
              <h3 className="font-display text-2xl font-bold mt-4">Creator Mode</h3>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">Paste your Instagram, LinkedIn, X, YouTube, or TikTok. We score your positioning, find your pillars, write 10 post ideas, captions, hooks, and a 7 or 30-day plan.</p>
              <ul className="mt-5 space-y-2 text-sm">
                {["Profile + niche score","10 post ideas with hooks","Captions & hashtags","Bio + CTA rewrites","7 or 30-day calendar"].map(x=>(
                  <li key={x} className="flex gap-2 items-start"><CheckCircle2 className="w-4 h-4 text-accent mt-0.5 shrink-0"/>{x}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-b border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Everything you need to act today.</h2>
          <div className="grid md:grid-cols-3 gap-px bg-border mt-10 border border-border">
            <Feature icon={BarChart3} title="Scores you can trust" body="Every scan gives a 0-100 score with a breakdown across trust, CTAs, SEO, mobile, and messaging." />
            <Feature icon={MailPlus} title="Drafted outreach" body="Personalized email drafts that reference your prospect's specific weaknesses, not generic templates." />
            <Feature icon={Users} title="Lead extraction" body="Public emails, phones, and decision-maker hints surfaced from each scan, ready to copy." />
            <Feature icon={CalendarDays} title="Content calendars" body="Auto-generated 7 or 30-day plans with hook, format, caption, and best post time." />
            <Feature icon={Sparkles} title="Plain English" body="No jargon. We explain why each issue hurts you and what the exact next step is." />
            <Feature icon={CheckCircle2} title="Checklists" body="Every report ends with a clear action checklist so non-technical owners can ship fixes today." />
          </div>
        </div>
      </section>

      <section id="pricing" className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-4 gap-px bg-border border border-border">
            <Stat k="Sites analyzed" v="12k+" />
            <Stat k="Avg score lift" v="+18 pts" />
            <Stat k="Hours saved / scan" v="6.4" />
            <Stat k="Email open rate" v="42%" />
          </div>
        </div>
      </section>

      {/* SEO Directories for Internal Linking */}
      <section className="border-b border-border bg-card/10">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Explore Our Growth Networks</h2>
            <p className="text-muted-foreground mt-3">Targeted expertise across services, business verticals, and regional locations.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {/* Services Column */}
            <div>
              <h3 className="font-display text-xl font-bold mb-6 border-b border-border pb-3 text-primary">SEO Services</h3>
              <ul className="space-y-3 text-sm">
                {[
                  { name: "SEO Services", slug: "seo" },
                  { name: "Google Ads", slug: "google-ads" },
                  { name: "Meta Ads", slug: "meta-ads" },
                  { name: "Website Development", slug: "website-development" },
                  { name: "Lead Generation", slug: "lead-generation" },
                  { name: "AI Marketing", slug: "ai-marketing" },
                  { name: "Branding", slug: "branding" }
                ].map(item => (
                  <li key={item.slug}>
                    <Link href={`/services/${item.slug}`} className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                      <ArrowRight className="w-3 h-3 text-primary" /> {item.name}
                    </Link>
                  </li>
                ))}
                <li className="pt-2">
                  <Link href="/services" className="text-primary hover:underline text-xs font-semibold">View All Services →</Link>
                </li>
              </ul>
            </div>

            {/* Industries Column */}
            <div>
              <h3 className="font-display text-xl font-bold mb-6 border-b border-border pb-3 text-primary">Marketing for Verticals</h3>
              <ul className="space-y-3 text-sm">
                {[
                  { name: "Marketing for Hospitals", slug: "hospitals" },
                  { name: "Marketing for Schools", slug: "startups" }, // maps to startups content template
                  { name: "Marketing for Restaurants", slug: "restaurants" },
                  { name: "Marketing for Real Estate", slug: "real-estate" },
                  { name: "Marketing for Startups", slug: "startups" }
                ].map(item => (
                  <li key={item.name}>
                    <Link href={`/industries/${item.slug}`} className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                      <ArrowRight className="w-3 h-3 text-primary" /> {item.name}
                    </Link>
                  </li>
                ))}
                <li className="pt-2">
                  <Link href="/industries" className="text-primary hover:underline text-xs font-semibold">View All Industries →</Link>
                </li>
              </ul>
            </div>

            {/* Locations Column */}
            <div>
              <h3 className="font-display text-xl font-bold mb-6 border-b border-border pb-3 text-primary">Serving Cities</h3>
              <ul className="space-y-3 text-sm">
                {[
                  { name: "Serving Bangalore", slug: "bangalore" },
                  { name: "Hyderabad", slug: "hyderabad" },
                  { name: "Mysore", slug: "mysore" },
                  { name: "Chennai", slug: "chennai" }
                ].map(item => (
                  <li key={item.slug}>
                    <Link href={`/locations/${item.slug}`} className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                      <ArrowRight className="w-3 h-3 text-primary" /> {item.name}
                    </Link>
                  </li>
                ))}
                <li className="pt-2">
                  <Link href="/locations" className="text-primary hover:underline text-xs font-semibold">View All Cities →</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight">Stop guessing. Start growing.</h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Your first scan is free. No card, no setup. Just answers.</p>
          <Link href="/signup" className="inline-block mt-8">
            <Button size="lg" className="gap-2" data-testid="cta-signup-btn">
              Create my account <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="py-10 text-center text-xs text-muted-foreground space-y-3">
        <div>&copy; 2026 LensGrowth AI &middot; Built for clarity over hype.</div>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span>A product of</span>
          <a href="#" className="inline-flex items-center gap-2 font-semibold text-foreground hover:text-primary transition-colors">
            <img src="/brand/codovate-logo.jpeg" alt="Codovate Solutions" className="w-7 h-7 object-contain" />
            Codovate Solutions
          </a>
          <span>&middot; Built by Codovate Solutions</span>
        </div>
      </footer>
    </div>
  );
}
