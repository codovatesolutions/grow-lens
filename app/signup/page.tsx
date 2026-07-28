"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Telescope } from "lucide-react";
import { toast } from "sonner";

declare global {
  interface Window {
    google?: any;
  }
}

export default function Signup() {
  const { register, loginWithGoogle } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "business" });
  const [busy, setBusy] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // Load Google Identity Services and render the button
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || clientId === "YOUR_GOOGLE_CLIENT_ID_HERE") return;

    const initGoogle = () => {
      if (!window.google || !googleBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential: string }) => {
          setBusy(true);
          try {
            await loginWithGoogle(response.credential);
            toast.success("Account created! Welcome to GrowthLens.");
            router.push("/dashboard");
          } catch (err: any) {
            toast.error(err.response?.data?.detail || "Google sign-up failed");
          } finally {
            setBusy(false);
          }
        },
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "signup_with",
        shape: "rectangular",
        width: googleBtnRef.current.offsetWidth || 384,
      });
    };

    if (window.google) {
      initGoogle();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.head.appendChild(script);
    }
  }, [loginWithGoogle, router]);

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
        <div className="w-full max-w-sm space-y-5">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Create account</h1>
            <p className="text-sm text-muted-foreground mt-1">Start scanning in under a minute.</p>
          </div>

          {/* Google Sign-Up Button */}
          <div
            ref={googleBtnRef}
            id="google-signup-btn"
            className="w-full flex justify-center"
            style={{ minHeight: 44 }}
          />

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or sign up with email</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={onSubmit} className="space-y-5" data-testid="signup-form">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("name", e.target.value)}
                required
                data-testid="signup-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("email", e.target.value)}
                required
                data-testid="signup-email"
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => set("password", e.target.value)}
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
          </form>

          <div className="text-sm text-muted-foreground text-center">
            Already have one?{" "}
            <Link href="/login" className="text-primary hover:underline" data-testid="signup-to-login">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
