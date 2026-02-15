import Image from "next/image";
import Link from "next/link";
import { IS_CLOUD } from "../../lib/const";
import { useWhiteLabel } from "../../hooks/useIsWhiteLabel";
import { HeartIcon } from "lucide-react";
import { Button } from "../../components/ui/button";

export function Footer() {
  const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION;
  const { isWhiteLabel } = useWhiteLabel();
  if (isWhiteLabel) {
    return null;
  }

  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-850 bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-[1100px] mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {/* Company Info */}
          <div className="space-y-4">
            <Image src="/buddystat-text.png" alt="BuddyStat" width={120} height={27} />
            {/* Social Media Links - Removed */}
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="/docs"
                  className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="/features"
                  className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="/api"
                  className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
                >
                  API Reference
                </a>
              </li>
              <li>
                <a
                  href="https://rybbit.com/affiliate"
                  className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
                >
                  50% Affiliate Program
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="/privacy"
                  className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
                >
                  Terms and Conditions
                </a>
              </li>
              <li>
                <a
                  href="/security"
                  className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
                >
                  Security
                </a>
              </li>
              {IS_CLOUD && (
                <li>
                  <a
                    href="mailto:support@buddystat.com"
                    className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
                  >
                    Support
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400">
              <span>© {new Date().getFullYear()} BuddyStat. All rights reserved.</span>
              <span className="hover:text-neutral-700 dark:hover:text-neutral-300">
                v{APP_VERSION}
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
