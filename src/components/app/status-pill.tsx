import type React from "react";
import { AlertTriangle, CheckCircle2, LoaderCircle, MinusCircle, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Status = "queued" | "running" | "success" | "failed" | "cancelled";

const styles: Record<Status, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  queued: { label: "Queued", className: "bg-muted text-muted-foreground", icon: MinusCircle },
  running: { label: "Running", className: "bg-blue-500/15 text-blue-300", icon: LoaderCircle },
  success: { label: "Success", className: "bg-emerald-500/15 text-emerald-300", icon: CheckCircle2 },
  failed: { label: "Failed", className: "bg-rose-500/15 text-rose-300", icon: XCircle },
  cancelled: { label: "Cancelled", className: "bg-amber-500/15 text-amber-300", icon: AlertTriangle },
};

export function StatusPill({ status }: { status: Status }) {
  const item = styles[status];
  const Icon = item.icon;

  return (
    <Badge variant="outline" className={cn("gap-1.5 border-none", item.className)}>
      <Icon className={cn("size-3.5", status === "running" && "animate-spin")} />
      {item.label}
    </Badge>
  );
}
