import { useState } from "react";
import { cn } from "../lib/utils";

export function Favicon({ domain, className }: { domain: string; className?: string }) {
  const [imageError, setImageError] = useState(false);
  const [fallbackError, setFallbackError] = useState(false);
  const firstLetter = domain.charAt(0).toUpperCase();

  // Show letter fallback if both services fail
  if (imageError && fallbackError) {
    return (
      <div
        className={cn(
          "bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center text-xs font-semibold text-white shadow-sm",
          className ?? "w-4 h-4"
        )}
      >
        {firstLetter}
      </div>
    );
  }

  // Try Google's more reliable service first, then fallback to DuckDuckGo
  const primarySrc = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  const fallbackSrc = `https://icons.duckduckgo.com/ip3/${domain}.ico`;

  return (
    <img
      src={imageError ? fallbackSrc : primarySrc}
      className={cn("rounded", className ?? "w-4 h-4")}
      alt={`${domain} favicon`}
      onError={() => {
        if (!imageError) {
          // First error - try fallback service
          setImageError(true);
        } else {
          // Second error - show letter fallback
          setFallbackError(true);
        }
      }}
    />
  );
}
