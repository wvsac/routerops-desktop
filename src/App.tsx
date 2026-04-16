import { ThemeProvider } from "next-themes";
import { useEffect, useMemo, useState } from "react";

import { type AppSection, navOrder, sectionMeta } from "@/app/sections";
import { AppCommandPalette } from "@/components/app/command-palette";
import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useRouterOpsState } from "@/features/use-routerops-state";
import { AliasesPage } from "@/pages/aliases-page";
import { FlashRouterPage } from "@/pages/flash-router-page";
import { HomePage } from "@/pages/home-page";
import { JobsPage } from "@/pages/jobs-page";
import { PlatformsPage } from "@/pages/platforms-page";
import { SettingsPage } from "@/pages/settings-page";

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <RouterOpsApp />
        <Toaster richColors />
      </TooltipProvider>
    </ThemeProvider>
  );
}

function RouterOpsApp() {
  const [section, setSection] = useState<AppSection>("home");
  const [paletteOpen, setPaletteOpen] = useState(false);

  const state = useRouterOpsState();
  const latestJob = state.jobs[0];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isK = event.key.toLowerCase() === "k";
      if ((event.metaKey || event.ctrlKey) && isK) {
        event.preventDefault();
        setPaletteOpen((current) => !current);
      }
      if (event.altKey && event.key === "1") setSection("home");
      if (event.altKey && event.key === "2") setSection("flash");
      if (event.altKey && event.key === "3") setSection("aliases");
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const content = useMemo(() => {
    switch (section) {
      case "home":
        return (
          <HomePage
            platforms={state.platforms}
            aliases={state.aliases}
            latestJob={latestJob}
            onNavigate={setSection}
          />
        );
      case "flash":
        return (
          <FlashRouterPage
            platforms={state.platforms}
            settings={state.settings}
            flashBusy={state.flashBusy}
            latestJob={latestJob}
            resolvePlan={state.resolvePlan}
            startFlash={state.startFlash}
          />
        );
      case "aliases":
        return (
          <AliasesPage
            aliases={state.aliases}
            platforms={state.platforms}
            busyAliasId={state.aliasBusyId}
            deployAliasesBusy={state.deployAliasesBusy}
            onCreateAlias={state.createAlias}
            onImportAliases={state.importAliases}
            onUpdateAlias={state.updateAlias}
            onRunAlias={state.runAlias}
            onDeployAliases={state.deployAliasesToRouter}
          />
        );
      case "platforms":
        return <PlatformsPage platforms={state.platforms} />;
      case "jobs":
        return <JobsPage jobs={state.jobs} logs={state.logs} />;
      case "settings":
        return <SettingsPage settings={state.settings} />;
      default:
        return null;
    }
  }, [latestJob, section, state]);

  return (
    <main className="min-h-screen overflow-x-hidden p-4">
      <div className="mx-auto grid max-w-[1440px] gap-4 lg:grid-cols-[17.5rem_1fr]">
        <Sidebar current={section} onNavigate={setSection} />

        <div className="min-w-0 space-y-4">
          <Topbar section={section} onPalette={() => setPaletteOpen(true)} />
          <div className="flex gap-1 overflow-x-auto overflow-y-hidden rounded-lg border border-border/60 bg-card/40 p-1 lg:hidden">
            {navOrder.map((key) => (
              <button
                key={key}
                onClick={() => setSection(key)}
                className={`rounded-md px-2.5 py-1.5 text-xs whitespace-nowrap ${
                  key === section ? "bg-muted text-foreground" : "text-muted-foreground"
                }`}
                type="button"
              >
                {sectionMeta[key].label}
              </button>
            ))}
          </div>
          {content}
        </div>
      </div>

      <AppCommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} onNavigate={setSection} />
    </main>
  );
}

export default App;
