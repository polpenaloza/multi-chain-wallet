'use client'

import { createWalletClient, custom } from 'viem'

import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import * as satsConnect from 'sats-connect'

import { WalletType } from '@/types/wallet'

export async function connectEVMWallet(): Promise<WalletType> {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed')
  }

  try {
    const client = createWalletClient({
      transport: custom(window.ethereum),
    })

    const [address] = await client.requestAddresses()

    if (!address) throw new Error('No account found')

    return {
      address,
      type: 'evm' as const,
    }
  } catch (error) {
    console.error('Error connecting to EVM wallet:', error)
    throw error
  }
}

export async function connectSolanaWallet(): Promise<WalletType> {
  // First check if we're on a mobile device
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )

  // Check if we're using Brave browser
  // Use a safer approach to detect Brave browser
  let isBrave = false
  try {
    // @ts-expect-error - Brave browser adds this property to navigator
    isBrave = (navigator.brave && (await navigator.brave.isBrave())) || false
  } catch {
    // Not using Brave browser - silently continue
  }

  // Mobile-specific handling
  if (isMobile) {
    console.log('Mobile device detected, using deep linking for Phantom wallet')

    try {
      // For mobile, we need to use deep linking to open the Phantom app
      // Create a unique connection ID to prevent caching issues
      const connectionId = `phantom-connect-${Date.now()}`

      // Create a deep link URL to the Phantom app
      // The redirect URL should be the current page
      const redirectUrl = encodeURIComponent(window.location.href)
      const deepLink = `https://phantom.app/ul/v1/connect?app=Multi-Chain%20Wallet&redirect=${redirectUrl}&connection_id=${connectionId}`

      // For Brave browser specifically, we need to use window.open with _blank target
      // This prevents the redirect loop issue in Brave mobile
      if (isBrave) {
        window.open(deepLink, '_blank')
      } else {
        // For other mobile browsers, we can use window.location
        window.location.href = deepLink
      }

      // Since we're redirecting, we need to throw an error to prevent further execution
      // The connection will be handled when the user is redirected back to the app
      throw new Error('Redirecting to Phantom app...')
    } catch (error) {
      console.error('Error connecting to Phantom on mobile:', error)
      throw error
    }
  }

  // Desktop handling (existing code)
  // First check if Phantom is available in the window object
  if (!window.solana) {
    throw new Error('Phantom wallet not installed')
  }

  try {
    // Check if already connected first
    const solana = window.solana as unknown as {
      isConnected?: boolean
      publicKey?: { toString: () => string }
      connect: () => Promise<{ publicKey: { toString: () => string } }>
    }

    // If already connected, just return the current address
    if (solana.isConnected && solana.publicKey) {
      console.log('Phantom wallet already connected, using existing connection')
      return {
        address: solana.publicKey.toString(),
        type: 'solana' as const,
      }
    }

    // Try direct connection first (this is more reliable than using the adapter)
    try {
      const { publicKey } = await solana.connect()
      if (publicKey) {
        return {
          address: publicKey.toString(),
          type: 'solana' as const,
        }
      }
    } catch (directError) {
      console.log(
        'Direct Phantom connection failed, trying adapter',
        directError
      )
    }

    // Fallback to adapter if direct connection fails
    // Create a new adapter instance with defensive error handling
    let phantom
    try {
      phantom = new PhantomWalletAdapter()
    } catch (error) {
      console.error('Error creating PhantomWalletAdapter:', error)
      throw new Error('Failed to initialize Phantom wallet adapter')
    }

    // Initialize the adapter with timeout
    const connectPromise = phantom.connect()

    // Add a timeout to prevent hanging if the wallet doesn't respond
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Connection timed out')), 10000)
    })

    await Promise.race([connectPromise, timeoutPromise])

    // Verify we have a public key after connection
    if (!phantom.publicKey) {
      throw new Error('Failed to connect Phantom wallet')
    }

    return {
      address: phantom.publicKey.toString(),
      type: 'solana' as const,
    }
  } catch (error) {
    console.error('Error connecting to Solana wallet:', error)

    // Handle specific error cases
    if (error instanceof Error) {
      if (
        error.message.includes('not installed') ||
        error.message.includes('not found')
      ) {
        throw new Error('Phantom wallet not installed')
      } else if (
        error.message.includes('user rejected') ||
        error.message.includes('cancelled')
      ) {
        throw new Error('Connection rejected by user')
      } else if (error.message.includes('timed out')) {
        throw new Error('Connection timed out')
      } else if (error.message.includes('Redirecting to Phantom app')) {
        // This is expected for mobile redirects
        throw error
      }
    }

    // Generic error fallback
    throw new Error('Failed to connect to Phantom wallet')
  }
}

export async function connectBitcoinWallet(): Promise<WalletType> {
  try {
    console.log('Attempting to connect to Bitcoin wallet...')

    // Use the imported satsConnect instead of dynamic import
    const { AddressPurpose, request } = satsConnect

    // First, try to get the account without prompting the user
    try {
      const accountResponse = await request('wallet_getAccount', null)

      if (accountResponse.status === 'success' && accountResponse.result) {
        console.log('Wallet already connected, using existing connection')

        const paymentAddressItem = accountResponse.result.addresses.find(
          (address) => address.purpose === 'payment'
        )

        if (paymentAddressItem) {
          return {
            address: paymentAddressItem.address,
            type: 'bitcoin' as const,
          }
        }
      }
    } catch (error) {
      console.log(
        'No existing connection or wallet locked, will prompt user to connect',
        error
      )
    }

    // If we couldn't get the account, prompt the user to connect
    const response = await request('wallet_connect', {
      addresses: [AddressPurpose.Payment],
      message: 'Connect to Multi-Chain Wallet',
    })

    if (response.status === 'success' && response.result) {
      const paymentAddressItem = response.result.addresses.find(
        (address) => address.purpose === AddressPurpose.Payment
      )

      if (!paymentAddressItem) {
        throw new Error('No Bitcoin payment address found')
      }

      return {
        address: paymentAddressItem.address,
        type: 'bitcoin' as const,
      }
    } else {
      if (response.error?.code === 4001) {
        // USER_REJECTION
        throw new Error('User cancelled the request')
      } else {
        throw new Error(
          response.error?.message || 'Failed to connect Bitcoin wallet'
        )
      }
    }
  } catch (error) {
    console.error('Error connecting to Bitcoin wallet:', error)
    if (
      error instanceof Error &&
      (error.message.includes('wallet not installed') ||
        error.message.includes('Provider not found'))
    ) {
      throw new Error('Xverse wallet not installed')
    }
    throw error
  }
}

export async function checkWalletConnection(
  wallet: WalletType
): Promise<boolean> {
  if (
    !wallet ||
    typeof wallet !== 'object' ||
    !wallet.address ||
    !wallet.type
  ) {
    return false
  }

  try {
    switch (wallet.type) {
      case 'evm':
        // For EVM, we rely on wagmi's auto-reconnect
        return !!window.ethereum
      case 'solana':
        // For Solana, just check if the window.solana object exists
        // Don't try to create a PhantomWalletAdapter as it can cause errors
        return !!(window as Window & { solana?: unknown }).solana
      case 'bitcoin':
        // For Bitcoin, use wallet_getAccount to check if the wallet is still connected
        try {
          // Use the imported satsConnect instead of dynamic import
          const { request } = satsConnect

          // Use wallet_getAccount to check if the wallet is still connected
          const response = await request('wallet_getAccount', null)

          // If we get a successful response, the wallet is still connected
          if (response.status === 'success' && response.result) {
            // Check if the address matches
            const paymentAddressItem = response.result.addresses.find(
              (address) => address.purpose === 'payment'
            )

            if (
              paymentAddressItem &&
              paymentAddressItem.address === wallet.address
            ) {
              console.log('Successfully reconnected to Xverse wallet')
              return true
            }
          }
          return false
        } catch (error) {
          console.error('Error checking Bitcoin wallet connection:', error)
          return false
        }
      default:
        return false
    }
  } catch (error) {
    console.error('Error checking wallet connection:', error)
    return false
  }
}

/**
 * Checks if a specific wallet type is installed in the browser
 */
export const isWalletInstalled = async (
  type: 'evm' | 'solana' | 'bitcoin'
): Promise<boolean> => {
  try {
    // Check if we're on a mobile device
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )

    switch (type) {
      case 'evm':
        // Check if MetaMask is installed
        return typeof window !== 'undefined' && !!window.ethereum

      case 'solana':
        // On mobile, we'll assume Phantom is available through deep linking
        // This prevents the "wallet not installed" error on mobile
        if (isMobile) {
          return true
        }
        // On desktop, check if Phantom is installed
        return typeof window !== 'undefined' && !!window.solana?.isPhantom

      case 'bitcoin':
        try {
          // Dynamically import to avoid hydration issues
          const { request } = await import('sats-connect')

          // Try to call wallet_getAccount to check if a wallet is available
          // This is more reliable than getInstalledWallets
          try {
            await request('wallet_getAccount', null)
            return true
          } catch (error) {
            // If we get a specific error about user rejection or wallet locked,
            // that means the wallet is installed but not connected
            if (error instanceof Error) {
              const errorMsg = error.message.toLowerCase()
              if (
                errorMsg.includes('user rejected') ||
                errorMsg.includes('wallet locked') ||
                errorMsg.includes('wallet not connected')
              ) {
                return true
              }
            }

            // Try the fallback method
            try {
              const { default: Wallet } = await import('sats-connect')
              const wallets = await Wallet.getInstalledWallets()
              return wallets.length > 0
            } catch {
              // If both methods fail, assume wallet is not installed
              return false
            }
          }
        } catch {
          return false
        }

      default:
        return false
    }
  } catch {
    return false
  }
}

/**
 * Disconnects an EVM wallet
 */
export const disconnectEVMWallet = (): void => {
  // For EVM wallets, we don't need to do anything special
  // The connection state is managed by the app
  console.log('EVM wallet disconnected')
}

/**
 * Disconnects a Solana wallet
 */
export const disconnectSolanaWallet = async (): Promise<void> => {
  try {
    // Create a new adapter instance
    const phantom = new PhantomWalletAdapter()

    // Check if connected before disconnecting
    if (phantom.connected) {
      await phantom.disconnect()
    }

    console.log('Solana wallet disconnected')
  } catch (error) {
    console.error('Error disconnecting Solana wallet:', error)
  }
}

/**
 * Disconnects a Bitcoin wallet
 */
export const disconnectBitcoinWallet = async (): Promise<void> => {
  try {
    // Dynamically import to avoid hydration issues
    const { default: Wallet } = await import('sats-connect')

    // Disconnect the wallet
    await Wallet.disconnect()

    console.log('Bitcoin wallet disconnected')
  } catch (error) {
    console.error('Error disconnecting Bitcoin wallet:', error)
  }
}
