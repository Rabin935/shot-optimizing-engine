"use client";

import { usePathname } from "next/navigation";

export function ScreenReaderStatus() {
  const pathname = usePathname();

  return (
    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      Loaded ShotOptix route {pathname}
    </div>
  );
}
