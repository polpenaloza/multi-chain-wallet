'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

import { ConnectedWallets } from '@/types/wallet'

function LoadingDots() {
  return (
    <div className='flex items-center justify-center p-4'>
      <span className='loading loading-dots loading-md'></span>
    </div>
  )
}

const BalanceDisplay = dynamic(() => import('@/components/BalanceDisplay'), {
  ssr: false,
  loading: () => <LoadingDots />,
})

const TokenList = dynamic(() => import('@/components/TokenList/TokenList'), {
  ssr: false,
  loading: () => <LoadingDots />,
})

const WalletConnect = dynamic(() => import('@/components/WalletConnect'), {
  ssr: false,
  loading: () => <LoadingDots />,
})

export default function Home() {
  const [isClient, setIsClient] = useState(false)

  const [connectedWallets, setConnectedWallets] = useState<ConnectedWallets>({
    evm: null,
    solana: null,
    bitcoin: null,
  })

  useEffect(() => {
    setIsClient(true)
  }, [])

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

  return (
    <div className='min-h-screen p-4 md:p-8'>
      <main className='container mx-auto'>
        <h1 className='text-2xl font-bold mb-8'>Multi-Chain Wallet</h1>

        <div className='flex flex-col gap-8'>
          {/* Wallet Connection Section */}
          <section className='card bg-base-200 p-4 sm:p-6'>
            <WalletConnect
              connectedWallets={connectedWallets}
              setConnectedWallets={setConnectedWallets}
            />
          </section>

          {/* Token List & Balances Section */}
          <section className='card bg-base-200 p-4 sm:p-6'>
            <h2 className='text-xl font-semibold mb-4'>Tokens & Balances</h2>
            <div className='flex flex-col 2xl:flex-row gap-6 min-h-[600px]'>
              <div className='2xl:w-1/2 h-full'>
                <BalanceDisplay connectedWallets={connectedWallets} />
              </div>
              <div className='overflow-x-auto 2xl:w-1/2 h-full'>
                <TokenList />
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
