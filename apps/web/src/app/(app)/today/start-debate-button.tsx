"use client";

import { Button } from "@agora/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  clusterId: string;
  /** Optional className override for the button */
  className?: string;
  size?: "sm" | "md";
}

export function StartDebateButton({ clusterId, className, size = "sm" }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  const start = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/debates/from-cluster/${clusterId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        const msg = data?.error ?? `Failed (${res.status})`;
        setError(msg);
        setLoading(false);
        return;
      }
      const { debateId } = (await res.json()) as { debateId: string };
      router.push(`/debates/${debateId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={start} loading={loading} size={size} className={className}>
        Start debate →
      </Button>
      {error && <span className="font-mono text-[10px] text-[var(--color-danger)]">{error}</span>}
    </div>
  );
}
