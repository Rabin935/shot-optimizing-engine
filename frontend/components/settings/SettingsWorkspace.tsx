"use client";

import {
  Bell,
  CheckCircle2,
  Gauge,
  LineChart,
  MonitorCog,
  Palette,
  RotateCcw,
  Ruler,
  SlidersHorizontal,
} from "lucide-react";
import type { ReactNode } from "react";
import { Badge, Button, Card, CardHeader, Dropdown, FieldLabel, Heading, Text } from "@/components/ui";
import {
  SETTINGS_STORAGE_KEY,
  type AnimationSpeedPreference,
  type ChartThemePreference,
  type CourtSurfacePreference,
  type SimulatorPreference,
  type ThemePreference,
  type UnitPreference,
  simulatorRoutes,
} from "@/lib/settings-preferences";
import { useSettingsStore } from "@/store/useSettingsStore";

export function SettingsWorkspace() {
  const { hydrated, resetSettings, settings, updateSettings } = useSettingsStore();
  const savedLabel = hydrated ? "Saved locally" : "Loading preferences";

  const exportSettings = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "shotoptix-user-settings.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearLocalSettings = () => {
    window.localStorage.removeItem(SETTINGS_STORAGE_KEY);
    resetSettings();
  };

  return (
    <section className="grid gap-6">
      <header className="flex flex-col gap-3 border-b border-[color:var(--line)] pb-6">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-success">
          User Preferences
        </p>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Heading>Settings</Heading>
            <Text className="mt-2 max-w-3xl" muted>
              Tune ShotOptix for your court workflow, simulator defaults,
              analytics visuals, and notification behavior.
            </Text>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="success">
                <CheckCircle2 className="mr-1 size-3.5" />
                {savedLabel}
              </Badge>
              <Badge tone={settings.highContrast ? "warning" : "neutral"}>
                {settings.highContrast ? "High contrast" : "Standard contrast"}
              </Badge>
              <Badge tone={settings.reducedMotion ? "warning" : "neutral"}>
                {settings.reducedMotion ? "Reduced motion" : "Motion enabled"}
              </Badge>
            </div>
          </div>
          <Button type="button" variant="outline" onClick={resetSettings}>
            <RotateCcw className="size-4" />
            Reset
          </Button>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-5">
          <PreferenceCard
            icon={<Palette className="size-5" />}
            title="Appearance"
            eyebrow="Theme"
            description="Control color mode, contrast, and app motion pacing."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <SelectSetting
                label="Theme"
                value={settings.theme}
                onChange={(value) => updateSettings({ theme: value as ThemePreference })}
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="system">System</option>
              </SelectSetting>
              <SelectSetting
                label="Animation Speed"
                value={settings.animationSpeed}
                onChange={(value) =>
                  updateSettings({ animationSpeed: value as AnimationSpeedPreference })
                }
              >
                <option value="reduced">Reduced</option>
                <option value="normal">Normal</option>
                <option value="fast">Fast</option>
              </SelectSetting>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <ToggleSetting
                checked={settings.reducedMotion}
                label="Reduced motion"
                onChange={(checked) => updateSettings({ reducedMotion: checked })}
              />
              <ToggleSetting
                checked={settings.highContrast}
                label="High contrast mode"
                onChange={(checked) => updateSettings({ highContrast: checked })}
              />
            </div>
          </PreferenceCard>

          <PreferenceCard
            icon={<MonitorCog className="size-5" />}
            title="Court Preferences"
            eyebrow="Court"
            description="Set the preferred court rendering and spatial overlays."
          >
            <div className="grid gap-4 md:grid-cols-3">
              <SelectSetting
                label="Court Surface"
                value={settings.courtSurface}
                onChange={(value) =>
                  updateSettings({ courtSurface: value as CourtSurfacePreference })
                }
              >
                <option value="classic">Classic</option>
                <option value="pro">Pro Arena</option>
                <option value="training">Training Lab</option>
              </SelectSetting>
              <ToggleSetting
                checked={settings.courtGrid}
                label="Court grid"
                onChange={(checked) => updateSettings({ courtGrid: checked })}
              />
              <ToggleSetting
                checked={settings.courtHotZones}
                label="Hot zones"
                onChange={(checked) => updateSettings({ courtHotZones: checked })}
              />
            </div>
          </PreferenceCard>

          <PreferenceCard
            icon={<SlidersHorizontal className="size-5" />}
            title="Simulator Defaults"
            eyebrow="Simulator"
            description="Choose which interactive workspace should open first."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <SelectSetting
                label="Default Simulator"
                value={settings.defaultSimulator}
                onChange={(value) =>
                  updateSettings({ defaultSimulator: value as SimulatorPreference })
                }
              >
                <option value="sandbox">Court Sandbox</option>
                <option value="simulator">2D Simulator</option>
                <option value="optimizer">Optimizer</option>
              </SelectSetting>
              <SelectSetting
                label="Units"
                value={settings.units}
                onChange={(value) => updateSettings({ units: value as UnitPreference })}
              >
                <option value="imperial">Feet and inches</option>
                <option value="metric">Meters and centimeters</option>
              </SelectSetting>
            </div>
          </PreferenceCard>

          <PreferenceCard
            icon={<LineChart className="size-5" />}
            title="Chart Preferences"
            eyebrow="Analytics"
            description="Pick default chart styling for dashboards and exports."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <SelectSetting
                label="Chart Theme"
                value={settings.chartTheme}
                onChange={(value) =>
                  updateSettings({ chartTheme: value as ChartThemePreference })
                }
              >
                <option value="arena">Arena</option>
                <option value="contrast">High contrast</option>
                <option value="print">Print friendly</option>
              </SelectSetting>
              <ToggleSetting
                checked={settings.notifications}
                label="Notifications"
                onChange={(checked) => updateSettings({ notifications: checked })}
              />
            </div>
          </PreferenceCard>
        </div>

        <aside className="grid content-start gap-4">
          <Card>
            <CardHeader eyebrow="Profile" title="Active setup" />
            <div className="grid gap-2">
              {[
                ["Theme", settings.theme],
                ["Court", settings.courtSurface],
                ["Simulator", settings.defaultSimulator],
                ["Charts", settings.chartTheme],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/25 px-3 py-2"
                >
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    {label}
                  </span>
                  <span className="text-sm font-black capitalize text-white">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader
              eyebrow="Persistence"
              icon={<Bell className="size-5" />}
              title="Saved locally"
            >
              Preferences are kept in this browser and applied immediately.
            </CardHeader>
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge tone={hydrated ? "success" : "warning"}>
                {hydrated ? "Loaded" : "Loading"}
              </Badge>
              <Badge tone="neutral">localStorage</Badge>
            </div>
            <div className="grid gap-2">
              <SummaryRow icon={<Palette className="size-4" />} label="Theme" value={settings.theme} />
              <SummaryRow icon={<Gauge className="size-4" />} label="Motion" value={settings.animationSpeed} />
              <SummaryRow icon={<MonitorCog className="size-4" />} label="Court" value={settings.courtSurface} />
              <SummaryRow icon={<Ruler className="size-4" />} label="Units" value={settings.units} />
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              <Button type="button" variant="outline" onClick={exportSettings}>
                Export
              </Button>
              <Button type="button" variant="subtle" onClick={clearLocalSettings}>
                Clear Local
              </Button>
            </div>
          </Card>
          <Card>
            <CardHeader eyebrow="Default Route" title="Launch target" />
            <Badge tone="success">{simulatorRoutes[settings.defaultSimulator]}</Badge>
            <Text className="mt-3" muted>
              The dashboard can use this preference to send users directly to
              their favorite simulator workspace.
            </Text>
          </Card>
        </aside>
      </div>
    </section>
  );
}

function PreferenceCard({
  children,
  description,
  eyebrow,
  icon,
  title,
}: {
  children: ReactNode;
  description: string;
  eyebrow: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <Card>
      <CardHeader eyebrow={eyebrow} icon={icon} title={title}>
        {description}
      </CardHeader>
      {children}
    </Card>
  );
}

function SelectSetting({
  children,
  label,
  onChange,
  value,
}: {
  children: ReactNode;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <FieldLabel className="grid gap-2">
      {label}
      <Dropdown value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </Dropdown>
    </FieldLabel>
  );
}

function ToggleSetting({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/25 px-3 text-sm font-bold text-slate-200 transition hover:border-orange-300/35 hover:bg-orange-500/10">
      {label}
      <input
        aria-label={label}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-5 accent-orange-400"
      />
    </label>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/25 px-3">
      <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
        {icon}
        {label}
      </span>
      <span className="text-sm font-black capitalize text-white">{value}</span>
    </div>
  );
}
