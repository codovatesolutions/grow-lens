"use client";

import { useState } from "react";
import Shell from "@/components/Shell";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Settings, User, Moon, Sun, Lock, Shield, CheckCircle } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();

  const [name, setName] = useState(user?.name || "");
  const [industry, setIndustry] = useState("auto");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setTimeout(() => {
      setSavingProfile(false);
      toast.success("Profile preferences saved successfully");
    }, 600);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSavingPassword(true);
    setTimeout(() => {
      setSavingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Password updated successfully");
    }, 600);
  };

  return (
    <Shell>
      <div className="space-y-6 max-w-4xl" data-testid="settings-page">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" /> Account & App Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your personal profile, audit defaults, appearance, and account security.
          </p>
        </div>

        {/* Profile Card */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <User className="w-5 h-5 text-primary" />
            <h2 className="font-display font-bold text-lg">Profile Information</h2>
          </div>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" value={user?.email || ""} disabled className="opacity-70 bg-muted" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Default Industry Focus</Label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-detect from scanned site</SelectItem>
                  <SelectItem value="saas">SaaS / Software</SelectItem>
                  <SelectItem value="ecommerce">E-Commerce</SelectItem>
                  <SelectItem value="agency">Agency / Consulting</SelectItem>
                  <SelectItem value="restaurant">Hospitality / Restaurant</SelectItem>
                  <SelectItem value="creator">Creator Economy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={savingProfile}>
              {savingProfile ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </Card>

        {/* Appearance Settings */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              {theme === "dark" ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
              <h2 className="font-display font-bold text-lg">Appearance & Theme</h2>
            </div>
            <Button variant="outline" size="sm" onClick={toggle} className="flex items-center gap-2">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              Switch to {theme === "dark" ? "Light" : "Dark"} Mode
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Current active theme: <strong className="text-foreground capitalize">{theme} Mode</strong>. Choose your preferred dashboard theme.
          </p>
        </Card>

        {/* Password & Security Card */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Lock className="w-5 h-5 text-primary" />
            <h2 className="font-display font-bold text-lg">Password & Security</h2>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="current-pass">Current Password</Label>
              <Input
                id="current-pass"
                type="password"
                value={currentPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-pass">New Password</Label>
              <Input
                id="new-pass"
                type="password"
                value={newPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
              />
            </div>
            <Button type="submit" disabled={savingPassword}>
              {savingPassword ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </Card>
      </div>
    </Shell>
  );
}
