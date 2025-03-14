'use client'

/**
 * Service for fetching wallet balances from different blockchain ecosystems
 */
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

import { Connection, PublicKey } from '@solana/web3.js'

import { Balance, ConnectedWallets, WalletType } from '@/types/wallet'

import { getAllTokens, Token } from './lifi.service'

// Cache for token data to avoid redundant API calls
let tokenCache: Record<string, Token> | null = null
let tokenCacheTimestamp: number = 0
const TOKEN_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

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

// Cache for wallet balances to reduce redundant API calls
const balanceCache = new Map<string, { data: Balance[]; timestamp: number }>()
const BALANCE_CACHE_TTL = 30 * 1000 // 30 seconds

/**
 * Get tokens with caching to avoid redundant API calls
 */
async function getCachedTokens(): Promise<Record<string, Token>> {
  const now = Date.now()

  // Return cached tokens if they're still valid
  if (tokenCache && now - tokenCacheTimestamp < TOKEN_CACHE_TTL) {
    return tokenCache
  }

  try {
    // Fetch new tokens and update cache
    const tokens = await getAllTokens()
    tokenCache = tokens
    tokenCacheTimestamp = now
    return tokens
  } catch (error) {
    console.error('Error fetching tokens:', error)
    // Return empty object or existing cache if available
    return tokenCache || {}
  }
}

/**
 * Format wallet address for display
 */
function formatWalletAddress(wallet: WalletType): string {
  return `${wallet.type}:${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 4)}`
}

/**
 * Fetch balances for all connected wallets
 */
export async function fetchWalletBalances(
  connectedWallets: ConnectedWallets
): Promise<Balance[]> {
  // Get all tokens from LI.FI API with caching
  const tokens = await getCachedTokens()

  // Process each wallet type if connected
  const walletPromises = Object.entries(connectedWallets)
    .filter(([_, wallet]) => wallet !== null)
    .map(async ([type, wallet]) => {
      if (!wallet) return []

      try {
        const walletKey = `${type}:${wallet.address}`
        const cachedBalance = balanceCache.get(walletKey)
        const now = Date.now()

        // Return cached balance if it's still valid
        if (
          cachedBalance &&
          now - cachedBalance.timestamp < BALANCE_CACHE_TTL
        ) {
          return cachedBalance.data
        }

        console.log(
          `Fetching balances for ${type} wallet: ${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 4)}`
        )

        let balances: Balance[] = []
        switch (type) {
          case 'evm':
            balances = await fetchEVMBalances(wallet, tokens)
            break
          case 'solana':
            balances = await fetchSolanaBalances(wallet, tokens)
            break
          case 'bitcoin':
            balances = await fetchBitcoinBalances(wallet)
            break
          default:
            balances = []
        }

        // Cache the result
        balanceCache.set(walletKey, { data: balances, timestamp: now })
        return balances
      } catch (error) {
        console.error(`Error fetching balances for ${type} wallet:`, error)
        // Return a fallback balance for the wallet type that failed
        const walletDisplay = formatWalletAddress(wallet)

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
  tokens: Record<string, Token>
): Promise<Balance[]> {
  const balances: Balance[] = []
  const walletDisplay = formatWalletAddress(wallet)

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

    // For ERC20 tokens, we would need to use token contract ABIs
    // Filter tokens for Ethereum mainnet (chainId 1)
    const ethereumTokens = Object.values(tokens).filter(
      (token) => token.chainId === 1
    )

    console.log(`Found ${ethereumTokens.length} Ethereum tokens in the list`)

    // Limit to a reasonable number of tokens to avoid rate limiting
    const tokensToCheck = ethereumTokens.slice(0, 5)

    // Add placeholder balances for the top tokens
    for (const token of tokensToCheck) {
      balances.push({
        token: token.symbol,
        amount: '0.0000', // Placeholder value
        wallet: walletDisplay,
      })
    }
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
  tokens: Record<string, Token>
): Promise<Balance[]> {
  const balances: Balance[] = []
  const walletDisplay = formatWalletAddress(wallet)

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
          setTimeout(() => reject(new Error('Connection timeout')), 3000) // Reduced timeout
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

    // For SPL tokens, filter tokens for Solana (chainId 501)
    const solanaTokens = Object.values(tokens).filter(
      (token) => token.chainId === 501 || token.symbol?.includes('SOL')
    )

    console.log(`Found ${solanaTokens.length} Solana tokens in the list`)

    // Limit to a reasonable number of tokens to avoid rate limiting
    const tokensToCheck = solanaTokens.slice(0, 5)

    // Add placeholder balances for the top tokens
    for (const token of tokensToCheck) {
      if (token.symbol !== 'SOL') {
        // Skip SOL as we already added it
        balances.push({
          token: token.symbol,
          amount: '0.0000', // Placeholder value
          wallet: walletDisplay,
        })
      }
    }
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
  const walletDisplay = formatWalletAddress(wallet)

  try {
    console.log(`Fetching Bitcoin balance for ${walletDisplay}...`)

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

    // Add BTC balance
    balances.push({
      token: 'BTC',
      amount: data.balance,
      wallet: walletDisplay,
    })

    // Add additional Bitcoin-related tokens if available
    // These are placeholder entries for demonstration
    balances.push({
      token: 'BTC (Lightning)',
      amount: '0.0000', // Placeholder
      wallet: walletDisplay,
    })
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
