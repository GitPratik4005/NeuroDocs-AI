"use client";

import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogOut } from "lucide-react";

export function NavBar() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          href="/dashboard"
          className="text-lg font-bold tracking-tight transition-colors hover:text-primary"
        >
          NeuroDocAI
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <span className="text-sm text-muted-foreground hidden sm:inline">
            {user?.name}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            aria-label="Logout"
            className="h-9 w-9 cursor-pointer text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
