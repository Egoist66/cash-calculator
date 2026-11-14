import { formatMoney, type CurrencyCode } from '../store/cash.type'

const actionBase =
  'inline-flex min-h-11 touch-manipulation items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition active:scale-[0.98] sm:px-3.5 sm:text-sm lg:w-full'

const clearIcon = `
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="h-4 w-4">
    <path stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
`

const copyIcon = `
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="h-4 w-4">
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path stroke-linecap="round" stroke-linejoin="round" d="M5 15V6a1 1 0 0 1 1-1h9" />
  </svg>
`

const shareIcon = `
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="h-4 w-4">
    <path stroke-linecap="round" stroke-linejoin="round" d="M12 15V4m0 0L8 8m4-4 4 4" />
    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
  </svg>
`

export function TotalBlock(total: number, currency: CurrencyCode): string {
  return `
    <div class="rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-xl shadow-slate-200/60 backdrop-blur dark:border-white/10 dark:bg-slate-900/70 dark:shadow-black/40 sm:p-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-stretch lg:gap-5">
        <div>
          <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
            Всего
          </p>
          <p
            data-cash-total
            class="mt-1 break-all text-2xl font-semibold leading-tight tabular-nums text-slate-900 dark:text-white sm:text-4xl lg:text-3xl"
          >
            ${formatMoney(total, currency)}
          </p>
        </div>

        <div class="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end lg:flex-col lg:justify-start">
          <button
            type="button"
            data-clear-cash
            class="${actionBase} border border-slate-200 bg-white/70 text-slate-700 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
          >
            ${clearIcon}
            Очистить
          </button>

          <button
            type="button"
            data-copy-cash
            class="${actionBase} border border-slate-200 bg-white/70 text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
          >
            ${copyIcon}
            Скопировать
          </button>

          <button
            type="button"
            data-share-cash
            class="${actionBase} col-span-2 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            ${shareIcon}
            Поделиться
          </button>
        </div>
      </div>

      <p
        data-cash-status
        aria-live="polite"
        class="mt-3 min-h-4 text-xs font-medium text-violet-600 dark:text-violet-400"
      ></p>
    </div>
  `
}
