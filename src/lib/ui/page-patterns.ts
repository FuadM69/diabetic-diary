/**
 * Shared Tailwind class strings for main AppShell pages.
 * Keeps spacing, surfaces, and feedback visually aligned across modules.
 */

/** Standard column under the header (mobile-first). */
export const PAGE_CONTAINER =
  "mx-auto w-full max-w-lg space-y-6 pb-4";

/** Primary panel: forms, main blocks. */
export const SURFACE_CARD =
  "rounded-3xl border border-white/10 bg-white/[0.04] p-4 sm:p-5";

/** Chart / secondary inset panel. */
export const SURFACE_INSET =
  "rounded-3xl border border-white/10 bg-white/[0.03] p-3 sm:p-4";

/** Section heading under the intro (h2). */
export const SECTION_TITLE = "text-sm font-medium text-white/80";

/** Intro / subtitle copy under filters or title. */
export const INTRO_TEXT = "text-sm leading-relaxed text-white/60";

/** Small legal / hint callout (export, bolus). */
export const CALLOUT_SUBTLE =
  "rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs leading-snug text-white/45";

/** Inline validation / server action errors. */
export const FEEDBACK_ERROR = "text-sm text-red-300";

/** Success / saved confirmation (polite). */
export const FEEDBACK_SUCCESS = "text-sm text-emerald-300/90";

/** Dashed empty list / period (friendly, actionable copy in children). */
export const EMPTY_STATE_DASHED =
  "rounded-3xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-12 text-center";

export const EMPTY_STATE_MUTED =
  "rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-6 text-center text-sm text-white/50";
