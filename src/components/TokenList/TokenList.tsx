'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { useQuery } from '@tanstack/react-query'

import TokenListSkeleton from './TokenListSkeleton'
import TokenListTable from './TokenListTable'

import { getAllTokens } from '@/services/lifi.service'

// Debounce function to limit how often a function can be called
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

function TokenList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [mounted, setMounted] = useState(false)

  // Debounce search term to avoid excessive filtering on each keystroke
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Set mounted state on client-side only
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch tokens with caching
  const {
    data: tokensData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['tokens'],
    queryFn: getAllTokens,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    // Add caching options
    gcTime: 10 * 60 * 1000, // 10 minutes (gcTime is the new name for cacheTime in React Query v4)
  })

  // Convert tokens to a flat array - memoized to prevent recalculation
  const rowData = useMemo(() => {
    if (!tokensData) return []

    // If tokensData is already an array, use it directly
    if (Array.isArray(tokensData)) return tokensData

    // If it's an object with token records, flatten it
    if (typeof tokensData === 'object') {
      return Object.values(tokensData).flat()
    }

    return []
  }, [tokensData])

  // Memoize the search change handler
  const onSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value)
    },
    []
  )

  // Memoize filtered tokens based on debounced search term
  const filteredTokens = useMemo(() => {
    if (debouncedSearchTerm === '') return rowData

    const searchLower = debouncedSearchTerm.toLowerCase()

    // Optimize filtering by doing a single pass through the data
    return rowData.filter((token) => {
      const nameMatch =
        token.name?.toLowerCase()?.includes(searchLower) || false
      const symbolMatch =
        token.symbol?.toLowerCase()?.includes(searchLower) || false
      return nameMatch || symbolMatch
    })
  }, [rowData, debouncedSearchTerm])

  // Show skeleton during SSR or before mounting
  if (!mounted || isLoading) return <TokenListSkeleton />

  if (error)
    return <div className='alert alert-error'>Failed to load tokens</div>

  return (
    <div className='w-full h-full flex flex-col overflow-hidden p-2'>
      <h3 className='text-lg font-medium mb-4'>Supported Tokens</h3>

      <div className='mb-4'>
        <input
          type='text'
          placeholder='Search tokens...'
          className='input input-bordered w-full focus:bg-base-100 focus:text-base-content focus:outline-primary'
          value={searchTerm}
          onChange={onSearchChange}
        />
      </div>

      {rowData && (
        <p className='text-sm text-gray-500 mb-4'>
          Showing {filteredTokens?.length || 0} of {rowData.length} tokens from
          Li.Fi API
        </p>
      )}

      <div className='flex-1 h-full max-w-full'>
        <div className='overflow-x-auto overflow-y-hidden rounded-lg border border-base-300 h-full'>
          <TokenListTable tokens={filteredTokens} />
        </div>
      </div>
    </div>
  )
}

export default TokenList
