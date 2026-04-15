"use client";

import { AuthGuard } from "@/components/auth-guard";
import { NavBar } from "@/components/nav-bar";
import { AuroraBackground } from "@/components/aurora-background";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AuroraBackground intensity="normal" />
      <NavBar />
      <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 pt-10 pb-16 sm:px-6 lg:px-8">
        {children}
      </main>
    </AuthGuard>
  );
}
