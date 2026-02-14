"use client";

import { useEffect } from "react";
import { toast } from "@/components/ui/sonner";

import { IS_CLOUD } from "../lib/const";
import packageJson from "../../package.json";
import { X } from "lucide-react";
import { Button } from "./ui/button";

export function VersionCheck() {
  useEffect(() => {
    if (IS_CLOUD) return;
    
    // Check if we've already dismissed this version or checked recently
    const dismissedVersion = localStorage.getItem("version-check-dismissed");
    const lastCheck = localStorage.getItem("version-check-last");
    const now = Date.now();
    
    // Only check once per day
    if (lastCheck && now - parseInt(lastCheck) < 24 * 60 * 60 * 1000) {
      return;
    }
    
    localStorage.setItem("version-check-last", now.toString());

    fetch("https://app.rybbit.io/api/version")
      .then((res) => res.json())
      .then((data: { version: string }) => {
        const latest = data.version;
        const current = packageJson.version;

        // Don't show if user already dismissed this version
        if (dismissedVersion === latest) {
          return;
        }

        if (latest && latest !== current && isNewer(latest, current)) {
          toast.custom(
            (t) => (
              <div
                style={{
                  opacity: t.visible ? 1 : 0,
                  transform: t.visible ? "translateY(0)" : "translateY(-8px)",
                  transition: "opacity 200ms ease, transform 200ms ease",
                }}
                className="flex items-center gap-3 bg-white dark:bg-neutral-850 border border-neutral-150 dark:border-neutral-850 rounded-lg shadow-lg py-2 px-3 text-sm"
              >
                <span>
                  BuddyStat v{latest} is available (you&apos;re on v{current})
                </span>
                <a
                  href="https://github.com/rybbit-io/rybbit/releases"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="success" size="sm">
                    View Update
                  </Button>
                </a>
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    // Remember that user dismissed this version
                    localStorage.setItem("version-check-dismissed", latest);
                  }}
                  className="text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
                >
                  <X size={16} />
                </button>
              </div>
            ),
            { duration: 10000 }
          );
        }
      })
      .catch(() => {
        // Silently ignore - user may be offline or app.rybbit.io unreachable
      });
  }, []);

  return null;
}

function isNewer(latest: string, current: string): boolean {
  const l = latest.split(".").map(Number);
  const c = current.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((l[i] ?? 0) > (c[i] ?? 0)) return true;
    if ((l[i] ?? 0) < (c[i] ?? 0)) return false;
  }
  return false;
}
