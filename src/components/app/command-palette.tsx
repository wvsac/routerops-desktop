import { sectionMeta, type AppSection } from "@/app/sections";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";

export function AppCommandPalette({
  open,
  onOpenChange,
  onNavigate,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onNavigate: (section: AppSection) => void;
}) {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Command>
        <CommandInput placeholder="Jump to section..." />
        <CommandList>
          <CommandEmpty>No matching section.</CommandEmpty>
          <CommandGroup heading="Navigation">
            {Object.entries(sectionMeta).map(([key, value]) => {
              const Icon = value.icon;
              return (
                <CommandItem
                  key={key}
                  value={`${value.label} ${value.hint}`}
                  onSelect={() => {
                    onNavigate(key as AppSection);
                    onOpenChange(false);
                  }}
                >
                  <Icon className="size-4" />
                  {value.label}
                  <CommandShortcut>{value.hint}</CommandShortcut>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
