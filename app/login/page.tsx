"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Telescope } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      toast.success("Welcome back");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Login failed");
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
          <h2 className="font-display text-4xl font-bold tracking-tight">Clarity over hype.</h2>
          <p className="mt-3 text-secondary-foreground/70 max-w-md">
            Scores, fixes and content plans grounded in your actual page and your actual profile.
          </p>
        </div>
        <div className="text-xs text-secondary-foreground/50 font-mono">
          growthlens.ai &copy; 2026
        </div>
      </div>
      <div className="flex items-center justify-center p-6 md:p-10">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5" data-testid="login-form">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground mt-1">Log in to continue your scans.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="login-email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-testid="login-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy} data-testid="login-submit">
            {busy ? "Signing in..." : "Sign in"}
          </Button>
          <div className="text-sm text-muted-foreground text-center">
            No account?{" "}
            <Link href="/signup" className="text-primary hover:underline" data-testid="login-to-signup">
              Create one
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
