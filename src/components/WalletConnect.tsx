'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'

import { useWalletObserverState } from '@/hooks/useWalletObserverState'

import { ConnectedWallets } from '@/types/wallet'

interface WalletConnectProps {
  connectedWallets: ConnectedWallets
  setConnectedWallets: (wallets: ConnectedWallets) => void
}

export default function WalletConnect({
  connectedWallets: _connectedWallets,
  setConnectedWallets,
}: WalletConnectProps) {
  const [isClient, setIsClient] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Use our observer-based hook for wallet connections
  const { connectedWallets, isConnecting, connectWallet, disconnectWallet } =
    useWalletObserverState()

  // First, safely determine if we're on the client
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Sync connected wallets with parent component
  useEffect(() => {
    if (!isClient) return

    // Ensure connectedWallets is not null or undefined before using it
    if (connectedWallets) {
      // Update parent component with connected wallets
      setConnectedWallets(connectedWallets)

      // Mark as initialized after first sync
      // Safely check if any wallet is connected
      if (
        !initialized &&
        connectedWallets &&
        Object.values(connectedWallets).some((wallet) => wallet !== null)
      ) {
        setInitialized(true)
      }
    }
  }, [connectedWallets, setConnectedWallets, initialized, isClient])

  // Sync the connected wallets from the hook with the parent component
  const handleConnectWallet = async (type: 'evm' | 'solana' | 'bitcoin') => {
    if (!isClient) return

    try {
      await connectWallet(type)
    } catch (error) {
      console.error(`Error connecting to ${type} wallet:`, error)
      // Error is already handled in the hook with toast notifications
    }
  }

  const handleDisconnectWallet = (type: 'evm' | 'solana' | 'bitcoin') => {
    if (!isClient) return

    disconnectWallet(type)
  }

  const wallets = useMemo(() => {
    return [
      { type: 'evm', name: 'EVM', icon: '/icons/metamask.svg' },
      { type: 'solana', name: 'Solana', icon: '/icons/solana.svg' },
      { type: 'bitcoin', name: 'Xverse', icon: '/icons/bitcoin.svg' },
    ] as const
  }, [])

  // Render a loading state during SSR
  if (!isClient) {
    return (
      <div className='flex flex-col gap-6'>
        <div className='flex justify-between items-center'>
          <h3 className='text-xl font-bold'>Connect your wallets</h3>
        </div>
        <div className='grid gap-4 sm:grid-cols-3 justify-items-center'>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className='card bg-base-200 shadow-md w-full max-w-xs animate-pulse'
            >
              <div className='card-body items-center justify-between text-center p-4 gap-2 h-[120px]'></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex justify-between items-center'>
        <h3 className='text-xl font-bold'>Connect your wallets</h3>
      </div>

      <div className='grid gap-4 sm:grid-cols-3 justify-items-center'>
        {wallets.map(({ type, name, icon }) => (
          <div
            key={type}
            className={`card bg-base-200 shadow-md transition-all hover:shadow-lg w-full max-w-xs ${
              connectedWallets?.[type] ? 'border-2 border-success' : ''
            }`}
          >
            <div className='card-body items-center justify-between text-center p-4 gap-2'>
              <div className='relative'>
                <Image
                  src={icon}
                  alt={name}
                  width={40}
                  height={40}
                  className='inline-block'
                />
                {connectedWallets?.[type] && (
                  <div className='absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full'></div>
                )}
              </div>
              <h3 className='card-title text-lg'>{name}</h3>
              {connectedWallets?.[type] ? (
                <div className='flex flex-col gap-2 w-full'>
                  <div
                    className='text-sm font-medium bg-base-300 py-1 px-2 rounded-md truncate max-w-full cursor-help'
                    title={connectedWallets[type]?.address}
                  >
                    {connectedWallets[type]?.address.slice(0, 6)}...
                    {connectedWallets[type]?.address.slice(-4)}
                  </div>
                  <button
                    onClick={() => handleDisconnectWallet(type)}
                    disabled={isConnecting}
                    className='btn btn-sm btn-error'
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleConnectWallet(type)}
                  disabled={isConnecting}
                  className='btn btn-sm btn-primary'
                >
                  {isConnecting ? (
                    <>
                      <span className='loading loading-spinner loading-xs'></span>
                      Connecting...
                    </>
                  ) : (
                    'Connect'
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
