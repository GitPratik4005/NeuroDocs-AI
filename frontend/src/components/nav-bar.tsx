"use client";

import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogOut, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export function NavBar() {
  const { user, logout } = useAuth();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-4 z-50 mx-auto w-[calc(100%-2rem)] max-w-6xl px-0"
    >
      <div className="glass-panel flex h-14 items-center justify-between rounded-full border border-white/10 px-4 dark:border-white/10">
        <Link
          href="/dashboard"
          className="group flex items-center gap-2 text-lg font-bold tracking-tight"
        >
          <span className="relative inline-flex size-8 items-center justify-center rounded-full bg-[color:var(--gold)]/15 text-[color:var(--gold)] ring-1 ring-[color:var(--gold)]/30 transition-shadow group-hover:shadow-[0_0_20px_oklch(0.78_0.16_80/0.5)]">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="gold-text">NeuroDocAI</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
          <Link
            href="/dashboard"
            className="transition-colors hover:text-foreground"
          >
            Dashboard
          </Link>
          <Link
            href="/about"
            className="transition-colors hover:text-foreground"
          >
            About
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user?.name && (
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user.name}
            </span>
          )}
          {user && (
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              aria-label="Logout"
              className="h-9 w-9 cursor-pointer text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </motion.header>
  );
}
