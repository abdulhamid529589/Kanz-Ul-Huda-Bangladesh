/**
 * IndexedDB Utility for Offline Data Syncing
 *
 * Manages queueing and syncing of API requests when offline
 */

const DB_NAME = 'kanz-ul-huda-offline'
const DB_VERSION = 1
const STORE_NAME = 'pending-requests'

class OfflineDB {
  constructor() {
    this.db = null
    this.initialized = false
  }

  async init() {
    return new Promise((resolve, reject) => {
      if (this.initialized) {
        resolve(this.db)
        return
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        this.initialized = true
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
          store.createIndex('timestamp', 'timestamp', { unique: false })
          store.createIndex('status', 'status', { unique: false })
        }
      }
    })
  }

  async addRequest(request) {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      const data = {
        ...request,
        timestamp: Date.now(),
        status: 'pending',
      }

      const addRequest = store.add(data)
      addRequest.onerror = () => reject(addRequest.error)
      addRequest.onsuccess = () => resolve(addRequest.result)
    })
  }

  async getPendingRequests() {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index('status')

      const query = index.getAll('pending')
      query.onerror = () => reject(query.error)
      query.onsuccess = () => resolve(query.result)
    })
  }

  async updateRequestStatus(id, status, response = null) {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      const getRequest = store.get(id)
      getRequest.onsuccess = () => {
        const data = getRequest.result
        data.status = status
        if (response) data.response = response
        data.updatedAt = Date.now()

        const updateRequest = store.put(data)
        updateRequest.onerror = () => reject(updateRequest.error)
        updateRequest.onsuccess = () => resolve(data)
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  async removeRequest(id) {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      const deleteRequest = store.delete(id)
      deleteRequest.onerror = () => reject(deleteRequest.error)
      deleteRequest.onsuccess = () => resolve(true)
    })
  }

  async clearAll() {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      const clearRequest = store.clear()
      clearRequest.onerror = () => reject(clearRequest.error)
      clearRequest.onsuccess = () => resolve(true)
    })
  }
}

export const offlineDB = new OfflineDB()

/**
 * Sync pending requests when connection is restored
 */
export async function syncPendingRequests() {
  try {
    const pending = await offlineDB.getPendingRequests()

    if (pending.length === 0) {
      console.log('✓ No pending requests to sync')
      return { synced: 0, failed: 0 }
    }

    let synced = 0
    let failed = 0

    for (const request of pending) {
      try {
        const response = await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body,
        })

        if (response.ok) {
          const data = await response.json()
          await offlineDB.updateRequestStatus(request.id, 'completed', data)
          synced++
          console.log(`✓ Synced request ${request.id}`)
        } else {
          await offlineDB.updateRequestStatus(request.id, 'failed')
          failed++
          console.error(`✗ Failed to sync request ${request.id}`)
        }
      } catch (error) {
        await offlineDB.updateRequestStatus(request.id, 'failed')
        failed++
        console.error(`✗ Error syncing request ${request.id}:`, error)
      }
    }

    console.log(`✓ Sync complete: ${synced} synced, ${failed} failed`)
    return { synced, failed }
  } catch (error) {
    console.error('✗ Sync error:', error)
    return { synced: 0, failed: 0, error: error.message }
  }
}

/**
 * Create an offline-aware fetch wrapper
 */
export function createOfflineFetch(options = {}) {
  const { queueOnOffline = true } = options

  return async function offlineFetch(url, fetchOptions = {}) {
    // If online, use regular fetch
    if (navigator.onLine) {
      return fetch(url, fetchOptions)
    }

    // If offline and queueing is enabled, queue the request
    if (queueOnOffline && ['POST', 'PUT', 'DELETE'].includes(fetchOptions.method)) {
      try {
        const requestId = await offlineDB.addRequest({
          url,
          method: fetchOptions.method,
          headers: fetchOptions.headers || {},
          body: fetchOptions.body,
        })

        console.log(`📋 Queued request ${requestId} for offline syncing`)

        // Return a mock response that indicates offline queueing
        return new Response(
          JSON.stringify({
            success: false,
            offline: true,
            queueId: requestId,
            message: 'Request queued for offline syncing',
          }),
          {
            status: 202,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      } catch (error) {
        console.error('Error queueing offline request:', error)
      }
    }

    // Return offline error response
    return new Response(
      JSON.stringify({
        success: false,
        offline: true,
        error: 'You are offline. Check your connection.',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}

export default offlineDB
