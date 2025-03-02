'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'

import { useWalletConnection } from '@/hooks/useWalletConnection'

import { setupMockWallets } from '@/lib/mock-wallets'

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
  const [useMocks, setUseMocks] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Use our custom hook for wallet connections
  const { connectedWallets, isConnecting, connectWallet, disconnectWallet } =
    useWalletConnection()

  // First, safely determine if we're on the client
  useEffect(() => {
    setIsClient(true)
    // Only set useMocks after we know we're on the client
    setUseMocks(process.env.NEXT_PUBLIC_USE_MOCK_WALLETS === 'true')
  }, [])

  // Sync connected wallets with parent component
  useEffect(() => {
    if (!isClient) return

    // Ensure connectedWallets is not null or undefined before using it
    if (connectedWallets) {
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

  // Setup mock wallets if enabled
  useEffect(() => {
    if (!isClient) return

    if (useMocks && process.env.NODE_ENV === 'development') {
      setupMockWallets()
    }
  }, [useMocks, isClient])

  // Sync the connected wallets from the hook with the parent component
  const handleConnectWallet = async (type: 'evm' | 'solana' | 'bitcoin') => {
    try {
      await connectWallet(type)
    } catch (error) {
      console.error(`Error connecting to ${type} wallet:`, error)
      // Error is already handled in the hook with toast notifications
    }
  }

  const handleDisconnectWallet = (type: 'evm' | 'solana' | 'bitcoin') => {
    disconnectWallet(type)
  }

  const wallets = useMemo(() => {
    return [
      { type: 'evm', name: 'EVM', icon: '/icons/metamask.svg' },
      { type: 'solana', name: 'Solana', icon: '/icons/solana.svg' },
      { type: 'bitcoin', name: 'Xverse', icon: '/icons/bitcoin.svg' },
    ] as const
  }, [])

  return (
    <div className='flex flex-col gap-6'>
      {isClient && process.env.NODE_ENV === 'development' && (
        <div className='flex justify-end'>
          <label className='flex items-center cursor-pointer'>
            <input
              type='checkbox'
              className='toggle toggle-primary'
              checked={useMocks}
              onChange={() => {
                const newValue = !useMocks
                setUseMocks(newValue)
                if (newValue) {
                  setupMockWallets()
                } else {
                  // Reload to clear mock wallets
                  window.location.reload()
                }
              }}
            />
            <span className='ml-2 text-sm'>Use mock wallets</span>
          </label>
        </div>
      )}

      <h2 className='text-2xl font-bold mb-4'>Connect Wallets</h2>

      <div className='grid gap-4 sm:grid-cols-3'>
        {wallets.map(({ type, name, icon }) => (
          <div
            key={type}
            className={`card bg-base-200 shadow-md transition-all hover:shadow-lg ${
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
              <button
                onClick={() =>
                  connectedWallets?.[type]
                    ? handleDisconnectWallet(type)
                    : handleConnectWallet(type)
                }
                disabled={isConnecting}
                className={`btn btn-sm ${
                  connectedWallets?.[type] ? 'btn-error' : 'btn-primary'
                }`}
              >
                {connectedWallets?.[type] ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
