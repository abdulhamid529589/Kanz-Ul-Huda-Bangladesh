import { useRef, useCallback } from 'react'

/**
 * useCache Hook
 * Caches data with 5-minute TTL to prevent redundant API calls
 * Time Complexity: O(1) - Hash map lookup
 * Performance: Eliminates API calls for recently fetched data
 */
export const useCache = () => {
  const cache = useRef({})

  const get = useCallback((key) => {
    const cached = cache.current[key]
    if (!cached) return null

    // Check if cache is still valid (5 minutes)
    if (Date.now() - cached.timestamp > 5 * 60 * 1000) {
      delete cache.current[key]
      return null
    }

    return cached.data
  }, [])

  const set = useCallback((key, data) => {
    cache.current[key] = {
      data,
      timestamp: Date.now(),
    }
  }, [])

  const clear = useCallback((key) => {
    if (key) {
      delete cache.current[key]
    } else {
      cache.current = {}
    }
  }, [])

  return { get, set, clear }
}
