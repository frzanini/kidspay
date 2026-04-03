import { useState, useEffect } from 'react'

// Captura o evento antes do React montar — resolve o timing issue do Chrome
let _cachedPrompt = null
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  _cachedPrompt = e
})

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(() => _cachedPrompt)
  const [installed, setInstalled]           = useState(isStandalone)

  useEffect(() => {
    if (installed) return

    // Sincroniza caso o evento tenha chegado depois da montagem
    if (_cachedPrompt && !deferredPrompt) {
      setDeferredPrompt(_cachedPrompt)
    }

    function onBeforeInstall(e) {
      e.preventDefault()
      _cachedPrompt = e
      setDeferredPrompt(e)
    }

    function onAppInstalled() {
      _cachedPrompt = null
      setInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onAppInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [installed, deferredPrompt])

  async function promptInstall() {
    const prompt = deferredPrompt || _cachedPrompt
    if (!prompt) return
    try {
      await prompt.prompt()
      const { outcome } = await prompt.userChoice
      if (outcome === 'accepted') {
        setInstalled(true)
        _cachedPrompt = null
      }
    } catch {
      // prompt() só pode ser chamado uma vez — descarta e aguarda novo evento
      _cachedPrompt = null
      setDeferredPrompt(null)
    }
  }

  const canInstall = !installed && (deferredPrompt !== null || _cachedPrompt !== null)

  return { canInstall, promptInstall }
}
