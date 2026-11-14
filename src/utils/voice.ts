export interface SpeechRecognitionAlternativeLike {
  transcript: string
}

export interface SpeechRecognitionResultLike {
  readonly length: number
  readonly isFinal: boolean
  [index: number]: SpeechRecognitionAlternativeLike
}

export interface SpeechRecognitionResultListLike {
  readonly length: number
  [index: number]: SpeechRecognitionResultLike
}

export interface SpeechRecognitionEventLike extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultListLike
}

export interface SpeechRecognitionErrorEventLike extends Event {
  readonly error: string
}

export interface SpeechRecognitionLike extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  processLocally?: boolean
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}

export type SpeechRecognitionQuality = 'command' | 'dictation' | 'conversation'

export type SpeechRecognitionAvailability =
  | 'available'
  | 'downloadable'
  | 'downloading'
  | 'unavailable'

export interface SpeechRecognitionOptionsLike {
  langs: string[]
  processLocally?: boolean
  quality?: SpeechRecognitionQuality
}

export interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike
  available?: (
    options: SpeechRecognitionOptionsLike,
  ) => Promise<SpeechRecognitionAvailability>
  install?: (options: SpeechRecognitionOptionsLike) => Promise<boolean>
}

export const SPEECH_LANG = 'ru-RU'

export function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') {
    return null
  }

  const scope = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }

  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null
}

const UNITS: Record<string, number> = {
  ноль: 0,
  нуль: 0,
  один: 1,
  одна: 1,
  одно: 1,
  два: 2,
  две: 2,
  три: 3,
  четыре: 4,
  пять: 5,
  шесть: 6,
  семь: 7,
  восемь: 8,
  девять: 9,
}

const TEENS: Record<string, number> = {
  десять: 10,
  одиннадцать: 11,
  двенадцать: 12,
  тринадцать: 13,
  четырнадцать: 14,
  пятнадцать: 15,
  шестнадцать: 16,
  семнадцать: 17,
  восемнадцать: 18,
  девятнадцать: 19,
}

const TENS: Record<string, number> = {
  двадцать: 20,
  тридцать: 30,
  сорок: 40,
  пятьдесят: 50,
  шестьдесят: 60,
  семьдесят: 70,
  восемьдесят: 80,
  девяносто: 90,
}

const HUNDREDS: Record<string, number> = {
  сто: 100,
  двести: 200,
  триста: 300,
  четыреста: 400,
  пятьсот: 500,
  шестьсот: 600,
  семьсот: 700,
  восемьсот: 800,
  девятьсот: 900,
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[.,!?;:()"«»]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function parseSpokenNumber(value: string): number | null {
  const text = normalize(value)

  if (!text) {
    return null
  }

  const digitGroups = text.match(/\d+/g)

  if (digitGroups && digitGroups.length > 0) {
    return Number(digitGroups.join(''))
  }

  const tokens = text
    .split(/[\s-]+/)
    .map((token) => token.replace(/[^а-я0-9]/g, ''))
    .filter(Boolean)

  let total = 0
  let current = 0
  let matched = false

  for (const token of tokens) {
    if (/^\d+$/.test(token)) {
      current += Number(token)
      matched = true
      continue
    }

    if (token in UNITS) {
      current += UNITS[token]
      matched = true
      continue
    }

    if (token in TEENS) {
      current += TEENS[token]
      matched = true
      continue
    }

    if (token in TENS) {
      current += TENS[token]
      matched = true
      continue
    }

    if (token in HUNDREDS) {
      current += HUNDREDS[token]
      matched = true
      continue
    }

    if (token.startsWith('тысяч')) {
      total += (current || 1) * 1_000
      current = 0
      matched = true
      continue
    }

    if (token.startsWith('миллион')) {
      total += (current || 1) * 1_000_000
      current = 0
      matched = true
      continue
    }

    if (token.startsWith('миллиард')) {
      total += (current || 1) * 1_000_000_000
      current = 0
      matched = true
    }
  }

  if (!matched) {
    return null
  }

  return total + current
}

export interface CashCommand {
  denomination: number
  count: number
}

export function parseCashCommand(transcript: string): CashCommand | null {
  const text = normalize(transcript)
    .replace(/кол\s*-\s*во/g, 'количество')
    .replace(/кол\s+во/g, 'количество')
    .replace(/колво/g, 'количество')
    .replace(/колличество/g, 'количество')

  const match = text.match(
    /номинал[а-я]*\s+(.+?)\s+(?:количеств[а-я]*|штук[а-я]*)\s+(.+)$/,
  )

  if (!match) {
    return null
  }

  const denominationText = match[1]
  const denomination = parseSpokenNumber(denominationText)
  const count = parseSpokenNumber(match[2])

  if (denomination === null || count === null) {
    return null
  }

  const isKopecks = denominationText.includes('коп')
  const denominationValue =
    Math.round((isKopecks ? denomination / 100 : denomination) * 100) / 100
  const countValue = Math.trunc(count)

  if (denominationValue <= 0 || countValue < 0) {
    return null
  }

  return { denomination: denominationValue, count: countValue }
}
