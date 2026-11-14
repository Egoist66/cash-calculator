const installIcon = `
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="h-4 w-4">
    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v11m0 0 4-4m-4 4-4-4" />
    <path stroke-linecap="round" stroke-linejoin="round" d="M5 17v1.5A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V17" />
  </svg>
`

export function InstallButton(): string {
  return `
    <button
      type="button"
      data-install-app
      hidden
      aria-label="Установить приложение"
      title="Установить приложение"
      class="inline-flex min-h-11 w-11 shrink-0 touch-manipulation items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-0 text-violet-700 shadow-sm transition hover:border-violet-300 hover:bg-violet-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 active:scale-[0.98] dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300 dark:hover:bg-violet-500/20 sm:min-h-0 sm:w-auto sm:px-3 sm:py-2"
    >
      ${installIcon}
      <span class="hidden text-xs font-semibold sm:inline">Установить</span>
    </button>
  `
}
