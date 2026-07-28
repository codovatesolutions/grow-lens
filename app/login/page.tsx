"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Telescope } from "lucide-react";
import { toast } from "sonner";

declare global {
  interface Window {
    google?: any;
  }
}

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

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
            toast.success("Welcome back!");
            router.push("/dashboard");
          } catch (err: any) {
            toast.error(err.response?.data?.detail || "Google sign-in failed");
          } finally {
            setBusy(false);
          }
        },
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
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
        <div className="w-full max-w-sm space-y-5">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground mt-1">Log in to continue your scans.</p>
          </div>

          {/* Google Sign-In Button */}
          <div
            ref={googleBtnRef}
            id="google-signin-btn"
            className="w-full flex justify-center"
            style={{ minHeight: 44 }}
          />

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or continue with email</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={onSubmit} className="space-y-5" data-testid="login-form">
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
          </form>

          <div className="text-sm text-muted-foreground text-center">
            No account?{" "}
            <Link href="/signup" className="text-primary hover:underline" data-testid="login-to-signup">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
