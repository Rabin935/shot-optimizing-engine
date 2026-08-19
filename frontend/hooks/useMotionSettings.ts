"use client";

import { useReducedMotion } from "framer-motion";
import { animationSpeedScale } from "@/lib/settings-preferences";
import { useSettingsStore } from "@/store/useSettingsStore";

/** Shared motion timing that respects Settings → Appearance. */
export function useMotionSettings() {
  const animationSpeed = useSettingsStore((state) => state.settings.animationSpeed);
  const reducedMotionSetting = useSettingsStore(
    (state) => state.settings.reducedMotion,
  );
  const osReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(osReducedMotion || reducedMotionSetting);
  const speedScale = animationSpeedScale[animationSpeed];

  const duration = (baseSeconds: number) =>
    reduceMotion ? 0 : baseSeconds * speedScale;

  return {
    animationSpeed,
    duration,
    reduceMotion,
    speedScale,
    transition: (baseSeconds = 0.2) => ({
      duration: duration(baseSeconds),
      ease: "easeOut" as const,
    }),
  };
}
