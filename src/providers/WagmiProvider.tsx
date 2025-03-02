'use client'

import { ReactNode } from 'react'
import { WagmiProvider } from 'wagmi'

import { config } from '@/lib/wagmi'

interface WagmiProviderWrapperProps {
  children: ReactNode
}

export function WagmiProviderWrapper({ children }: WagmiProviderWrapperProps) {
  // We don't need to check for mounting here since the parent Providers component
  // already handles that. This component will only render when the parent is mounted.

  // Wrap in try-catch to prevent any potential errors during initialization
  try {
    return <WagmiProvider config={config}>{children}</WagmiProvider>
  } catch (error) {
    console.error('Error initializing WagmiProvider:', error)
    // Fallback to rendering children without the provider in case of error
    return <>{children}</>
  }
}
