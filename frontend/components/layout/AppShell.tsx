import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#070807] text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(135deg,rgba(249,115,22,0.1)_0%,transparent_34%,rgba(34,197,94,0.08)_72%,transparent_100%),linear-gradient(180deg,#101318_0%,#070807_45%,#050505_100%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:54px_54px]" />

      <Sidebar />

      <main className="relative z-10 min-h-screen lg:pl-72">
        <div className="mx-auto w-full max-w-[1520px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
