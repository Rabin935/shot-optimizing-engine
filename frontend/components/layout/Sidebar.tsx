"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Target, X } from "lucide-react";
import type { NavigationGroup, NavigationItem } from "@/components/navigation/navigation-data";
import {
  dashboardItem,
  isActiveRoute,
  mobileNavigationItems,
  navigationGroups,
  navigationItems,
  utilityNavigationItems,
} from "@/components/navigation/navigation-data";
import { Button } from "@/components/ui";
import { cx } from "@/lib/design-system";
import { useCallback, useEffect, useState } from "react";

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

      <MobileQuickNav pathname={pathname} />

      {isOpen ? (
        <div className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            className="absolute inset-0 cursor-default"
            onClick={() => setIsOpen(false)}
          />
          <aside className="relative flex h-full w-[min(15rem,82vw)] flex-col border-r border-white/10 bg-[#0A0A0A] shadow-[30px_0_90px_rgba(0,0,0,0.42)]">
            <SidebarContent
              pathname={pathname}
              onNavigate={() => setIsOpen(false)}
            />
          </aside>
        </div>
      ) : null}

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 border-r border-white/10 bg-[#0A0A0A] lg:flex">
        <SidebarContent pathname={pathname} />
      </aside>
    </>
  );
}

function MobileQuickNav({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Primary mobile navigation"
      className="fixed inset-x-3 bottom-3 z-40 rounded-lg border border-white/10 bg-[#0A0A0A]/95 p-2 shadow-[0_18px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl lg:hidden"
    >
      <div className="grid grid-cols-4 gap-1">
        {mobileNavigationItems.map((item) => {
          const Icon = item.icon;
          const active = isActiveRoute(pathname, item.href);

          return (
            <Link
              key={`mobile-${item.href}`}
              href={item.href}
              className={cx(
                "grid min-h-14 place-items-center gap-1 rounded-md border px-1 py-2 text-center text-[10px] font-black transition",
                active
                  ? "border-orange-300/35 bg-orange-500/15 text-orange-100"
                  : "border-transparent text-slate-500 hover:bg-white/[0.055] hover:text-white",
              )}
            >
              <Icon className="size-4" />
              <span className="max-w-full truncate">{shortMobileLabel(item.label)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function SidebarContent({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const router = useRouter();

  const recordVisit = useCallback(
    () => {
      onNavigate?.();
    },
    [onNavigate],
  );

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "SELECT" ||
        target?.tagName === "TEXTAREA";

      if (!event.altKey || isTyping) {
        return;
      }

      const item = navigationItems.find(
        (navItem) =>
          navItem.shortcut?.toLowerCase() === event.key.toLowerCase(),
      );

      if (item) {
        event.preventDefault();
        recordVisit();
        router.push(item.href);
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [router, recordVisit]);

  return (
    <div className="flex min-h-0 w-full flex-col">
      <div className="shrink-0 border-b border-white/10 px-3 py-2.5">
        <Brand />
      </div>

      <nav className="flex flex-1 flex-col px-2 py-3">
        <SidebarLink
          active={isActiveRoute(pathname, dashboardItem.href)}
          item={dashboardItem}
          onVisit={recordVisit}
        />

        <NavDivider />

        <div className="grid gap-2" role="group" aria-label="Navigation groups">
          {navigationGroups.map((group) => (
            <NavigationGroupSection
              key={group.id}
              group={group}
              pathname={pathname}
              onVisit={recordVisit}
            />
          ))}
        </div>

        <NavDivider />

        <div className="grid gap-0.5">
          {utilityNavigationItems.map((item) => (
            <SidebarLink
              key={item.href}
              active={isActiveRoute(pathname, item.href)}
              item={item}
              onVisit={recordVisit}
            />
          ))}
        </div>
      </nav>
    </div>
  );
}

function NavDivider() {
  return <div className="my-2.5 border-t border-white/[0.08]" role="separator" />;
}

function NavigationGroupSection({
  group,
  onVisit,
  pathname,
}: {
  group: NavigationGroup;
  onVisit: (item: NavigationItem) => void;
  pathname: string;
}) {
  const hasActiveItem = group.items.some((item) =>
    isActiveRoute(pathname, item.href),
  );

  return (
    <section className="border-t border-white/[0.08] pt-2 first:border-t-0 first:pt-0">
      <div className="flex min-h-7 w-full items-center gap-2 px-1.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <span
            className={cx(
              "size-1.5 rounded-full transition",
              hasActiveItem
                ? "bg-orange-300 shadow-[0_0_8px_rgba(251,146,60,0.6)]"
                : "bg-slate-600",
            )}
          />
          {group.label}
        </span>
      </div>

      <div className="mt-0.5 grid gap-0.5 border-l border-white/[0.06] pl-2 ml-2">
        {group.items.map((item) => (
          <SidebarLink
            key={item.href}
            active={isActiveRoute(pathname, item.href)}
            item={item}
            nested
            onVisit={onVisit}
          />
        ))}
      </div>
    </section>
  );
}

function SidebarLink({
  active,
  item,
  nested = false,
  onVisit,
}: {
  active: boolean;
  item: NavigationItem;
  nested?: boolean;
  onVisit: (item: NavigationItem) => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      aria-current={active ? "page" : undefined}
      href={item.href}
      onClick={() => onVisit(item)}
      className={cx(
        "group relative flex min-h-8 items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-medium transition duration-150",
        nested && "min-h-7 py-1",
        active
          ? "border-orange-300/30 bg-orange-500/12 text-orange-100"
          : "border-transparent text-slate-400 hover:border-white/[0.08] hover:bg-white/[0.04] hover:text-white",
      )}
    >
      {active ? (
        <span className="absolute left-0 top-1.5 h-[calc(100%-0.75rem)] w-0.5 rounded-r-full bg-orange-300" />
      ) : null}
      <span
        className={cx(
          "grid shrink-0 place-items-center rounded border transition duration-150 group-hover:scale-105",
          nested ? "size-5" : "size-6",
          active
            ? "border-green-300/25 bg-green-400/10 text-green-100"
            : "border-white/[0.08] bg-white/[0.03] text-slate-500 group-hover:border-orange-300/20 group-hover:text-orange-100",
        )}
      >
        <Icon className={nested ? "size-2.5" : "size-3"} />
      </span>
      <span className="min-w-0 flex-1 truncate leading-tight">{item.label}</span>
      {item.shortcut ? (
        <span className="hidden rounded border border-white/[0.08] bg-white/[0.03] px-1 py-px text-[9px] font-semibold text-slate-500 group-hover:text-slate-400 lg:inline-flex">
          Alt+{item.shortcut}
        </span>
      ) : null}
    </Link>
  );
}

function Brand() {
  return (
    <Link href="/dashboard" className="group flex min-w-0 items-center gap-2">
      <span className="grid size-8 shrink-0 place-items-center rounded-md border border-orange-300/30 bg-orange-500/12 text-orange-100 transition group-hover:scale-105 group-hover:border-orange-300/45">
        <Target className="size-3.5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold tracking-tight text-white">
          ShotOptix
        </span>
        <span className="block truncate text-[9px] font-medium uppercase tracking-[0.14em] text-green-300/80">
          Shot Optimization
        </span>
      </span>
    </Link>
  );
}

function shortMobileLabel(label: string) {
  return label
    .replace("Court ", "")
    .replace("2D ", "")
    .replace("Dashboard", "Home");
}
