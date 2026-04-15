"use client";

import { cn } from "@/lib/utils";

type AuroraBackgroundProps = {
  className?: string;
  intensity?: "subtle" | "normal" | "strong";
};

export function AuroraBackground({
  className,
  intensity = "normal",
}: AuroraBackgroundProps) {
  const opacityClass =
    intensity === "subtle"
      ? "opacity-60"
      : intensity === "strong"
        ? "opacity-100"
        : "opacity-85";

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden",
        className,
      )}
    >
      <div className={cn("absolute inset-0 aurora-bg", opacityClass)} />
      {/* themed veil — light: soft white haze, dark: deep slate */}
      <div className="absolute inset-0 aurora-veil" />
      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.9'/></svg>\")",
        }}
      />
    </div>
  );
}
