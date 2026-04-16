import { buildAliasExportScript, buildFlashPlan } from "@/data/mock-data";
import type {
  AliasCommand,
  AliasDeploymentResult,
  AliasRunResult,
  AppSettings,
  FlashJob,
  FlashRequestInput,
  JobLogEntry,
  RouterPlatform,
} from "@/domain/models";
import type { AliasService, FlashService, JobLogService } from "@/services/contracts";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class MockFlashService implements FlashService {
  resolvePlan(input: FlashRequestInput, platform: RouterPlatform, settings: AppSettings) {
    return buildFlashPlan(
      platform,
      input.firmwareHash,
      settings.s3BaseUrl,
      input.imageSource,
      input.localImagePath,
    );
  }

  async startFlash(input: FlashRequestInput, platform: RouterPlatform, settings: AppSettings): Promise<FlashJob> {
    const plan = this.resolvePlan(input, platform, settings);
    await wait(750);

    return {
      id: `job-${Math.floor(2000 + Math.random() * 6000)}`,
      createdAt: new Date().toISOString(),
      platformId: input.platformId,
      firmwareHash: input.firmwareHash,
      imageUrl: plan.imageUrl,
      status: "running",
      progress: 12,
      plan: {
        ...plan,
        steps: plan.steps.map((step, index) => (index === 0 ? { ...step, state: "running" } : step)),
      },
    };
  }
}

export class MockAliasService implements AliasService {
  async execute(alias: AliasCommand): Promise<AliasRunResult> {
    await wait(450);
    const failed = alias.dangerous && Math.random() > 0.55;
    return {
      aliasId: alias.id,
      status: failed ? "failed" : "success",
      timestamp: new Date().toISOString(),
      output: failed ? "Command exited with code 1 (simulated)." : "Command executed successfully (simulated).",
    };
  }

  async deployToRouter(aliases: AliasCommand[], platform: RouterPlatform): Promise<AliasDeploymentResult> {
    await wait(650);
    const deployed = aliases.filter((alias) => alias.exportToRouter);
    const scriptPreview = buildAliasExportScript(deployed);

    return {
      platformId: platform.id,
      deployedCount: deployed.length,
      status: "success",
      scriptPreview,
      output: `Exported ${deployed.length} aliases to ${platform.defaultIp} ~/.profile (simulated).`,
      timestamp: new Date().toISOString(),
    };
  }
}

export class MockJobLogService implements JobLogService {
  constructor(private readonly logs: JobLogEntry[]) {}

  getByJobId(jobId: string) {
    return this.logs
      .filter((log) => log.jobId === jobId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
}
