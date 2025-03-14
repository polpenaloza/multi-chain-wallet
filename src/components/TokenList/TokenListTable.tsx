'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import { AllCommunityModule, ColDef, ModuleRegistry } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'

import { Token } from '@/services/lifi.service'

ModuleRegistry.registerModules([AllCommunityModule])

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

const PriceCellRenderer = (props: { value: number | undefined }) => {
  const { value } = props
  if (!value) return <span>N/A</span>
  return <span>{`$${Number(value).toFixed(2)}`}</span>
}

export default function TokenListTable({ tokens }: { tokens: Token[] }) {
  const safeTokens = useMemo(() => {
    if (!tokens || !Array.isArray(tokens)) return []

    return tokens.filter(
      (token) =>
        token &&
        typeof token === 'object' &&
        !Object.getOwnPropertyNames(token).includes('__proto__')
    )
  }, [tokens])

  const columnDefs = useMemo<ColDef<Token>[]>(
    () => [
      {
        headerName: 'Token',
        field: 'logoURI',
        cellRenderer: LogoCellRenderer,
        width: 70,
        sortable: false,
        filter: false,
      },
      {
        headerName: 'Symbol',
        field: 'symbol',
        flex: 1,
        minWidth: 100,
        sortable: true,
      },
      {
        headerName: 'Price',
        field: 'priceUSD',
        cellRenderer: PriceCellRenderer,
        width: 100,
        sortable: true,
        type: 'numericColumn',
        headerClass: 'ag-right-aligned-header',
        cellClass: 'ag-right-aligned-cell',
      },
    ],
    []
  )

  const defaultColDef = useMemo(
    () => ({
      flex: 1,
      resizable: true,
      sortable: true,
      filter: false,
    }),
    []
  )

  return (
    <div className='ag-theme-alpine-dark w-full' style={{ height: '500px' }}>
      <AgGridReact
        rowData={safeTokens}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        animateRows={false}
        rowSelection='single'
        pagination
        paginationPageSize={20}
        suppressPaginationPanel={false}
        domLayout='normal'
      />
    </div>
  )
}
