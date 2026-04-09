"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useFormStatus } from "react-dom";
import type { GlucoseEntry } from "@/lib/types/glucose";
import {
  editGlucoseEntryAction,
  type GlucoseSubmitResult,
} from "../actions";
import { FEEDBACK_ERROR } from "@/lib/ui/page-patterns";
import { formatDatetimeLocalFromIso } from "@/lib/utils/datetime-local";

const initialState: GlucoseSubmitResult = {
  success: false,
  error: null,
};

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black disabled:opacity-60"
    >
      {pending ? "Сохранение…" : "Сохранить"}
    </button>
  );
}

function EditFormBody({
  entry,
  onSuccess,
  onCancel,
}: {
  entry: GlucoseEntry;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: GlucoseSubmitResult, formData: FormData) =>
      editGlucoseEntryAction(formData),
    initialState
  );

  useEffect(() => {
    if (state.success) {
      onSuccess();
    }
  }, [state.success, onSuccess]);

  return (
    <form
      action={formAction}
      className="max-h-[min(70vh,calc(100dvh-7rem))] space-y-4 overflow-y-auto overflow-x-hidden pr-0.5"
    >
      <input type="hidden" name="entryId" value={entry.id} />
      <div>
        <label htmlFor={`glucose-edit-${entry.id}`} className="text-sm text-white/70">
          Глюкоза
        </label>
        <input
          id={`glucose-edit-${entry.id}`}
          name="glucoseValue"
          type="number"
          min={0.1}
          step="0.1"
          inputMode="decimal"
          defaultValue={entry.glucose_value}
          disabled={isPending}
          className="mt-2 w-full rounded-2xl border border-white/15 bg-black/50 px-4 py-3 text-base text-white outline-none focus:border-white/35 disabled:opacity-60"
        />
      </div>
      <div>
        <label
          htmlFor={`glucose-edit-measured-at-${entry.id}`}
          className="text-sm text-white/70"
        >
          Дата и время замера
        </label>
        <input
          id={`glucose-edit-measured-at-${entry.id}`}
          name="measuredAt"
          type="datetime-local"
          defaultValue={formatDatetimeLocalFromIso(entry.measured_at)}
          disabled={isPending}
          className="mt-2 w-full rounded-2xl border border-white/15 bg-black/50 px-4 py-3 text-base text-white outline-none focus:border-white/35 disabled:opacity-60 [color-scheme:dark]"
        />
      </div>
      <label htmlFor={`glucose-edit-note-${entry.id}`} className="block text-sm text-white/70">
        Заметка{" "}
        <span className="text-white/40">(необязательно)</span>
        <textarea
          id={`glucose-edit-note-${entry.id}`}
          name="note"
          rows={2}
          defaultValue={entry.note ?? ""}
          disabled={isPending}
          className="mt-2 w-full resize-none rounded-2xl border border-white/15 bg-black/50 px-4 py-3 text-base text-white outline-none focus:border-white/35 disabled:opacity-60"
        />
      </label>
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
        <SaveButton />
      </div>
    </form>
  );
}

type EditGlucoseDialogProps = {
  entry: GlucoseEntry;
};

export function EditGlucoseDialog({ entry }: EditGlucoseDialogProps) {
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
        className="fixed left-[50%] top-[50%] z-[100] w-[calc(100%-2rem)] max-w-sm translate-x-[-50%] translate-y-[-50%] rounded-3xl border border-white/15 bg-neutral-950 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] text-white shadow-2xl open:backdrop:bg-black/65"
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
          key={`${session}-${entry.id}-${entry.measured_at}`}
          entry={entry}
          onSuccess={close}
          onCancel={close}
        />
      </dialog>
    </>
  );
}
