import {
  isDefaultDenomination,
  type CashItem,
  type CurrencyCode,
} from '../store/cash.type'
import { CashRow, rowGrid } from './CashRow'

export function CashList(
  nominals: readonly CashItem[],
  currency: CurrencyCode,
): string {
  const rows = nominals
    .map((item) =>
      CashRow(
        item,
        currency,
        !isDefaultDenomination(item.denomination, currency),
      ),
    )
    .join('')

  return `
    <div class="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 shadow-xl shadow-slate-200/60 backdrop-blur dark:border-white/10 dark:bg-slate-900/70 dark:shadow-black/40">
      <div class="${rowGrid} border-b border-slate-200/70 px-3 py-2.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:border-white/10 dark:text-slate-500 sm:px-6 sm:py-3 sm:text-[10px] sm:tracking-[0.14em]">
        <span>Номинал</span>
        <span></span>
        <span class="text-center">Кол-во</span>
        <span></span>
        <span class="text-right">Сумма</span>
        <span></span>
      </div>

      ${rows}
    </div>
  `
}
