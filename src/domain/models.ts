export type JobStatus = "queued" | "running" | "success" | "failed" | "cancelled";
export type LogLevel = "info" | "warn" | "error" | "debug";
export type TransferMethod = "scp" | "rsync" | "tftp";
export type UpdateMethod = "sysupgrade" | "ubus-upgrade" | "custom";
export type PlatformMaturity = "stable" | "beta" | "experimental";
export type FlashImageSource = "s3" | "local";
export type AliasKind = "alias" | "function";

export interface RouterPlatform {
  id: string;
  tag: string;
  name: string;
  artifactFileName: string;
  defaultIp: string;
  transferMethod: TransferMethod;
  destinationPath: string;
  updateMethod: UpdateMethod;
  updateCommand: string;
  logPath: string;
  preFlashCommands?: string[];
  postFlashCommands?: string[];
  notes?: string;
  maturity: PlatformMaturity;
}

export interface FlashPlanStep {
  id: string;
  title: string;
  commandPreview: string;
  state: "pending" | "running" | "completed" | "failed";
}

export interface FlashPlan {
  imageSource: FlashImageSource;
  imageUrl: string;
  localImagePath?: string;
  steps: FlashPlanStep[];
  warnings: string[];
}

export interface JobLogEntry {
  id: string;
  jobId: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  command?: string;
  output?: string;
}

export interface FlashJob {
  id: string;
  createdAt: string;
  platformId: string;
  firmwareHash: string;
  imageUrl: string;
  status: JobStatus;
  progress: number;
  plan: FlashPlan;
  resultSummary?: string;
}

export interface AliasCommand {
  id: string;
  name: string;
  kind: AliasKind;
  command: string;
  description: string;
  tags: string[];
  platformTags: string[];
  dangerous: boolean;
  requiresConfirmation: boolean;
  exportToRouter: boolean;
  routerAliasName: string;
  lastRunAt?: string;
  lastResult?: "success" | "failed";
}

export interface AppSettings {
  s3BaseUrl: string;
  defaultPlatformTag: string;
  theme: "dark" | "light" | "system";
}

export interface DeviceActivity {
  id: string;
  timestamp: string;
  platformId: string;
  action: string;
  detail: string;
}

export interface FlashRequestInput {
  firmwareHash: string;
  platformId: string;
  imageSource: FlashImageSource;
  localImagePath?: string;
}

export interface AliasRunResult {
  aliasId: string;
  status: "success" | "failed";
  output: string;
  timestamp: string;
}

export interface AliasDeploymentResult {
  platformId: string;
  deployedCount: number;
  status: "success" | "failed";
  scriptPreview: string;
  output: string;
  timestamp: string;
}

export interface LogExportResult {
  platformId: string;
  status: "success" | "failed";
  logPath: string;
  content: string;
  exportedAt: string;
  byteSize: number;
}
