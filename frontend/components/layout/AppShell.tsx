import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { PageTransition } from "@/components/navigation/PageTransition";
import { ScreenReaderStatus } from "@/components/layout/ScreenReaderStatus";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[var(--app-shell-bg)] text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:border focus:border-orange-300/40 focus:bg-black focus:px-4 focus:py-3 focus:text-sm focus:font-black focus:text-orange-100"
      >
        Skip to main content
      </a>
      <div className="pointer-events-none fixed inset-0 bg-[image:var(--app-shell-wash)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:54px_54px]" />
      <ScreenReaderStatus />

      <Sidebar />

      <main
        id="main-content"
        tabIndex={-1}
        className="relative z-10 min-h-screen lg:pl-72"
      >
        <div className="mx-auto w-full max-w-[1520px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:py-8">
          <Breadcrumbs />
          <PageTransition>{children}</PageTransition>
        </div>
      </main>
    </div>
  );
}
