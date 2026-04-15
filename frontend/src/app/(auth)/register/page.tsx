"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/glass-card";
import { AuroraBackground } from "@/components/aurora-background";
import { Check, X, Sparkles, ArrowRight } from "lucide-react";

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordValid = PASSWORD_RULES.every((r) => r.test(password));
  const passwordsMatch = password === confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!passwordValid) {
      setError("Password does not meet requirements");
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await register(email, password, name);
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "h-11 bg-white/40 dark:bg-white/5 backdrop-blur-md focus-visible:ring-[color:var(--purple-cta)]/40";

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <AuroraBackground intensity="normal" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex size-12 items-center justify-center rounded-2xl bg-[color:var(--gold)]/15 text-[color:var(--gold)] ring-1 ring-[color:var(--gold)]/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="gold-text">NeuroDocAI</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            AI Document Intelligence
          </p>
        </div>

        <GlassCard tilt glow className="p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-semibold">Create account</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Start chatting with your documents
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={inputClass}
              />
              <AnimatePresence>
                {password.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1 overflow-hidden pt-1"
                  >
                    {PASSWORD_RULES.map((rule) => {
                      const pass = rule.test(password);
                      return (
                        <motion.div
                          key={rule.label}
                          layout
                          className={`flex items-center gap-1.5 text-xs ${
                            pass ? "text-[color:var(--gold)]" : "text-muted-foreground"
                          }`}
                        >
                          {pass ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                          {rule.label}
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={inputClass}
              />
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="flex items-center gap-1.5 text-xs text-destructive">
                  <X className="h-3 w-3" />
                  Passwords do not match
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="purple"
              className="group/cta h-11 w-full cursor-pointer text-sm font-medium"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Create Account
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/cta:translate-x-0.5" />
                </span>
              )}
            </Button>

            <p className="pt-1 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-[color:var(--gold)] underline-offset-4 hover:underline"
              >
                Sign In
              </Link>
            </p>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
}
