const micIcon = `
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="h-4 w-4">
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path stroke-linecap="round" d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </svg>
`

export function VoiceInput(): string {
  return `
    <div class="rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div class="min-w-0">
          <p class="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
            Голосовой ввод
          </p>
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Скажите например: «Номинал сто, количество три».
          </p>
          <p class="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
            Первый запуск может скачать языковой пакет.
          </p>
        </div>

        <button
          type="button"
          data-voice-toggle
          aria-pressed="false"
          class="inline-flex min-h-11 w-full shrink-0 touch-manipulation items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 data-[listening=true]:bg-rose-600 data-[listening=true]:hover:bg-rose-500 sm:w-auto"
        >
          ${micIcon}
          <span data-voice-label>Слушать</span>
        </button>
      </div>

      <p
        data-voice-status
        aria-live="polite"
        class="mt-3 min-h-4 text-xs font-medium text-violet-600 dark:text-violet-400"
      ></p>

      <p
        data-voice-transcript
        class="mt-1 min-h-4 break-words text-xs italic text-slate-500 dark:text-slate-400"
      ></p>
    </div>
  `
}
