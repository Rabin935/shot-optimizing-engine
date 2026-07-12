"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  Clock3,
  Menu,
  Pin,
  Search,
  Star,
  Target,
  X,
} from "lucide-react";
import type { NavigationGroup, NavigationItem } from "@/components/navigation/navigation-data";
import {
  isActiveRoute,
  navigationGroups,
  navigationItems,
  pinnedNavigationItems,
} from "@/components/navigation/navigation-data";
import { Button, Input } from "@/components/ui";
import { cx } from "@/lib/design-system";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

const FAVORITES_KEY = "shotoptix-navigation-favorites";
const RECENTS_KEY = "shotoptix-navigation-recents";
const DEFAULT_FAVORITES = ["dashboard", "sandbox"];
const NAV_SEARCH_ID = "shotoptix-navigation-search";

function readStoredStringArray(key: string, fallback: string[]) {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as string[]) : fallback;
  } catch {
    return fallback;
  }
}

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

function MobileQuickNav({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Primary mobile navigation"
      className="fixed inset-x-3 bottom-3 z-40 rounded-lg border border-white/10 bg-[#0A0A0A]/95 p-2 shadow-[0_18px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl lg:hidden"
    >
      <div className="grid grid-cols-4 gap-1">
        {pinnedNavigationItems.slice(0, 4).map((item) => {
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
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() =>
    readStoredStringArray(FAVORITES_KEY, DEFAULT_FAVORITES),
  );
  const [recentHrefs, setRecentHrefs] = useState<string[]>(() =>
    readStoredStringArray(RECENTS_KEY, []),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const favoriteItems = navigationItems.filter((item) =>
    favoriteIds.includes(item.id),
  );
  const recentItems = recentHrefs
    .map((href) => navigationItems.find((item) => item.href === href))
    .filter((item): item is NavigationItem => Boolean(item));
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return [];
    }

    return navigationItems.filter((item) =>
      `${item.label} ${item.description} ${item.href}`
        .toLowerCase()
        .includes(query),
    );
  }, [searchQuery]);

  useEffect(() => {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  useEffect(() => {
    window.localStorage.setItem(RECENTS_KEY, JSON.stringify(recentHrefs));
  }, [recentHrefs]);

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((current) =>
      current.includes(groupId)
        ? current.filter((id) => id !== groupId)
        : [...current, groupId],
    );
  };
  const toggleFavorite = (itemId: string) => {
    setFavoriteIds((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [itemId, ...current].slice(0, 8),
    );
  };
  const recordVisit = useCallback((item: NavigationItem) => {
    setRecentHrefs((current) =>
      [item.href, ...current.filter((href) => href !== item.href)].slice(0, 5),
    );
    onNavigate?.();
  }, [onNavigate]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "SELECT" ||
        target?.tagName === "TEXTAREA";

      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        document.getElementById(NAV_SEARCH_ID)?.focus();
        return;
      }

      if (event.key === "Escape") {
        setSearchQuery("");
        document.getElementById(NAV_SEARCH_ID)?.blur();
        return;
      }

      if (!event.altKey || isTyping) {
        return;
      }

      const item = navigationItems.find(
        (navItem) =>
          navItem.shortcut?.toLowerCase() === event.key.toLowerCase(),
      );

      if (item) {
        event.preventDefault();
        recordVisit(item);
        router.push(item.href);
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [router, recordVisit]);

  return (
    <div className="flex min-h-0 w-full flex-col">
      <div className="border-b border-white/10 px-5 py-5">
        <Brand />
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <label className="mb-4 grid gap-2 px-1">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
            <Search className="size-3.5" />
            Search Navigation
          </span>
          <Input
            id={NAV_SEARCH_ID}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search pages or press /"
            className="bg-[#111]"
          />
        </label>

        {searchQuery ? (
          <NavigationList
            emptyLabel="No matching pages"
            favoriteIds={favoriteIds}
            items={searchResults}
            label="Search Results"
            pathname={pathname}
            onFavoriteToggle={toggleFavorite}
            onVisit={recordVisit}
          />
        ) : null}

        <div className="mb-5" role="group" aria-label="Pinned navigation">
          <p className="mb-2 px-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            Pinned
          </p>
          <div className="grid gap-1">
            {pinnedNavigationItems.map((item) => (
              <SidebarLink
                key={item.href}
                active={isActiveRoute(pathname, item.href)}
                favorite={favoriteIds.includes(item.id)}
                item={item}
                onFavoriteToggle={toggleFavorite}
                onVisit={recordVisit}
                compact
              />
            ))}
          </div>
        </div>

        <NavigationList
          emptyLabel="Star pages to add favorites"
          favoriteIds={favoriteIds}
          icon={<Star className="size-3.5" />}
          items={favoriteItems}
          label="Favorites"
          pathname={pathname}
          onFavoriteToggle={toggleFavorite}
          onVisit={recordVisit}
        />

        <NavigationList
          emptyLabel="Visited pages will appear here"
          favoriteIds={favoriteIds}
          icon={<Clock3 className="size-3.5" />}
          items={recentItems}
          label="Recently Visited"
          pathname={pathname}
          onFavoriteToggle={toggleFavorite}
          onVisit={recordVisit}
        />

        <div className="grid gap-3" role="group" aria-label="Navigation groups">
          {navigationGroups.map((group) => (
            <NavigationGroupSection
              key={group.id}
              collapsed={collapsedGroups.includes(group.id)}
              group={group}
              pathname={pathname}
              favoriteIds={favoriteIds}
              onFavoriteToggle={toggleFavorite}
              onToggle={() => toggleGroup(group.id)}
              onVisit={recordVisit}
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
  favoriteIds,
  group,
  onFavoriteToggle,
  onToggle,
  onVisit,
  pathname,
}: {
  collapsed: boolean;
  favoriteIds: string[];
  group: NavigationGroup;
  onFavoriteToggle: (itemId: string) => void;
  onToggle: () => void;
  onVisit: (item: NavigationItem) => void;
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
              favorite={favoriteIds.includes(item.id)}
              item={item}
              onFavoriteToggle={onFavoriteToggle}
              onVisit={onVisit}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function NavigationList({
  emptyLabel,
  favoriteIds,
  icon,
  items,
  label,
  onFavoriteToggle,
  onVisit,
  pathname,
}: {
  emptyLabel: string;
  favoriteIds: string[];
  icon?: ReactNode;
  items: NavigationItem[];
  label: string;
  onFavoriteToggle: (itemId: string) => void;
  onVisit: (item: NavigationItem) => void;
  pathname: string;
}) {
  return (
    <section className="mb-5">
      <p className="mb-2 flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
        {icon}
        {label}
      </p>
      <div className="grid gap-1">
        {items.length ? (
          items.map((item) => (
            <SidebarLink
              key={`${label}-${item.href}`}
              active={isActiveRoute(pathname, item.href)}
              favorite={favoriteIds.includes(item.id)}
              item={item}
              onFavoriteToggle={onFavoriteToggle}
              onVisit={onVisit}
              compact
            />
          ))
        ) : (
          <p className="rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-bold text-slate-500">
            {emptyLabel}
          </p>
        )}
      </div>
    </section>
  );
}

function SidebarLink({
  active,
  compact = false,
  favorite,
  item,
  onFavoriteToggle,
  onVisit,
}: {
  active: boolean;
  compact?: boolean;
  favorite: boolean;
  item: NavigationItem;
  onFavoriteToggle: (itemId: string) => void;
  onVisit: (item: NavigationItem) => void;
}) {
  const Icon = item.icon;

  return (
    <div
      className={cx(
        "group relative flex min-h-11 items-center rounded-lg border text-sm font-bold transition",
        active
          ? "border-orange-300/35 bg-orange-500/15 text-orange-100 shadow-[0_12px_40px_rgba(249,115,22,0.12)]"
          : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.055] hover:text-white",
      )}
    >
      {active ? (
        <span className="absolute left-0 top-2 h-[calc(100%-1rem)] w-1 rounded-r-full bg-orange-300" />
      ) : null}
      <Link
        aria-current={active ? "page" : undefined}
        href={item.href}
        onClick={() => onVisit(item)}
        className="flex min-w-0 flex-1 items-center gap-3 py-2.5 pl-3"
      >
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
      </Link>
      {item.shortcut ? (
        <span className="mr-2 hidden rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-black text-slate-500 group-hover:text-slate-300 sm:inline-flex">
          Alt {item.shortcut}
        </span>
      ) : null}
      <button
        type="button"
        aria-label={favorite ? `Remove ${item.label} from favorites` : `Add ${item.label} to favorites`}
        onClick={() => onFavoriteToggle(item.id)}
        className={cx(
          "mr-2 grid size-8 shrink-0 place-items-center rounded-md border transition",
          favorite
            ? "border-yellow-300/30 bg-yellow-300/10 text-yellow-100"
            : "border-transparent text-slate-600 hover:border-white/10 hover:text-yellow-100",
        )}
      >
        <Star className={cx("size-4", favorite ? "fill-current" : "")} />
      </button>
      {item.pinned ? <Pin className="mr-3 size-3.5 text-green-200" /> : null}
    </div>
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

function shortMobileLabel(label: string) {
  return label
    .replace("Court ", "")
    .replace("2D ", "")
    .replace("Dashboard", "Home");
}
