"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Menu,
  Pin,
  Target,
  X,
} from "lucide-react";
import type { NavigationGroup, NavigationItem } from "@/components/navigation/navigation-data";
import {
  isActiveRoute,
  navigationGroups,
  pinnedNavigationItems,
} from "@/components/navigation/navigation-data";
import { Button } from "@/components/ui";
import { cx } from "@/lib/design-system";
import { useState } from "react";

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0A0A0A]/95 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Brand />
          <Button
            aria-expanded={isOpen}
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setIsOpen((current) => !current)}
            size="sm"
            type="button"
            variant="outline"
          >
            {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
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
          <aside className="relative flex h-full w-[min(24rem,88vw)] flex-col border-r border-white/10 bg-[#0A0A0A] shadow-[30px_0_90px_rgba(0,0,0,0.42)]">
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
  const activeGroupIds = navigationGroups
    .filter((group) =>
      group.items.some((item) => isActiveRoute(pathname, item.href)),
    )
    .map((group) => group.id);
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>(() =>
    navigationGroups
      .filter((group) => !activeGroupIds.includes(group.id))
      .map((group) => group.id),
  );

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((current) =>
      current.includes(groupId)
        ? current.filter((id) => id !== groupId)
        : [...current, groupId],
    );
  };

  return (
    <div className="flex min-h-0 w-full flex-col">
      <div className="border-b border-white/10 px-5 py-5">
        <Brand />
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-5">
          <p className="mb-2 px-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            Pinned
          </p>
          <div className="grid gap-1">
            {pinnedNavigationItems.map((item) => (
              <SidebarLink
                key={item.href}
                active={isActiveRoute(pathname, item.href)}
                item={item}
                onNavigate={onNavigate}
                compact
              />
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          {navigationGroups.map((group) => (
            <NavigationGroupSection
              key={group.id}
              collapsed={collapsedGroups.includes(group.id)}
              group={group}
              pathname={pathname}
              onNavigate={onNavigate}
              onToggle={() => toggleGroup(group.id)}
            />
          ))}
        </div>
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-lg border border-green-300/20 bg-green-400/10 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-200">
            Phase 6: Product Polish
          </p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-sm font-black text-white">Navigation upgrade</span>
            <span className="h-2.5 w-2.5 rounded-full bg-green-300 shadow-[0_0_18px_rgba(74,222,128,0.85)]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function NavigationGroupSection({
  collapsed,
  group,
  onNavigate,
  onToggle,
  pathname,
}: {
  collapsed: boolean;
  group: NavigationGroup;
  onNavigate?: () => void;
  onToggle: () => void;
  pathname: string;
}) {
  const hasActiveItem = group.items.some((item) =>
    isActiveRoute(pathname, item.href),
  );

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.025] p-2">
      <button
        type="button"
        aria-expanded={!collapsed}
        onClick={onToggle}
        className="flex min-h-9 w-full items-center justify-between gap-3 rounded-md px-2 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
      >
        <span className="inline-flex items-center gap-2">
          <span
            className={cx(
              "size-2 rounded-full",
              hasActiveItem ? "bg-orange-300" : "bg-slate-600",
            )}
          />
          {group.label}
        </span>
        <ChevronDown
          className={cx(
            "size-4 transition",
            collapsed ? "-rotate-90" : "rotate-0",
          )}
        />
      </button>

      {!collapsed ? (
        <div className="mt-1 grid gap-1">
          {group.items.map((item) => (
            <SidebarLink
              key={item.href}
              active={isActiveRoute(pathname, item.href)}
              item={item}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function SidebarLink({
  active,
  compact = false,
  item,
  onNavigate,
}: {
  active: boolean;
  compact?: boolean;
  item: NavigationItem;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cx(
        "group relative flex min-h-11 items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-bold transition",
        active
          ? "border-orange-300/35 bg-orange-500/15 text-orange-100 shadow-[0_12px_40px_rgba(249,115,22,0.12)]"
          : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.055] hover:text-white",
      )}
    >
      {active ? (
        <span className="absolute left-0 top-2 h-[calc(100%-1rem)] w-1 rounded-r-full bg-orange-300" />
      ) : null}
      <span
        className={cx(
          "grid size-9 shrink-0 place-items-center rounded-md border transition",
          active
            ? "border-green-300/25 bg-green-400/10 text-green-100"
            : "border-white/10 bg-white/[0.04] text-slate-400 group-hover:text-orange-100",
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate">{item.label}</span>
        {!compact ? (
          <span className="mt-0.5 block truncate text-[11px] font-bold text-slate-500">
            {item.description}
          </span>
        ) : null}
      </span>
      {item.pinned ? <Pin className="size-3.5 text-green-200" /> : null}
    </Link>
  );
}

function Brand() {
  return (
    <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-lg border border-orange-300/35 bg-orange-500/15 text-orange-100 shadow-[0_0_30px_rgba(255,77,0,0.16)]">
        <Target className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-lg font-black tracking-tight text-white">
          ShotOptix
        </span>
        <span className="block truncate text-[11px] font-bold uppercase tracking-[0.2em] text-green-300">
          Navigation System
        </span>
      </span>
    </Link>
  );
}
