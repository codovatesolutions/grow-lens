import Shell from "@/components/Shell";

export default function SocialLayout({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}

export const metadata = {
  title: "Social Publisher — LensGrowth",
  description: "Publish to all your social media platforms in one click. Schedule posts, manage accounts, and track performance.",
};
