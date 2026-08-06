import "./globals.css";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/components/AuthProvider";
import { Toaster } from "sonner";
import React from "react";

export const metadata = {
  title: "LensGrowth AI",
  description: "AI-powered website conversion auditor and social growth engine.",
  icons: {
    icon: "/logolensgrowth.jpeg",
    shortcut: "/logolensgrowth.jpeg",
    apple: "/logolensgrowth.jpeg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/jpeg" href="/logolensgrowth.jpeg" />
        <link rel="apple-touch-icon" href="/logolensgrowth.jpeg" />
        <link rel="preload" href="/logolensgrowth.jpeg" as="image" />
        <link rel="preload" href="/brand/codovate-logo.jpeg" as="image" />
      </head>
      <body className="antialiased min-h-screen">
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

