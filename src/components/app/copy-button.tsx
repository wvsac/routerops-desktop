import { Copy, CopyCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <Button variant="ghost" size="sm" onClick={onCopy}>
      {copied ? <CopyCheck className="size-3.5" /> : <Copy className="size-3.5" />}
      {label}
    </Button>
  );
}
