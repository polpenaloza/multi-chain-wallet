'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { ColDef } from 'ag-grid-community'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'

import { Token } from '@/services/lifi.service'

ModuleRegistry.registerModules([AllCommunityModule])

// Custom cell renderer for token logos
const LogoCellRenderer = (props: { value: string; data: Token }) => {
  const { data } = props

  if (data.logoURI) {
    return (
      <div className='flex items-center'>
        <Image
          src={data.logoURI}
          alt={data.symbol}
          width={32}
          height={32}
          className='rounded-full'
          onError={(e) => {
            ;(e.target as HTMLImageElement).src =
              'https://placehold.co/32x32?text=?'
          }}
        />
      </div>
    )
  }

  return (
    <div className='w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center'>
      {data?.symbol?.charAt(0)}
    </div>
  )
}

// Custom cell renderer for price formatting
const PriceCellRenderer = (props: { value: number | undefined }) => {
  const { value } = props
  if (!value) return <span>N/A</span>
  return <span>{`$${Number(value).toFixed(2)}`}</span>
}

export default function TokenListTable({ tokens }: { tokens: Token[] }) {
  // Add state for client-side rendering
  const [mounted, setMounted] = useState(false)
  // Add state for screen size
  const [isSmallScreen, setIsSmallScreen] = useState(false)

  // Update screen size state on client side only
  useEffect(() => {
    setMounted(true)

    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 640)
    }

    // Set initial value
    handleResize()

    // Add event listener for window resize
    window.addEventListener('resize', handleResize)

    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Ensure tokens is an array before rendering
  const safeTokens = useMemo(() => {
    if (!tokens || !Array.isArray(tokens)) return []

    // Filter out any potentially problematic tokens
    return tokens.filter(
      (token) =>
        token &&
        typeof token === 'object' &&
        !Object.getOwnPropertyNames(token).includes('__proto__')
    )
  }, [tokens])

  // Column definitions
  const columnDefs = useMemo<ColDef<Token>[]>(
    () => [
      {
        headerName: 'Logo',
        field: 'logoURI',
        cellRenderer: LogoCellRenderer,
        width: 80,
        sortable: false,
        filter: false,
      },
      {
        headerName: 'Symbol',
        field: 'symbol',
        sortable: true,
        filter: true,
      },
      {
        headerName: 'Name',
        field: 'name',
        sortable: true,
        filter: true,
        hide: isSmallScreen, // Use state variable instead of direct window check
      },
      {
        headerName: 'Chain',
        field: 'chainId',
        sortable: true,
        filter: true,
      },
      {
        headerName: 'Price',
        field: 'priceUSD',
        cellRenderer: PriceCellRenderer,
        sortable: true,
        type: 'numericColumn',
        headerClass: 'ag-right-aligned-header',
        cellClass: 'ag-right-aligned-cell',
      },
    ],
    [isSmallScreen] // Add isSmallScreen as a dependency
  )

  // Default column settings
  const defaultColDef = useMemo(
    () => ({
      resizable: true,
    }),
    []
  )

  // Return a placeholder during SSR or before mounting
  if (!mounted) {
    return (
      <div className='w-full h-full min-h-[500px] bg-base-200 animate-pulse rounded-md'>
        <div className='p-4 text-center text-base-content/50'>
          Loading token data...
        </div>
      </div>
    )
  }

  return (
    <div
      className='ag-theme-alpine-dark w-full h-full'
      style={{ height: '100%', minHeight: '500px' }}
    >
      <AgGridReact
        rowData={safeTokens}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        animateRows={true}
        rowSelection='single'
        paginationPageSize={50}
        pagination
        domLayout='normal'
      />
    </div>
  )
}
