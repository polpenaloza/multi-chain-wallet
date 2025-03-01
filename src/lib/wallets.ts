import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { ethers } from 'ethers'
import { AddressPurpose,request } from 'sats-connect'

import { WalletType } from '@/types/wallet'

export async function connectEVMWallet(): Promise<WalletType> {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed')
  }

  const provider = new ethers.BrowserProvider(window.ethereum)
  const accounts = await provider.send('eth_requestAccounts', [])

  if (!accounts[0]) throw new Error('No account found')

  return {
    address: accounts[0],
    type: 'evm' as const,
  }
}

export async function connectSolanaWallet(): Promise<WalletType> {
  const phantom = new PhantomWalletAdapter()

  if (!phantom.connected) {
    await phantom.connect()
  }

  if (!phantom.publicKey) throw new Error('Failed to connect Phantom wallet')

  return {
    address: phantom.publicKey.toString(),
    type: 'solana' as const,
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
