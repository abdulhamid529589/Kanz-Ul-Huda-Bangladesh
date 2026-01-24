import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

export const useServiceWorker = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [hasUpdate, setHasUpdate] = useState(false)
  const [swRegistration, setSwRegistration] = useState(null)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js', { scope: '/' })
        .then((registration) => {
          console.log('Service Worker registered:', registration)
          setSwRegistration(registration)

          // Check for updates periodically
          setInterval(() => {
            registration.update()
          }, 60000) // Check every minute

          // Listen for update available
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated') {
                setHasUpdate(true)
              }
            })
          })
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })
    }

    // Handle online/offline events
    const handleOnline = () => {
      setIsOnline(true)
      toast.success('You are back online!')
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast.error('You are offline. Using cached data.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const updateServiceWorker = () => {
    if (swRegistration) {
      swRegistration.waiting?.postMessage({ type: 'SKIP_WAITING' })
      window.location.reload()
    }
  }

  const clearCache = () => {
    if (swRegistration) {
      swRegistration.active?.postMessage({ type: 'CLEAR_CACHE' })
      toast.success('Cache cleared')
    }
  }

  return {
    isOnline,
    hasUpdate,
    updateServiceWorker,
    clearCache,
  }
}

export default useServiceWorker
