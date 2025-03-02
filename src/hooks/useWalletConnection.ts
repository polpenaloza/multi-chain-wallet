'use client'

import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useAccount, useConnect, useDisconnect } from 'wagmi'

import {
  checkWalletConnection,
  connectBitcoinWallet,
  connectSolanaWallet,
} from '@/lib/wallets'

import { ConnectedWallets, WalletType } from '@/types/wallet'

// Initialize with proper structure where all wallet types are null
const initialWallets: ConnectedWallets = {
  evm: null,
  solana: null,
  bitcoin: null,
}

// Local storage key for persisting wallet connections
const STORAGE_KEY = 'connected_wallets'

// Helper to save wallet connections to localStorage - only called client-side
const saveWalletsToStorage = (wallets: ConnectedWallets) => {
  try {
    // Ensure wallets is a valid object before saving
    if (wallets && typeof wallets === 'object') {
      // Create a clean copy with only the expected structure
      const cleanWallets: ConnectedWallets = {
        evm: null,
        solana: null,
        bitcoin: null,
      }

      // Only copy valid wallet data
      if (
        wallets.evm &&
        typeof wallets.evm === 'object' &&
        wallets.evm.address &&
        wallets.evm.type === 'evm'
      ) {
        cleanWallets.evm = wallets.evm
      }

      if (
        wallets.solana &&
        typeof wallets.solana === 'object' &&
        wallets.solana.address &&
        wallets.solana.type === 'solana'
      ) {
        cleanWallets.solana = wallets.solana
      }

      if (
        wallets.bitcoin &&
        typeof wallets.bitcoin === 'object' &&
        wallets.bitcoin.address &&
        wallets.bitcoin.type === 'bitcoin'
      ) {
        cleanWallets.bitcoin = wallets.bitcoin
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanWallets))
    }
  } catch (error) {
    console.error('Failed to save wallet connections to storage:', error)
  }
}

// Helper to load wallet connections from localStorage - only called client-side
const loadWalletsFromStorage = (): ConnectedWallets => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsedWallets = JSON.parse(stored)

      // Validate the structure of the parsed wallets
      if (parsedWallets && typeof parsedWallets === 'object') {
        // Create a new object with the correct structure
        const validWallets: ConnectedWallets = {
          evm: null,
          solana: null,
          bitcoin: null,
        }

        // Only copy valid wallet data
        if (
          parsedWallets.evm &&
          typeof parsedWallets.evm === 'object' &&
          parsedWallets.evm.address &&
          parsedWallets.evm.type === 'evm'
        ) {
          validWallets.evm = parsedWallets.evm
        }

        if (
          parsedWallets.solana &&
          typeof parsedWallets.solana === 'object' &&
          parsedWallets.solana.address &&
          parsedWallets.solana.type === 'solana'
        ) {
          validWallets.solana = parsedWallets.solana
        }

        if (
          parsedWallets.bitcoin &&
          typeof parsedWallets.bitcoin === 'object' &&
          parsedWallets.bitcoin.address &&
          parsedWallets.bitcoin.type === 'bitcoin'
        ) {
          validWallets.bitcoin = parsedWallets.bitcoin
        }

        return validWallets
      }
    }
  } catch (error) {
    console.error('Failed to load wallet connections from storage:', error)
    // If there's an error, clear the corrupted data
    localStorage.removeItem(STORAGE_KEY)
  }
  return initialWallets
}

export function useWalletConnection() {
  // Use a state to track if we're on the client side
  const [isClient, setIsClient] = useState(false)
  const [connectedWallets, setConnectedWallets] =
    useState<ConnectedWallets>(initialWallets)
  const [isConnecting, setIsConnecting] = useState(false)
  const [pendingEVMConnection, setPendingEVMConnection] = useState(false)

  // Wagmi hooks for EVM wallet connection
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { address, isConnected } = useAccount()

  // First, safely determine if we're on the client
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Load saved wallet connections on initial mount, but only on the client
  useEffect(() => {
    if (!isClient) return

    const loadSavedWallets = async () => {
      const savedWallets = loadWalletsFromStorage()

      // Create a new object to store validated wallets
      const validatedWallets: ConnectedWallets = { ...initialWallets }

      // Validate each wallet connection
      for (const type of ['evm', 'solana', 'bitcoin'] as const) {
        if (savedWallets[type]) {
          // For EVM, we rely on wagmi's auto-reconnect
          if (type === 'evm') {
            validatedWallets.evm = savedWallets.evm
          } else {
            // For other wallet types, check if they're still connected
            const isStillConnected = await checkWalletConnection(
              savedWallets[type]!
            )
            if (isStillConnected) {
              validatedWallets[type] = savedWallets[type]
            }
          }
        }
      }

      // Update state with validated wallets
      setConnectedWallets(validatedWallets)
    }

    loadSavedWallets()
  }, [isClient])

  // Save wallet connections to localStorage when they change, but only on the client
  useEffect(() => {
    if (!isClient) return
    saveWalletsToStorage(connectedWallets)
  }, [connectedWallets, isClient])

  // Effect to handle address changes after connection
  useEffect(() => {
    if (!isClient) return

    if (pendingEVMConnection && isConnected && address) {
      setConnectedWallets((prev) => ({
        ...prev,
        evm: {
          address,
          type: 'evm',
        },
      }))
      toast.success('EVM wallet connected')
      setPendingEVMConnection(false)
      setIsConnecting(false)
    }
  }, [address, isConnected, pendingEVMConnection, isClient])

  const connectWallet = async (type: 'evm' | 'solana' | 'bitcoin') => {
    if (!isClient) return

    setIsConnecting(true)
    try {
      let wallet: WalletType

      switch (type) {
        case 'evm':
          // Find MetaMask connector
          const metaMaskConnector = connectors.find(
            (c) => c.name === 'MetaMask'
          )
          if (!metaMaskConnector)
            throw new Error('MetaMask connector not found')

          // Connect using wagmi - this is async but doesn't return the address
          connect({ connector: metaMaskConnector })

          // Set pending flag - address will be handled in the useEffect
          setPendingEVMConnection(true)
          return // Early return - the rest will be handled by the useEffect

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
      setIsConnecting(false)
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to connect wallet'
      )
      setIsConnecting(false)
      setPendingEVMConnection(false)
    }
  }

  const disconnectWallet = (type: 'evm' | 'solana' | 'bitcoin') => {
    if (!isClient) return

    if (type === 'evm') {
      // Use wagmi disconnect for EVM
      disconnect()
    }

    // Create a new object without the specified wallet
    const { [type]: _, ...remainingWallets } = connectedWallets
    setConnectedWallets(remainingWallets as ConnectedWallets)
    toast.success(`${type.toUpperCase()} wallet disconnected`)
  }

  return {
    connectedWallets,
    isConnecting,
    connectWallet,
    disconnectWallet,
  }
}
