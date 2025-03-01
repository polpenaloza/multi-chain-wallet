'use client'

import { useEffect, useState } from 'react'

import BalanceDisplay from '@/components/BalanceDisplay'
import TokenList from '@/components/TokenList'
import WalletConnect from '@/components/WalletConnect'

import { setupMockWallets } from '@/lib/mock-wallets'

import { ConnectedWallets } from '@/types/wallet'

export default function Home() {
  const [isWalletReady, setIsWalletReady] = useState(false)
  const [connectedWallets, setConnectedWallets] = useState<ConnectedWallets>({
    evm: null,
    solana: null,
    bitcoin: null,
  })

  useEffect(() => {
    // Only use mocks if explicitly enabled via environment variable
    if (process.env.NEXT_PUBLIC_USE_MOCK_WALLETS === 'true') {
      setupMockWallets()
    }
    setIsWalletReady(true)
  }, [])

  if (!isWalletReady) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        Loading wallet providers...
      </div>
    )
  }

  return (
    <div className='min-h-screen p-4 md:p-8'>
      <main className='container mx-auto'>
        <h1 className='text-2xl font-bold mb-8'>Multi-Chain Wallet</h1>

        <div className='grid gap-8'>
          {/* Wallet Connection Section */}
          <section className='card bg-base-200 p-6'>
            <h2 className='text-xl font-semibold mb-4'>Connect Wallets</h2>
            <WalletConnect
              connectedWallets={connectedWallets}
              setConnectedWallets={setConnectedWallets}
            />
          </section>

          {/* Token List & Balances Section */}
          <section className='card bg-base-200 p-6'>
            <h2 className='text-xl font-semibold mb-4'>Tokens & Balances</h2>
            <div className='grid md:grid-cols-2 gap-6'>
              <TokenList />
              <BalanceDisplay connectedWallets={connectedWallets} />
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
