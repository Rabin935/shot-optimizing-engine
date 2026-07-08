"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  BrainCircuit,
  FileText,
  Flame,
  Gauge,
  Info,
  LayoutDashboard,
  Menu,
  SlidersHorizontal,
  Target,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";

type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

const navItems: NavItem[] = [
  { href: "/sandbox", icon: Target, label: "Court Sandbox" },
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/prediction", icon: BrainCircuit, label: "Prediction" },
  { href: "/model-info", icon: Gauge, label: "Model Info" },
  { href: "/evaluation", icon: BarChart3, label: "Evaluation" },
  { href: "/heatmap", icon: Flame, label: "Heatmap" },
  { href: "/optimizer", icon: SlidersHorizontal, label: "Optimizer" },
  { href: "/simulator", icon: Activity, label: "2D Simulator" },
  { href: "/reports", icon: FileText, label: "Reports" },
  { href: "/about", icon: Info, label: "About" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0A0A0A]/95 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Brand />
          <button
            type="button"
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isOpen}
            onClick={() => setIsOpen((current) => !current)}
            className="grid size-11 place-items-center rounded-lg border border-white/10 bg-white/[0.06] text-slate-100 transition hover:border-orange-300/40 hover:bg-orange-500/15"
          >
            {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </header>

      {isOpen ? (
        <div className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            className="absolute inset-0 cursor-default"
            onClick={() => setIsOpen(false)}
          />
          <aside className="relative flex h-full w-[min(22rem,86vw)] flex-col border-r border-white/10 bg-[#0A0A0A] shadow-[30px_0_90px_rgba(0,0,0,0.42)]">
            <SidebarContent
              pathname={pathname}
              onNavigate={() => setIsOpen(false)}
            />
          </aside>
        </div>
      ) : null}

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-white/10 bg-[#0A0A0A] lg:flex">
        <SidebarContent pathname={pathname} />
      </aside>
    </>
  );
}

function SidebarContent({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex min-h-0 w-full flex-col">
      <div className="border-b border-white/10 px-5 py-5">
        <Brand />
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <SidebarLink
              key={item.href}
              item={item}
              active={isActiveRoute(pathname, item.href)}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-lg border border-green-300/20 bg-green-400/10 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-200">
            Phase 5: Analytics
          </p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-sm font-black text-white">In Progress</span>
            <span className="h-2.5 w-2.5 rounded-full bg-green-300 shadow-[0_0_18px_rgba(74,222,128,0.85)]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`group flex min-h-11 items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-bold transition ${
        active
          ? "border-orange-300/35 bg-orange-500/15 text-orange-100 shadow-[0_12px_40px_rgba(249,115,22,0.12)]"
          : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.055] hover:text-white"
      }`}
    >
      <span
        className={`grid size-9 shrink-0 place-items-center rounded-md border transition ${
          active
            ? "border-green-300/25 bg-green-400/10 text-green-100"
            : "border-white/10 bg-white/[0.04] text-slate-400 group-hover:text-orange-100"
        }`}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 truncate">{item.label}</span>
    </Link>
  );
}

function Brand() {
  return (
    <Link href="/sandbox" className="flex min-w-0 items-center gap-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-lg border border-orange-300/35 bg-orange-500/15 text-orange-100 shadow-[0_0_30px_rgba(255,77,0,0.16)]">
        <Target className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-lg font-black tracking-tight text-white">
          ShotOptix
        </span>
        <span className="block truncate text-[11px] font-bold uppercase tracking-[0.2em] text-green-300">
          Shot Optimization Engine
        </span>
      </span>
    </Link>
  );
}

function isActiveRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
