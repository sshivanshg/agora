"use client";

import { Theater } from "@agora/ui";
import { useSearchParams } from "next/navigation";

interface TheaterPreviewProps {
  debateId: string;
  resolution: string;
}

export function TheaterPreview({ debateId: _debateId, resolution }: TheaterPreviewProps) {
  const searchParams = useSearchParams();
  const demoMode = searchParams?.get("demo") === "1";

  return (
    <div className="theater">
      <Theater speech={{ resolution }} demoMode={demoMode} />
    </div>
  );
}
