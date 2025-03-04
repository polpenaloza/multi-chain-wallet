import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory cache
interface CacheEntry {
  balance: string
  timestamp: number
}
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const cache: Record<string, CacheEntry> = {}

// API endpoints for Bitcoin balance
const BTC_API_ENDPOINTS = [
  // BlockCypher API with token (if available)
  process.env.NEXT_PUBLIC_BLOCKCYPHER_API_KEY
    ? `https://api.blockcypher.com/v1/btc/main/addrs/{address}/balance?token=${process.env.NEXT_PUBLIC_BLOCKCYPHER_API_KEY}`
    : `https://api.blockcypher.com/v1/btc/main/addrs/{address}/balance`,
  // Blockchain.info as fallback
  'https://blockchain.info/rawaddr/{address}?limit=1',
]

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

    // Try each endpoint until one works
    let balance = '0.00000000'
    let success = false

    for (const endpointTemplate of BTC_API_ENDPOINTS) {
      try {
        const endpoint = endpointTemplate.replace('{address}', address)
        console.log(`Trying Bitcoin endpoint: ${endpoint.split('?')[0]}`) // Don't log API key

        // Fetch the balance from the API
        const response = await fetch(endpoint, {
          headers: {
            'User-Agent': 'Multi-Chain-Wallet/1.0',
          },
          next: { revalidate: 300 }, // Cache for 5 minutes on the server
        })

        // Log the response status
        console.log(
          `Bitcoin API response status: ${response.status} ${response.statusText}`
        )

        if (!response.ok) {
          console.error(`Failed with status: ${response.status}`)
          continue // Try next endpoint
        }

        const data = await response.json()

        // Parse balance based on API format
        if (endpoint.includes('blockcypher')) {
          balance = (data.balance / 1e8).toFixed(8)
        } else if (endpoint.includes('blockchain.info')) {
          balance = (data.final_balance / 1e8).toFixed(8)
        }

        success = true
        console.log(`Successfully fetched Bitcoin balance: ${balance} BTC`)
        break
      } catch (error) {
        console.error('Error fetching Bitcoin balance:', error)
        // Continue to next endpoint
      }
    }

    if (!success) {
      console.error('All Bitcoin endpoints failed')
      return NextResponse.json(
        { error: 'Failed to fetch Bitcoin balance', balance: '0.00000000' },
        { status: 503 }
      )
    }

    // Cache the balance
    cache[address] = {
      balance,
      timestamp: Date.now(),
    }

    return NextResponse.json({ balance })
  } catch (error) {
    console.error('Error in Bitcoin balance API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Bitcoin balance', balance: '0.00000000' },
      { status: 500 }
    )
  }
}
