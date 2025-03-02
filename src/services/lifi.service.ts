/**
 * Service for interacting with the Li.Fi API
 * Documentation: https://docs.li.fi/li.fi-api/li.fi-api
 */

const LIFI_API_URL = 'https://li.quest/v1'

export interface Token {
  address: string
  chainId: number
  coinKey?: string
  decimals: number
  logoURI?: string
  name: string
  priceUSD?: number
  symbol: string
}

export interface TokensResponse {
  tokens: Record<string, Token>
}

/**
 * Fetches all tokens supported by Li.Fi
 * @returns A promise that resolves to a record of tokens
 */
export async function getAllTokens(): Promise<Record<string, Token>> {
  try {
    const response = await fetch(`${LIFI_API_URL}/tokens`)

    if (!response.ok) {
      throw new Error(`Failed to fetch tokens: ${response.statusText}`)
    }

    const data: TokensResponse = await response.json()
    return data.tokens
  } catch (error) {
    console.error('Error fetching tokens:', error)
    throw error
  }
}

/**
 * Fetches supported chains from Li.Fi
 * @returns A promise that resolves to the supported chains
 */
export async function getSupportedChains() {
  try {
    const response = await fetch(`${LIFI_API_URL}/chains`)

    if (!response.ok) {
      throw new Error(`Failed to fetch chains: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching chains:', error)
    throw error
  }
}
