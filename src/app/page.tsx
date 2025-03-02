'use client'

import { lazy, Suspense, useEffect, useState } from 'react'

import { setupMockWallets } from '@/lib/mock-wallets'

import { ConnectedWallets } from '@/types/wallet'

// Dynamically import components
const BalanceDisplay = lazy(() => import('@/components/BalanceDisplay'))
const TokenList = lazy(() => import('@/components/TokenList/TokenList'))
const WalletConnect = lazy(() => import('@/components/WalletConnect'))

// Loading component using DaisyUI loading dots
function LoadingDots() {
  return (
    <div className='flex items-center justify-center p-4'>
      <span className='loading loading-dots loading-md'></span>
    </div>
  )
}

export default function Home() {
  const [isClient, setIsClient] = useState(false)
  const [isWalletReady, setIsWalletReady] = useState(false)
  const [connectedWallets, setConnectedWallets] = useState<ConnectedWallets>({
    evm: null,
    solana: null,
    bitcoin: null,
  })

  // First, safely determine if we're on the client
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Then handle wallet setup only on the client
  useEffect(() => {
    if (isClient) {
      // Only use mocks if explicitly enabled via environment variable
      if (process.env.NEXT_PUBLIC_USE_MOCK_WALLETS === 'true') {
        setupMockWallets()
      }
      setIsWalletReady(true)
    }
  }, [isClient])

  // Show a simple loading state during SSR
  if (!isClient) {
    return (
      <div className='min-h-screen p-4 md:p-8'>
        <main className='container mx-auto'>
          <h1 className='text-2xl font-bold mb-8'>Multi-Chain Wallet</h1>
          <div className='flex items-center justify-center min-h-[50vh]'>
            <span className='loading loading-dots loading-lg'></span>
          </div>
        </main>
      </div>
    )
  }

  if (!isWalletReady) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <span className='loading loading-dots loading-lg'></span>
      </div>
    )
  }

  return (
    <div className='min-h-screen p-4 md:p-8'>
      <main className='container mx-auto'>
        <h1 className='text-2xl font-bold mb-8'>Multi-Chain Wallet</h1>

        <div className='grid gap-8'>
          {/* Wallet Connection Section */}
          <section className='card bg-base-200 p-4 sm:p-6'>
            <h2 className='text-xl font-semibold mb-4'>Connect Wallets</h2>
            <Suspense fallback={<LoadingDots />}>
              <WalletConnect
                connectedWallets={connectedWallets}
                setConnectedWallets={setConnectedWallets}
              />
            </Suspense>
          </section>

          {/* Token List & Balances Section */}
          <section className='card bg-base-200 p-4 sm:p-6'>
            <h2 className='text-xl font-semibold mb-4'>Tokens & Balances</h2>
            <div className='grid lg:grid-cols-2 gap-6'>
              <div className='overflow-x-auto'>
                <Suspense fallback={<LoadingDots />}>
                  <TokenList />
                </Suspense>
              </div>
              <Suspense fallback={<LoadingDots />}>
                <BalanceDisplay connectedWallets={connectedWallets} />
              </Suspense>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
