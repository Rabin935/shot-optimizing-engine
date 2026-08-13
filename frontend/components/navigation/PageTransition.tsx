"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useMotionSettings } from "@/hooks/useMotionSettings";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { reduceMotion, transition } = useMotionSettings();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
        transition={transition(0.18)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
