import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Download, FileUp, Pencil, Play, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { CopyButton } from "@/components/app/copy-button";
import { EmptyState } from "@/components/app/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { AliasCommand, RouterPlatform } from "@/domain/models";
import { formatRelative } from "@/lib/format";
import { parseImportedAliases } from "@/lib/alias-import";

const aliasSchema = z.object({
  name: z.string().min(2, "Name is required"),
  kind: z.enum(["alias", "function"]),
  command: z.string().min(1, "Command/body is required"),
  description: z.string().min(3, "Description is required"),
  tags: z.string(),
  platformTags: z.string().min(1, "At least one platform tag is required"),
  dangerous: z.boolean(),
  requiresConfirmation: z.boolean(),
  exportToRouter: z.boolean(),
  routerAliasName: z.string().min(2, "Router alias name is required"),
});

type AliasForm = z.infer<typeof aliasSchema>;

export function AliasesPage({
  aliases,
  platforms,
  busyAliasId,
  deployAliasesBusy,
  onCreateAlias,
  onImportAliases,
  onUpdateAlias,
  onRunAlias,
  onDeployAliases,
}: {
  aliases: AliasCommand[];
  platforms: RouterPlatform[];
  busyAliasId: string | null;
  deployAliasesBusy: boolean;
  onCreateAlias: (alias: Omit<AliasCommand, "id">) => void;
  onImportAliases: (aliases: Array<Omit<AliasCommand, "id">>) => void;
  onUpdateAlias: (aliasId: string, partial: Partial<AliasCommand>) => void;
  onRunAlias: (alias: AliasCommand) => Promise<void>;
  onDeployAliases: (platformTag: string, aliasIds: string[]) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<AliasCommand | null>(null);
  const [confirmAlias, setConfirmAlias] = useState<AliasCommand | null>(null);
  const [scopePlatformTag, setScopePlatformTag] = useState<string>(platforms[0]?.tag ?? "gl-ax1800");
  const [selectedAliasIds, setSelectedAliasIds] = useState<string[]>([]);
  const [importContent, setImportContent] = useState("");

  const filtered = useMemo(() => {
    return aliases.filter((alias) => {
      const searchMatch = `${alias.name} ${alias.description} ${alias.tags.join(" ")} ${alias.routerAliasName} ${alias.platformTags.join(" ")}`.toLowerCase().includes(query.toLowerCase());
      const platformMatch = alias.platformTags.includes(scopePlatformTag);
      return searchMatch && platformMatch;
    });
  }, [aliases, query, scopePlatformTag]);

  const form = useForm<AliasForm>({
    resolver: zodResolver(aliasSchema),
    defaultValues: {
      name: "",
      kind: "alias",
      command: "",
      description: "",
      tags: "",
      platformTags: scopePlatformTag,
      dangerous: false,
      requiresConfirmation: false,
      exportToRouter: true,
      routerAliasName: "",
    },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset({
      name: "",
      kind: "alias",
      command: "",
      description: "",
      tags: "",
      platformTags: scopePlatformTag,
      dangerous: false,
      requiresConfirmation: false,
      exportToRouter: true,
      routerAliasName: "",
    });
    setOpen(true);
  };

  const openEdit = (alias: AliasCommand) => {
    setEditing(alias);
    form.reset({
      name: alias.name,
      kind: alias.kind,
      command: alias.command,
      description: alias.description,
      tags: alias.tags.join(", "),
      platformTags: alias.platformTags.join(", "),
      dangerous: alias.dangerous,
      requiresConfirmation: alias.requiresConfirmation,
      exportToRouter: alias.exportToRouter,
      routerAliasName: alias.routerAliasName,
    });
    setOpen(true);
  };

  const submit = form.handleSubmit((values) => {
    const mapped: Omit<AliasCommand, "id"> = {
      ...values,
      tags: values.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      platformTags: values.platformTags.split(",").map((tag) => tag.trim()).filter(Boolean),
    };

    if (editing) onUpdateAlias(editing.id, mapped);
    else onCreateAlias(mapped);
    setOpen(false);
  });

  const toggleSelected = (aliasId: string) => {
    setSelectedAliasIds((prev) =>
      prev.includes(aliasId) ? prev.filter((id) => id !== aliasId) : [...prev, aliasId],
    );
  };

  const selectAllScoped = () => {
    setSelectedAliasIds(filtered.map((alias) => alias.id));
  };

  const clearSelection = () => {
    setSelectedAliasIds([]);
  };

  const runAlias = async (alias: AliasCommand) => {
    if (alias.dangerous || alias.requiresConfirmation) {
      setConfirmAlias(alias);
      return;
    }
    await onRunAlias(alias);
  };

  const doImport = () => {
    const imported = parseImportedAliases(importContent, scopePlatformTag);
    onImportAliases(imported);
    setImportContent("");
    setImportOpen(false);
  };

  return (
    <div className="space-y-4">
      <Card className="glass">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Command aliases</CardTitle>
              <CardDescription>Choose tag scope, pick aliases, then export to that router tag directly.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={scopePlatformTag} onValueChange={(value) => value && setScopePlatformTag(value)}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Tag scope" />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((platform) => (
                    <SelectItem key={platform.id} value={platform.tag}>
                      {platform.tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={selectAllScoped}>
                Select all scoped
              </Button>
              <Button variant="outline" onClick={clearSelection}>
                Clear selection
              </Button>
              <Button
                variant="outline"
                onClick={() => void onDeployAliases(scopePlatformTag, selectedAliasIds)}
                disabled={selectedAliasIds.length === 0 || deployAliasesBusy}
              >
                <Download className="size-4" />
                Export selected
              </Button>
              <Button variant="outline" onClick={() => setImportOpen(true)}>
                <FileUp className="size-4" />
                Import
              </Button>
              <Button onClick={openCreate}>
                <Plus className="size-4" />
                New alias
              </Button>
            </div>
          </div>
          <div className="relative mt-2 max-w-md">
            <Search className="pointer-events-none absolute top-2 left-2.5 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search aliases by name, command, tags..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Search className="size-5" />}
              title="No aliases in this tag scope"
              description="Create new aliases for this platform tag or import them from shell snippets."
            />
          ) : (
            filtered.map((alias) => (
              <div key={alias.id} className="rounded-lg border border-border/80 bg-muted/20 p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedAliasIds.includes(alias.id)}
                      onChange={() => toggleSelected(alias.id)}
                    />
                    <div>
                      <p className="text-sm">{alias.name}</p>
                      <p className="text-xs text-muted-foreground">{alias.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline">{alias.kind}</Badge>
                    {alias.dangerous && (
                      <Badge variant="destructive">
                        <AlertTriangle className="size-3" />
                        Dangerous
                      </Badge>
                    )}
                    {alias.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                    {alias.exportToRouter ? <Badge variant="outline">router:{alias.routerAliasName}</Badge> : null}
                  </div>
                </div>
                <div className="rounded-md border border-border/70 bg-background/50 p-2">
                  <p className="font-mono text-xs break-all whitespace-pre-wrap">{alias.command}</p>
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    Last run {alias.lastRunAt ? formatRelative(alias.lastRunAt) : "never"} · {alias.lastResult ?? "n/a"}
                  </p>
                  <div className="flex items-center gap-1">
                    <CopyButton text={alias.command} />
                    <Button variant="ghost" size="sm" onClick={() => openEdit(alias)}>
                      <Pencil className="size-3.5" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => void runAlias(alias)} disabled={busyAliasId === alias.id}>
                      <Play className="size-3.5" />
                      Run
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit alias" : "Create alias"}</DialogTitle>
            <DialogDescription>Supports both shell aliases and bash functions.</DialogDescription>
          </DialogHeader>
          <form className="space-y-3" onSubmit={submit}>
            <div className="grid gap-2 sm:grid-cols-2">
              <FormField label="Alias name" error={form.formState.errors.name?.message}>
                <Input {...form.register("name")} />
              </FormField>
              <FormField label="Kind">
                <Select
                  value={form.watch("kind")}
                  onValueChange={(value) => value && form.setValue("kind", value as "alias" | "function")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alias">alias</SelectItem>
                    <SelectItem value="function">function</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <FormField label="Command/body" error={form.formState.errors.command?.message}>
              <Textarea rows={4} {...form.register("command")} />
            </FormField>
            <FormField label="Description" error={form.formState.errors.description?.message}>
              <Input {...form.register("description")} />
            </FormField>
            <div className="grid gap-2 sm:grid-cols-2">
              <FormField label="Tags (comma-separated)">
                <Input placeholder="ssh, diagnostics, wifi" {...form.register("tags")} />
              </FormField>
              <FormField label="Platform tags (comma-separated)" error={form.formState.errors.platformTags?.message}>
                <Input placeholder="gl-ax1800, rdkb-pi-4" {...form.register("platformTags")} />
              </FormField>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex items-center gap-2 rounded-lg border border-border/80 bg-muted/30 p-2.5 text-sm">
                <input type="checkbox" {...form.register("dangerous")} />
                Mark as dangerous
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-border/80 bg-muted/30 p-2.5 text-sm">
                <input type="checkbox" {...form.register("requiresConfirmation")} />
                Require confirmation
              </label>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex items-center gap-2 rounded-lg border border-border/80 bg-muted/30 p-2.5 text-sm">
                <input type="checkbox" {...form.register("exportToRouter")} />
                Export in router profile
              </label>
              <FormField label="Router alias/function name" error={form.formState.errors.routerAliasName?.message}>
                <Input placeholder="meshcheck" {...form.register("routerAliasName")} />
              </FormField>
            </div>
            <DialogFooter showCloseButton>
              <Button type="submit">{editing ? "Save changes" : "Create alias"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import aliases/functions</DialogTitle>
            <DialogDescription>
              Paste shell snippets like alias declarations and function declarations. Imported entries are scoped to tag: {scopePlatformTag}.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={14}
            placeholder={`alias wclients='ubus call hostapd.wlan0 get_clients'\nmeshcheck() {\n  iw dev wlan0 station dump | grep -E 'Station|signal'\n}`}
            value={importContent}
            onChange={(event) => setImportContent(event.target.value)}
          />
          <DialogFooter showCloseButton>
            <Button type="button" onClick={doImport} disabled={!importContent.trim()}>
              Import snippets
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(confirmAlias)} onOpenChange={() => setConfirmAlias(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm command execution</DialogTitle>
            <DialogDescription>This alias/function is marked as dangerous and can alter router state.</DialogDescription>
          </DialogHeader>
          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-2.5">
            <p className="font-mono text-xs break-all text-amber-200 whitespace-pre-wrap">{confirmAlias?.command}</p>
          </div>
          <DialogFooter showCloseButton>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmAlias) void onRunAlias(confirmAlias);
                setConfirmAlias(null);
              }}
            >
              Run anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FormField({
  label,
  children,
  error,
}: {
  label: string;
  children: ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-muted-foreground">{label}</label>
      {children}
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
