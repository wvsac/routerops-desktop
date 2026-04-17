import type {
  AliasCommand,
  AliasDeploymentResult,
  AliasRunResult,
  AppSettings,
  FlashJob,
  FlashPlan,
  FlashRequestInput,
  JobLogEntry,
  LogExportResult,
  RouterPlatform,
} from "@/domain/models";

export interface FlashService {
  resolvePlan(input: FlashRequestInput, platform: RouterPlatform, settings: AppSettings): FlashPlan;
  startFlash(input: FlashRequestInput, platform: RouterPlatform, settings: AppSettings): Promise<FlashJob>;
}

export interface AliasService {
  execute(alias: AliasCommand): Promise<AliasRunResult>;
  deployToRouter(aliases: AliasCommand[], platform: RouterPlatform): Promise<AliasDeploymentResult>;
}

export interface JobLogService {
  getByJobId(jobId: string): JobLogEntry[];
}

export interface LogExportService {
  exportLogs(platform: RouterPlatform): Promise<LogExportResult>;
}

// TODO: Replace mock services with Tauri command invocations or Python sidecar bridge.
// Suggested boundary:
// - resolvePlan -> tauri::command("resolve_firmware_plan")
// - startFlash  -> stream flash events from backend and map to FlashJob + JobLogEntry
// - execute     -> command execution via secure shell/native dispatcher
// - deployToRouter -> append generated alias lines to remote shell profile and source it
