import { Monitor, MoonStar, Sun, TerminalSquare } from "lucide-react";
import { useTheme } from "next-themes";

import { sectionMeta, type AppSection } from "@/app/sections";
import { Button } from "@/components/ui/button";

const isMac = navigator.userAgent.includes("Mac");
const themeOrder = ["dark", "light", "system"] as const;
const themeIcon = { dark: Sun, light: MoonStar, system: Monitor } as const;

export function Topbar({
  section,
  onPalette,
}: {
  section: AppSection;
  onPalette: () => void;
}) {
  const { theme, setTheme } = useTheme();
  const current = sectionMeta[section];
  const Icon = current.icon;

  const nextTheme = () => {
    const idx = themeOrder.indexOf(theme as (typeof themeOrder)[number]);
    setTheme(themeOrder[(idx + 1) % themeOrder.length]);
  };
  const ThemeIcon = themeIcon[(theme as keyof typeof themeIcon) ?? "dark"];

  return (
    <header className="glass flex h-16 items-center justify-between rounded-2xl px-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="rounded-md border border-border/80 bg-muted/40 p-2">
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <h2 className="truncate font-display text-base">{current.label}</h2>
          <p className="truncate text-xs text-muted-foreground">{current.hint}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onPalette}>
          <TerminalSquare className="size-3.5" />
          <span className="hidden md:inline">Command palette</span>
          <span className="font-mono text-xs text-muted-foreground">{isMac ? "⌘K" : "Ctrl+K"}</span>
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={nextTheme}
          aria-label="Toggle theme"
        >
          <ThemeIcon className="size-3.5" />
        </Button>
      </div>
    </header>
  );
}
