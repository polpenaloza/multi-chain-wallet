'use client'

import { ReactNode, useEffect, useState } from 'react'
import { Toaster } from 'react-hot-toast'

import { QueryProvider } from './Query.provider'
import { WagmiProviderWrapper } from './WagmiProvider'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [mounted, setMounted] = useState(false)

  // Only mount providers after client-side hydration is complete
  useEffect(() => {
    setMounted(true)
  }, [])

  // During SSR and initial client render, render a minimal version
  // This ensures the server and client render the same initial HTML
  if (!mounted) {
    return (
      <div className='min-h-screen'>
        {/* Render a minimal version of the UI without any providers */}
        {/* This prevents hydration mismatches */}
        <div className='flex items-center justify-center min-h-screen'>
          <div className='loading loading-dots loading-lg'></div>
        </div>
      </div>
    )
  }

  // Once mounted on the client, render with all providers
  return (
    <>
      <WagmiProviderWrapper>
        <QueryProvider>{children}</QueryProvider>
      </WagmiProviderWrapper>
      <Toaster />
    </>
  )
}
