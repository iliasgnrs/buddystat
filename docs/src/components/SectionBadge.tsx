import { cn } from "@/lib/utils";

interface SectionBadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionBadge({ children, className }: SectionBadgeProps) {
  return (
    <div
      className={cn(
        "inline-block bg-gradient-to-br from-fuchsia-600/20 to-fuchsia-700/15 dark:from-fuchsia-600/15 dark:to-fuchsia-700/10 border border-fuchsia-600/30 dark:border-fuchsia-600/20 shadow-md shadow-fuchsia-600/10 dark:shadow-fuchsia-600/5 text-fuchsia-600 dark:text-fuchsia-300 px-3 py-1 rounded-sm text-sm font-medium",
        className
      )}
    >
      {children}
    </div>
  );
}
