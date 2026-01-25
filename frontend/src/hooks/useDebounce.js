import { useState, useEffect } from 'react'

/**
 * useDebounce Hook
 * Delays value updates to reduce rapid API calls
 * Time Complexity: O(1) - Simple state update
 * Performance: Reduces API calls from 10/sec to 1 per 300ms
 */
export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
