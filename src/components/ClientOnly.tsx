'use client'

import { ReactNode, useEffect, useState } from 'react'

interface ClientOnlyProps {
  children: ReactNode
}

/**
 * ClientOnly component that only renders its children on the client side
 * This prevents hydration mismatches for components that use browser APIs
 */
export function ClientOnly({ children }: ClientOnlyProps) {
  const [mounted, setMounted] = useState(false)

  // Use useEffect to set mounted to true after hydration
  useEffect(() => {
    // Set a small delay to ensure DOM is fully loaded
    // This helps avoid hydration mismatches caused by browser extensions
    const timer = setTimeout(() => {
      setMounted(true)
    }, 10)

    return () => clearTimeout(timer)
  }, [])

  // Return null on server-side rendering
  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}></div>
  }

  return <>{children}</>
}
