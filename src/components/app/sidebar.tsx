import { CircleDot } from "lucide-react";

import { appBrand, navOrder, sectionMeta, type AppSection } from "@/app/sections";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export function Sidebar({
  current,
  onNavigate,
}: {
  current: AppSection;
  onNavigate: (section: AppSection) => void;
}) {
  const Logo = appBrand.logo;

  return (
    <aside className="glass hidden h-[calc(100vh-2rem)] w-72 flex-col rounded-2xl p-4 lg:flex">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-lg border border-border/80 bg-muted/40 p-2">
          <Logo className="size-4 text-muted-foreground" />
        </div>
        <div>
          <h1 className="font-display text-sm tracking-wide">{appBrand.name}</h1>
          <p className="text-xs text-muted-foreground">{appBrand.subtitle}</p>
        </div>
      </div>
      <Separator />
      <div className="mt-3 space-y-1.5">
        {navOrder.map((key) => {
          const item = sectionMeta[key];
          const Icon = item.icon;

          return (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg border border-transparent px-3 py-2.5 text-left transition-colors",
                current === key
                  ? "border-border/80 bg-muted/80 text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon className="size-4" />
                <span className="text-sm">{item.label}</span>
              </div>
              {current === key && <CircleDot className="size-3.5 text-primary/80" />}
            </button>
          );
        })}
      </div>
      <div className="mt-auto rounded-xl border border-border/80 bg-muted/30 p-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Workflow</p>
        <p className="mt-1 text-sm text-foreground">Flash routers, run aliases, inspect logs.</p>
      </div>
    </aside>
  );
}
