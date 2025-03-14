'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { createWalletClient, custom } from 'viem'

import { WalletEvent, walletObserver } from '@/lib/walletObserver'
import {
  connectBitcoinWallet,
  connectEVMWallet,
  connectSolanaWallet,
  isWalletInstalled,
} from '@/lib/wallets'

import { ConnectedWallets, WalletType } from '@/types/wallet'

// Initialize with proper structure where all wallet types are null
const initialWallets: ConnectedWallets = {
  evm: null,
  solana: null,
  bitcoin: null,
}

export function useWalletObserverState() {
  const [isClient, setIsClient] = useState(false)
  const [connectedWallets, setConnectedWallets] =
    useState<ConnectedWallets>(initialWallets)
  const [isConnecting, setIsConnecting] = useState(false)

  // First, safely determine if we're on the client
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Handle wallet events from the observer
  const handleWalletEvent = useCallback((event: WalletEvent) => {
    console.log('Wallet event:', event)

    switch (event.type) {
      case 'connect':
        setConnectedWallets((prev) => ({
          ...prev,
          [event.walletType]: {
            address: event.address,
            type: event.walletType,
          },
        }))
        break

      case 'disconnect':
        setConnectedWallets((prev) => ({
          ...prev,
          [event.walletType]: null,
        }))
        break

      case 'accountChanged':
        setConnectedWallets((prev) => ({
          ...prev,
          [event.walletType]: {
            address: event.address,
            type: event.walletType,
          },
        }))
        break
    }
  }, [])

  // Subscribe to wallet events
  useEffect(() => {
    if (!isClient) return

    // Subscribe to wallet events directly from the walletObserver instance
    const unsubscribe = walletObserver.subscribe(handleWalletEvent)

    // Cleanup on unmount
    return unsubscribe
  }, [isClient, handleWalletEvent])

  // Attempt auto-reconnect for all wallet types on mount
  useEffect(() => {
    if (!isClient) return

    const attemptAutoReconnect = async () => {
      // Don't set isConnecting to true here to avoid UI flicker
      // We're doing this silently in the background

      // Try to auto-reconnect to EVM wallet
      if (window.ethereum) {
        try {
          const client = createWalletClient({
            transport: custom(window.ethereum),
          })
          const [address] = await client.requestAddresses()
          if (address) {
            console.log('Auto-reconnected to EVM wallet')
          }
        } catch (error) {
          console.log(
            'EVM auto-reconnect failed, user will need to connect manually',
            error
          )
        }
      }

      // For Solana and Bitcoin, the walletObserver will handle auto-reconnection
      // This is just a fallback in case the observer doesn't catch it

      // Try to auto-reconnect to Solana wallet
      if (window.solana?.isPhantom) {
        try {
          await connectSolanaWallet()
          console.log('Auto-reconnected to Solana wallet via hook')
        } catch (error) {
          // Ignore errors, the user will need to connect manually
          console.log('Solana auto-reconnect failed in hook', error)
        }
      }

      // Try to auto-reconnect to Bitcoin wallet
      try {
        await connectBitcoinWallet()
        console.log('Auto-reconnected to Bitcoin wallet via hook')
      } catch (error) {
        // Ignore errors, the user will need to connect manually
        console.log('Bitcoin auto-reconnect failed in hook', error)
      }
    }

    // Attempt auto-reconnect with a slight delay to ensure extensions are loaded
    const timer = setTimeout(() => {
      attemptAutoReconnect()
    }, 1500)

    return () => clearTimeout(timer)
  }, [isClient])

  // Connect to a wallet
  const connectWallet = useCallback(
    async (type: 'evm' | 'solana' | 'bitcoin') => {
      if (!isClient) return

      setIsConnecting(true)

      try {
        // Check if the wallet is installed
        const isInstalled = await isWalletInstalled(type)

        if (!isInstalled) {
          toast.error(
            `${type.charAt(0).toUpperCase() + type.slice(1)} wallet is not installed`
          )
          setIsConnecting(false)
          return
        }

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

        // The wallet observer will handle updating the state
        // This is just a fallback in case the observer doesn't catch it
        setConnectedWallets((prev) => ({
          ...prev,
          [type]: wallet,
        }))

        toast.success(`${type.toUpperCase()} wallet connected`)
        setIsConnecting(false)
      } catch (error) {
        console.error('Failed to connect wallet:', error)
        toast.error(
          error instanceof Error ? error.message : 'Failed to connect wallet'
        )
        setIsConnecting(false)
      }
    },
    [isClient]
  )

  // Disconnect a wallet
  const disconnectWallet = useCallback(
    (type: 'evm' | 'solana' | 'bitcoin') => {
      if (!isClient) return

      // For EVM, we can use window.ethereum to disconnect
      if (type === 'evm' && window.ethereum) {
        // The wallet observer will handle the state update
      }

      // For Solana, we can use window.solana to disconnect
      if (type === 'solana' && window.solana) {
        try {
          const solana = window.solana as unknown as {
            disconnect: () => Promise<void>
          }
          solana
            .disconnect()
            .catch((err) =>
              console.error('Error disconnecting Solana wallet:', err)
            )
        } catch (err) {
          console.error('Error disconnecting Solana wallet:', err)
        }
      }

      // For Bitcoin, we can use satsConnect to disconnect
      if (type === 'bitcoin') {
        try {
          // The wallet observer will handle the state update
        } catch (err) {
          console.error('Error disconnecting Bitcoin wallet:', err)
        }
      }

      // Update state directly as a fallback
      setConnectedWallets((prev) => ({
        ...prev,
        [type]: null,
      }))

      toast.success(`${type.toUpperCase()} wallet disconnected`)
    },
    [isClient]
  )

  return {
    connectedWallets,
    isConnecting,
    connectWallet,
    disconnectWallet,
  }
}
