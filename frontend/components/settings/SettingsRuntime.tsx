"use client";

import { useEffect, useState } from "react";
import { animationSpeedScale } from "@/lib/settings-preferences";
import { useSettingsStore } from "@/store/useSettingsStore";

function resolveTheme(theme: "dark" | "light" | "system") {
  if (theme !== "system") {
    return theme;
  }

  if (typeof window === "undefined") {
    return "dark" as const;
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? ("light" as const)
    : ("dark" as const);
}

export function SettingsRuntime() {
  const settings = useSettingsStore((state) => state.settings);
  const [systemTheme, setSystemTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const sync = () => setSystemTheme(media.matches ? "light" : "dark");
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const resolvedTheme =
    settings.theme === "system" ? systemTheme : resolveTheme(settings.theme);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    root.classList.toggle("shotoptix-theme-light", resolvedTheme === "light");
    root.classList.toggle("shotoptix-theme-dark", resolvedTheme === "dark");
    root.classList.toggle("shotoptix-high-contrast", settings.highContrast);
    // Animation speed only scales motion; reduced-motion is an explicit accessibility toggle.
    root.classList.toggle(
      "shotoptix-reduced-motion",
      prefersReducedMotion || settings.reducedMotion,
    );
    root.style.setProperty(
      "--shotoptix-motion-speed",
      String(animationSpeedScale[settings.animationSpeed]),
    );

    body.dataset.courtSurface = settings.courtSurface;
    body.dataset.courtGrid = settings.courtGrid ? "on" : "off";
    body.dataset.courtHotZones = settings.courtHotZones ? "on" : "off";
    body.dataset.chartTheme = settings.chartTheme;
  }, [
    resolvedTheme,
    settings.animationSpeed,
    settings.chartTheme,
    settings.courtGrid,
    settings.courtHotZones,
    settings.courtSurface,
    settings.highContrast,
    settings.reducedMotion,
  ]);

  return null;
}
