import type { AppContext, Cleanup } from '../../core/createApp'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function initInstallPrompt(context: AppContext): Cleanup {
  const button = context.container.querySelector<HTMLButtonElement>(
    '[data-install-app]',
  )

  if (!button) {
    return () => {}
  }

  if (isStandalone()) {
    button.remove()
    return () => {}
  }

  const onBeforeInstallPrompt = (event: Event): void => {
    event.preventDefault()
    deferredPrompt = event as BeforeInstallPromptEvent
    button.hidden = false
  }

  const onClick = async (): Promise<void> => {
    if (!deferredPrompt) {
      return
    }

    const promptEvent = deferredPrompt
    deferredPrompt = null
    button.hidden = true

    await promptEvent.prompt()
    await promptEvent.userChoice
  }

  const onInstalled = (): void => {
    deferredPrompt = null
    button.hidden = true
    button.remove()
  }

  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  window.addEventListener('appinstalled', onInstalled)
  button.addEventListener('click', onClick)

  return () => {
    window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.removeEventListener('appinstalled', onInstalled)
    button.removeEventListener('click', onClick)
  }
}
