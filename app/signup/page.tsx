"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Telescope } from "lucide-react";
import { toast } from "sonner";

export default function Signup() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "business" });
  const [busy, setBusy] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await register(form);
      toast.success("Account created");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Sign up failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex flex-col justify-between p-10 bg-secondary text-secondary-foreground">
        <Link href="/" className="flex items-center gap-2">
          <Telescope className="w-5 h-5 text-primary" />
          <span className="font-display text-lg font-bold">
            GrowthLens<span className="text-primary">.</span>
          </span>
        </Link>
        <div>
          <h2 className="font-display text-4xl font-bold tracking-tight">Your first scan is free.</h2>
          <p className="mt-3 text-secondary-foreground/70 max-w-md">
            No credit card. Just answers in plain English.
          </p>
        </div>
        <div className="text-xs text-secondary-foreground/50 font-mono">
          growthlens.ai &copy; 2026
        </div>
      </div>
      <div className="flex items-center justify-center p-6 md:p-10">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5" data-testid="signup-form">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Create account</h1>
            <p className="text-sm text-muted-foreground mt-1">Start scanning in under a minute.</p>
          </div>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
              data-testid="signup-name"
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              required
              data-testid="signup-email"
            />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              required
              minLength={6}
              data-testid="signup-password"
            />
          </div>
          <div className="space-y-2">
            <Label>I am a</Label>
            <Select value={form.role} onValueChange={(v) => set("role", v)}>
              <SelectTrigger data-testid="signup-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="business">Business owner</SelectItem>
                <SelectItem value="creator">Creator</SelectItem>
                <SelectItem value="analyst">Analyst / consultant</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={busy} data-testid="signup-submit">
            {busy ? "Creating..." : "Create account"}
          </Button>
          <div className="text-sm text-muted-foreground text-center">
            Already have one?{" "}
            <Link href="/login" className="text-primary hover:underline" data-testid="signup-to-login">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
