import React from "react";
import { notFound } from "next/navigation";
import { CheckCircle2, AlertTriangle, ArrowRight, Zap, Target, TrendingUp, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FAQAccordion } from "@/components/FAQ/FAQAccordion";
import { CTASection } from "@/components/CTA/CTASection";
import { SchemaMarkup } from "@/components/SEO/Metadata";
import Link from "next/link";

interface ServiceData {
  title: string;
  metaDescription: string;
  keywords: string[];
  heroTitle: string;
  heroSub: string;
  problems: string[];
  benefits: { title: string; desc: string }[];
  process: string[];
  faqs: { q: string; a: string }[];
}

const servicesContent: Record<string, ServiceData> = {
  "seo": {
    title: "SEO Services | Increase Rankings & Organic Traffic | LensGrowth",
    metaDescription: "Professional SEO services that improve Google rankings, generate qualified leads, and increase business growth.",
    keywords: ["SEO Services", "SEO Agency", "SEO Consultant", "Technical SEO", "Local SEO", "SEO Expert", "Website SEO Audit", "Organic Traffic"],
    heroTitle: "Organic Search Optimization That Drives Growth",
    heroSub: "Build authority and secure long-term traffic that converts into paying customers.",
    problems: [
      "Website not ranking on Google for crucial search terms",
      "Low organic traffic despite high content investment",
      "No customers from Google search queries",
      "Competitors outranking you on high-intent terms",
      "Recent Google algorithm updates caused drop in ranking"
    ],
    benefits: [
      { title: "Business Growth", desc: "Sustainable organic growth that compounds month over month." },
      { title: "High-Quality Traffic", desc: "Attract intent-driven visitors who are actively searching for your solutions." },
      { title: "Increased Revenue", desc: "More leads and conversions translate directly to sales growth." }
    ],
    process: ["Discovery & Goal Alignment", "Technical SEO Audit", "Competitor & Keyword Research", "On-Page & Content Strategy", "Link Building", "Continuous Optimization"],
    faqs: [
      { q: "What is LensGrowth SEO service?", a: "LensGrowth SEO is a data-driven service focused on building topical authority to increase search engine ranking, drive organic traffic, and generate organic leads." },
      { q: "How long does it take to see SEO results?", a: "SEO typically takes 3 to 6 months to start showing meaningful ranking and traffic improvements, as Google needs to crawl and trust your content updates." },
      { q: "Do you offer local SEO search ranking?", a: "Yes, we specialize in local SEO targeting map packs, Google Business Profile optimization, and local citation builds." },
      { q: "What is topical authority in SEO?", a: "Topical authority is a search engine optimization concept where a website builds trust by writing exhaustive, high-quality content coverages for a specific topic." },
      { q: "Is technical SEO audit included?", a: "Yes, every SEO campaign begins with a comprehensive technical audit covering page speeds, mobile friendliness, indexability, and structural issues." },
      { q: "How do you track campaign progress?", a: "We integrate Google Analytics 4, Search Console, and provide monthly dashboards tracking rankings, traffic, and conversion metrics." },
      { q: "Do you build high-authority backlinks?", a: "Yes, we focus on white-hat outreach, guest postings, and creating link-worthy digital assets to safely build domain authority." },
      { q: "Will you edit our current website content?", a: "Yes, we optimize existing copy, headings, metadata, internal links, and images to improve relevancy without breaking branding." },
      { q: "What tools do you use for SEO research?", a: "We leverage industry-leading SEO suites including Semrush, Ahrefs, Screaming Frog, Google Search Console, and our internal AI analyzers." },
      { q: "Can we cancel our SEO services at any time?", a: "Our contracts are monthly, offering flexibility with a standard 30-day notice period. No long-term lock-ins required." }
    ]
  },
  "local-seo": {
    title: "Local SEO Services | Win Your Local Market | LensGrowth",
    metaDescription: "Dominate Google Maps and local search results to drive foot traffic and inquiries to your brick-and-mortar business.",
    keywords: ["Local SEO", "Google Business Profile", "Google Maps Marketing", "Local Citation Building", "Near Me Searches"],
    heroTitle: "Local SEO Services: Connect with Local Customers",
    heroSub: "Get found in Google Maps and drive highly qualified local traffic to your store or office.",
    problems: [
      "Your competitors are taking all local map-pack leads",
      "Google Business Profile suspended or not optimized",
      "Low visibility for local 'near me' search queries",
      "Inconsistent NAP info (Name, Address, Phone) across directories"
    ],
    benefits: [
      { title: "Local Dominance", desc: "Show up in the 3-Pack on Google Maps where 70% of local clicks go." },
      { title: "Increased Phone Calls", desc: "Drive direct calls, directions requests, and website visits." },
      { title: "High-Intent Visits", desc: "Connect with local searchers ready to buy right now." }
    ],
    process: ["Google Profile Audit", "Local Citation Clean-up", "Geotargeted Content Creation", "Review Acquisition Strategy", "Map Pack Tracking"],
    faqs: [
      { q: "What is local SEO?", a: "Local SEO focuses on optimizing your online presence to attract customers from local, geographically relevant search queries." },
      { q: "Why is Google Maps visibility important?", a: "Most mobile local searches result in a physical store visit or service booking within 24 hours. Maps place you directly in front of these prospects." },
      { q: "How do you optimize a Google Business Profile?", a: "We optimize primary/secondary categories, business descriptions, services, geotagged photos, and build local citations." },
      { q: "What is local citation building?", a: "Citations are online mentions of your business name, address, and phone number on directories like Yelp, YellowPages, and localized portals." },
      { q: "Do reviews affect local rankings?", a: "Yes, review volume, frequency, and keyword rich reviews are major ranking factors in the Google local algorithm." },
      { q: "How long to rank on Google Map pack?", a: "Local SEO optimizations can reflect changes in 2 to 4 weeks, with full local authority established in 3 months." },
      { q: "What is NAP consistency?", a: "NAP stands for Name, Address, and Phone. Ensuring this data matches everywhere builds high crawler trust." },
      { q: "Do you handle multiple locations?", a: "Yes, we build scalable multi-location campaigns and customized landing pages for each branch." },
      { q: "Can we track local phone leads?", a: "We set up call tracking and conversion funnels to verify the exact ROI from maps." },
      { q: "What industries benefit most from local SEO?", a: "Hospitals, clinics, doctors, restaurants, lawyers, real estate brokers, and local tradespeople." }
    ]
  },
  "technical-seo": {
    title: "Technical SEO Services | Site Auditing & Performance | LensGrowth",
    metaDescription: "Identify and resolve site performance, indexing, and architecture bottlenecks to optimize crawler accessibility.",
    keywords: ["Technical SEO", "Core Web Vitals", "Sitemap Optimization", "Crawl Budget", "Schema Markup"],
    heroTitle: "Remove the Technical Obstacles Blocking Your Rankings",
    heroSub: "Clean architecture, faster loading speeds, and optimized schemas that search engine bots love.",
    problems: [
      "Pages take too long to load (failing Core Web Vitals)",
      "Search engines are not indexing your new content",
      "Messy site structure with duplicate pages and broken links",
      "No schema markup causing poor visual presence in search results"
    ],
    benefits: [
      { title: "Improved Indexing", desc: "Ensure search engine crawlers find and index all key pages." },
      { title: "Faster Page Speed", desc: "Improve user experience and Core Web Vitals rankings." },
      { title: "Rich Snippets", desc: "Unlock visual enhancements like stars and FAQs in SERPs." }
    ],
    process: ["Deep Technical Audit", "Speed Optimization", "Crawler Diagnostics", "Schema Markup Injection", "Crawl Budget Planning"],
    faqs: [
      { q: "What does technical SEO involve?", a: "It focuses on website optimization that helps search crawlers access, index, and render pages efficiently." },
      { q: "What are Core Web Vitals?", a: "Google's metrics measuring loading performance (LCP), interactivity (INP), and visual stability (CLS)." },
      { q: "Why is site speed important for SEO?", a: "Faster sites convert visitors better and are prioritized by Google's mobile-first indexing systems." },
      { q: "How do you fix indexing issues?", a: "By fixing robots.txt rules, correcting canonical headers, resolving 404s, and updating sitemaps." },
      { q: "Do you implement schema markup?", a: "Yes, we integrate comprehensive JSON-LD schemas on all page types." },
      { q: "What is a canonical tag?", a: "A tag telling search engines which version of a URL represents the master page to prevent duplicate content flags." },
      { q: "How often should technical audits be run?", a: "We run weekly automated monitoring and detailed quarterly audits." },
      { q: "What is crawl budget?", a: "The number of pages Googlebot crawls on your site during a specific timeframe, optimized by eliminating low-value urls." },
      { q: "Does technical SEO fix mobile errors?", a: "Yes, mobile-friendliness and responsive issues are central parts of our optimization process." },
      { q: "Will technical SEO break website layouts?", a: "No, our changes are carefully staged and tested to preserve original user interfaces." }
    ]
  },
  "google-ads": {
    title: "Google Ads Management Services | LensGrowth",
    metaDescription: "Professional Google Ads management that drives immediate leads, increases conversion rates, and maximizes your ROI.",
    keywords: ["Google Ads", "PPC Services", "Google PPC Agency", "Search Ads", "Performance Max"],
    heroTitle: "High-Converting Google Ads (PPC) Management",
    heroSub: "Stop wasting budget on clicks. Get highly-targeted Google ads that deliver real sales.",
    problems: [
      "High ad spend with zero qualified leads",
      "Low Quality Scores causing expensive CPC rates",
      "Inaccurate conversion tracking and poor campaign insights",
      "Inefficient targeting showing ads to the wrong audiences"
    ],
    benefits: [
      { title: "Immediate Sales", desc: "Get found instantly on search page results when people are ready to buy." },
      { title: "Accurate ROI Tracking", desc: "Know exactly which keywords and ads are generating profits." },
      { title: "Reduced Ad Waste", desc: "Continually filter negative keywords and low-performing queries." }
    ],
    process: ["Competitor Bid Analysis", "Ad Copywriting & Creatives", "Conversion Setup", "Campaign Structure Launch", "Weekly Bid Optimization"],
    faqs: [
      { q: "What is Google Ads management?", a: "It's the process of planning, building, and optimizing paid search campaigns on Google's advertising network." },
      { q: "How is Google Ads different from SEO?", a: "SEO is organic and takes time to build, whereas Google Ads is paid search that generates leads immediately." },
      { q: "What is a Quality Score?", a: "A metric from 1-10 measuring your ad relevance, expected CTR, and landing page experience; higher scores lower CPC." },
      { q: "How much budget do we need?", a: "We recommend starting with at least $1,000/month to accumulate sufficient conversion data." },
      { q: "Do you write the ad copy?", a: "Yes, our expert copywriters create all headlines, descriptions, and extensions." },
      { q: "What is negative keyword filtering?", a: "Excluding words that are irrelevant to your services to prevent budget waste on unrelated searches." },
      { q: "What campaigns do you support?", a: "Search, Display, Performance Max, Local, Shopping, and YouTube Ads." },
      { q: "Do you optimize landing pages?", a: "Yes, we provide recommendations or build high-converting custom landing pages." },
      { q: "How do we view lead results?", a: "We integrate custom conversion actions with your CRM or Google Analytics." },
      { q: "Is there a setup fee?", a: "We charge a transparent monthly management percentage fee based on ad spend, with minor setup costs." }
    ]
  },
  "meta-ads": {
    title: "Meta Ads & Facebook Advertising Services | LensGrowth",
    metaDescription: "Scalable Meta and Instagram ad campaigns that capture attention, build trust, and drive digital sales.",
    keywords: ["Meta Ads", "Facebook Advertising", "Instagram Ads", "Social Media PPC", "Lead Gen Ads"],
    heroTitle: "Social Media Customer Acquisition via Meta Ads",
    heroSub: "Stop boosting posts. Launch highly optimized Facebook & Instagram campaigns that convert scrollers into customers.",
    problems: [
      "Boosting posts with zero conversions or leads",
      "High cost-per-lead (CPL) on Facebook campaigns",
      "Ad fatigue making campaigns unprofitable after a few days",
      "Incorrect Pixel configuration losing attribution data"
    ],
    benefits: [
      { title: "Hyper-Targeting", desc: "Reach prospects based on demographics, interests, behaviors, and lookalikes." },
      { title: "Creative Scale", desc: "Test multiple image, video, and carousel ads to find the winners." },
      { title: "Omnipresence", desc: "Keep your brand top of mind on both Facebook and Instagram feeds." }
    ],
    process: ["Audience Mapping", "Creative & Copy Design", "Pixel & API Integration", "Campaign Setup", "Scaling & Budget Optimization"],
    faqs: [
      { q: "What are Meta Ads?", a: "Advertising campaigns placed across Meta properties, including Facebook, Instagram, and Messenger." },
      { q: "Do you design the creative banners?", a: "Yes, we produce high-quality images, video hooks, and carousel designs." },
      { q: "What is the Meta Pixel?", a: "A tracking code snippet for your website that measures ad conversions and compiles custom retargeting lists." },
      { q: "How much do Facebook ads cost?", a: "Costs depend on industry and audience, but retargeting and lead generation ads offer excellent ROI." },
      { q: "What is ad fatigue?", a: "When audiences see the same ads too often, causing conversion rates to drop and costs to rise." },
      { q: "Do you offer retargeting ads?", a: "Yes, we run sequential retargeting campaigns to convert past site visitors." },
      { q: "How do you test different ads?", a: "We utilize dynamic creative testing, matching multiple headlines, bodies, and creatives." },
      { q: "Can we capture leads inside Facebook?", a: "Yes, we build Instant Lead Forms that prefill user details for high submission rates." },
      { q: "What is Conversions API?", a: "A server-side tracking tool that bypasses browser ad blockers to accurately track conversions." },
      { q: "Do you manage Meta accounts?", a: "Yes, we handle setup, auditing, billing support, and full execution." }
    ]
  },
  "website-development": {
    title: "Website Development Services | High-Performance Sites | LensGrowth",
    metaDescription: "Speed-optimized, responsive, and search-ready website designs that convert casual traffic into active customers.",
    keywords: ["Website Development", "Web Development Company", "Responsive Web Design", "Next.js Development", "SEO-Friendly Web Design"],
    heroTitle: "Websites Designed to Load Instantly & Generate Leads",
    heroSub: "Ditch slow templates. Build custom, fast, and SEO-engineered websites that turn clicks into conversions.",
    problems: [
      "Website design looks outdated and amateur",
      "Slow load times causing visitors to bounce immediately",
      "Difficult to update content and images without developers",
      "Site doesn't display correctly on mobile screens"
    ],
    benefits: [
      { title: "Ultra-Fast Speeds", desc: "PageSpeed scores of 95+ using modern structures like Next.js." },
      { title: "Built-In SEO", desc: "Correct HTML tags, schemas, speed layouts, and clean coding." },
      { title: "Conversion Architecture", desc: "Clear call-to-actions, sticky buttons, and optimized contact forms." }
    ],
    process: ["UI/UX Mockups", "Next.js Frontend Build", "SEO & Optimization Check", "Content Population", "Speed & Schema Validation", "Launch"],
    faqs: [
      { q: "What technologies do you use for web development?", a: "We build high-performance sites using React, Next.js, Tailwind CSS, and headless CMS integrations." },
      { q: "Will the website be mobile-friendly?", a: "Yes, all our websites are fully responsive, displaying perfectly on all device sizes." },
      { q: "Do you provide web hosting?", a: "We assist with setting up fast edge hosting on platforms like Vercel, Netlify, or AWS." },
      { q: "Can I edit the website content myself?", a: "Yes, we integrate easy-to-use content management systems (CMS) so you can update copy easily." },
      { q: "How long does a website build take?", a: "A typical high-quality corporate website takes between 4 to 8 weeks from design to launch." },
      { q: "Is website security included?", a: "Yes, we implement SSL certificates, secure hosting headers, and clean coding practices." },
      { q: "Will you write the website copy?", a: "We can provide SEO copywriting services to write content that ranks and sells." },
      { q: "Do you redesign existing websites?", a: "Yes, we specialize in complete redesigns focused on improving speed and conversion rates." },
      { q: "Are custom animations supported?", a: "Yes, we build subtle, modern micro-interactions that make the user experience premium." },
      { q: "Do you offer post-launch support?", a: "Yes, we have monthly maintenance agreements covering updates, security, and speed optimization." }
    ]
  },
  "lead-generation": {
    title: "Lead Generation Services | B2B & Customer Acquisition | LensGrowth",
    metaDescription: "Fill your sales funnel with qualified business inquiries and sales appointments using automated multi-channel systems.",
    keywords: ["Lead Generation", "B2B Lead Generation", "Customer Acquisition", "Lead Magnet", "Sales Funnels"],
    heroTitle: "Consistent, Automated Lead Generation Systems",
    heroSub: "Stop relying on referrals. Build a predictable funnel of inbound leads ready to talk to your team.",
    problems: [
      "Inconsistent sales pipeline with dry spells",
      "Spending too much time prospecting instead of closing",
      "Low form submissions on your current landing pages",
      "Traffic visits your site but leaves without contacting you"
    ],
    benefits: [
      { title: "Predictable Growth", desc: "A steady pipeline of new customer conversations every single week." },
      { title: "Higher Margins", desc: "Target high-value prospects searching specifically for premium services." },
      { title: "Automated Nurturing", desc: "Follow up with prospects automatically via email and WhatsApp alerts." }
    ],
    process: ["Target Audience Profiling", "Lead Magnet Creation", "High-Converting Landing Pages", "Traffic Generation", "Integration & Automations"],
    faqs: [
      { q: "What is lead generation?", a: "The process of identifying, attracting, and converting online searchers into warm business inquiries." },
      { q: "What is a lead magnet?", a: "A high-value free resource (like an eBook, checklist, or audit) offered in exchange for contact details." },
      { q: "How do you quality check the leads?", a: "We set up custom qualification fields on forms to filter out spam and unqualified submissions." },
      { q: "Do you integrate with CRMs?", a: "Yes, we integrate with Salesforce, HubSpot, Zoho, and other popular tools via Zapier." },
      { q: "Which channels work best for lead gen?", a: "A mix of Google Search Ads, high-intent SEO pages, and targeted Meta lead forms." },
      { q: "What is a conversion rate?", a: "The percentage of website visitors who take a desired action, like filling out a contact form." },
      { q: "Do you build custom landing pages?", a: "Yes, we design single-focus landing pages optimized for maximum submission rates." },
      { q: "How do you track success?", a: "We track cost per lead (CPL), conversion volume, and quality ratings." },
      { q: "Do you handle email follow-ups?", a: "We can set up automated email autoresponders to engage leads instantly." },
      { q: "What industries benefit from lead gen?", a: "B2B firms, clinics, lawyers, real estate agencies, interior designers, and SaaS startups." }
    ]
  },
  "branding": {
    title: "Branding & Corporate Identity Design | LensGrowth",
    metaDescription: "Build a memorable, premium brand presence that conveys trust, commands authority, and wins customers.",
    keywords: ["Branding Services", "Brand Design", "Corporate Identity", "Logo Design", "Brand Guidelines"],
    heroTitle: "Premium Branding & Identity Systems for Authority",
    heroSub: "Stand out in crowded markets. Create a visually stunning, cohesive brand identity that commands premium prices.",
    problems: [
      "Brand identity looks cheap, outdated, or inconsistent",
      "Struggling to win premium clients because of look and feel",
      "No clear brand guidelines causing marketing team confusion",
      "Logo and graphics don't display well in digital formats"
    ],
    benefits: [
      { title: "Premium Brand Image", desc: "Convey immediate trust and scale your brand authority." },
      { title: "Consistency Across Channels", desc: "Unified logo, colors, fonts, and assets everywhere." },
      { title: "Higher Customer Loyalty", desc: "Build emotional connections that make customers choose you." }
    ],
    process: ["Brand Discovery & Strategy", "Logo & Typography System", "Color Palette Development", "Collateral & Assets Design", "Brand Guidelines Manual"],
    faqs: [
      { q: "What is branding?", a: "Creating a cohesive identity, voice, and design system that differentiates your business from others." },
      { q: "What deliverables are included?", a: "Logo suite, color palette, typography guidelines, business cards, social templates, and a brand book." },
      { q: "Can you refresh an existing logo?", a: "Yes, we offer brand modernization services to update your look while keeping recognizable elements." },
      { q: "How long does a branding project take?", a: "Typically 3 to 6 weeks depending on revisions and scope of collateral." },
      { q: "Do you write brand taglines?", a: "Yes, we help craft core brand messaging, value propositions, and taglines." },
      { q: "What is a brand book?", a: "A reference guide detailing how to use logos, fonts, colors, and voice to maintain consistency." },
      { q: "Who owns the final designs?", a: "You receive full, unrestricted copyright ownership of all approved branding assets." },
      { q: "Do you design social media templates?", a: "Yes, we design custom templates for Instagram, LinkedIn, and YouTube." },
      { q: "Why is cohesive branding crucial for SEO?", a: "Strong brands get direct search queries, building Google search engine authority and trust." },
      { q: "What formats do you provide assets in?", a: "All vector source files (AI, SVG) along with web-ready PNGs and PDFs." }
    ]
  },
  "ai-marketing": {
    title: "AI Marketing Integration & Automation | LensGrowth",
    metaDescription: "Leverage artificial intelligence to automate content production, optimize campaigns, and scale leads.",
    keywords: ["AI Marketing", "Marketing Automation", "AI Content Strategy", "AI Personalization", "Predictive Analytics"],
    heroTitle: "Scale Smarter with AI-Driven Marketing Automation",
    heroSub: "Automate repetitive tasks, generate data-backed copy, and personalize customer journeys at scale.",
    problems: [
      "Struggling to produce enough high-quality content consistently",
      "Manual workflows slowing down marketing execution",
      "Wasting budget on broad campaigns instead of personalized customer pathways",
      "Overwhelmed by marketing data and unable to extract insights"
    ],
    benefits: [
      { title: "Rapid Content Output", desc: "Generate SEO-optimized outlines and copy ideas 10x faster." },
      { title: "Predictive Targeting", desc: "Deliver the right message to the right lead using smart patterns." },
      { title: "Reduced Costs", desc: "Free up manual hours by automating customer nurturing and notifications." }
    ],
    process: ["AI Workflow Audit", "Custom Prompt Setup", "Automation Implementation", "Staff Training & Documentation", "Continuous Optimization"],
    faqs: [
      { q: "What is AI marketing?", a: "Using machine learning, natural language processing, and automation to streamline and scale marketing campaigns." },
      { q: "Does AI content rank on Google?", a: "Yes, Google's official stance is that high-quality, helpful content ranks regardless of how it was generated, provided it meets E-E-A-T standards." },
      { q: "Do you use raw AI content?", a: "Never. We use AI for research, outlines, and drafts, which are always edited and verified by human subject matter experts." },
      { q: "What automations do you set up?", a: "Automated email responses, WhatsApp notifications, review requests, and SEO reports." },
      { q: "How does AI improve conversion rates?", a: "By personalizing website copy and landing pages dynamically based on visitor data." },
      { q: "Is custom integration expensive?", a: "No, we use scalable APIs and affordable automation layers that offer massive ROI." },
      { q: "What tools do you integrate?", a: "OpenAI API, Claude, Make.com, Zapier, HubSpot, and Google Workspace tools." },
      { q: "Can AI help with social media?", a: "Yes, we build content engines that generate post schedules, scripts, and format-specific hooks." },
      { q: "Is data privacy protected?", a: "Yes, we ensure all automations respect client data storage rules and GDPR policies." },
      { q: "How do we get started?", a: "We run a quick discovery call to identify the biggest bottlenecks in your current marketing workflow." }
    ]
  }
};

export async function generateStaticParams() {
  return Object.keys(servicesContent).map((slug) => ({
    slug,
  }));
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = servicesContent[slug];

  if (!content) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Schema Markups */}
      <SchemaMarkup
        type="Service"
        data={{
          serviceType: content.heroTitle,
          description: content.metaDescription,
        }}
      />
      <SchemaMarkup
        type="Breadcrumb"
        data={{
          links: [
            { name: "Home", url: "https://lensgrowth.com" },
            { name: "Services", url: "https://lensgrowth.com/services" },
            { name: content.title.split("|")[0].trim(), url: `https://lensgrowth.com/services/${slug}` },
          ],
        }}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border py-20 lg:py-32">
        <div className="hero-glow absolute inset-0 opacity-40 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="text-xs uppercase tracking-[0.25em] text-primary mb-4 font-semibold">
            LensGrowth Services
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
                Book Free Consultation <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
            <Link href="/services">
              <Button size="lg" variant="outline">View All Services</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Problems Section */}
      <section className="py-20 border-b border-border bg-card/10">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-display text-2xl sm:text-3xl font-black text-center mb-12 tracking-tight">
            Are You Facing These Common Challenges?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {content.problems.map((prob, idx) => (
              <div key={idx} className="p-6 border border-border/80 rounded-xl bg-card/60 backdrop-blur flex items-start gap-4 hover:border-red-500/30 transition-all duration-300">
                <div className="w-8 h-8 rounded-full bg-red-500/10 grid place-items-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-foreground font-medium leading-relaxed">{prob}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 border-b border-border">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-display text-2xl sm:text-3xl font-black text-center mb-12 tracking-tight">
            How Our Service Drives Growth
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {content.benefits.map((benefit, idx) => (
              <div key={idx} className="p-6 border border-border rounded-xl bg-card/40 hover:border-primary/40 transition-colors">
                <div className="w-10 h-10 rounded-md bg-primary/10 grid place-items-center mb-4">
                  {idx === 0 ? <TrendingUp className="w-5 h-5 text-primary" /> : idx === 1 ? <Target className="w-5 h-5 text-primary" /> : <Zap className="w-5 h-5 text-primary" />}
                </div>
                <h3 className="font-display text-lg font-bold mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 border-b border-border bg-card/10">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-display text-2xl sm:text-3xl font-black text-center mb-12 tracking-tight">
            Our Work Process
          </h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-6xl mx-auto">
            {content.process.map((step, idx) => (
              <div key={idx} className="p-4 border border-border/50 rounded-lg bg-card/30 relative text-center">
                <div className="w-8 h-8 rounded-full bg-primary/10 grid place-items-center mx-auto mb-3 text-xs font-bold text-primary">
                  {idx + 1}
                </div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Step {idx + 1}</h4>
                <p className="text-sm font-semibold text-foreground leading-tight">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Component */}
      <FAQAccordion faqs={content.faqs} />

      {/* CTA Component */}
      <CTASection />
    </div>
  );
}
