"use client";

import Link from "next/link";
import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useFormStatus } from "react-dom";
import type { GlucoseRangeKey } from "@/lib/types/glucose";
import { INSULIN_ENTRY_TYPES, type InsulinEntry } from "@/lib/types/insulin";
import {
  extractLinkedMealIdFromInsulinNote,
  stripLinkedMealMarkerFromInsulinNote,
} from "@/lib/utils/bolus-prefill";
import {
  formatUtcIsoForUserDisplay,
  utcIsoToDatetimeLocalInUserTimezone,
} from "@/lib/utils/datetime-local-tz";
import {
  getInsulinTakenAtTimezoneCaption,
  INSULIN_ENTRY_TYPE_LABEL_RU,
} from "@/lib/utils/insulin";
import {
  updateInsulinEntryAction,
  type InsulinActionResult,
} from "../actions";
import { FEEDBACK_ERROR, FEEDBACK_SUCCESS } from "@/lib/ui/page-patterns";

const initialState: InsulinActionResult = {
  success: false,
  error: null,
};

const inputClass =
  "mt-2 w-full rounded-2xl border border-white/15 bg-black/50 px-4 py-3 text-base text-white outline-none focus:border-white/35 disabled:opacity-60";

function SaveButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black disabled:opacity-60"
    >
      {pending ? "Сохранение…" : "Сохранить"}
    </button>
  );
}

function EditFormBody({
  entry,
  userTimezone,
  activeRange,
  activeRangeLabel,
  onSuccess,
  onCancel,
}: {
  entry: InsulinEntry;
  userTimezone: string | null;
  activeRange: GlucoseRangeKey;
  activeRangeLabel: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const takenAtParsed = utcIsoToDatetimeLocalInUserTimezone(
    entry.taken_at,
    userTimezone
  );
  const takenAtDefault = takenAtParsed.ok ? takenAtParsed.value : "";
  const timezoneFieldError = takenAtParsed.ok ? null : takenAtParsed.message;
  const blockEdit = !takenAtParsed.ok;

  const [state, formAction, isPending] = useActionState(
    async (_prev: InsulinActionResult, formData: FormData) =>
      updateInsulinEntryAction(formData),
    initialState
  );

  const takenAtTzCaption = getInsulinTakenAtTimezoneCaption(userTimezone);
  const editSaved =
    state.success &&
    Boolean(state.savedEntryTypeLabel && state.savedTakenAtDisplay);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_INSULIN_DEBUG === "1") {
      console.log("[insulin][edit-dialog][tz]", {
        entryId: entry.id,
        rawTakenAtUtc: entry.taken_at,
        userTimezoneSetting: userTimezone,
        datetimeLocalPrefill: takenAtDefault,
        labelForDisplay: formatUtcIsoForUserDisplay(
          entry.taken_at,
          userTimezone
        ),
        parseOk: takenAtParsed.ok,
      });
    }
  }, [
    entry.id,
    entry.taken_at,
    userTimezone,
    takenAtDefault,
    takenAtParsed.ok,
  ]);

  const linkedMealId = extractLinkedMealIdFromInsulinNote(entry.note);

  return (
    <form action={formAction} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
      <input type="hidden" name="entryId" value={entry.id} />
      {linkedMealId ? (
        <input type="hidden" name="linked_meal_id" value={linkedMealId} />
      ) : null}

      {editSaved && state.savedEntryTypeLabel && state.savedTakenAtDisplay ? (
        <div className="space-y-3">
          <p role="status" className={FEEDBACK_SUCCESS}>
            Запись сохранена:{" "}
            <strong className="font-medium">{state.savedEntryTypeLabel}</strong>
            {", "}
            <span className="tabular-nums">{state.savedTakenAtDisplay}</span> —
            как в журнале (время по настройкам профиля).
            {activeRange !== "all" ? (
              <>
                {" "}
                Список ниже сейчас ограничен периодом «{activeRangeLabel}» —
                запись появится только если эта дата не раньше нижней границы
                фильтра. Иначе откройте{" "}
                <Link
                  href="/insulin?range=all"
                  className="font-medium text-emerald-200/95 underline decoration-emerald-400/40 underline-offset-2"
                >
                  всё время
                </Link>
                .
              </>
            ) : (
              <> Список ниже показывает весь журнал.</>
            )}
          </p>
          <button
            type="button"
            onClick={onSuccess}
            className="w-full rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black"
          >
            Закрыть
          </button>
        </div>
      ) : null}

      {!editSaved && timezoneFieldError ? (
        <p role="alert" className={FEEDBACK_ERROR}>
          {timezoneFieldError}
        </p>
      ) : null}

      {!editSaved ? (
        <>
          <div>
            <label htmlFor={`insulin-taken-${entry.id}`} className="text-sm text-white/70">
              Когда введено
            </label>
            <input
              id={`insulin-taken-${entry.id}`}
              name="taken_at"
              type="datetime-local"
              required
              defaultValue={takenAtDefault}
              disabled={isPending || blockEdit}
              className={inputClass}
            />
            {!blockEdit ? (
              <p className="mt-1.5 text-xs leading-relaxed text-white/45">
                {takenAtTzCaption}
              </p>
            ) : null}
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm text-white/70">Тип</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {INSULIN_ENTRY_TYPES.map((key) => (
                <label key={key} className="relative block cursor-pointer">
                  <input
                    type="radio"
                    name="entry_type"
                    value={key}
                    defaultChecked={entry.entry_type === key}
                    required={key === INSULIN_ENTRY_TYPES[0]}
                    disabled={isPending || blockEdit}
                    className="peer sr-only"
                  />
                  <span className="block rounded-2xl border border-white/15 bg-white/[0.04] px-3 py-3 text-center text-sm text-white/90 peer-checked:border-white peer-checked:bg-white peer-checked:font-medium peer-checked:text-black">
                    {INSULIN_ENTRY_TYPE_LABEL_RU[key]}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor={`insulin-units-${entry.id}`} className="text-sm text-white/70">
              Единицы (УЕ)
            </label>
            <input
              id={`insulin-units-${entry.id}`}
              name="units"
              type="number"
              inputMode="decimal"
              min={0.05}
              step="any"
              required
              defaultValue={entry.units}
              disabled={isPending || blockEdit}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor={`insulin-name-${entry.id}`} className="text-sm text-white/70">
              Название инсулина{" "}
              <span className="text-white/40">(необязательно)</span>
            </label>
            <input
              id={`insulin-name-${entry.id}`}
              name="insulin_name"
              type="text"
              defaultValue={entry.insulin_name ?? ""}
              disabled={isPending || blockEdit}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor={`insulin-note-${entry.id}`} className="text-sm text-white/70">
              Заметка{" "}
              <span className="text-white/40">(необязательно)</span>
            </label>
            <textarea
              id={`insulin-note-${entry.id}`}
              name="note"
              rows={2}
              defaultValue={
                stripLinkedMealMarkerFromInsulinNote(entry.note) ?? ""
              }
              disabled={isPending || blockEdit}
              className={`${inputClass} resize-none`}
            />
          </div>

          {state.error ? (
            <p role="alert" className={FEEDBACK_ERROR}>
              {state.error}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={isPending}
              className="rounded-xl border border-white/20 px-4 py-2.5 text-sm text-white/85 hover:bg-white/5 disabled:opacity-60"
            >
              Отмена
            </button>
            <SaveButton disabled={blockEdit} />
          </div>
        </>
      ) : null}
    </form>
  );
}

type EditInsulinDialogProps = {
  entry: InsulinEntry;
  userTimezone: string | null;
  activeRange: GlucoseRangeKey;
  activeRangeLabel: string;
};

export function EditInsulinDialog({
  entry,
  userTimezone,
  activeRange,
  activeRangeLabel,
}: EditInsulinDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [session, setSession] = useState(0);

  const open = () => {
    setSession((s) => s + 1);
    dialogRef.current?.showModal();
  };

  const close = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="text-xs text-white/45 underline decoration-white/20 underline-offset-2 hover:text-white/75"
      >
        Изменить
      </button>
      <dialog
        ref={dialogRef}
        className="fixed left-[50%] top-[50%] z-[100] w-[calc(100%-2rem)] max-w-sm translate-x-[-50%] translate-y-[-50%] rounded-3xl border border-white/15 bg-neutral-950 p-5 text-white shadow-2xl open:backdrop:bg-black/65"
      >
        <div className="mb-4 flex items-start justify-between gap-2">
          <h3 className="text-base font-medium text-white">Изменить запись</h3>
          <button
            type="button"
            onClick={close}
            className="rounded-lg px-2 py-1 text-lg leading-none text-white/50 hover:bg-white/10 hover:text-white"
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>
        <EditFormBody
          key={session}
          entry={entry}
          userTimezone={userTimezone}
          activeRange={activeRange}
          activeRangeLabel={activeRangeLabel}
          onSuccess={close}
          onCancel={close}
        />
      </dialog>
    </>
  );
}
