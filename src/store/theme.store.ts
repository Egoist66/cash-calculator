import { reactive } from '../../core/reactive'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'cash-calculator:theme'

function prefersDark(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )
}

function loadTheme(): Theme {
  if (typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)

      if (stored === 'light' || stored === 'dark') {
        return stored
      }
    } catch {
      // Хранилище может быть недоступно.
    }
  }

  return prefersDark() ? 'dark' : 'light'
}

function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme
}

export const themeStore = reactive({ theme: loadTheme() })

applyTheme(themeStore.theme)

export function setTheme(theme: Theme): void {
  if (themeStore.theme === theme) {
    return
  }

  themeStore.theme = theme
  applyTheme(theme)

  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Хранилище может быть недоступно.
    }
  }
}
