import type { Theme } from '../store/theme.store'
import { CustomDenomination } from './CustomDenomination'

const sunIcon = `
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="h-4 w-4">
    <circle cx="12" cy="12" r="4" />
    <path stroke-linecap="round" d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
`

const moonIcon = `
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="h-4 w-4">
    <path stroke-linecap="round" stroke-linejoin="round" d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
  </svg>
`

const gearIcon = `
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="h-4 w-4">
    <circle cx="12" cy="12" r="3" />
    <path stroke-linecap="round" stroke-linejoin="round" d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.51 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.26.34.6.6 1 .8.32.18.68.27 1.05.27H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z" />
  </svg>
`

const closeIcon = `
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="h-4 w-4">
    <path stroke-linecap="round" d="M6 6l12 12M18 6 6 18" />
  </svg>
`

function themeButton(
  theme: Theme,
  active: boolean,
  label: string,
  icon: string,
): string {
  return `
    <button
      type="button"
      data-theme="${theme}"
      aria-pressed="${active}"
      class="flex min-h-11 flex-1 touch-manipulation items-center justify-center rounded-xl px-3 text-xs font-semibold transition ${
        active
          ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
      }"
    >
      <span class="inline-flex items-center justify-center gap-1.5">
        ${icon}
        ${label}
      </span>
    </button>
  `
}

export function ThemeSettings(theme: Theme): string {
  return `
    <div
      role="group"
      aria-label="Тема оформления"
      class="flex w-full gap-1 rounded-2xl border border-slate-200/80 bg-white/70 p-1 shadow-sm dark:border-white/10 dark:bg-white/5"
    >
      ${themeButton('light', theme === 'light', 'Светлая', sunIcon)}
      ${themeButton('dark', theme === 'dark', 'Тёмная', moonIcon)}
    </div>
  `
}

export function SettingsButton(): string {
  return `
    <button
      type="button"
      data-settings-open
      aria-label="Настройки"
      title="Настройки"
      class="inline-flex min-h-11 w-11 shrink-0 touch-manipulation items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-white/70 text-slate-500 shadow-sm backdrop-blur transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:text-white sm:min-h-0 sm:w-auto sm:px-3 sm:py-2"
    >
      ${gearIcon}
      <span class="hidden text-xs font-semibold sm:inline">Настройки</span>
    </button>
  `
}

export function SettingsModal(theme: Theme): string {
  return `
    <div
      data-settings-dialog
      hidden
      class="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6"
    >
      <div
        data-settings-close
        class="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
      ></div>

      <div
        data-settings-panel
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        tabindex="-1"
        class="relative flex max-h-[calc(100svh-1.5rem)] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl dark:border-white/10 dark:bg-slate-900"
      >
        <header class="flex items-start justify-between gap-4 border-b border-slate-200/70 px-5 py-4 dark:border-white/10">
          <div>
            <h2
              id="settings-title"
              class="text-lg font-semibold tracking-tight text-slate-900 dark:text-white"
            >
              Настройки
            </h2>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Внешний вид и параметры приложения.
            </p>
          </div>

          <button
            type="button"
            data-settings-close
            aria-label="Закрыть настройки"
            class="inline-flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:hover:bg-white/10 dark:hover:text-white"
          >
            ${closeIcon}
          </button>
        </header>

        <div class="space-y-5 overflow-y-auto px-5 py-5">
          <section aria-labelledby="settings-theme-title">
            <h3
              id="settings-theme-title"
              class="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500"
            >
              Тема
            </h3>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Выберите оформление интерфейса.
            </p>

            <div data-settings-theme class="mt-3">
              ${ThemeSettings(theme)}
            </div>
          </section>

          <section
            aria-labelledby="settings-custom-title"
            class="border-t border-slate-200/70 pt-5 dark:border-white/10"
          >
            <h3
              id="settings-custom-title"
              class="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500"
            >
              Свой номинал
            </h3>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Добавьте нестандартный номинал в список.
            </p>

            <div class="mt-3">
              ${CustomDenomination()}
            </div>
          </section>
        </div>
      </div>
    </div>
  `
}
