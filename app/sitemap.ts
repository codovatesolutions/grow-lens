import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://lensgrowth.com";

  const coreRoutes = [
    "",
    "/services",
    "/industries",
    "/locations",
    "/blog",
    "/case-studies",
    "/faqs",
    "/tools",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  const services = [
    "seo",
    "local-seo",
    "technical-seo",
    "ecommerce-seo",
    "google-ads",
    "meta-ads",
    "social-media-marketing",
    "website-development",
    "lead-generation",
    "branding",
    "ai-marketing",
  ].map((slug) => ({
    url: `${baseUrl}/services/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const industries = [
    "hospitals",
    "doctors",
    "clinics",
    "restaurants",
    "lawyers",
    "real-estate",
    "interior-designers",
    "startups",
    "manufacturers",
    "gyms",
  ].map((slug) => ({
    url: `${baseUrl}/industries/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const locations = [
    "bangalore",
    "hyderabad",
    "mysore",
    "chennai",
  ].map((slug) => ({
    url: `${baseUrl}/locations/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const blogs = [
    "why-is-my-website-not-getting-traffic",
    "how-can-i-generate-more-business-leads",
    "how-to-get-customers-from-google",
    "why-is-my-google-ranking-dropping",
    "website-that-converts-visitors-into-customers",
  ].map((slug) => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  const caseStudies = [
    "hospital-seo-bangalore",
    "saas-lead-generation",
  ].map((slug) => ({
    url: `${baseUrl}/case-studies/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...coreRoutes, ...services, ...industries, ...locations, ...blogs, ...caseStudies];
}
