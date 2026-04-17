import { invoke } from "@tauri-apps/api/core";
import { isTauri } from "@tauri-apps/api/core";
import { Network } from "lucide-react";
import { useEffect, useState } from "react";

interface NetInterface {
  name: string;
  ip: string;
  is_ipv4: boolean;
}

const FALLBACK: NetInterface[] = [
  { name: "eth0", ip: "192.168.8.100", is_ipv4: true },
  { name: "wlan0", ip: "192.168.1.42", is_ipv4: true },
];

export function NetInterfaces() {
  const [interfaces, setInterfaces] = useState<NetInterface[]>([]);

  useEffect(() => {
    let cancelled = false;

    const fetch = async () => {
      if (!isTauri()) {
        setInterfaces(FALLBACK);
        return;
      }
      try {
        const result = await invoke<NetInterface[]>("get_interfaces");
        if (!cancelled) setInterfaces(result);
      } catch {
        if (!cancelled) setInterfaces(FALLBACK);
      }
    };

    void fetch();
    const interval = setInterval(() => void fetch(), 10_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (interfaces.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/80 bg-muted/30 p-3">
      <div className="mb-2 flex items-center gap-2">
        <Network className="size-3.5 text-muted-foreground" />
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Interfaces</p>
      </div>
      <div className="space-y-1">
        {interfaces.map((iface) => (
          <div key={`${iface.name}-${iface.ip}`} className="flex items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground">{iface.name}</span>
            <span className="font-mono text-foreground">{iface.ip}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
