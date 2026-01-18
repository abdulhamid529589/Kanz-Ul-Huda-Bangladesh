import { useState, useEffect } from 'react'

/**
 * Hook to detect screen size breakpoints
 * @param {string} query - Media query string (e.g., '(min-width: 1024px)')
 * @returns {boolean} - Whether the query matches
 */
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches
    }
    return false
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia(query)

    const handler = (event) => {
      setMatches(event.matches)
    }

    // Set initial value
    setMatches(mediaQuery.matches)

    // Listen for changes
    mediaQuery.addEventListener('change', handler)

    return () => {
      mediaQuery.removeEventListener('change', handler)
    }
  }, [query])

  return matches
}

/**
 * Hook to check if device is mobile
 * @returns {boolean}
 */
export const useIsMobile = () => {
  return useMediaQuery('(max-width: 768px)')
}

/**
 * Hook to check if device is tablet
 * @returns {boolean}
 */
export const useIsTablet = () => {
  return useMediaQuery('(min-width: 769px) and (max-width: 1023px)')
}

/**
 * Hook to check if device is desktop
 * @returns {boolean}
 */
export const useIsDesktop = () => {
  return useMediaQuery('(min-width: 1024px)')
}
