export type ThemePreference = "dark" | "light" | "system";
export type AnimationSpeedPreference = "reduced" | "normal" | "fast";
export type CourtSurfacePreference = "classic" | "pro" | "training";
export type SimulatorPreference = "sandbox" | "simulator" | "optimizer";
export type UnitPreference = "imperial" | "metric";
export type ChartThemePreference = "arena" | "contrast" | "print";

export type UserSettings = {
  animationSpeed: AnimationSpeedPreference;
  chartTheme: ChartThemePreference;
  courtGrid: boolean;
  courtHotZones: boolean;
  courtSurface: CourtSurfacePreference;
  defaultSimulator: SimulatorPreference;
  highContrast: boolean;
  notifications: boolean;
  reducedMotion: boolean;
  theme: ThemePreference;
  units: UnitPreference;
};

export const DEFAULT_USER_SETTINGS: UserSettings = {
  animationSpeed: "normal",
  chartTheme: "arena",
  courtGrid: true,
  courtHotZones: true,
  courtSurface: "classic",
  defaultSimulator: "sandbox",
  highContrast: false,
  notifications: true,
  reducedMotion: false,
  theme: "dark",
  units: "imperial",
};

export const animationSpeedScale: Record<AnimationSpeedPreference, number> = {
  fast: 0.75,
  normal: 1,
  reduced: 1.6,
};

export const simulatorRoutes: Record<SimulatorPreference, string> = {
  optimizer: "/optimizer",
  sandbox: "/sandbox",
  simulator: "/simulator",
};
