import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme";
import { Button } from "./ui/button";
import {
  LayoutDashboard, Plus, Users, Sparkles, CalendarDays, FileText,
  Settings, CreditCard, LogOut, Sun, Moon, Telescope,
} from "lucide-react";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, tid: "nav-dashboard" },
  { to: "/scan/new", label: "New Scan", icon: Plus, tid: "nav-new-scan" },
  { to: "/leads", label: "Lead List", icon: Users, tid: "nav-leads" },
  { to: "/creator", label: "Creator Insights", icon: Sparkles, tid: "nav-creator" },
  { to: "/planner", label: "Content Planner", icon: CalendarDays, tid: "nav-planner" },
  { to: "/reports", label: "Reports", icon: FileText, tid: "nav-reports" },
  { to: "/settings", label: "Settings", icon: Settings, tid: "nav-settings" },
  { to: "/billing", label: "Billing", icon: CreditCard, tid: "nav-billing" },
];

export default function Shell({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const nav = useNavigate();

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
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              data-testid={it.tid}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`
              }
            >
              <it.icon className="w-4 h-4" />
              {it.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <div className="text-xs text-muted-foreground mb-1">Signed in as</div>
          <div className="text-sm font-medium truncate" data-testid="shell-user-name">{user?.name}</div>
          <div className="text-xs text-muted-foreground truncate" data-testid="shell-user-email">{user?.email}</div>
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3 justify-start"
            onClick={() => { logout(); nav("/"); }}
            data-testid="logout-btn"
          >
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
          <div className="text-[10px] text-muted-foreground text-center mt-3 pt-3 border-t border-border">
            © 2026 · A product of <span className="text-foreground font-semibold">Codovate Solutions</span>
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
