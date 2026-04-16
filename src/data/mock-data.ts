import type {
  AliasCommand,
  AppSettings,
  DeviceActivity,
  FlashImageSource,
  FlashJob,
  FlashPlan,
  JobLogEntry,
  RouterPlatform,
} from "@/domain/models";

const now = Date.now();
const minutesAgo = (minutes: number) => new Date(now - minutes * 60_000).toISOString();

export const mockSettings: AppSettings = {
  s3BaseUrl: "s3://router-firmware/builds/qa",
  defaultPlatformTag: "gl-ax1800",
  theme: "dark",
};

export const mockPlatforms: RouterPlatform[] = [
  {
    id: "gl-ax1800-main",
    tag: "gl-ax1800",
    name: "GL.iNet AX1800 (Main QA)",
    artifactFileName: "glinet_gl-ax1800-squashfs-sysupgrade.bin",
    defaultIp: "192.168.8.1",
    transferMethod: "scp",
    destinationPath: "/tmp/firmware.bin",
    updateMethod: "sysupgrade",
    updateCommand: "sysupgrade -n /tmp/firmware.bin",
    preFlashCommands: ["ubus call system board"],
    postFlashCommands: ["reboot"],
    notes: "Default and primary platform for daily regressions.",
    maturity: "stable",
  },
  {
    id: "rdkb-pi-4",
    tag: "rdkb-pi-4",
    name: "RDKB Pi 4",
    artifactFileName: "rdkb-rpi4-sysupgrade.bin",
    defaultIp: "192.168.1.1",
    transferMethod: "scp",
    destinationPath: "/tmp/rdkb-upgrade.bin",
    updateMethod: "custom",
    updateCommand: "/usr/bin/rdkb_upgrade /tmp/rdkb-upgrade.bin",
    notes: "Uses custom upgrade wrapper and longer reboot window.",
    maturity: "beta",
  },
  {
    id: "technicolor-xb8",
    tag: "technicolor-xb8",
    name: "Technicolor XB8",
    artifactFileName: "technicolor_xb8-sysupgrade.bin",
    defaultIp: "10.0.0.1",
    transferMethod: "rsync",
    destinationPath: "/tmp/upgrade/xb8.bin",
    updateMethod: "ubus-upgrade",
    updateCommand: "ubus call system upgrade '{\"path\":\"/tmp/upgrade/xb8.bin\"}'",
    notes: "Rsync preferred due to image size.",
    maturity: "experimental",
  },
];

export const resolveFirmwareImagePath = (
  platform: RouterPlatform,
  hash: string,
  s3BaseUrl: string,
): string => `${s3BaseUrl}/${hash}/${platform.tag}/${platform.artifactFileName}`;

export const buildFlashPlan = (
  platform: RouterPlatform,
  hash: string,
  s3BaseUrl: string,
  imageSource: FlashImageSource,
  localImagePath?: string,
): FlashPlan => {
  const remoteImage = resolveFirmwareImagePath(platform, hash, s3BaseUrl);
  const resolvedImage = imageSource === "local" ? localImagePath ?? "/path/to/firmware.bin" : remoteImage;

  return {
    imageSource,
    imageUrl: resolvedImage,
    localImagePath: imageSource === "local" ? resolvedImage : undefined,
    warnings: platform.maturity !== "stable" ? ["Platform is non-stable. Keep recovery serial console available."] : [],
    steps: [
      {
        id: "resolve",
        title: "Resolve firmware image",
        commandPreview:
          imageSource === "s3"
            ? `resolve-artifact --hash ${hash} --platform-tag ${platform.tag}`
            : `validate-local-image "${resolvedImage}"`,
        state: "pending",
      },
      {
        id: "prepare",
        title: imageSource === "s3" ? "Download image from artifact storage" : "Prepare local image for transfer",
        commandPreview:
          imageSource === "s3"
            ? `aws s3 cp ${remoteImage} ./cache/${platform.tag}-${hash}.bin`
            : `cp "${resolvedImage}" ./cache/${platform.tag}-${hash}.bin`,
        state: "pending",
      },
      {
        id: "transfer",
        title: "Transfer image to router",
        commandPreview:
          platform.transferMethod === "scp"
            ? `scp ./cache/${platform.tag}-${hash}.bin root@${platform.defaultIp}:${platform.destinationPath}`
            : platform.transferMethod === "rsync"
              ? `rsync -av ./cache/${platform.tag}-${hash}.bin root@${platform.defaultIp}:${platform.destinationPath}`
              : `tftp ${platform.defaultIp} -m binary -c put ./cache/${platform.tag}-${hash}.bin ${platform.destinationPath}`,
        state: "pending",
      },
      {
        id: "update",
        title: "Execute update command",
        commandPreview: `ssh root@${platform.defaultIp} "${platform.updateCommand}"`,
        state: "pending",
      },
      {
        id: "verify",
        title: "Verify device health",
        commandPreview: `ping ${platform.defaultIp} && ssh root@${platform.defaultIp} "ubus call system board"`,
        state: "pending",
      },
    ],
  };
};

export const buildAliasExportScript = (aliases: AliasCommand[]): string => {
  const lines = aliases
    .filter((alias) => alias.exportToRouter)
    .map((alias) =>
      alias.kind === "function"
        ? `${alias.routerAliasName}() {\n${alias.command}\n}`
        : `alias ${alias.routerAliasName}='${alias.command.replace(/'/g, "'\\''")}'`,
    );

  return [
    "# RouterOps alias export",
    "cat <<'EOF' >> ~/.profile",
    ...lines,
    "EOF",
    "source ~/.profile",
  ].join("\n");
};

export const mockAliases: AliasCommand[] = [
  {
    id: "check-mesh",
    name: "Check mesh backhaul",
    kind: "alias",
    command: "iw dev wlan0 station dump | grep -E 'Station|signal'",
    description: "Inspect current mesh links and signal levels.",
    tags: ["mesh", "wifi"],
    platformTags: ["gl-ax1800", "technicolor-xb8"],
    dangerous: false,
    requiresConfirmation: false,
    exportToRouter: true,
    routerAliasName: "meshcheck",
    lastRunAt: minutesAgo(32),
    lastResult: "success",
  },
  {
    id: "wifi-clients",
    name: "List Wi-Fi clients",
    kind: "alias",
    command: "ubus call hostapd.wlan0 get_clients",
    description: "Print active clients from hostapd ubus endpoint.",
    tags: ["wifi", "clients"],
    platformTags: ["gl-ax1800"],
    dangerous: false,
    requiresConfirmation: false,
    exportToRouter: true,
    routerAliasName: "wclients",
    lastRunAt: minutesAgo(76),
    lastResult: "success",
  },
  {
    id: "factory-reset",
    name: "Factory reset",
    kind: "function",
    command: "firstboot -y && reboot",
    description: "Hard reset the router and reboot.",
    tags: ["reset", "dangerous"],
    platformTags: ["rdkb-pi-4"],
    dangerous: true,
    requiresConfirmation: true,
    exportToRouter: false,
    routerAliasName: "hardreset",
    lastRunAt: minutesAgo(210),
    lastResult: "failed",
  },
];

const glPlan = buildFlashPlan(mockPlatforms[0], "a91b2f3", mockSettings.s3BaseUrl, "s3");

export const mockJobs: FlashJob[] = [
  {
    id: "job-1436",
    createdAt: minutesAgo(12),
    platformId: "gl-ax1800-main",
    firmwareHash: "a91b2f3",
    imageUrl: glPlan.imageUrl,
    status: "running",
    progress: 62,
    plan: {
      ...glPlan,
      steps: glPlan.steps.map((step, index) =>
        index < 2 ? { ...step, state: "completed" } : index === 2 ? { ...step, state: "running" } : step,
      ),
    },
  },
  {
    id: "job-1435",
    createdAt: minutesAgo(95),
    platformId: "rdkb-pi-4",
    firmwareHash: "80ef10a",
    imageUrl: resolveFirmwareImagePath(mockPlatforms[1], "80ef10a", mockSettings.s3BaseUrl),
    status: "success",
    progress: 100,
    plan: buildFlashPlan(mockPlatforms[1], "80ef10a", mockSettings.s3BaseUrl, "s3"),
    resultSummary: "Flashed in 9m 10s with post-check OK.",
  },
  {
    id: "job-1434",
    createdAt: minutesAgo(215),
    platformId: "technicolor-xb8",
    firmwareHash: "5f8dc11",
    imageUrl: "/Users/wvsac/firmware/technicolor_xb8-sysupgrade.bin",
    status: "failed",
    progress: 74,
    plan: buildFlashPlan(
      mockPlatforms[2],
      "5f8dc11",
      mockSettings.s3BaseUrl,
      "local",
      "/Users/wvsac/firmware/technicolor_xb8-sysupgrade.bin",
    ),
    resultSummary: "Device did not come back after update window.",
  },
];

export const mockLogs: JobLogEntry[] = [
  {
    id: "log-1",
    jobId: "job-1436",
    timestamp: minutesAgo(11),
    level: "info",
    message: "Resolved image artifact from S3.",
    command: "resolve-artifact --hash a91b2f3 --platform-tag gl-ax1800",
    output: "resolved=glinet_gl-ax1800-squashfs-sysupgrade.bin",
  },
  {
    id: "log-2",
    jobId: "job-1436",
    timestamp: minutesAgo(8),
    level: "info",
    message: "Downloaded image to local cache.",
    command: "aws s3 cp ...",
    output: "download: 30.7 MiB",
  },
  {
    id: "log-3",
    jobId: "job-1436",
    timestamp: minutesAgo(5),
    level: "debug",
    message: "Transfer channel negotiated with router.",
    command: "scp ./cache/gl-ax1800-a91b2f3.bin root@192.168.8.1:/tmp/firmware.bin",
    output: "throughput=14.2MiB/s",
  },
];

export const mockActivity: DeviceActivity[] = [
  {
    id: "act-1",
    timestamp: minutesAgo(9),
    platformId: "gl-ax1800-main",
    action: "Flash in progress",
    detail: "Image transfer step reached 62% on gl-ax1800.",
  },
  {
    id: "act-2",
    timestamp: minutesAgo(42),
    platformId: "rdkb-pi-4",
    action: "Aliases exported",
    detail: "Router aliases appended to ~/.profile and sourced.",
  },
  {
    id: "act-3",
    timestamp: minutesAgo(120),
    platformId: "technicolor-xb8",
    action: "Recovery warning",
    detail: "Device failed reboot heartbeat after local image upgrade attempt.",
  },
];
