"use client";

import { AuthGuard } from "@/components/auth-guard";
import { NavBar } from "@/components/nav-bar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <NavBar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {children}
      </main>
    </AuthGuard>
  );
}
