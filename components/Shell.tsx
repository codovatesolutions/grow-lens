"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Plus, Users, Sparkles, CalendarDays, FileText,
  Settings, CreditCard, LogOut, Sun, Moon, Telescope
} from "lucide-react";
import React from "react";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, tid: "nav-dashboard" },
  { href: "/scan/new", label: "New Scan", icon: Plus, tid: "nav-new-scan" },
  { href: "/leads", label: "Lead List", icon: Users, tid: "nav-leads" },
  { href: "/creator", label: "Creator Insights", icon: Sparkles, tid: "nav-creator" },
  { href: "/planner", label: "Content Planner", icon: CalendarDays, tid: "nav-planner" },
  { href: "/reports", label: "Reports", icon: FileText, tid: "nav-reports" },
  { href: "/settings", label: "Settings", icon: Settings, tid: "nav-settings" },
  { href: "/billing", label: "Billing", icon: CreditCard, tid: "nav-billing" },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
        <div className="px-6 py-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Telescope className="w-5 h-5 text-primary" />
            <span className="font-display text-lg font-bold tracking-tight">GrowthLens<span className="text-primary">.</span></span>
          </div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-1 pl-7">by Codovate Solutions</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {items.map((it) => {
            const isActive = pathname === it.href;
            return (
              <Link
                key={it.href}
                href={it.href}
                data-testid={it.tid}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <it.icon className="w-4 h-4" />
                {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <div className="text-xs text-muted-foreground mb-1">Signed in as</div>
          <div className="text-sm font-medium truncate" data-testid="shell-user-name">{user?.name || user?.email}</div>
          <div className="text-xs text-muted-foreground truncate" data-testid="shell-user-email">{user?.email}</div>
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3 justify-start"
            onClick={() => { logout(); router.push("/"); }}
            data-testid="logout-btn"
          >
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
          <div className="text-[10px] text-muted-foreground text-center mt-3 pt-3 border-t border-border flex items-center justify-center gap-2">
            <img src="/brand/codovate-logo.png" alt="Codovate Solutions" className="w-5 h-5 object-contain" />
            <span>&copy; 2026 &bull; <span className="text-foreground font-semibold">Codovate Solutions</span></span>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center justify-between px-4 md:px-8 bg-card">
          <div className="md:hidden font-display text-lg font-bold">GrowthLens<span className="text-primary">.</span></div>
          <div className="flex-1" />
          <Button variant="ghost" size="icon" onClick={toggle} data-testid="theme-toggle">
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </header>
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
