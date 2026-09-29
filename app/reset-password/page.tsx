"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { KeyRound, CheckCircle2 } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("Password reset token is missing from URL");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long with uppercase and number");
      return;
    }

    setBusy(true);
    try {
      await api.post("/auth/reset-password", {
        token,
        new_password: newPassword,
      });
      setDone(true);
      toast.success("Password reset successfully! You can now log in.");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Password reset failed");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <Card className="p-8 text-center max-w-md w-full space-y-4">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
        <h1 className="font-display font-bold text-xl">Password Reset Complete</h1>
        <p className="text-sm text-muted-foreground">Your account password has been updated successfully.</p>
        <Button asChild className="w-full">
          <Link href="/login">Sign In Now</Link>
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-8 max-w-md w-full space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl flex items-center gap-2">
          <KeyRound className="w-6 h-6 text-primary" /> Reset Your Password
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Enter your new secure password below.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new-pass">New Password</Label>
          <Input
            id="new-pass"
            type="password"
            value={newPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
            placeholder="Minimum 8 characters (uppercase & number)"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-pass">Confirm Password</Label>
          <Input
            id="confirm-pass"
            type="password"
            value={confirmPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password"
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Resetting..." : "Reset Password"}
        </Button>
      </form>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading reset form...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
