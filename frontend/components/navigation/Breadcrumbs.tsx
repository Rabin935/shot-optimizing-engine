"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { navigationItems } from "@/components/navigation/navigation-data";

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const currentItem = navigationItems.find((item) => item.href === pathname);

  if (!segments.length) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-5">
      <ol className="flex flex-wrap items-center gap-2 text-sm font-bold text-muted-foreground">
        <li>
          <Link
            href="/dashboard"
            className="inline-flex min-h-8 items-center gap-2 rounded-lg border border-[color:var(--line)] bg-panel px-2.5 text-foreground transition hover:border-orange-300/35 hover:text-primary-strong"
          >
            <Home className="size-4" />
            Home
          </Link>
        </li>
        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join("/")}`;
          const isLast = index === segments.length - 1;
          const label =
            isLast && currentItem
              ? currentItem.label
              : formatBreadcrumbSegment(segment);

          return (
            <li key={href} className="inline-flex items-center gap-2">
              <ChevronRight className="size-4 text-subtle-foreground" />
              {isLast ? (
                <span className="rounded-lg border border-[color:var(--line)] bg-panel-muted px-2.5 py-1.5 text-foreground">
                  {label}
                </span>
              ) : (
                <Link
                  href={href}
                  className="rounded-lg px-2.5 py-1.5 text-muted-foreground transition hover:text-foreground"
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function formatBreadcrumbSegment(segment: string) {
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
