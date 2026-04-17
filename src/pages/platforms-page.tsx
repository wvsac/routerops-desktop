import { AlertCircle, Download, LoaderCircle, ShieldCheck, TestTube2 } from "lucide-react";

import { CopyButton } from "@/components/app/copy-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { LogExportResult, RouterPlatform } from "@/domain/models";
import { formatTimestamp } from "@/lib/format";

export function PlatformsPage({
  platforms,
  logExportBusyId,
  lastLogExport,
  onExportLogs,
  onDismissLogExport,
}: {
  platforms: RouterPlatform[];
  logExportBusyId: string | null;
  lastLogExport: LogExportResult | null;
  onExportLogs: (platformId: string) => Promise<void>;
  onDismissLogExport: () => void;
}) {
  return (
    <div className="space-y-4">
      <Card className="glass">
        <CardHeader>
          <CardTitle>Platform catalog</CardTitle>
          <CardDescription>Transfer/update strategy map for supported router profiles.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-3">
          {platforms.map((platform) => (
            <div key={platform.id} className="rounded-lg border border-border/80 bg-muted/20 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm">{platform.name}</p>
                <MaturityBadge maturity={platform.maturity} />
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <Line label="Tag" value={platform.tag} mono />
                <Line label="IP" value={platform.defaultIp} />
                <Line label="Transfer" value={platform.transferMethod} />
                <Line label="Update" value={platform.updateMethod} />
                <Line label="Log path" value={platform.logPath} mono />
                <Line label="Artifact" value={platform.artifactFileName} mono />
                <Line label="Destination" value={platform.destinationPath} mono />
                {platform.notes ? <p className="pt-1 text-[11px] text-amber-200/85">{platform.notes}</p> : null}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                disabled={logExportBusyId === platform.id}
                onClick={() => void onExportLogs(platform.id)}
              >
                {logExportBusyId === platform.id ? (
                  <LoaderCircle className="size-3.5 animate-spin" />
                ) : (
                  <Download className="size-3.5" />
                )}
                Export logs
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Strategy matrix</CardTitle>
          <CardDescription>Details intended for repeatable QA flashing workflows.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Platform</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Tag</TableHead>
                <TableHead>Transfer</TableHead>
                <TableHead>Log path</TableHead>
                <TableHead>Artifact</TableHead>
                <TableHead>Update command</TableHead>
                <TableHead>Maturity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {platforms.map((platform) => (
                <TableRow key={platform.id}>
                  <TableCell>{platform.name}</TableCell>
                  <TableCell className="font-mono text-xs">{platform.defaultIp}</TableCell>
                  <TableCell className="font-mono text-xs">{platform.tag}</TableCell>
                  <TableCell>{platform.transferMethod}</TableCell>
                  <TableCell className="font-mono text-xs">{platform.logPath}</TableCell>
                  <TableCell className="max-w-sm font-mono text-xs truncate">{platform.artifactFileName}</TableCell>
                  <TableCell className="max-w-lg font-mono text-xs truncate">{platform.updateCommand}</TableCell>
                  <TableCell>
                    <MaturityBadge maturity={platform.maturity} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={lastLogExport !== null} onOpenChange={(open) => !open && onDismissLogExport()}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Exported logs</DialogTitle>
            <DialogDescription>
              {lastLogExport && (
                <>
                  From <span className="font-mono">{lastLogExport.logPath}</span> ·{" "}
                  {lastLogExport.byteSize} bytes · {formatTimestamp(lastLogExport.exportedAt)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] rounded-lg border border-border/80 bg-black/30 p-3">
            <pre className="font-mono text-xs whitespace-pre-wrap">{lastLogExport?.content}</pre>
          </ScrollArea>
          <DialogFooter showCloseButton>
            {lastLogExport && <CopyButton text={lastLogExport.content} label="Copy logs" />}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Line({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span>{label}</span>
      <span className={mono ? "max-w-[65%] truncate font-mono" : ""}>{value}</span>
    </div>
  );
}

function MaturityBadge({ maturity }: { maturity: RouterPlatform["maturity"] }) {
  if (maturity === "stable") {
    return (
      <Badge variant="outline" className="border-emerald-400/35 bg-emerald-500/10 text-emerald-300">
        <ShieldCheck className="size-3" />
        Stable
      </Badge>
    );
  }
  if (maturity === "beta") {
    return (
      <Badge variant="outline" className="border-blue-400/35 bg-blue-500/10 text-blue-300">
        <TestTube2 className="size-3" />
        Beta
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-amber-400/35 bg-amber-500/10 text-amber-300">
      <AlertCircle className="size-3" />
      Experimental
    </Badge>
  );
}
