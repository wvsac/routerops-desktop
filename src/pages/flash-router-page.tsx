import { zodResolver } from "@hookform/resolvers/zod";
import { FileImage, LoaderCircle, Rocket, ShieldAlert } from "lucide-react";
import { isTauri } from "@tauri-apps/api/core";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { CopyButton } from "@/components/app/copy-button";
import { EmptyState } from "@/components/app/empty-state";
import { StatusPill } from "@/components/app/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AppSettings, FlashImageSource, FlashJob, FlashPlan, RouterPlatform } from "@/domain/models";
import { formatRelative } from "@/lib/format";

const flashSchema = z.object({
  firmwareHash: z.string().min(6, "Firmware hash must be at least 6 chars."),
  platformId: z.string().min(1, "Platform is required."),
  imageSource: z.enum(["s3", "local"]),
  localImagePath: z.string().optional(),
});

type FlashForm = z.infer<typeof flashSchema>;

export function FlashRouterPage({
  platforms,
  settings,
  flashBusy,
  latestJob,
  resolvePlan,
  startFlash,
}: {
  platforms: RouterPlatform[];
  settings: AppSettings;
  flashBusy: boolean;
  latestJob?: FlashJob;
  resolvePlan: (
    firmwareHash: string,
    platformId: string,
    imageSource: FlashImageSource,
    localImagePath?: string,
  ) => FlashPlan | null;
  startFlash: (
    firmwareHash: string,
    platformId: string,
    imageSource: FlashImageSource,
    localImagePath?: string,
  ) => Promise<void>;
}) {
  const defaultPlatformId =
    platforms.find((platform) => platform.tag === "gl-ax1800")?.id ?? platforms[0]?.id ?? "";
  const form = useForm<FlashForm>({
    resolver: zodResolver(flashSchema),
    defaultValues: {
      firmwareHash: "",
      platformId: defaultPlatformId,
      imageSource: "s3",
      localImagePath: "",
    },
  });

  const firmwareHash = form.watch("firmwareHash");
  const platformId = form.watch("platformId");
  const imageSource = form.watch("imageSource");
  const localImagePath = form.watch("localImagePath");

  const selectedPlatform = useMemo(
    () => platforms.find((platform) => platform.id === platformId),
    [platformId, platforms],
  );
  const plan = resolvePlan(firmwareHash, platformId, imageSource, localImagePath);

  const onSubmit = form.handleSubmit(async (values) => {
    if (values.imageSource === "local" && !values.localImagePath?.trim()) {
      form.setError("localImagePath", { message: "Local image path is required." });
      return;
    }

    await startFlash(values.firmwareHash, values.platformId, values.imageSource, values.localImagePath);
    form.reset({
      firmwareHash: "",
      platformId: values.platformId,
      imageSource: values.imageSource,
      localImagePath: values.localImagePath,
    });
  });

  const pickLocalImage = async () => {
    if (!isTauri()) return;
    const { open } = await import("@tauri-apps/plugin-dialog");
    const selected = await open({
      multiple: false,
      directory: false,
      filters: [
        { name: "Firmware image", extensions: ["bin", "itb", "img"] },
        { name: "All files", extensions: ["*"] },
      ],
    });

    if (typeof selected === "string") {
      form.setValue("localImagePath", selected, { shouldValidate: true });
    }
  };

  return (
    <div className="grid gap-4 2xl:grid-cols-[1.15fr_0.85fr]">
      <Card className="glass">
        <CardHeader>
          <CardTitle>Firmware flash workflow</CardTitle>
          <CardDescription>Resolve image, transfer artifact, execute update, and monitor result.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-3" onSubmit={onSubmit}>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Firmware hash</label>
              <Input placeholder="ex: a91b2f3" {...form.register("firmwareHash")} />
              <FieldError error={form.formState.errors.firmwareHash?.message} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Platform profile</label>
              <Select
                value={platformId}
                onValueChange={(value) => {
                  if (value) form.setValue("platformId", value, { shouldValidate: true });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((platform) => (
                    <SelectItem key={platform.id} value={platform.id}>
                      {platform.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError error={form.formState.errors.platformId?.message} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Image source</label>
              <Select
                value={imageSource}
                onValueChange={(value) => {
                  if (value) form.setValue("imageSource", value as FlashImageSource, { shouldValidate: true });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select image source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="s3">S3 artifact by hash + platform tag</SelectItem>
                  <SelectItem value="local">Local image file path</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {imageSource === "local" ? (
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Local image path</label>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="/Users/you/firmware/glinet_gl-ax1800-squashfs-sysupgrade.bin"
                    {...form.register("localImagePath")}
                  />
                  <Button type="button" variant="outline" onClick={() => void pickLocalImage()} disabled={!isTauri()}>
                    Pick file
                  </Button>
                </div>
                <FieldError error={form.formState.errors.localImagePath?.message} />
                <p className="text-[11px] text-muted-foreground">
                  {isTauri()
                    ? "Native file picker enabled."
                    : "File picker works in Tauri runtime. In browser preview, paste path manually."}
                </p>
              </div>
            ) : null}
            <Button className="w-full" type="submit" disabled={flashBusy}>
              {flashBusy ? <LoaderCircle className="size-4 animate-spin" /> : <Rocket className="size-4" />}
              Start flash sequence
            </Button>
          </form>

          <div className="grid gap-3 lg:grid-cols-2">
            <InfoCard label="S3 base URL" value={settings.s3BaseUrl} />
            <InfoCard label="Default platform tag" value={settings.defaultPlatformTag} />
            <InfoCard label="Platform tag" value={selectedPlatform?.tag ?? "Select platform"} />
            <InfoCard label="Transfer method" value={selectedPlatform?.transferMethod ?? "Select platform"} />
            <InfoCard label="Update strategy" value={selectedPlatform?.updateCommand ?? "Select platform"} mono />
            <InfoCard label="Artifact filename" value={selectedPlatform?.artifactFileName ?? "Select platform"} mono />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Execution plan preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {plan ? (
              <>
                <div className="rounded-lg border border-border/80 bg-muted/30 p-3">
                  <p className="mb-1 text-xs text-muted-foreground">Resolved image</p>
                  <p className="mb-1 text-[11px] text-muted-foreground">
                    Source: {plan.imageSource === "s3" ? "S3 artifact" : "Local file"}
                  </p>
                  <p className="font-mono text-xs break-all">{plan.imageUrl}</p>
                  <div className="mt-2 flex justify-end">
                    <CopyButton text={plan.imageUrl} />
                  </div>
                </div>
                {plan.warnings.map((warning) => (
                  <div key={warning} className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-2.5 text-amber-200">
                    <ShieldAlert className="mt-0.5 size-4 shrink-0" />
                    <p className="text-xs">{warning}</p>
                  </div>
                ))}
                <div className="space-y-2">
                  {plan.steps.map((step) => (
                    <div key={step.id} className="rounded-lg border border-border/70 bg-muted/20 p-2.5">
                      <p className="text-sm">{step.title}</p>
                      <p className="mt-1 font-mono text-[11px] text-muted-foreground">{step.commandPreview}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                icon={imageSource === "local" ? <FileImage className="size-5" /> : <Rocket className="size-5" />}
                title="Prepare your flash plan"
                description="Set hash, platform, and image source to preview exact transfer + update steps."
              />
            )}
          </CardContent>
        </Card>

        {latestJob && (
          <Card className="glass">
            <CardHeader>
              <CardTitle>Latest job status</CardTitle>
              <CardDescription>{latestJob.id}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-sm">Current state</p>
                <StatusPill status={latestJob.status} />
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${latestJob.progress}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">{latestJob.progress}% complete · {formatRelative(latestJob.createdAt)}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function InfoCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-border/80 bg-muted/20 p-3">
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <p className={mono ? "font-mono text-xs break-all" : "text-sm"}>{value}</p>
    </div>
  );
}

function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="text-xs text-rose-300">{error}</p>;
}
