import { reactive } from '../../core/reactive'
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  isDefaultDenomination,
  type CashItem,
  type CurrencyCode,
} from './cash.type'

const STORAGE_KEY = 'cash-calculator:state'

interface PersistedCashState {
  currency: CurrencyCode
  nominals: CashItem[]
}

export function createNominals(currency: CurrencyCode): CashItem[] {
  return CURRENCIES[currency].denominations.map((denomination) => ({
    denomination,
    count: 0,
  }))
}

function normalizeDenomination(value: unknown): number | null {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return null
  }

  const denomination = Math.round(number * 100) / 100
  return denomination > 0 ? denomination : null
}

function normalizeCount(value: unknown): number {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? Math.trunc(number) : 0
}

function loadState(): PersistedCashState {
  const fallback: PersistedCashState = {
    currency: DEFAULT_CURRENCY,
    nominals: createNominals(DEFAULT_CURRENCY),
  }

  if (typeof localStorage === 'undefined') {
    return fallback
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return fallback
    }

    const parsed: unknown = JSON.parse(raw)

    if (!parsed || typeof parsed !== 'object') {
      return fallback
    }

    const data = parsed as Partial<PersistedCashState>
    const currency =
      data.currency && data.currency in CURRENCIES
        ? data.currency
        : DEFAULT_CURRENCY

    const counts = new Map<number, number>()

    for (const denomination of CURRENCIES[currency].denominations) {
      counts.set(denomination, 0)
    }

    if (Array.isArray(data.nominals)) {
      for (const item of data.nominals) {
        if (!item || typeof item !== 'object') {
          continue
        }

        const denomination = normalizeDenomination(item.denomination)

        if (denomination === null) {
          continue
        }

        counts.set(denomination, normalizeCount(item.count))
      }
    }

    const nominals = [...counts.entries()]
      .sort(([a], [b]) => a - b)
      .map(([denomination, count]) => ({ denomination, count }))

    return { currency, nominals }
  } catch {
    return fallback
  }
}

const initialState = loadState()

export const cashStore = reactive(
  {
    currency: initialState.currency,
    nominals: initialState.nominals,
  },
  { deep: true },
)

export type CashStorType = typeof cashStore

let persistTimer: ReturnType<typeof setTimeout> | undefined

function persist(): void {
  if (typeof localStorage === 'undefined') {
    return
  }

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        currency: cashStore.currency,
        nominals: cashStore.nominals.map(({ denomination, count }) => ({
          denomination,
          count,
        })),
      }),
    )
  } catch {
    // Хранилище может быть недоступно (private mode, лимит квоты).
  }
}

function schedulePersist(): void {
  if (persistTimer !== undefined) {
    clearTimeout(persistTimer)
  }

  persistTimer = setTimeout(() => {
    persistTimer = undefined
    persist()
  }, 120)
}

cashStore.subscribe('currency', schedulePersist)
cashStore.subscribe('nominals', schedulePersist)

export function setCurrency(currency: CurrencyCode): void {
  if (cashStore.currency === currency) {
    return
  }

  cashStore.currency = currency
  cashStore.nominals = createNominals(currency)
}

export function setCount(denomination: number, count: number): void {
  const item = cashStore.nominals.find(
    (entry) => entry.denomination === denomination,
  )

  if (!item) {
    return
  }

  item.count = Number.isFinite(count) && count > 0 ? Math.trunc(count) : 0
}

export function clearCash(): void {
  cashStore.nominals = cashStore.nominals.map((item) => ({
    denomination: item.denomination,
    count: 0,
  }))
}

export function removeDenomination(denomination: number): boolean {
  if (isDefaultDenomination(denomination, cashStore.currency)) {
    return false
  }

  const next = cashStore.nominals.filter(
    (item) => item.denomination !== denomination,
  )

  if (next.length === cashStore.nominals.length) {
    return false
  }

  cashStore.nominals = next
  return true
}

export type AddDenominationResult = 'added' | 'invalid' | 'duplicate'

export function addDenomination(denomination: number): AddDenominationResult {
  if (!Number.isFinite(denomination)) {
    return 'invalid'
  }

  const value = Math.round(denomination * 100) / 100

  if (value <= 0) {
    return 'invalid'
  }

  if (cashStore.nominals.some((item) => item.denomination === value)) {
    return 'duplicate'
  }

  const current = cashStore.nominals.map((item) => ({
    denomination: item.denomination,
    count: item.count,
  }))

  cashStore.nominals = [
    ...current,
    { denomination: value, count: 0 },
  ].sort((a, b) => a.denomination - b.denomination)

  return 'added'
}
