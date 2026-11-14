import {
  formatMoney,
  type CashItem,
  type CurrencyCode,
} from '../store/cash.type'

export const rowGrid =
  'grid grid-cols-[4.25rem_0.75rem_minmax(0,0.85fr)_0.75rem_minmax(0,1.15fr)_2.5rem] items-center gap-x-1 sm:grid-cols-[5.5rem_1.25rem_6rem_1.25rem_minmax(0,1fr)_2.5rem] sm:gap-x-4'

const trashIcon = `
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="h-4 w-4">
    <path stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
`

export function CashRow(
  item: CashItem,
  currency: CurrencyCode,
  isCustom: boolean,
): string {
  const sum = item.denomination * item.count
  const formattedDenomination = formatMoney(item.denomination, currency)

  return `
    <div class="${rowGrid} border-b border-slate-100 px-3 py-2.5 transition-colors last:border-b-0 hover:bg-violet-50/60 dark:border-white/5 dark:hover:bg-white/5 sm:px-6 sm:py-3">
      <span class="inline-flex h-8 w-full min-w-0 items-center justify-center rounded-lg bg-violet-50 px-1.5 text-xs font-semibold tabular-nums text-violet-700 ring-1 ring-inset ring-violet-500/10 dark:bg-violet-500/10 dark:text-violet-300 sm:h-9 sm:rounded-xl sm:px-3 sm:text-sm">
        ${formattedDenomination}
      </span>

      <span class="text-center text-base font-light text-slate-400 dark:text-slate-500 sm:text-lg">×</span>

      <input
        type="number"
        min="0"
        step="1"
        inputmode="numeric"
        placeholder="0"
        value="${item.count}"
        data-cash-input="${item.denomination}"
        aria-label="Количество номиналом ${formattedDenomination}"
        class="min-w-0 w-full rounded-lg border border-slate-200 bg-slate-50/80 px-1.5 py-2.5 text-center text-base font-semibold tabular-nums text-slate-900 outline-none transition placeholder:text-slate-300 hover:border-slate-300 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-600 dark:hover:border-white/20 dark:focus:border-violet-400 dark:focus:bg-white/10 sm:rounded-xl sm:px-2 sm:py-2 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />

      <span class="text-center text-base font-light text-slate-400 dark:text-slate-500 sm:text-lg">=</span>

      <span
        data-cash-sum="${item.denomination}"
        class="min-w-0 break-all text-right text-[11px] font-semibold tabular-nums text-slate-900 dark:text-white sm:text-base"
      >
        ${formatMoney(sum, currency)}
      </span>

      ${
        isCustom
          ? `
        <button
          type="button"
          data-remove-denomination="${item.denomination}"
          aria-label="Удалить номинал ${formattedDenomination}"
          title="Удалить номинал"
          class="inline-flex h-10 w-10 touch-manipulation items-center justify-center justify-self-end rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:hover:bg-rose-500/10 dark:hover:text-rose-300 sm:h-9 sm:w-9"
        >
          ${trashIcon}
        </button>
      `
          : '<span aria-hidden="true"></span>'
      }
    </div>
  `
}
