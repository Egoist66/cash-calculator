import type { AppContext, Cleanup } from '../../core/createApp'
import { CashFormContent } from '../components/CashForm'
import { ThemeSettings } from '../components/Settings'
import {
  addDenomination,
  cashStore,
  clearCash,
  setCount,
  setCurrency,
} from '../store/cash.store'
import {
  buildCashSummary,
  formatMoney,
  totalCash,
  type CurrencyCode,
} from '../store/cash.type'
import { setTheme, themeStore } from '../store/theme.store'
import {
  getSpeechRecognition,
  parseCashCommand,
  SPEECH_LANG,
  type SpeechRecognitionEventLike,
  type SpeechRecognitionLike,
  type SpeechRecognitionOptionsLike,
} from '../utils/voice'

function voiceErrorMessage(error: string): string {
  switch (error) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Разрешите доступ к микрофону в настройках браузера.'
    case 'no-speech':
      return 'Речь не распознана. Попробуйте ещё раз.'
    case 'audio-capture':
      return 'Микрофон не найден.'
    case 'network':
      return 'Нет связи с сервисом распознавания.'
    default:
      return 'Ошибка распознавания. Попробуйте ещё раз.'
  }
}

export const useCashCalculator = () => {
  const bindCashForm = (context: AppContext): Cleanup => {
    const form = context.container.querySelector<HTMLElement>('[data-cash-form]')

    if (!form) {
      return () => {}
    }

    const settingsDialog =
      context.container.querySelector<HTMLElement>('[data-settings-dialog]')
    const settingsPanel =
      settingsDialog?.querySelector<HTMLElement>('[data-settings-panel]') ?? null
    const settingsTheme =
      settingsDialog?.querySelector<HTMLElement>('[data-settings-theme]') ?? null
    let settingsOpen = false
    let bodyOverflow = ''

    let lastSignature = ''
    let scheduled = false
    let statusTimer: number | undefined

    const recognitionCtor = getSpeechRecognition()
    let recognition: SpeechRecognitionLike | null = null
    let voiceListening = false
    let voiceStarting = false
    let voiceSettled = false
    let voiceLocal = false
    let voiceRetried = false
    let voiceFallbackPending = false
    let voiceStatusText = recognitionCtor
      ? 'Нажмите «Слушать» и произнесите фразу.'
      : 'Голосовой ввод не поддерживается в этом браузере.'
    let voiceTranscriptText = ''

    const signature = (): string =>
      `${themeStore.theme}:${cashStore.currency}:${cashStore.nominals
        .map((item) => item.denomination)
        .join(',')}`

    const showStatus = (message: string): void => {
      const status = form.querySelector<HTMLElement>('[data-cash-status]')

      if (!status) {
        return
      }

      status.textContent = message

      if (statusTimer !== undefined) {
        window.clearTimeout(statusTimer)
      }

      statusTimer = window.setTimeout(() => {
        status.textContent = ''
        statusTimer = undefined
      }, 2200)
    }

    const sync = (): void => {
      for (const item of cashStore.nominals) {
        const sum = form.querySelector<HTMLElement>(
          `[data-cash-sum="${item.denomination}"]`,
        )

        if (sum) {
          sum.textContent = formatMoney(
            item.denomination * item.count,
            cashStore.currency,
          )
        }

        const input = form.querySelector<HTMLInputElement>(
          `[data-cash-input="${item.denomination}"]`,
        )

        if (input && document.activeElement !== input) {
          input.value = String(item.count)
        }
      }

      const total = form.querySelector<HTMLElement>('[data-cash-total]')

      if (total) {
        total.textContent = formatMoney(
          totalCash(cashStore.nominals),
          cashStore.currency,
        )
      }
    }

    const writeVoiceUi = (): void => {
      const button = form.querySelector<HTMLButtonElement>('[data-voice-toggle]')
      const label = form.querySelector<HTMLElement>('[data-voice-label]')
      const status = form.querySelector<HTMLElement>('[data-voice-status]')
      const transcript =
        form.querySelector<HTMLElement>('[data-voice-transcript]')

      if (button) {
        button.disabled = !recognitionCtor || voiceStarting
        button.dataset.listening = String(voiceListening)
        button.setAttribute('aria-pressed', String(voiceListening))
      }

      if (label) {
        label.textContent = !recognitionCtor
          ? 'Недоступно'
          : voiceStarting
            ? 'Подготовка…'
            : voiceListening
              ? 'Слушаю…'
              : 'Слушать'
      }

      if (status) {
        status.textContent = recognitionCtor
          ? voiceStatusText
          : 'Голосовой ввод не поддерживается в этом браузере.'
      }

      if (transcript) {
        transcript.textContent = voiceTranscriptText
      }
    }

    const applyVoiceCommand = (transcript: string): void => {
      const command = parseCashCommand(transcript)

      if (!command) {
        voiceStatusText = 'Не понял фразу. Скажите: «Номинал сто, количество три».'
        writeVoiceUi()
        return
      }

      const exists = cashStore.nominals.some(
        (item) => item.denomination === command.denomination,
      )
      const result = exists ? 'duplicate' : addDenomination(command.denomination)

      if (result === 'invalid') {
        voiceStatusText = 'Введите положительный целый номинал.'
        writeVoiceUi()
        return
      }

      setCount(command.denomination, command.count)
      voiceStatusText = `Готово: ${formatMoney(command.denomination, cashStore.currency)} × ${command.count}`
      writeVoiceUi()
    }

    const startRecognition = async (): Promise<void> => {
      if (!recognition) {
        return
      }

      voiceStarting = true
      voiceTranscriptText = ''
      voiceSettled = false
      voiceRetried = false
      voiceFallbackPending = false
      voiceLocal = false
      voiceStatusText = 'Проверяю локальное распознавание…'
      writeVoiceUi()

      let useLocal = false
      const availableFn = recognitionCtor?.available
      const installFn = recognitionCtor?.install

      if (availableFn && installFn) {
        const options: SpeechRecognitionOptionsLike = {
          langs: [SPEECH_LANG],
          processLocally: true,
          quality: 'command',
        }

        try {
          const availability = await availableFn(options)

          if (availability === 'available') {
            useLocal = true
          } else if (
            availability === 'downloadable' ||
            availability === 'downloading'
          ) {
            voiceStatusText = 'Загружаю языковой пакет…'
            writeVoiceUi()
            useLocal = await installFn(options)
          }
        } catch {
          useLocal = false
        }
      }

      if (!recognition) {
        return
      }

      recognition.processLocally = useLocal
      voiceLocal = useLocal
      voiceStatusText = useLocal
        ? 'Слушаю на устройстве…'
        : 'Скажите: «Номинал сто, количество три».'
      writeVoiceUi()

      try {
        recognition.start()
      } catch {
        if (useLocal) {
          voiceLocal = false
          recognition.processLocally = false

          try {
            recognition.start()
            return
          } catch {
            // Ниже покажем сообщение об ошибке.
          }
        }

        voiceStarting = false
        voiceStatusText = 'Не удалось запустить микрофон.'
        writeVoiceUi()
      }
    }

    const toggleVoice = (): void => {
      if (!recognition) {
        voiceStatusText =
          'Голосовой ввод не поддерживается в этом браузере.'
        writeVoiceUi()
        return
      }

      if (voiceStarting) {
        return
      }

      if (voiceListening) {
        voiceSettled = true
        voiceStatusText = 'Остановлено.'
        recognition.stop()
        writeVoiceUi()
        return
      }

      void startRecognition()
    }

    if (recognitionCtor) {
      const instance = new recognitionCtor()
      instance.lang = SPEECH_LANG
      instance.continuous = false
      instance.interimResults = true

      instance.onstart = () => {
        voiceListening = true
        voiceStarting = false
        voiceSettled = false
        voiceStatusText = voiceLocal
          ? 'Слушаю на устройстве…'
          : 'Слушаю…'
        writeVoiceUi()
      }

      instance.onresult = (event: SpeechRecognitionEventLike) => {
        let interim = ''
        let final = ''

        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index]
          const transcript = result[0]?.transcript ?? ''

          if (result.isFinal) {
            final += transcript
          } else {
            interim += transcript
          }
        }

        if (interim) {
          voiceTranscriptText = interim.trim()
          writeVoiceUi()
        }

        if (final) {
          voiceSettled = true
          voiceTranscriptText = final.trim()
          applyVoiceCommand(final)
        }
      }

      instance.onerror = (event) => {
        voiceListening = false
        voiceStarting = false

        if (
          voiceLocal &&
          !voiceRetried &&
          (event.error === 'language-not-supported' ||
            event.error === 'network')
        ) {
          voiceRetried = true
          voiceFallbackPending = true
          voiceSettled = true
          voiceStatusText = 'Локальный режим не сработал, пробую через сеть…'
          writeVoiceUi()
          return
        }

        voiceSettled = true
        voiceStatusText = voiceErrorMessage(event.error)
        writeVoiceUi()
      }

      instance.onend = () => {
        voiceListening = false
        voiceStarting = false

        if (voiceFallbackPending) {
          voiceFallbackPending = false
          voiceLocal = false
          voiceStarting = true

          if (recognition) {
            recognition.processLocally = false
            voiceSettled = false
            voiceStatusText = 'Скажите: «Номинал сто, количество три».'
            writeVoiceUi()

            try {
              recognition.start()
            } catch {
              voiceStarting = false
              voiceStatusText = 'Не удалось запустить микрофон.'
              writeVoiceUi()
            }
          }

          return
        }

        if (!voiceSettled) {
          voiceStatusText = 'Ничего не распознано. Попробуйте ещё раз.'
        }

        writeVoiceUi()
      }

      recognition = instance
    }

    const render = (): void => {
      form.innerHTML = CashFormContent(cashStore)
      writeVoiceUi()
    }

    const update = (): void => {
      const next = signature()

      if (next !== lastSignature) {
        lastSignature = next
        render()
        return
      }

      sync()
    }

    const schedule = (): void => {
      if (scheduled) {
        return
      }

      scheduled = true

      queueMicrotask(() => {
        scheduled = false
        update()
      })
    }

    const syncSettingsTheme = (): void => {
      if (!settingsTheme) {
        return
      }

      settingsTheme.innerHTML = ThemeSettings(themeStore.theme)
    }

    const openSettings = (): void => {
      if (!settingsDialog || settingsOpen) {
        return
      }

      settingsOpen = true
      settingsDialog.hidden = false
      bodyOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      syncSettingsTheme()

      const target =
        settingsTheme?.querySelector<HTMLElement>(
          `[data-theme="${themeStore.theme}"]`,
        ) ??
        settingsDialog.querySelector<HTMLElement>('[data-settings-close]')

      target?.focus()
    }

    const closeSettings = (): void => {
      if (!settingsDialog || !settingsOpen) {
        return
      }

      settingsOpen = false
      settingsDialog.hidden = true
      document.body.style.overflow = bodyOverflow
      bodyOverflow = ''
      form.querySelector<HTMLElement>('[data-settings-open]')?.focus()
    }

    const onSettingsClick = (event: MouseEvent): void => {
      const target = event.target

      if (!(target instanceof Element)) {
        return
      }

      const themeButton = target.closest<HTMLButtonElement>('[data-theme]')
      const theme = themeButton?.dataset.theme

      if (theme === 'light' || theme === 'dark') {
        setTheme(theme)
        return
      }

      if (target.closest('[data-settings-close]')) {
        closeSettings()
      }
    }

    const onDocumentKeydown = (event: KeyboardEvent): void => {
      if (!settingsOpen || !settingsDialog) {
        return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        closeSettings()
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const focusable = Array.from(
        settingsDialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.getClientRects().length > 0)

      if (focusable.length === 0) {
        event.preventDefault()
        settingsPanel?.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (!(active instanceof Node) || !settingsDialog.contains(active)) {
        event.preventDefault()
        first.focus()
        return
      }

      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    const copySummary = async (): Promise<void> => {
      const text = buildCashSummary(cashStore.currency, cashStore.nominals)

      try {
        await navigator.clipboard.writeText(text)
        showStatus('Скопировано')
      } catch {
        showStatus('Не удалось скопировать')
      }
    }

    const shareSummary = async (): Promise<void> => {
      const text = buildCashSummary(cashStore.currency, cashStore.nominals)

      if (typeof navigator.share === 'function') {
        try {
          await navigator.share({ title: 'Наличные', text })
          showStatus('Отправлено')
        } catch (error) {
          if (!(error instanceof DOMException) || error.name !== 'AbortError') {
            showStatus('Не удалось поделиться')
          }
        }
        return
      }

      await copySummary()
    }

    const addCustomDenomination = (): void => {
      const input = form.querySelector<HTMLInputElement>(
        '[data-custom-denomination]',
      )
      const error = form.querySelector<HTMLElement>('[data-custom-error]')
      const result = addDenomination(Number(input?.value ?? ''))

      if (result === 'invalid') {
        if (error) {
          error.textContent = 'Введите положительный номинал.'
        }
        input?.focus()
        return
      }

      if (result === 'duplicate') {
        if (error) {
          error.textContent = 'Такой номинал уже есть в списке.'
        }
        input?.focus()
        return
      }

      if (error) {
        error.textContent = ''
      }
    }

    const onClick = (event: MouseEvent): void => {
      const target = event.target

      if (!(target instanceof Element)) {
        return
      }

      if (target.closest('[data-settings-open]')) {
        openSettings()
        return
      }

      if (target.closest('[data-voice-toggle]')) {
        toggleVoice()
        return
      }

      const currencyButton = target.closest<HTMLButtonElement>('[data-currency]')

      if (currencyButton?.dataset.currency) {
        setCurrency(currencyButton.dataset.currency as CurrencyCode)
        return
      }

      if (target.closest('[data-add-denomination]')) {
        addCustomDenomination()
        return
      }

      if (target.closest('[data-clear-cash]')) {
        clearCash()
        showStatus('Очищено')
        return
      }

      if (target.closest('[data-copy-cash]')) {
        void copySummary()
        return
      }

      if (target.closest('[data-share-cash]')) {
        void shareSummary()
      }
    }

    const onInput = (event: Event): void => {
      const input = event.target

      if (!(input instanceof HTMLInputElement)) {
        return
      }

      if (input.matches('[data-custom-denomination]')) {
        const error = form.querySelector<HTMLElement>('[data-custom-error]')
        if (error) {
          error.textContent = ''
        }
        return
      }

      const denomination = Number(input.dataset.cashInput)
      const value = Number(input.value)

      setCount(
        denomination,
        Number.isFinite(value) && value > 0 ? Math.trunc(value) : 0,
      )
    }

    const onFocusOut = (event: FocusEvent): void => {
      const input = event.target

      if (!(input instanceof HTMLInputElement)) {
        return
      }

      const denomination = Number(input.dataset.cashInput)

      if (!Number.isFinite(denomination)) {
        return
      }

      const item = cashStore.nominals.find(
        (entry) => entry.denomination === denomination,
      )

      input.value = String(item?.count ?? 0)
    }

    const onKeydown = (event: KeyboardEvent): void => {
      const input = event.target

      if (
        event.key === 'Enter' &&
        input instanceof HTMLInputElement &&
        input.matches('[data-custom-denomination]')
      ) {
        event.preventDefault()
        addCustomDenomination()
      }
    }

    form.addEventListener('click', onClick)
    form.addEventListener('input', onInput)
    form.addEventListener('focusout', onFocusOut)
    form.addEventListener('keydown', onKeydown)
    settingsDialog?.addEventListener('click', onSettingsClick)
    document.addEventListener('keydown', onDocumentKeydown)

    const unsubscribeNominals = cashStore.subscribe('nominals', schedule)
    const unsubscribeCurrency = cashStore.subscribe('currency', schedule)
    const unsubscribeTheme = themeStore.subscribe('theme', () => {
      const hadThemeFocus =
        settingsOpen &&
        settingsTheme !== null &&
        settingsTheme.contains(document.activeElement)

      syncSettingsTheme()

      if (hadThemeFocus) {
        settingsTheme
          ?.querySelector<HTMLElement>(`[data-theme="${themeStore.theme}"]`)
          ?.focus()
      }

      schedule()
    })

    lastSignature = signature()
    sync()
    writeVoiceUi()

    return () => {
      form.removeEventListener('click', onClick)
      form.removeEventListener('input', onInput)
      form.removeEventListener('focusout', onFocusOut)
      form.removeEventListener('keydown', onKeydown)
      settingsDialog?.removeEventListener('click', onSettingsClick)
      document.removeEventListener('keydown', onDocumentKeydown)
      unsubscribeNominals()
      unsubscribeCurrency()
      unsubscribeTheme()

      if (settingsOpen) {
        document.body.style.overflow = bodyOverflow
        settingsOpen = false
      }

      if (recognition) {
        recognition.onstart = null
        recognition.onresult = null
        recognition.onerror = null
        recognition.onend = null
        recognition.abort()
        recognition = null
      }

      if (statusTimer !== undefined) {
        window.clearTimeout(statusTimer)
      }
    }
  }

  return {
    cashStore,
    bindCashForm,
  }
}
