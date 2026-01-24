import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { syncPendingRequests } from '../utils/offlineDB'

export function useSyncOnReconnect() {
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState(null)

  useEffect(() => {
    const handleOnline = async () => {
      if (isSyncing) return // Prevent duplicate syncs

      setIsSyncing(true)
      toast.loading('Syncing offline data...')

      try {
        const result = await syncPendingRequests()

        setSyncStatus(result)

        if (result.synced > 0 || result.failed > 0) {
          toast.dismiss()
          if (result.failed === 0) {
            toast.success(`✓ Synced ${result.synced} requests`)
          } else {
            toast.error(`${result.synced} synced, ${result.failed} failed`)
          }
        } else {
          toast.dismiss()
        }
      } catch (error) {
        toast.dismiss()
        toast.error('Sync failed. Retry when online.')
        console.error('Sync error:', error)
      } finally {
        setIsSyncing(false)
      }
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [isSyncing])

  return { isSyncing, syncStatus }
}

export default useSyncOnReconnect
