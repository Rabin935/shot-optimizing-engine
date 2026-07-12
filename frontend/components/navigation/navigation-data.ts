import {
  Activity,
  BarChart3,
  BrainCircuit,
  FileText,
  Flame,
  Gauge,
  Info,
  LayoutDashboard,
  LineChart,
  ScanSearch,
  Settings,
  SlidersHorizontal,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavigationItem = {
  description: string;
  href: string;
  icon: LucideIcon;
  id: string;
  label: string;
  pinned?: boolean;
  shortcut?: string;
};

export type NavigationGroup = {
  id: string;
  items: NavigationItem[];
  label: string;
};

export const navigationGroups: NavigationGroup[] = [
  {
    id: "workspace",
    label: "Workspace",
    items: [
      {
        description: "Application control center",
        href: "/dashboard",
        icon: LayoutDashboard,
        id: "dashboard",
        label: "Dashboard",
        pinned: true,
        shortcut: "D",
      },
      {
        description: "Court spacing and shot value lab",
        href: "/sandbox",
        icon: Target,
        id: "sandbox",
        label: "Court Sandbox",
        pinned: true,
        shortcut: "S",
      },
      {
        description: "Animated release and contest timeline",
        href: "/simulator",
        icon: Activity,
        id: "simulator",
        label: "2D Simulator",
        pinned: true,
      },
      {
        description: "EPPS alternatives and better looks",
        href: "/optimizer",
        icon: SlidersHorizontal,
        id: "optimizer",
        label: "Optimizer",
        pinned: true,
        shortcut: "O",
      },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    items: [
      {
        description: "Shot density and zone map",
        href: "/heatmap",
        icon: Flame,
        id: "heatmap",
        label: "Heatmap",
      },
      {
        description: "Shooting mechanics dashboard",
        href: "/analytics/mechanics",
        icon: TrendingUp,
        id: "mechanics",
        label: "Mechanics",
      },
      {
        description: "Defender pressure analytics",
        href: "/analytics/pressure",
        icon: Users,
        id: "pressure",
        label: "Pressure",
      },
      {
        description: "Shot zone performance splits",
        href: "/analytics/shot-zones",
        icon: LineChart,
        id: "shot-zones",
        label: "Shot Zones",
      },
    ],
  },
  {
    id: "engine",
    label: "Prediction Engine",
    items: [
      {
        description: "Prediction input and response view",
        href: "/prediction",
        icon: BrainCircuit,
        id: "prediction",
        label: "Prediction",
        shortcut: "P",
      },
      {
        description: "Model metadata and training notes",
        href: "/model-info",
        icon: Gauge,
        id: "model-info",
        label: "Model Info",
      },
      {
        description: "Model evaluation and quality checks",
        href: "/evaluation",
        icon: BarChart3,
        id: "evaluation",
        label: "Evaluation",
      },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    items: [
      {
        description: "Research dashboards and exports",
        href: "/reports",
        icon: FileText,
        id: "reports",
        label: "Reports",
        shortcut: "R",
      },
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
      {
        description: "Navigation help and app discovery",
        href: "/demo",
        icon: ScanSearch,
        id: "demo",
        label: "Demo",
      },
    ],
  },
];

export const navigationItems = navigationGroups.flatMap((group) => group.items);
export const pinnedNavigationItems = navigationItems.filter((item) => item.pinned);

export function isActiveRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
