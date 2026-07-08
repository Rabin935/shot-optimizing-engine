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
      <ol className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500">
        <li>
          <Link
            href="/dashboard"
            className="inline-flex min-h-8 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 text-slate-300 transition hover:border-orange-300/35 hover:text-orange-100"
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
              <ChevronRight className="size-4 text-slate-700" />
              {isLast ? (
                <span aria-current="page" className="text-orange-100">
                  {label}
                </span>
              ) : (
                <Link
                  href={href}
                  className="rounded-md px-1.5 py-1 text-slate-400 transition hover:text-white"
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
