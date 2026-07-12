"use client";

import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";

export const TOAST_EVENT = "shotoptix:toast";

export function showToast(message: string) {
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: message }));
}

export function ToastViewport() {
  const notifications = useSettingsStore((state) => state.settings.notifications);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleToast = (event: Event) => {
      if (!notifications) {
        return;
      }

      setMessage((event as CustomEvent<string>).detail);
      window.setTimeout(() => setMessage(null), 2400);
    };

    window.addEventListener(TOAST_EVENT, handleToast);
    return () => window.removeEventListener(TOAST_EVENT, handleToast);
  }, [notifications]);

  if (!message) {
    return null;
  }

  return (
    <div
      className="fixed inset-x-3 bottom-20 z-[80] flex items-center gap-3 rounded-lg border border-green-300/25 bg-[#07110b]/95 px-4 py-3 text-sm font-bold text-green-100 shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur sm:bottom-5 sm:left-auto sm:right-5 sm:max-w-sm"
      role="status"
      aria-live="polite"
    >
      <CheckCircle2 className="size-5 shrink-0" />
      {message}
    </div>
  );
}
