import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'

export const OfflineIndicator = ({ hasUpdate, onUpdate }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setIsSyncing(true)
      setTimeout(() => setIsSyncing(false), 2000)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Offline indicator
  if (!isOnline) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-red-500 text-white px-4 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <WifiOff size={16} />
          <span>You are offline. Using cached data.</span>
        </div>
        <span className="text-xs opacity-75">Changes will sync when online</span>
      </div>
    )
  }

  // Update available indicator
  if (hasUpdate) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-blue-500 text-white px-4 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <RefreshCw size={16} />
          <span>A new version is available</span>
        </div>
        <button
          onClick={onUpdate}
          className="px-3 py-1 bg-white text-blue-500 rounded hover:bg-blue-50 font-medium text-xs"
        >
          Reload
        </button>
      </div>
    )
  }

  // Syncing indicator (shown briefly when coming back online)
  if (isSyncing) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-green-500 text-white px-4 py-2 flex items-center gap-2 text-sm animate-pulse">
        <RefreshCw size={16} className="animate-spin" />
        <span>Syncing data...</span>
      </div>
    )
  }

  return null
}

export default OfflineIndicator
