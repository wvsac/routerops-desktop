import { Command, FileClock, Radio, Router, Settings } from "lucide-react";

import { StatusPill } from "@/components/app/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AliasCommand, FlashJob, RouterPlatform } from "@/domain/models";
import { formatRelative } from "@/lib/format";
import type { AppSection } from "@/app/sections";

export function HomePage({
  platforms,
  aliases,
  latestJob,
  onNavigate,
}: {
  platforms: RouterPlatform[];
  aliases: AliasCommand[];
  latestJob?: FlashJob;
  onNavigate: (section: AppSection) => void;
}) {
  return (
    <div className="space-y-4">
      <Card className="glass">
        <CardHeader>
          <CardTitle>Start quickly</CardTitle>
          <CardDescription>No dashboard noise. Pick an action and continue your workflow.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <ActionTile
            icon={Radio}
            title="Flash Router"
            description="Hash + platform + image source, then run."
            onClick={() => onNavigate("flash")}
            primary
          />
          <ActionTile
            icon={Command}
            title="Aliases"
            description="Run commands or export aliases to router profile."
            onClick={() => onNavigate("aliases")}
          />
          <ActionTile
            icon={FileClock}
            title="Jobs / Logs"
            description="Inspect current and previous runs."
            onClick={() => onNavigate("jobs")}
          />
          <ActionTile
            icon={Router}
            title="Platforms"
            description="Check per-platform tags and artifact names."
            onClick={() => onNavigate("platforms")}
          />
          <ActionTile
            icon={Settings}
            title="Settings"
            description="Theme and integration-level preferences."
            onClick={() => onNavigate("settings")}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Current context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
              <span className="text-muted-foreground">Default platform</span>
              <span className="font-mono">{platforms[0]?.tag ?? "n/a"}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
              <span className="text-muted-foreground">Available aliases</span>
              <span className="font-mono">{aliases.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
              <span className="text-muted-foreground">Latest job</span>
              {latestJob ? <StatusPill status={latestJob.status} /> : <span className="text-muted-foreground">none</span>}
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Last flash</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {latestJob ? (
              <>
                <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                  <p className="font-mono text-xs text-muted-foreground">{latestJob.id}</p>
                  <p className="mt-1 text-sm">Hash: {latestJob.firmwareHash}</p>
                  <p className="text-xs text-muted-foreground">{formatRelative(latestJob.createdAt)}</p>
                </div>
                <Button className="w-full" onClick={() => onNavigate("jobs")}>
                  Open logs
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No flash jobs yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ActionTile({
  icon: Icon,
  title,
  description,
  onClick,
  primary,
}: {
  icon: typeof Radio;
  title: string;
  description: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition-colors ${
        primary
          ? "border-primary/30 bg-primary/10 hover:bg-primary/15"
          : "border-border/80 bg-muted/20 hover:bg-muted/45"
      }`}
    >
      <div className="mb-3 inline-flex rounded-md border border-border/80 bg-background/70 p-2">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </button>
  );
}
