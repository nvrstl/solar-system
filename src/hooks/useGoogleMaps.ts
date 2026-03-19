import { useState, useEffect } from 'react'

interface UseGoogleMapsResult {
  isLoaded: boolean
  error: string | null
}

declare global {
  interface Window {
    initMap?: () => void
  }
}

export function useGoogleMaps(apiKey: string | null): UseGoogleMapsResult {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!apiKey) return

    // Already loaded
    if (window.google?.maps) {
      setIsLoaded(true)
      return
    }

    // Expose callback
    window.initMap = () => {
      setIsLoaded(true)
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=drawing,geometry,places&callback=initMap`
    script.async = true
    script.defer = true
    script.onerror = () => setError('Failed to load Google Maps API. Check your API key.')
    document.head.appendChild(script)

    return () => {
      // Cleanup callback; leave script tag in place if loaded
      delete window.initMap
    }
  }, [apiKey])

  return { isLoaded, error }
}
