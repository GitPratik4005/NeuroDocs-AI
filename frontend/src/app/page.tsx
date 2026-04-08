"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      router.push(user ? "/dashboard" : "/login");
    }
  }, [isLoading, user, router]);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <p className="text-lg font-bold tracking-tight text-muted-foreground">NeuroDocAI</p>
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
