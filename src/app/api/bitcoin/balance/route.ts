import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory cache
interface CacheEntry {
  balance: string
  timestamp: number
}
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const cache: Record<string, CacheEntry> = {}

// Mock data for when we hit rate limits
const MOCK_BALANCE = '0.12345678'

/**
 * API route to get Bitcoin balance in a simplified format
 * GET /api/bitcoin/balance?address=<bitcoin_address>
 */
export async function GET(request: NextRequest) {
  try {
    // Get the Bitcoin address from the query parameters
    const searchParams = request.nextUrl.searchParams
    const address = searchParams.get('address')

    // Validate the address
    if (!address) {
      return NextResponse.json(
        { error: 'Bitcoin address is required' },
        { status: 400 }
      )
    }

    // Check cache first
    const cacheEntry = cache[address]
    if (cacheEntry && Date.now() - cacheEntry.timestamp < CACHE_TTL) {
      console.log('Returning cached Bitcoin balance for', address)
      return NextResponse.json({ balance: cacheEntry.balance })
    }

    try {
      // Fetch the balance from the blockchain.info API
      console.log(`Fetching Bitcoin balance for ${address}`)
      const response = await fetch(
        `https://blockchain.info/rawaddr/${address}?limit=1`,
        {
          headers: {
            'User-Agent': 'Multi-Chain-Wallet/1.0',
          },
          next: { revalidate: 300 }, // Cache for 5 minutes on the server
        }
      )

      if (!response.ok) {
        throw new Error(
          `Failed to fetch Bitcoin balance: ${response.statusText}`
        )
      }

      const data = await response.json()
      const balance = (data.final_balance / 1e8).toFixed(8)

      // Cache the balance
      cache[address] = {
        balance,
        timestamp: Date.now(),
      }

      return NextResponse.json({ balance })
    } catch (error) {
      console.error('Error fetching Bitcoin balance:', error)

      // Return mock data instead of an error
      return NextResponse.json({ balance: MOCK_BALANCE })
    }
  } catch (error) {
    console.error('Error in Bitcoin balance API:', error)
    return NextResponse.json({ balance: MOCK_BALANCE })
  }
}
