import Link from "next/link";
import {
  EMPTY_STATE_DASHED,
  EMPTY_STATE_MUTED,
} from "@/lib/ui/page-patterns";

type EmptyStateProps = {
  title: string;
  description?: string;
  variant?: "dashed" | "muted";
  /** Optional calm CTA (e.g. anchor on same page). */
  action?: { href: string; label: string };
};

export function EmptyState({
  title,
  description,
  variant = "dashed",
  action,
}: EmptyStateProps) {
  const wrap = variant === "dashed" ? EMPTY_STATE_DASHED : EMPTY_STATE_MUTED;

  return (
    <div className={wrap} role="status">
      <p className="text-sm text-white/60">{title}</p>
      {description ? (
        <p className="mt-1 text-xs leading-relaxed text-white/42">{description}</p>
      ) : null}
      {action ? (
        <Link
          href={action.href}
          className="mt-4 inline-flex min-h-10 items-center justify-center rounded-2xl border border-white/18 bg-white/[0.06] px-4 py-2.5 text-sm font-medium text-white/90 transition-colors hover:border-white/28 hover:bg-white/[0.09]"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
