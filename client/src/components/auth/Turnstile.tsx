"use client";

import { Turnstile as CloudflareTurnstile, TurnstileInstance } from "@marsidev/react-turnstile";
import { useTheme } from "next-themes";
import { useRef } from "react";
import { TURNSTILE_SITE_KEY } from "@/lib/const";

interface TurnstileProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  className?: string;
}

export function Turnstile({ onSuccess, onError, onExpire, className = "" }: TurnstileProps) {
  const turnstileRef = useRef<TurnstileInstance>(null);
  const { theme } = useTheme();

  // Silently return null if siteKey is not configured
  if (!TURNSTILE_SITE_KEY) {
    return null;
  }

  return (
    <div className={className}>
      <CloudflareTurnstile
        ref={turnstileRef}
        siteKey={TURNSTILE_SITE_KEY}
        onSuccess={onSuccess}
        onError={() => {
          onError?.();
        }}
        onExpire={() => {
          onExpire?.();
        }}
        options={{
          theme: theme === "dark" ? "dark" : "auto",
          size: "normal",
        }}
      />
    </div>
  );
}
