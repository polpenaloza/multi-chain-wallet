'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import React from 'react'
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

interface ExtendedGridApi<T> extends GridApi<T> {
  paginationSetPageSize(size: number): void
}

const LogoCellRenderer = React.memo((props: { value: string; data: Token }) => {
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
          loading='lazy' // Add lazy loading for images
        />
      </div>
    )
  }

  return (
    <div className='w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center'>
      {data?.symbol?.charAt(0)}
    </div>
  )
})

LogoCellRenderer.displayName = 'LogoCellRenderer'

const PriceCellRenderer = React.memo((props: { value: number | undefined }) => {
  const { value } = props
  if (!value) return <span>N/A</span>
  return <span>{`$${Number(value).toFixed(2)}`}</span>
})

PriceCellRenderer.displayName = 'PriceCellRenderer'

const CustomPagination = React.memo(
  ({ api }: { api: ExtendedGridApi<Token> }) => {
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

    useEffect(() => {
      if (api) {
        api.addEventListener('paginationChanged', onPaginationChanged)
        onPaginationChanged()

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

    const changePageSize = useCallback(
      (newSize: number) => {
        if (api) {
          // The correct way to set pagination page size
          api.paginationSetPageSize(newSize)
        }
      },
      [api]
    )

    const paginationButtons = useMemo(() => {
      return (
        <div className='flex items-center justify-between mt-4 px-2'>
          <div className='flex items-center space-x-2'>
            <select
              className='select select-bordered select-sm'
              value={pageSize}
              onChange={(e) => changePageSize(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className='flex items-center space-x-2'>
            <span className='text-sm'>
              Page {currentPage + 1} of {totalPages || 1}
            </span>
            <div className='btn-group'>
              <button
                className='btn btn-sm'
                onClick={goToPrevPage}
                disabled={currentPage === 0}
              >
                «
              </button>
              <button
                className='btn btn-sm'
                onClick={goToNextPage}
                disabled={currentPage >= totalPages - 1}
              >
                »
              </button>
            </div>
          </div>
        </div>
      )
    }, [
      currentPage,
      totalPages,
      pageSize,
      goToPrevPage,
      goToNextPage,
      changePageSize,
    ])

    return paginationButtons
  }
)

CustomPagination.displayName = 'CustomPagination'

export default function TokenListTable({ tokens }: { tokens: Token[] }) {
  const [gridApi, setGridApi] = useState<GridApi<Token> | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isSmallScreen, setIsSmallScreen] = useState(false)
  const gridRef = useRef<AgGridReact>(null)

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      setIsMobile(width < 768)
      setIsSmallScreen(width < 380)
    }

    handleResize()

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // Memoize the tokens to prevent unnecessary re-renders
  const safeTokens = useMemo(() => {
    if (!tokens || !Array.isArray(tokens)) return []

    return tokens.filter(
      (token) =>
        token &&
        typeof token === 'object' &&
        !Object.getOwnPropertyNames(token).includes('__proto__')
    )
  }, [tokens])

  // Memoize column definitions to prevent unnecessary re-renders
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

  // Memoize default column definition to prevent unnecessary re-renders
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
          rowBuffer={10} // Increase row buffer for smoother scrolling
          cacheBlockSize={100} // Optimize cache block size
          maxBlocksInCache={10} // Limit cache size
          suppressCellFocus={true} // Improve performance by disabling cell focus
        />
      </div>
      {gridApi && <CustomPagination api={gridApi as ExtendedGridApi<Token>} />}
    </div>
  )
}
