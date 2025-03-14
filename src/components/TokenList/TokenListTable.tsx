'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import {
  AllCommunityModule,
  ColDef,
  GridApi,
  ModuleRegistry,
} from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'

import { Token } from '@/services/lifi.service'

ModuleRegistry.registerModules([AllCommunityModule])

// Add this interface at the top of the file, after imports
interface ExtendedGridApi<T> extends GridApi<T> {
  paginationSetPageSize(size: number): void
}

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

// Custom pagination component
const CustomPagination = ({ api }: { api: ExtendedGridApi<Token> }) => {
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [pageSize, setPageSize] = useState(20)

  // Update pagination state when it changes
  const onPaginationChanged = useCallback(() => {
    if (api) {
      setCurrentPage(api.paginationGetCurrentPage())
      setTotalPages(api.paginationGetTotalPages())
      setPageSize(api.paginationGetPageSize())
    }
  }, [api])

  // Register for pagination changes
  useEffect(() => {
    if (api) {
      api.addEventListener('paginationChanged', onPaginationChanged)
      onPaginationChanged() // Initialize values

      return () => {
        api.removeEventListener('paginationChanged', onPaginationChanged)
      }
    }
  }, [api, onPaginationChanged])

  const goToPrevPage = useCallback(() => {
    if (api) {
      api.paginationGoToPreviousPage()
    }
  }, [api])

  const goToNextPage = useCallback(() => {
    if (api) {
      api.paginationGoToNextPage()
    }
  }, [api])

  // Change page size
  const changePageSize = useCallback(
    (newSize: number) => {
      if (api) {
        // Cast to extended interface
        ;(api as ExtendedGridApi<Token>).paginationSetPageSize(newSize)
      }
    },
    [api]
  )

  return (
    <div className='flex items-center justify-between p-2 border-t border-base-300 bg-base-100'>
      <div className='flex items-center'>
        <button
          onClick={goToPrevPage}
          disabled={currentPage === 0}
          className='btn btn-sm btn-square btn-ghost px-2 min-h-8 h-8'
          aria-label='Previous page'
        >
          ←
        </button>
        <span className='text-xs px-1 text-center min-w-[60px]'>
          {currentPage + 1}/{totalPages || 1}
        </span>
        <button
          onClick={goToNextPage}
          disabled={currentPage >= totalPages - 1}
          className='btn btn-sm btn-square btn-ghost px-2 min-h-8 h-8'
          aria-label='Next page'
        >
          →
        </button>
      </div>
      <div className='flex items-center min-w-14'>
        <select
          value={pageSize}
          onChange={(e) => changePageSize(Number(e.target.value))}
          className='select select-xs select-bordered h-8 min-h-8 px-2'
          aria-label='Page size'
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
        </select>
      </div>
    </div>
  )
}

export default function TokenListTable({ tokens }: { tokens: Token[] }) {
  const [gridApi, setGridApi] = useState<GridApi<Token> | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isSmallScreen, setIsSmallScreen] = useState(false)
  const gridRef = useRef<AgGridReact>(null)

  // Check screen size on mount
  useEffect(() => {
    const width = window.innerWidth
    setIsMobile(width < 768)
    setIsSmallScreen(width < 380)
  }, [])

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
        width: isSmallScreen ? 50 : 70,
        sortable: false,
        filter: false,
        suppressSizeToFit: true,
      },
      {
        headerName: 'Symbol',
        field: 'symbol',
        flex: 1,
        minWidth: isSmallScreen ? 80 : 100,
        sortable: true,
      },
      {
        headerName: 'Price',
        field: 'priceUSD',
        cellRenderer: PriceCellRenderer,
        width: isSmallScreen ? 80 : 100,
        sortable: true,
        type: 'numericColumn',
        headerClass: 'ag-right-aligned-header',
        cellClass: 'ag-right-aligned-cell',
        suppressSizeToFit: true,
      },
    ],
    [isSmallScreen]
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

  // Store grid API on ready
  const onGridReady = useCallback((params: { api: GridApi<Token> }) => {
    setGridApi(params.api)
  }, [])

  return (
    <div className='flex flex-col w-full'>
      <style jsx global>{`
        .ag-theme-alpine-dark {
          --ag-font-size: ${isSmallScreen ? '12px' : '14px'};
          --ag-header-height: ${isSmallScreen ? '30px' : '40px'};
          --ag-row-height: ${isSmallScreen ? '40px' : '48px'};
        }

        .ag-theme-alpine-dark .ag-header-cell-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>
      <div
        className='ag-theme-alpine-dark w-full overflow-hidden'
        style={{
          height: isSmallScreen ? '350px' : isMobile ? '400px' : '500px',
        }}
      >
        <AgGridReact
          ref={gridRef}
          rowData={safeTokens}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          animateRows={false}
          rowSelection='single'
          pagination
          paginationPageSize={isSmallScreen ? 5 : isMobile ? 10 : 20}
          suppressPaginationPanel={true}
          domLayout='normal'
          onGridReady={onGridReady}
        />
      </div>
      {gridApi && <CustomPagination api={gridApi as ExtendedGridApi<Token>} />}
    </div>
  )
}
