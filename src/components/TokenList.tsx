'use client'

import { useMemo, useState } from 'react'
import { ColDef } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'

import { useQuery } from '@tanstack/react-query'

import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'

interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
  chainId: number
}

export default function TokenList() {
  const [rowData, setRowData] = useState<Token[]>([])

  // Define column definitions with proper typing
  const columnDefs = useMemo<ColDef<Token>[]>(
    () => [
      {
        field: 'symbol' as keyof Token,
        headerName: 'Symbol',
        sortable: true,
        filter: true,
      },
      {
        field: 'name' as keyof Token,
        headerName: 'Name',
        sortable: true,
        filter: true,
      },
      {
        field: 'chainId' as keyof Token,
        headerName: 'Chain',
        sortable: true,
        filter: true,
      },
    ],
    []
  )

  // Default column configuration
  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      flex: 1,
    }),
    []
  )

  const { isLoading, error } = useQuery({
    queryKey: ['tokens'],
    queryFn: async () => {
      // TODO: Implement LI.FI API call to fetch tokens
      const mockTokens: Token[] = [
        {
          address: '0x123',
          symbol: 'ETH',
          name: 'Ethereum',
          decimals: 18,
          chainId: 1,
        },
        {
          address: '0x456',
          symbol: 'MATIC',
          name: 'Polygon',
          decimals: 18,
          chainId: 137,
        },
        // Add more mock tokens for testing
      ]
      setRowData(mockTokens)
      return mockTokens
    },
  })

  if (isLoading)
    return (
      <div className='flex justify-center items-center p-4'>
        Loading tokens...
      </div>
    )
  if (error)
    return (
      <div className='flex justify-center items-center p-4 text-error'>
        Error loading tokens
      </div>
    )

  return (
    <div className='w-full h-[500px] ag-theme-alpine dark:ag-theme-alpine-dark'>
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        animateRows={true}
        rowSelection='single'
        pagination={true}
        paginationPageSize={10}
      />
    </div>
  )
}
