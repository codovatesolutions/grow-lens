import "./globals.css";
import { ThemeProvider } from "@/lib/theme";
import { Toaster } from "sonner";
import React from "react";

export const metadata = {
  title: "GrowthLens AI",
  description: "AI-powered website conversion auditor and social growth engine.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen">
        <ThemeProvider>
          {children}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
