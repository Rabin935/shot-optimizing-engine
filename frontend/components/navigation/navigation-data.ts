import {
  Activity,
  BarChart3,
  BrainCircuit,
  FileText,
  Flame,
  Gauge,
  Info,
  LayoutDashboard,
  Settings,
  SlidersHorizontal,
  Target,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavigationItem = {
  description: string;
  href: string;
  icon: LucideIcon;
  id: string;
  label: string;
  shortcut?: string;
};

export type NavigationGroup = {
  id: string;
  items: NavigationItem[];
  label: string;
};

export const dashboardItem: NavigationItem = {
  description: "Application control center",
  href: "/dashboard",
  icon: LayoutDashboard,
  id: "dashboard",
  label: "Dashboard",
  shortcut: "D",
};

export const navigationGroups: NavigationGroup[] = [
  {
    id: "shot-analysis",
    label: "Shot Analysis",
    items: [
      {
        description: "Court spacing and shot value lab",
        href: "/sandbox",
        icon: Target,
        id: "sandbox",
        label: "Court Sandbox",
        shortcut: "S",
      },
      {
        description: "Prediction input and response view",
        href: "/prediction",
        icon: BrainCircuit,
        id: "prediction",
        label: "Prediction",
        shortcut: "P",
      },
      {
        description: "EPPS alternatives and better looks",
        href: "/optimizer",
        icon: SlidersHorizontal,
        id: "optimizer",
        label: "Optimizer",
        shortcut: "O",
      },
      {
        description: "Animated release and contest timeline",
        href: "/simulator",
        icon: Activity,
        id: "simulator",
        label: "2D Simulator",
      },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    items: [
      {
        description: "Model evaluation and quality checks",
        href: "/evaluation",
        icon: BarChart3,
        id: "evaluation",
        label: "Evaluation",
      },
      {
        description: "Shot density and zone map",
        href: "/heatmap",
        icon: Flame,
        id: "heatmap",
        label: "Heatmap",
      },
      {
        description: "Research dashboards and exports",
        href: "/reports",
        icon: FileText,
        id: "reports",
        label: "Reports",
        shortcut: "R",
      },
    ],
  },
  {
    id: "machine-learning",
    label: "Machine Learning",
    items: [
      {
        description: "Model metadata and training notes",
        href: "/model-info",
        icon: Gauge,
        id: "model-info",
        label: "Model Info",
      },
    ],
  },
];

export const utilityNavigationItems: NavigationItem[] = [
  {
    description: "User preferences and persistence",
    href: "/settings",
    icon: Settings,
    id: "settings",
    label: "Settings",
  },
  {
    description: "Product overview and context",
    href: "/about",
    icon: Info,
    id: "about",
    label: "About",
  },
];

export const navigationItems = [
  dashboardItem,
  ...navigationGroups.flatMap((group) => group.items),
  ...utilityNavigationItems,
];

export const mobileNavigationItems = [
  dashboardItem,
  navigationGroups[0].items[0],
  navigationGroups[0].items[1],
  navigationGroups[1].items[1],
];

export function isActiveRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
