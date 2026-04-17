import { useMemo, useState } from "react";
import { toast } from "sonner";

import { mockActivity, mockAliases, mockJobs, mockLogs, mockPlatforms, mockSettings } from "@/data/mock-data";
import type {
  AliasCommand,
  AppSettings,
  FlashImageSource,
  FlashJob,
  FlashPlan,
  FlashRequestInput,
  JobLogEntry,
  RouterPlatform,
} from "@/domain/models";
import { MockAliasService, MockFlashService, MockJobLogService } from "@/services/mock-services";

const flashService = new MockFlashService();
const aliasService = new MockAliasService();

const createPlanInput = (
  firmwareHash: string,
  platformId: string,
  imageSource: FlashImageSource,
  localImagePath?: string,
): FlashRequestInput => ({ firmwareHash, platformId, imageSource, localImagePath });

export function useRouterOpsState() {
  const [settings, setSettings] = useState<AppSettings>(mockSettings);
  const [platforms] = useState<RouterPlatform[]>(mockPlatforms);
  const [jobs, setJobs] = useState<FlashJob[]>(mockJobs);
  const [aliases, setAliases] = useState<AliasCommand[]>(mockAliases);
  const [logs, setLogs] = useState<JobLogEntry[]>(mockLogs);
  const [activity, setActivity] = useState(mockActivity);
  const [flashBusy, setFlashBusy] = useState(false);
  const [aliasBusyId, setAliasBusyId] = useState<string | null>(null);
  const [deployAliasesBusy, setDeployAliasesBusy] = useState(false);

  const jobLogService = useMemo(() => new MockJobLogService(logs), [logs]);

  const resolvePlan = (
    firmwareHash: string,
    platformId: string,
    imageSource: FlashImageSource,
    localImagePath?: string,
  ): FlashPlan | null => {
    const platform = platforms.find((item) => item.id === platformId);
    if (!platform || !firmwareHash.trim()) return null;
    if (imageSource === "local" && !localImagePath?.trim()) return null;
    return flashService.resolvePlan(
      createPlanInput(firmwareHash.trim(), platformId, imageSource, localImagePath?.trim()),
      platform,
      settings,
    );
  };

  const startFlash = async (
    firmwareHash: string,
    platformId: string,
    imageSource: FlashImageSource,
    localImagePath?: string,
  ) => {
    const platform = platforms.find((item) => item.id === platformId);
    if (!platform) return;
    setFlashBusy(true);
    try {
      const newJob = await flashService.startFlash(
        createPlanInput(firmwareHash.trim(), platformId, imageSource, localImagePath?.trim()),
        platform,
        settings,
      );
      const logEntry: JobLogEntry = {
        id: `log-${Math.floor(Math.random() * 100000)}`,
        jobId: newJob.id,
        timestamp: new Date().toISOString(),
        level: "info",
        message: "Flash workflow dispatched using mock service.",
        output: "TODO: connect to Tauri/native flash pipeline.",
      };

      setJobs((prev) => [newJob, ...prev]);
      setLogs((prev) => [logEntry, ...prev]);
      setActivity((prev) => [
        {
          id: `act-${Math.floor(Math.random() * 100000)}`,
          timestamp: new Date().toISOString(),
          platformId,
          action: "Flash started",
          detail: `${platform.tag} flashing initiated (${imageSource === "s3" ? "S3 artifact" : "local image"}).`,
        },
        ...prev,
      ]);
      toast.success("Flash job started in simulation mode");
    } finally {
      setFlashBusy(false);
    }
  };

  const createAlias = (alias: Omit<AliasCommand, "id">) => {
    const newAlias: AliasCommand = {
      ...alias,
      id: `alias-${Math.floor(Math.random() * 100000)}`,
    };
    setAliases((prev) => [newAlias, ...prev]);
    toast.success("Alias created");
  };

  const importAliases = (imported: Array<Omit<AliasCommand, "id">>) => {
    if (imported.length === 0) return;
    const newAliases: AliasCommand[] = imported.map((alias) => ({
      ...alias,
      id: `alias-${Math.floor(Math.random() * 1000000)}`,
    }));
    setAliases((prev) => [...newAliases, ...prev]);
    toast.success(`Imported ${imported.length} aliases`);
  };

  const updateAlias = (aliasId: string, partial: Partial<AliasCommand>) => {
    setAliases((prev) => prev.map((alias) => (alias.id === aliasId ? { ...alias, ...partial } : alias)));
    toast.success("Alias updated");
  };

  const deleteAlias = (aliasId: string) => {
    setAliases((prev) => prev.filter((alias) => alias.id !== aliasId));
    toast.success("Alias deleted");
  };

  const runAlias = async (alias: AliasCommand) => {
    setAliasBusyId(alias.id);
    try {
      const result = await aliasService.execute(alias);
      setAliases((prev) =>
        prev.map((item) =>
          item.id === alias.id
            ? {
                ...item,
                lastRunAt: result.timestamp,
                lastResult: result.status,
              }
            : item,
        ),
      );

      const aliasLog: JobLogEntry = {
        id: `log-${Math.floor(Math.random() * 100000)}`,
        jobId: `alias-${alias.id}`,
        timestamp: result.timestamp,
        level: result.status === "success" ? "info" : "error",
        message: `Alias ${alias.name} executed`,
        command: alias.command,
        output: result.output,
      };
      setLogs((prev) => [aliasLog, ...prev]);
      toast[result.status === "success" ? "success" : "error"](
        result.status === "success" ? "Alias executed" : "Alias execution failed",
      );
    } finally {
      setAliasBusyId(null);
    }
  };

  const deployAliasesToRouter = async (platformTag: string, aliasIds: string[]) => {
    const platform = platforms.find((item) => item.tag === platformTag);
    if (!platform) return;
    setDeployAliasesBusy(true);
    try {
      const scopedAliases = aliases.filter(
        (alias) => aliasIds.includes(alias.id) && alias.platformTags.includes(platform.tag),
      );
      const result = await aliasService.deployToRouter(scopedAliases, platform);
      const logEntry: JobLogEntry = {
        id: `log-${Math.floor(Math.random() * 100000)}`,
        jobId: `alias-export-${platform.id}`,
        timestamp: result.timestamp,
        level: result.status === "success" ? "info" : "error",
        message: `Alias export completed for ${platform.tag}`,
        command: `ssh root@${platform.defaultIp} "<append aliases to ~/.profile>"`,
        output: `${result.output}\n\n${result.scriptPreview}`,
      };
      setLogs((prev) => [logEntry, ...prev]);
      setActivity((prev) => [
        {
          id: `act-${Math.floor(Math.random() * 100000)}`,
          timestamp: result.timestamp,
          platformId: platform.id,
          action: "Aliases exported",
          detail: `${result.deployedCount} aliases exported to ${platform.tag} (platform-scoped).`,
        },
        ...prev,
      ]);
      toast.success(`Exported ${result.deployedCount} aliases to ${platform.tag}`);
    } finally {
      setDeployAliasesBusy(false);
    }
  };

  const updateSettings = (partial: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
    toast.success("Settings updated");
  };

  const clearCompletedJobs = () => {
    setJobs((prev) => prev.filter((job) => job.status === "running" || job.status === "queued"));
    toast.success("Completed jobs cleared");
  };

  return {
    settings,
    platforms,
    jobs,
    aliases,
    logs,
    activity,
    flashBusy,
    aliasBusyId,
    deployAliasesBusy,
    resolvePlan,
    startFlash,
    createAlias,
    importAliases,
    updateAlias,
    deleteAlias,
    runAlias,
    deployAliasesToRouter,
    updateSettings,
    clearCompletedJobs,
    getJobLogs: (jobId: string) => jobLogService.getByJobId(jobId),
  };
}
