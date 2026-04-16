import {
  Activity,
  Boxes,
  Cable,
  Command,
  Home,
  Radio,
  Settings,
} from "lucide-react";

export type AppSection = "home" | "flash" | "aliases" | "platforms" | "jobs" | "settings";

export const sectionMeta: Record<
  AppSection,
  { label: string; icon: typeof Home; hint: string }
> = {
  home: { label: "Home", icon: Home, hint: "Quick actions for daily workflow" },
  flash: { label: "Flash Router", icon: Radio, hint: "Firmware deployment workflow" },
  aliases: { label: "Aliases", icon: Command, hint: "Reusable command macros" },
  platforms: { label: "Platforms", icon: Boxes, hint: "Router profile catalog" },
  jobs: { label: "Jobs / Logs", icon: Activity, hint: "Execution traces" },
  settings: { label: "Settings", icon: Settings, hint: "Desktop preferences and integrations" },
};

export const navOrder: AppSection[] = [
  "home",
  "flash",
  "aliases",
  "platforms",
  "jobs",
  "settings",
];

export const appBrand = {
  name: "RouterOps Control",
  subtitle: "Linux QA Utility",
  logo: Cable,
};
