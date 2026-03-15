import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// This should match the ID in your index.html
const GA_MEASUREMENT_ID = 'G-NCTZK5VLD2'

// Augment the window object with the gtag function
declare global {
  interface Window {
    gtag?: (command: 'config', targetId: string, config?: { page_path: string }) => void
  }
}

/**
 * This component tracks page views for a Single-Page Application (SPA)
 * by listening for route changes and sending a `page_view` event to Google Analytics.
 * It should be placed inside your Router component.
 */
export const AnalyticsTracker = () => {
  const location = useLocation()

  useEffect(() => {
    if (typeof window.gtag === 'function') {
      window.gtag('config', GA_MEASUREMENT_ID, {
        page_path: location.pathname + location.search,
      })
    }
  }, [location])

  return null
}
