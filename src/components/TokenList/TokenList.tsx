'use client'

import { useMemo, useState } from 'react'

import { useQuery } from '@tanstack/react-query'

import TokenListSkeleton from './TokenListSkeleton'
import TokenListTable from './TokenListTable'

import { getAllTokens } from '@/services/lifi.service'

function TokenList() {
  const [searchTerm, setSearchTerm] = useState('')

  const {
    data: tokensData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['tokens'],
    queryFn: getAllTokens,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })

  // Convert tokens to a flat array
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

  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const filteredTokens = useMemo(() => {
    if (searchTerm === '') return rowData

    const searchLower = searchTerm.toLowerCase()
    const nameMatches = rowData.filter(
      (token) => token.name?.toLowerCase()?.includes(searchLower) || false
    )
    const symbolMatches = rowData.filter(
      (token) => token.symbol?.toLowerCase()?.includes(searchLower) || false
    )

    // Combine results and remove duplicates
    return [...new Set([...nameMatches, ...symbolMatches])]
  }, [rowData, searchTerm])

  if (isLoading) return <TokenListSkeleton />

  if (error)
    return <div className='alert alert-error'>Failed to load tokens</div>

  return (
    <div className='w-full overflow-hidden p-2'>
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

      <div className='overflow-x-auto -mx-4 sm:mx-0'>
        <TokenListTable tokens={filteredTokens} />
      </div>
    </div>
  )
}

export default TokenList
