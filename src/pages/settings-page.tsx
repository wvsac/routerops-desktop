import { Info, Link2, Wrench } from "lucide-react";
import { useTheme } from "next-themes";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { AppSettings } from "@/domain/models";

export function SettingsPage({
  settings,
  onUpdateSettings,
}: {
  settings: AppSettings;
  onUpdateSettings: (partial: Partial<AppSettings>) => void;
}) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className="glass">
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Integration endpoints and default values.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Field
            label="S3 base URL"
            value={settings.s3BaseUrl}
            icon={Link2}
            onChange={(value) => onUpdateSettings({ s3BaseUrl: value })}
          />
          <Field
            label="Default platform tag"
            value={settings.defaultPlatformTag}
            icon={Link2}
            onChange={(value) => onUpdateSettings({ defaultPlatformTag: value })}
          />
          <Field label="Flash worker backend" value="MockFlashService (replace with Tauri command bridge)" icon={Wrench} />
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Appearance and app info</CardTitle>
          <CardDescription>Desktop defaults tuned for dark-first Linux utility workflows.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border border-border/80 bg-muted/20 p-3">
            <p className="mb-2 text-xs text-muted-foreground">Theme mode</p>
            <div className="inline-flex rounded-lg border border-border/80 bg-background p-1">
              {(["dark", "light", "system"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setTheme(option)}
                  className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
                    theme === option ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-border/80 bg-muted/20 p-3">
            <p className="text-sm">RouterOps Control</p>
            <p className="text-xs text-muted-foreground">Version 0.1.0 · Tauri v2 · React + TypeScript</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="outline">Mock Mode</Badge>
              <Badge variant="outline">Portfolio Build</Badge>
            </div>
          </div>
          <div className="rounded-lg border border-dashed border-border/80 bg-muted/10 p-3">
            <div className="mb-1 flex items-center gap-2 text-sm">
              <Info className="size-4 text-muted-foreground" />
              Future integrations
            </div>
            <p className="text-xs text-muted-foreground">
              Python sidecar task queue, SSH credential vault, live stream parser, persistent telemetry storage.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  icon: Icon,
  onChange,
}: {
  label: string;
  value: string;
  icon: typeof Link2;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-muted-foreground">{label}</label>
      <div className="relative">
        <Icon className="pointer-events-none absolute top-2.5 left-2.5 size-3.5 text-muted-foreground" />
        <Input
          value={value}
          readOnly={!onChange}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          className="pl-8 font-mono text-xs"
        />
      </div>
    </div>
  );
}
