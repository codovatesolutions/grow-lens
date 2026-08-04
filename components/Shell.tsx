"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Plus, Users, Sparkles, CalendarDays, FileText,
  Settings, CreditCard, LogOut, Telescope, Menu, X,
  Brain, Swords, Trophy, Store
} from "lucide-react";
import React, { useState } from "react";

const items = [
  { href: "/dashboard", label: "Growth OS", icon: LayoutDashboard, tid: "nav-dashboard" },
  { href: "/digital-twin", label: "AI Digital Twin", icon: Brain, tid: "nav-digital-twin" },
  { href: "/war-room", label: "War Room", icon: Swords, tid: "nav-war-room" },
  { href: "/missions", label: "Growth Missions", icon: Trophy, tid: "nav-missions" },
  { href: "/marketplace", label: "Marketplace", icon: Store, tid: "nav-marketplace" },
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
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
        <div className="px-6 py-5 border-b border-border">
          <div className="flex items-center gap-2">
            <img src="/logolensgrowth.jpeg" alt="LensGrowth Logo" className="w-7 h-7 rounded-md object-cover border border-border" />
            <span className="font-display text-lg font-bold tracking-tight">LensGrowth<span className="text-primary">.</span></span>
          </div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-1 pl-9">by Codovate Solutions</div>
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
            <img src="/brand/codovate-logo.jpeg" alt="Codovate Solutions" className="w-5 h-5 object-contain" />
            <span>&copy; 2026 &bull; <span className="text-foreground font-semibold">Codovate Solutions</span></span>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-50 w-72 max-w-[80vw] flex flex-col border-r border-border bg-card shadow-2xl h-full">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <img src="/logolensgrowth.jpeg" alt="LensGrowth Logo" className="w-6 h-6 rounded-md object-cover border border-border" />
                  <span className="font-display text-lg font-bold tracking-tight">LensGrowth<span className="text-primary">.</span></span>
                </div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-0.5 pl-8">by Codovate Solutions</div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} data-testid="mobile-menu-close">
                <X className="w-5 h-5" />
              </Button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {items.map((it) => {
                const isActive = pathname === it.href;
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    data-testid={`mobile-${it.tid}`}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
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
            <div className="p-4 border-t border-border">
              <div className="text-xs text-muted-foreground mb-1">Signed in as</div>
              <div className="text-sm font-medium truncate">{user?.name || user?.email}</div>
              <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3 justify-start"
                onClick={() => { setMobileOpen(false); logout(); router.push("/"); }}
              >
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center justify-between px-4 md:px-8 bg-card">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
              data-testid="mobile-menu-toggle"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="font-display text-lg font-bold flex items-center gap-1.5 md:hidden">
              <img src="/logolensgrowth.jpeg" alt="LensGrowth Logo" className="w-5 h-5 rounded object-cover border border-border" />
              <span>LensGrowth<span className="text-primary">.</span></span>
            </div>
          </div>
          <div className="flex-1" />
        </header>
        <div className="flex-1 p-4 md:p-8 overflow-y-auto overflow-x-hidden max-w-full">{children}</div>
      </main>
    </div>
  );
}
