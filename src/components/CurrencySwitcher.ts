import {
  CURRENCIES,
  CURRENCY_CODES,
  type CurrencyCode,
} from '../store/cash.type'

function currencyButton(code: CurrencyCode, active: boolean): string {
  return `
    <button
      type="button"
      data-currency="${code}"
      aria-pressed="${active}"
      title="${CURRENCIES[code].label}"
      class="min-h-11 flex-1 touch-manipulation rounded-xl px-3 text-xs font-semibold tabular-nums transition sm:min-h-0 sm:flex-none sm:py-2 ${
        active
          ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
      }"
    >
      ${CURRENCIES[code].shortLabel}
    </button>
  `
}

export function CurrencySwitcher(current: CurrencyCode): string {
  return `
    <div
      role="group"
      aria-label="Валюта"
      class="inline-flex w-full gap-1 rounded-2xl border border-slate-200/80 bg-white/70 p-1 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 sm:w-auto"
    >
      ${CURRENCY_CODES.map((code) => currencyButton(code, code === current)).join('')}
    </div>
  `
}
