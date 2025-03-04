'use client'

/**
 * Service for fetching wallet balances from different blockchain ecosystems
 */
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

import { Connection, PublicKey } from '@solana/web3.js'

import { Balance, ConnectedWallets, WalletType } from '@/types/wallet'

import { getAllTokens, Token } from './lifi.service'

// Constants
// Use mainnet endpoints for real data
const SOLANA_RPC_ENDPOINTS = [
  // Try the API key endpoint first if available
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    'https://api.mainnet-beta.solana.com',
  'https://solana-mainnet.g.alchemy.com/v2/demo',
  'https://rpc.ankr.com/solana',
  'https://solana.public-rpc.com',
  'https://api.devnet.solana.com', // Fallback to devnet for testing
]
const BTC_API_URL = '/api/bitcoin/balance'

/**
 * Fetch balances for all connected wallets
 */
export async function fetchWalletBalances(
  connectedWallets: ConnectedWallets
): Promise<Balance[]> {
  // Get all tokens from LI.FI API
  let tokens: Record<string, Token> = {}
  try {
    tokens = await getAllTokens()
  } catch (error) {
    console.error('Error fetching tokens:', error)
    // Continue with empty tokens object
  }

  // Process each wallet type if connected
  const walletPromises = Object.entries(connectedWallets)
    .filter(([_, wallet]) => wallet !== null)
    .map(async ([type, wallet]) => {
      if (!wallet) return []

      try {
        console.log(
          `Fetching balances for ${type} wallet: ${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 4)}`
        )

        switch (type) {
          case 'evm':
            return await fetchEVMBalances(wallet, tokens)
          case 'solana':
            return await fetchSolanaBalances(wallet, tokens)
          case 'bitcoin':
            return await fetchBitcoinBalances(wallet)
          default:
            return []
        }
      } catch (error) {
        console.error(`Error fetching balances for ${type} wallet:`, error)
        // Return a fallback balance for the wallet type that failed
        const walletDisplay = `${wallet.type}:${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 4)}`

        // Return a basic fallback balance with zero amount
        return [
          {
            token: type === 'evm' ? 'ETH' : type === 'solana' ? 'SOL' : 'BTC',
            amount: '0.0000',
            wallet: walletDisplay,
          },
        ]
      }
    })

  try {
    // Wait for all balance fetching to complete
    const results = await Promise.all(walletPromises)

    // Flatten results
    return results.flat()
  } catch (error) {
    console.error('Error fetching wallet balances:', error)
    return []
  }
}

/**
 * Fetch EVM token balances
 */
export async function fetchEVMBalances(
  wallet: WalletType,
  _tokens: Record<string, Token>
): Promise<Balance[]> {
  const balances: Balance[] = []
  const walletDisplay = `${wallet.type}:${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 4)}`

  // Create a public client for Ethereum mainnet
  const client = createPublicClient({
    chain: mainnet,
    transport: http(),
  })

  try {
    // Get ETH balance first
    console.log(`Fetching ETH balance for ${walletDisplay}...`)
    const ethBalance = await client.getBalance({
      address: wallet.address as `0x${string}`,
    })

    balances.push({
      token: 'ETH',
      amount: (Number(ethBalance) / 1e18).toFixed(4),
      wallet: walletDisplay,
    })

    // For ERC20 tokens, we would need to use a token contract ABI
    // Since we don't have access to the required libraries, we'll skip this part
    console.log('Skipping ERC20 token balances due to library limitations')
  } catch (error) {
    console.error('Error fetching EVM balances:', error)

    // Return just ETH with zero balance in case of error
    balances.push({
      token: 'ETH',
      amount: '0.0000',
      wallet: walletDisplay,
    })
  }

  return balances
}

/**
 * Fetch Solana token balances
 */
export async function fetchSolanaBalances(
  wallet: WalletType,
  _tokens: Record<string, Token>
): Promise<Balance[]> {
  const balances: Balance[] = []
  const walletDisplay = `${wallet.type}:${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 4)}`

  try {
    console.log(`Fetching Solana balances for ${walletDisplay}...`)

    // Try to get SOL balance using multiple endpoints
    let solBalance = 0
    let success = false
    let lastError = null

    // Try each endpoint until one works
    for (const endpoint of SOLANA_RPC_ENDPOINTS) {
      try {
        console.log(`Trying Solana endpoint: ${endpoint}`)
        const connection = new Connection(endpoint, { commitment: 'confirmed' })
        const publicKey = new PublicKey(wallet.address)

        // Add a timeout to prevent hanging on slow endpoints
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Connection timeout')), 5000)
        })

        solBalance = (await Promise.race([
          connection.getBalance(publicKey),
          timeoutPromise,
        ])) as number

        success = true
        console.log(`Successfully fetched balance from ${endpoint}`)
        break
      } catch (endpointError) {
        lastError = endpointError
        console.error(`Error with endpoint ${endpoint}:`, endpointError)
        // Continue to next endpoint
      }
    }

    if (!success && lastError) {
      console.error('All Solana endpoints failed:', lastError)
    }

    // Add SOL balance
    balances.push({
      token: 'SOL',
      amount: success ? (solBalance / 1e9).toFixed(4) : '0.0000',
      wallet: walletDisplay,
    })

    // For SPL tokens, we would need to use the TOKEN_PROGRAM_ID
    // Since we don't have access to the required libraries, we'll skip this part
    console.log('Skipping SPL token balances due to library limitations')
  } catch (error) {
    console.error('Error fetching Solana balances:', error)

    // Return just SOL with zero balance in case of error
    balances.push({
      token: 'SOL',
      amount: '0.0000',
      wallet: walletDisplay,
    })
  }

  return balances
}

/**
 * Fetch Bitcoin balance
 */
export async function fetchBitcoinBalances(
  wallet: WalletType
): Promise<Balance[]> {
  const balances: Balance[] = []
  const walletDisplay = `${wallet.type}:${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 4)}`

  try {
    console.log(`Fetching Bitcoin balance for ${walletDisplay}...`)

    // Add a delay to avoid overwhelming the API
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Fetch BTC balance using our simplified API
    const response = await fetch(`${BTC_API_URL}?address=${wallet.address}`, {
      // Add cache control headers to prevent browser caching
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    })

    if (!response.ok) {
      console.error(`Failed to fetch Bitcoin balance: ${response.statusText}`)
      throw new Error(`Failed to fetch Bitcoin balance: ${response.statusText}`)
    }

    const data = await response.json()
    console.log(`Successfully fetched Bitcoin balance for ${walletDisplay}`)

    balances.push({
      token: 'BTC',
      amount: data.balance,
      wallet: walletDisplay,
    })

    // Bitcoin only has BTC, no other tokens to fetch
  } catch (error) {
    console.error('Error fetching Bitcoin balance:', error)

    // Return just BTC with zero balance in case of error
    balances.push({
      token: 'BTC',
      amount: '0.0000',
      wallet: walletDisplay,
    })
  }

  return balances
}
