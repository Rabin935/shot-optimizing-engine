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
      <header className="sticky top-0 z-40 border-b border-[color:var(--line)] bg-[color:var(--sidebar-bg)]/95 px-4 py-3 backdrop-blur-xl lg:hidden">
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
        <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            className="absolute inset-0 cursor-default"
            onClick={() => setIsOpen(false)}
          />
          <aside className="relative flex h-full w-[min(15rem,82vw)] flex-col border-r border-[color:var(--line)] bg-[color:var(--sidebar-bg)] shadow-[30px_0_90px_rgba(0,0,0,0.18)]">
            <SidebarContent
              pathname={pathname}
              onNavigate={() => setIsOpen(false)}
            />
          </aside>
        </div>
      ) : null}

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 border-r border-[color:var(--line)] bg-[color:var(--sidebar-bg)] lg:flex">
        <SidebarContent pathname={pathname} />
      </aside>
    </>
  );
}

function MobileQuickNav({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Primary mobile navigation"
      className="fixed inset-x-3 bottom-3 z-40 rounded-lg border border-[color:var(--line)] bg-[color:var(--sidebar-bg)]/95 p-2 shadow-[0_18px_70px_rgba(0,0,0,0.2)] backdrop-blur-xl lg:hidden"
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
                  ? "border-orange-300/35 bg-[color:var(--sidebar-active)] text-primary-strong"
                  : "border-transparent text-[color:var(--sidebar-muted)] hover:bg-[color:var(--sidebar-hover)] hover:text-[color:var(--sidebar-fg)]",
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
    <div className="flex min-h-0 w-full flex-col text-[color:var(--sidebar-fg)]">
      <div className="shrink-0 border-b border-[color:var(--line)] px-3 py-2.5">
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
  return <div className="my-2.5 border-t border-[color:var(--line)]" role="separator" />;
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
    <section className="border-t border-[color:var(--line)] pt-2 first:border-t-0 first:pt-0">
      <div className="flex min-h-7 w-full items-center gap-2 px-1.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--sidebar-muted)]">
        <span className="inline-flex items-center gap-1.5">
          <span
            className={cx(
              "size-1.5 rounded-full transition",
              hasActiveItem
                ? "bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.6)]"
                : "bg-[color:var(--subtle-foreground)]",
            )}
          />
          {group.label}
        </span>
      </div>

      <div className="mt-0.5 grid gap-0.5 border-l border-[color:var(--line)] pl-2 ml-2">
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
          ? "border-orange-300/30 bg-[color:var(--sidebar-active)] text-primary-strong"
          : "border-transparent text-[color:var(--sidebar-muted)] hover:border-[color:var(--line)] hover:bg-[color:var(--sidebar-hover)] hover:text-[color:var(--sidebar-fg)]",
      )}
    >
      {active ? (
        <span className="absolute left-0 top-1.5 h-[calc(100%-0.75rem)] w-0.5 rounded-r-full bg-orange-400" />
      ) : null}
      <span
        className={cx(
          "grid shrink-0 place-items-center rounded border transition duration-150 group-hover:scale-105",
          nested ? "size-5" : "size-6",
          active
            ? "border-green-400/30 bg-success-soft text-success"
            : "border-[color:var(--line)] bg-[color:var(--sidebar-hover)] text-[color:var(--sidebar-muted)] group-hover:border-orange-300/30 group-hover:text-primary-strong",
        )}
      >
        <Icon className={nested ? "size-2.5" : "size-3"} />
      </span>
      <span className="min-w-0 flex-1 truncate leading-tight">{item.label}</span>
      {item.shortcut ? (
        <span className="hidden rounded border border-[color:var(--line)] bg-[color:var(--sidebar-hover)] px-1 py-px text-[9px] font-semibold text-[color:var(--sidebar-muted)] lg:inline-flex">
          Alt+{item.shortcut}
        </span>
      ) : null}
    </Link>
  );
}

function Brand() {
  return (
    <Link href="/dashboard" className="group flex min-w-0 items-center gap-2">
      <span className="grid size-8 shrink-0 place-items-center rounded-md border border-orange-300/30 bg-orange-500/12 text-primary-strong transition group-hover:scale-105 group-hover:border-orange-300/45">
        <Target className="size-3.5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold tracking-tight text-[color:var(--sidebar-fg)]">
          ShotOptix
        </span>
        <span className="block truncate text-[9px] font-medium uppercase tracking-[0.14em] text-success">
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
