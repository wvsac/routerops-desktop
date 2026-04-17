import { Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { CopyButton } from "@/components/app/copy-button";
import { EmptyState } from "@/components/app/empty-state";
import { StatusPill } from "@/components/app/status-pill";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FlashJob, JobLogEntry } from "@/domain/models";
import { formatRelative, formatTimestamp } from "@/lib/format";
import { cn } from "@/lib/utils";

const filters: Array<FlashJob["status"] | "all"> = ["all", "running", "success", "failed", "queued", "cancelled"];

export function JobsPage({
  jobs,
  logs,
  onClearCompleted,
}: {
  jobs: FlashJob[];
  logs: JobLogEntry[];
  onClearCompleted: () => void;
}) {
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const [selectedJobId, setSelectedJobId] = useState(jobs[0]?.id ?? "");

  const filteredJobs = useMemo(
    () => jobs.filter((job) => (filter === "all" ? true : job.status === filter)),
    [filter, jobs],
  );

  const selected = filteredJobs.find((job) => job.id === selectedJobId) ?? filteredJobs[0];
  const selectedLogs = logs
    .filter((log) => selected && log.jobId === selected.id)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return (
    <div className="grid gap-4 2xl:grid-cols-[0.9fr_1.1fr]">
      <Card className="glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Job list</CardTitle>
              <CardDescription>Filter by status and inspect run metadata.</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearCompleted}
              disabled={!jobs.some((job) => job.status !== "running" && job.status !== "queued")}
            >
              <Trash2 className="size-3.5" />
              Clear completed
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {filters.map((entry) => (
              <Button
                key={entry}
                variant={filter === entry ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(entry)}
              >
                {entry}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {filteredJobs.map((job) => (
            <button
              key={job.id}
              className={cn(
                "w-full rounded-lg border px-3 py-2 text-left transition-colors",
                selected?.id === job.id
                  ? "border-border bg-muted/70"
                  : "border-border/70 bg-muted/20 hover:bg-muted/50",
              )}
              onClick={() => setSelectedJobId(job.id)}
              type="button"
            >
              <div className="mb-1 flex items-center justify-between">
                <p className="font-mono text-xs">{job.id}</p>
                <StatusPill status={job.status} />
              </div>
              <p className="text-sm">{job.firmwareHash}</p>
              <p className="text-xs text-muted-foreground">{formatRelative(job.createdAt)}</p>
            </button>
          ))}
        </CardContent>
      </Card>

      {selected ? (
        <Card className="glass">
          <CardHeader>
            <CardTitle>Job details · {selected.id}</CardTitle>
            <CardDescription>Step timeline and command output placeholders.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-2">
              {selected.plan.steps.map((step) => (
                <div key={step.id} className="rounded-lg border border-border/80 bg-muted/20 p-2.5">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-sm">{step.title}</p>
                    <Badge variant="outline">{step.state}</Badge>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground break-all">{step.commandPreview}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm">Command output</p>
                <CopyButton
                  text={selectedLogs.map((log) => `[${log.timestamp}] ${log.level.toUpperCase()} ${log.message}`).join("\n")}
                  label="Copy logs"
                />
              </div>
              <ScrollArea className="h-[360px] rounded-lg border border-border/80 bg-black/30 p-3">
                {selectedLogs.length === 0 ? (
                  <EmptyState
                    icon={<Badge variant="outline">0</Badge>}
                    title="No logs for selected job"
                    description="Log stream placeholder exists and will bind to backend event output."
                  />
                ) : (
                  <div className="space-y-2 font-mono text-xs">
                    {selectedLogs.map((log) => (
                      <div key={log.id} className="rounded-md border border-border/60 bg-background/70 p-2">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="text-muted-foreground">{formatTimestamp(log.timestamp)}</span>
                          <Badge variant="outline">{log.level}</Badge>
                        </div>
                        <p>{log.message}</p>
                        {log.command ? <p className="mt-1 text-muted-foreground break-all">$ {log.command}</p> : null}
                        {log.output ? <p className="mt-1 text-muted-foreground break-all">{log.output}</p> : null}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={<Badge variant="outline">0</Badge>}
          title="No jobs available"
          description="Run a flash workflow to populate this view."
        />
      )}
    </div>
  );
}
