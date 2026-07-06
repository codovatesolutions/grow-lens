import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";

export default function Settings() {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Settings</div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mt-1">Account & preferences</h1>
      </div>

      <section className="border border-border bg-card rounded p-6 space-y-4">
        <h2 className="font-display text-lg font-semibold">Profile</h2>
        <div className="space-y-2"><Label>Name</Label><Input value={user?.name || ""} readOnly data-testid="settings-name"/></div>
        <div className="space-y-2"><Label>Email</Label><Input value={user?.email || ""} readOnly data-testid="settings-email"/></div>
        <div className="space-y-2"><Label>Role</Label><Input value={user?.role || ""} readOnly data-testid="settings-role"/></div>
      </section>

      <section className="border border-border bg-card rounded p-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold">Dark mode</h2>
          <p className="text-sm text-muted-foreground">Switch theme for low-light environments.</p>
        </div>
        <Switch checked={theme === "dark"} onCheckedChange={toggle} data-testid="settings-dark-toggle"/>
      </section>
    </div>
  );
}
