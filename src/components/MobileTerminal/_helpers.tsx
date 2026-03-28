import { useState, useCallback } from "react";

/** Small hook for copy-to-clipboard with flash feedback */
export function useCopy() {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 1200);
    });
  }, []);
  return { copiedText, copy };
}
