import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { useTheme } from "../lib/theme";
import {
  Telescope, ArrowRight, Globe, Sparkles, CheckCircle2, BarChart3, MailPlus,
  Users, CalendarDays, Sun, Moon,
} from "lucide-react";

const Stat = ({ k, v }) => (
  <div className="p-6">
    <div className="font-display text-4xl font-black">{v}</div>
    <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-1">{k}</div>
  </div>
);

const Feature = ({ icon: Icon, title, body }) => (
  <div className="p-6 flex flex-col gap-3">
    <div className="w-10 h-10 rounded-md bg-primary/10 grid place-items-center"><Icon className="w-5 h-5 text-primary" /></div>
    <h3 className="font-display text-lg font-semibold">{title}</h3>
    <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
  </div>
);

export default function Landing() {
  const { theme, toggle } = useTheme();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Telescope className="w-5 h-5 text-primary" />
            <span className="font-display text-lg font-bold">GrowthLens<span className="text-primary">.</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggle} data-testid="landing-theme-toggle">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Link to="/login"><Button variant="ghost" size="sm" data-testid="landing-login-btn">Log in</Button></Link>
            <Link to="/signup"><Button size="sm" data-testid="landing-signup-btn">Get started</Button></Link>
          </div>
        </div>
      </header>

      <section className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28 grid md:grid-cols-12 gap-10">
          <div className="md:col-span-7">
            <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-6">AI-powered growth analyst</div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tighter">
              See exactly what's
              <span className="text-primary"> holding back </span>
              your website or social profile.
            </h1>
            <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
              Paste a URL or a social link. GrowthLens AI reads it, scores it 0&ndash;100, and tells you in plain English what to fix, what to post, and how to win the next 30 days.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/signup"><Button size="lg" className="gap-2" data-testid="hero-signup-btn">Start free scan <ArrowRight className="w-4 h-4" /></Button></Link>
              <a href="#how"><Button size="lg" variant="outline" data-testid="hero-how-btn">How it works</Button></a>
            </div>
            <div className="mt-10 flex gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> No credit card</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Plain-English reports</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Public data only</span>
            </div>
          </div>
          <div className="md:col-span-5">
            <div className="border border-border bg-card rounded-md overflow-hidden">
              <div className="px-5 py-3 border-b border-border text-xs uppercase tracking-[0.2em] text-muted-foreground flex justify-between">
                <span>Live demo</span><span className="font-mono text-primary">SCORE 82</span>
              </div>
              <div className="p-6 space-y-4">
                <div className="font-mono text-xs text-muted-foreground">https://acme-bakery.com</div>
                <div className="font-display text-2xl font-bold leading-tight">Top fix: weak above-the-fold CTA</div>
                <p className="text-sm text-muted-foreground">Your hero has 3 competing buttons. Cut to one: <span className="text-foreground font-medium">"Order today's bread"</span>. Mobile bounce drops ~12% in similar sites.</p>
                <div className="grid grid-cols-3 border border-border rounded">
                  {[{k:"Trust",v:"7/10"},{k:"SEO",v:"6/10"},{k:"CTA",v:"4/10"}].map(s=>(
                    <div key={s.k} className="p-3 text-center border-r last:border-r-0 border-border">
                      <div className="font-mono text-sm font-semibold">{s.v}</div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{s.k}</div>
                    </div>
                  ))}
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
            <Feature icon={MailPlus} title="Drafted outreach" body="Personalized email drafts that reference your prospect's specific weaknesses — not generic templates." />
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

      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight">Stop guessing. Start growing.</h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Your first scan is free. No card, no setup. Just answers.</p>
          <Link to="/signup" className="inline-block mt-8">
            <Button size="lg" className="gap-2" data-testid="cta-signup-btn">Create my account <ArrowRight className="w-4 h-4" /></Button>
          </Link>
        </div>
      </section>

      <footer className="py-10 text-center text-xs text-muted-foreground">
        © 2026 GrowthLens AI · Built for clarity over hype.
      </footer>
    </div>
  );
}
