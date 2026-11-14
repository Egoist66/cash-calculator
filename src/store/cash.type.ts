export type CurrencyCode = 'RUB' | 'BYN' | 'USD'

export interface CurrencyConfig {
  code: CurrencyCode
  label: string
  shortLabel: string
  symbol: string
  locale: string
  denominations: readonly number[]
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  RUB: {
    code: 'RUB',
    label: 'Рубли',
    shortLabel: '₽ RUB',
    symbol: '₽',
    locale: 'ru-RU',
    denominations: [
      0.05,
      0.1,
      0.5,
      1,
      2,
      5,
      10,
      50,
      100,
      200,
      500,
      1000,
      2000,
      5000,
    ],
  },
  BYN: {
    code: 'BYN',
    label: 'Белорусские рубли',
    shortLabel: 'Br BYN',
    symbol: 'Br',
    locale: 'ru-RU',
    denominations: [
      0.01,
      0.02,
      0.05,
      0.1,
      0.2,
      0.5,
      1,
      2,
      5,
      10,
      20,
      50,
      100,
      200,
      500,
    ],
  },
  USD: {
    code: 'USD',
    label: 'Доллары',
    shortLabel: '$ USD',
    symbol: '$',
    locale: 'en-US',
    denominations: [1, 2, 5, 10, 20, 50, 100],
  },
}

export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[]

export const DEFAULT_CURRENCY: CurrencyCode = 'RUB'

export interface CashItem {
  denomination: number
  count: number
}

export function isDefaultDenomination(
  denomination: number,
  currency: CurrencyCode,
): boolean {
  return CURRENCIES[currency].denominations.includes(denomination)
}

const moneyFormatters: Record<CurrencyCode, Intl.NumberFormat> = {
  RUB: new Intl.NumberFormat(CURRENCIES.RUB.locale, {
    maximumFractionDigits: 2,
  }),
  BYN: new Intl.NumberFormat(CURRENCIES.BYN.locale, {
    maximumFractionDigits: 2,
  }),
  USD: new Intl.NumberFormat(CURRENCIES.USD.locale, {
    maximumFractionDigits: 2,
  }),
}

export function formatMoney(value: number, currency: CurrencyCode): string {
  if (value > 0 && value < 1) {
    const minor = Math.round(value * 100)

    if (minor > 0 && minor < 100) {
      if (currency === 'RUB' || currency === 'BYN') {
        return `${minor} коп.`
      }

      if (currency === 'USD') {
        return `${minor} ¢`
      }
    }
  }

  return `${moneyFormatters[currency].format(value)} ${CURRENCIES[currency].symbol}`
}

export function totalCash(nominals: readonly CashItem[]): number {
  return nominals.reduce(
    (total, item) => total + item.denomination * item.count,
    0,
  )
}

export function buildCashSummary(
  currency: CurrencyCode,
  nominals: readonly CashItem[],
): string {
  const filled = nominals
    .filter((item) => item.count > 0)
    .map(
      (item) =>
        `• ${formatMoney(item.denomination, currency)} × ${item.count} = ${formatMoney(
          item.denomination * item.count,
          currency,
        )}`,
    )

  return [
    `Наличные (${CURRENCIES[currency].label})`,
    ...(filled.length > 0 ? filled : ['Номиналы не заполнены']),
    '',
    `Всего: ${formatMoney(totalCash(nominals), currency)}`,
  ].join('\n')
}
