"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useFormStatus } from "react-dom";
import {
  deleteMealEntryAction,
  type MealActionResult,
} from "../actions";
import { FEEDBACK_ERROR } from "@/lib/ui/page-patterns";

const initialState: MealActionResult = {
  success: false,
  error: null,
};

function DeleteConfirmButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-red-600/90 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60"
    >
      {pending ? "Удаление…" : "Удалить"}
    </button>
  );
}

function DeleteConfirmForm({
  mealEntryId,
  onSuccess,
  onCancel,
}: {
  mealEntryId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: MealActionResult, formData: FormData) =>
      deleteMealEntryAction(formData),
    initialState
  );

  useEffect(() => {
    if (state.success) {
      onSuccess();
    }
  }, [state.success, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="mealEntryId" value={mealEntryId} />
      <p className="text-sm text-white/70">
        Удалить этот приём пищи и все позиции? Действие нельзя отменить.
      </p>
      {state.error ? (
        <p role="alert" className={FEEDBACK_ERROR}>
          {state.error}
        </p>
      ) : null}
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="rounded-xl border border-white/20 px-4 py-2.5 text-sm text-white/85 hover:bg-white/5 disabled:opacity-60"
        >
          Отмена
        </button>
        <DeleteConfirmButton />
      </div>
    </form>
  );
}

type DeleteMealButtonProps = {
  mealEntryId: string;
};

export function DeleteMealButton({ mealEntryId }: DeleteMealButtonProps) {
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
        className="text-xs text-white/45 underline decoration-white/20 underline-offset-2 hover:text-red-300/90"
      >
        Удалить
      </button>
      <dialog
        ref={dialogRef}
        className="fixed left-[50%] top-[50%] z-[100] w-[calc(100%-2rem)] max-w-sm translate-x-[-50%] translate-y-[-50%] rounded-3xl border border-white/15 bg-neutral-950 p-5 text-white shadow-2xl open:backdrop:bg-black/65"
      >
        <div className="mb-4 flex items-start justify-between gap-2">
          <h3 className="text-base font-medium text-white">Удаление</h3>
          <button
            type="button"
            onClick={close}
            className="rounded-lg px-2 py-1 text-lg leading-none text-white/50 hover:bg-white/10 hover:text-white"
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>
        <DeleteConfirmForm
          key={session}
          mealEntryId={mealEntryId}
          onSuccess={close}
          onCancel={close}
        />
      </dialog>
    </>
  );
}
