'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import Image from 'next/image'

import { setupMockWallets } from '@/lib/mock-wallets'
import {
  connectBitcoinWallet,
  connectEVMWallet,
  connectSolanaWallet,
} from '@/lib/wallets'

import { ConnectedWallets, WalletType } from '@/types/wallet'

interface WalletConnectProps {
  connectedWallets: ConnectedWallets
  setConnectedWallets: (wallets: ConnectedWallets) => void
}

export default function WalletConnect({
  connectedWallets,
  setConnectedWallets,
}: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [useMocks, setUseMocks] = useState(
    process.env.NEXT_PUBLIC_USE_MOCK_WALLETS === 'true'
  )

  const connectWallet = async (type: 'evm' | 'solana' | 'bitcoin') => {
    setIsConnecting(true)
    try {
      let wallet: WalletType

      switch (type) {
        case 'evm':
          wallet = await connectEVMWallet()
          break
        case 'solana':
          wallet = await connectSolanaWallet()
          break
        case 'bitcoin':
          wallet = await connectBitcoinWallet()
          break
        default:
          throw new Error('Unsupported wallet type')
      }

      setConnectedWallets({
        ...connectedWallets,
        [type]: wallet,
      })

      toast.success(`${type.toUpperCase()} wallet connected`)
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to connect wallet'
      )
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className='flex flex-col gap-6'>
      {process.env.NODE_ENV === 'development' && (
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

      <div className='grid gap-4 sm:grid-cols-3'>
        <button
          onClick={() => connectWallet('evm')}
          disabled={isConnecting || !!connectedWallets.evm}
          className='btn btn-primary flex items-center justify-center gap-2'
        >
          <Image
            src='/icons/metamask.svg'
            alt='MetaMask'
            width={20}
            height={20}
            className='inline-block'
          />
          {connectedWallets.evm ? 'EVM Connected' : 'Connect EVM'}
        </button>

        <button
          onClick={() => connectWallet('solana')}
          disabled={isConnecting || !!connectedWallets.solana}
          className='btn btn-primary flex items-center justify-center gap-2'
        >
          <Image
            src='/icons/solana.svg'
            alt='Solana'
            width={20}
            height={20}
            className='inline-block'
          />
          {connectedWallets.solana ? 'Solana Connected' : 'Connect Solana'}
        </button>

        <button
          onClick={() => connectWallet('bitcoin')}
          disabled={isConnecting || !!connectedWallets.bitcoin}
          className='btn btn-primary flex items-center justify-center gap-2'
        >
          <Image
            src='/icons/bitcoin.svg'
            alt='Xverse'
            width={20}
            height={20}
            className='inline-block'
          />
          {connectedWallets.bitcoin ? 'Xverse Connected' : 'Connect Xverse'}
        </button>
      </div>
    </div>
  )
}
