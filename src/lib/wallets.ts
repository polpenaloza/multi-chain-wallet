import { createWalletClient, custom } from 'viem'

import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { AddressPurpose, request } from 'sats-connect'

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
  // First check if Phantom is available in the window object
  const solana = (window as Window & { solana?: unknown }).solana
  if (!solana) {
    throw new Error('Phantom wallet not installed')
  }

  try {
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
      }
    }

    // Generic error fallback
    throw new Error('Failed to connect to Phantom wallet')
  }
}

export async function connectBitcoinWallet(): Promise<WalletType> {
  try {
    console.log('Attempting to connect to Bitcoin wallet...')
    const response = await request('wallet_connect', {
      addresses: [AddressPurpose.Payment],
      message: 'Connect to Multi-Chain Wallet',
    })

    if (response.status === 'success') {
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
      if (response.error.code === 4001) {
        // USER_REJECTION
        throw new Error('User cancelled the request')
      } else {
        throw new Error(
          response.error.message || 'Failed to connect Bitcoin wallet'
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
        // For Bitcoin, check if Xverse is available
        return !!window.bitcoin
      default:
        return false
    }
  } catch (error) {
    console.error('Error checking wallet connection:', error)
    return false
  }
}
