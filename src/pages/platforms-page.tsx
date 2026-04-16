import { AlertCircle, ShieldCheck, TestTube2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { RouterPlatform } from "@/domain/models";

export function PlatformsPage({ platforms }: { platforms: RouterPlatform[] }) {
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
                <Line label="Artifact" value={platform.artifactFileName} mono />
                <Line label="Destination" value={platform.destinationPath} mono />
                {platform.notes ? <p className="pt-1 text-[11px] text-amber-200/85">{platform.notes}</p> : null}
              </div>
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
