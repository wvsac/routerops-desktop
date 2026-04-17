import { buildAliasExportScript, buildFlashPlan } from "@/data/mock-data";
import type {
  AliasCommand,
  AliasDeploymentResult,
  AliasRunResult,
  AppSettings,
  FlashJob,
  FlashRequestInput,
  JobLogEntry,
  LogExportResult,
  RouterPlatform,
} from "@/domain/models";
import type { AliasService, FlashService, JobLogService, LogExportService } from "@/services/contracts";

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

const MOCK_SYSLOG = `Jan  1 00:00:01 router syslogd started: BusyBox v1.36.1
Jan  1 00:00:01 router kernel: [    0.000000] Linux version 5.15.137
Jan  1 00:00:02 router kernel: [    1.241023] mtd: partition "firmware" created
Jan  1 00:00:03 router netifd: Interface 'loopback' is enabled
Jan  1 00:00:03 router netifd: Interface 'lan' is enabled
Jan  1 00:00:04 router hostapd: wlan0: interface state UNINITIALIZED->ENABLED
Jan  1 00:00:04 router hostapd: wlan0: AP-ENABLED
Jan  1 00:00:05 router dnsmasq[1423]: started, DNSSEC, DNS-over-TLS
Jan  1 00:00:05 router dnsmasq[1423]: read /etc/hosts - 3 names
Jan  1 00:00:06 router dropbear[1501]: Running in background
Jan  1 00:00:08 router uhttpd[1520]: listening on 0.0.0.0:80
Jan  1 00:00:12 router odhcpd[1445]: router advertisement sent on br-lan
Jan  1 00:00:15 router kernel: [   14.832100] br-lan: port 1(eth0.1) entered forwarding state
Jan  1 00:00:18 router hostapd: wlan0: STA 4a:3b:22:ff:ee:01 IEEE 802.11: authenticated
Jan  1 00:00:19 router hostapd: wlan0: STA 4a:3b:22:ff:ee:01 IEEE 802.11: associated`;

export class MockLogExportService implements LogExportService {
  async exportLogs(platform: RouterPlatform): Promise<LogExportResult> {
    await wait(800);
    const content = MOCK_SYSLOG;
    return {
      platformId: platform.id,
      status: "success",
      logPath: platform.logPath,
      content,
      exportedAt: new Date().toISOString(),
      byteSize: new TextEncoder().encode(content).length,
    };
  }
}
