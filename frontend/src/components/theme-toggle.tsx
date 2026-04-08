"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";

const themes = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-9 w-9" />;

  const current = themes.find((t) => t.value === theme) ?? themes[1];
  const nextIndex = (themes.findIndex((t) => t.value === theme) + 1) % themes.length;
  const next = themes[nextIndex];

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(next.value)}
      aria-label={`Switch to ${next.label} theme`}
      title={`Current: ${current.label}. Click for ${next.label}`}
      className="h-9 w-9 cursor-pointer"
    >
      <current.icon className="h-4 w-4" />
    </Button>
  );
}
