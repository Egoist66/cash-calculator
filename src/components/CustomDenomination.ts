export function CustomDenomination(): string {
  return `
    <div>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label class="flex-1">
          <span class="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
            Номинал
          </span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            inputmode="decimal"
            placeholder="Например, 300 или 0,5"
            data-custom-denomination
            class="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-base font-semibold tabular-nums text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-300 hover:border-slate-300 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-600 dark:hover:border-white/20 dark:focus:border-violet-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </label>

        <button
          type="button"
          data-add-denomination
          class="inline-flex min-h-11 w-full shrink-0 touch-manipulation items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98] dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 sm:w-auto"
        >
          Добавить
        </button>
      </div>

      <p
        data-custom-error
        aria-live="polite"
        class="mt-2 min-h-4 text-xs text-rose-500 dark:text-rose-400"
      ></p>
    </div>
  `
}
