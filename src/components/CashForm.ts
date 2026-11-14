import type { CashStorType } from '../store/cash.store'
import { totalCash } from '../store/cash.type'
import { themeStore } from '../store/theme.store'
import { CashList } from './CashList'
import { CurrencySwitcher } from './CurrencySwitcher'
import { InstallButton } from './InstallButton'
import { SettingsButton, SettingsModal } from './Settings'
import { TotalBlock } from './TotalBlock'
import { VoiceInput } from './VoiceInput'

export function CashForm(store: CashStorType): string {
  return `
    <section data-cash-form class="flex w-full flex-1 items-start justify-center bg-gradient-to-b from-slate-50 via-white to-slate-50 px-3 py-8 text-left dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 sm:px-6 sm:py-14">
      ${CashFormContent(store)}
    </section>
    ${SettingsModal(themeStore.theme)}
  `
}

export function CashFormContent(store: CashStorType): string {
  return `
    <div class="w-full max-w-4xl">
      <header class="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-7 sm:gap-5">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-500 dark:text-violet-400">
            Cash calculator
          </p>
          <h1 class="mb-0 mt-2 text-[28px] font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Наличные
          </h1>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Укажите количество банкнот каждого номинала.
          </p>
        </div>

        <div class="flex w-full items-stretch gap-2 sm:w-auto sm:items-center">
          ${InstallButton()}
          ${CurrencySwitcher(store.currency)}
          ${SettingsButton()}
        </div>
      </header>

      <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
        <div class="order-2 flex min-w-0 flex-col gap-4 lg:order-1">
          ${CashList(store.nominals, store.currency)}
          ${VoiceInput()}
        </div>

        <div class="order-1 min-w-0 lg:order-2 lg:sticky lg:top-6">
          ${TotalBlock(totalCash(store.nominals), store.currency)}
        </div>
      </div>
    </div>
  `
}
