'use client'

import { ReactNode } from 'react'
import { WagmiProvider } from 'wagmi'

import { config } from '@/lib/wagmi'

interface WagmiProviderWrapperProps {
  children: ReactNode
}

export function WagmiProviderWrapper({ children }: WagmiProviderWrapperProps) {
  return <WagmiProvider config={config}>{children}</WagmiProvider>
}
