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

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return <>{children}</>
}
