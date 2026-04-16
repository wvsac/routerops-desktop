import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card className="glass border-dashed">
      <CardContent className="flex min-h-44 flex-col items-center justify-center gap-3 text-center">
        <div className="rounded-lg border border-border/80 bg-muted/50 p-3 text-muted-foreground">{icon}</div>
        <h3 className="font-display text-lg">{title}</h3>
        <p className="max-w-lg text-sm text-muted-foreground">{description}</p>
        {action}
      </CardContent>
    </Card>
  );
}
