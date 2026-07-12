"use client";

import { useEffect, useMemo } from "react";
import { animationSpeedScale } from "@/lib/settings-preferences";
import { useSettingsStore } from "@/store/useSettingsStore";

export function SettingsRuntime() {
  const settings = useSettingsStore((state) => state.settings);
  const resolvedTheme = useMemo(() => {
    if (settings.theme !== "system") {
      return settings.theme;
    }

    if (typeof window === "undefined") {
      return "dark";
    }

    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  }, [settings.theme]);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    root.classList.toggle("shotoptix-theme-light", resolvedTheme === "light");
    root.classList.toggle("shotoptix-theme-dark", resolvedTheme === "dark");
    root.classList.toggle("shotoptix-high-contrast", settings.highContrast);
    root.classList.toggle(
      "shotoptix-reduced-motion",
      settings.reducedMotion || settings.animationSpeed === "reduced",
    );
    root.style.setProperty(
      "--shotoptix-motion-speed",
      String(animationSpeedScale[settings.animationSpeed]),
    );
    body.dataset.courtSurface = settings.courtSurface;
    body.dataset.chartTheme = settings.chartTheme;
  }, [
    resolvedTheme,
    settings.animationSpeed,
    settings.chartTheme,
    settings.courtSurface,
    settings.highContrast,
    settings.reducedMotion,
  ]);

  return null;
}
