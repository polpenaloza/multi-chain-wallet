'use client'

import { Toaster } from 'react-hot-toast'

import { QueryProvider } from './Query.provider'
import { WagmiProviderWrapper } from './WagmiProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WagmiProviderWrapper>
        <QueryProvider>{children}</QueryProvider>
      </WagmiProviderWrapper>
      <Toaster />
    </>
  )
}
