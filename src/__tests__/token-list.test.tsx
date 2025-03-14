import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import '@testing-library/jest-dom'

import TokenList from '../components/TokenList/TokenList'
import { getAllTokens } from '../services/lifi.service'

import { render, screen, waitFor } from '@testing-library/react'

// Define token type to avoid using 'any'
interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
  chainId: number
  logoURI: string
}

// Mock the AG Grid component
jest.mock('ag-grid-react', () => ({
  AgGridReact: jest.fn().mockImplementation(({ rowData }) => (
    <div data-testid='ag-grid'>
      <div>Total tokens: {rowData ? rowData.length : 0}</div>
      {rowData &&
        rowData.map((row: Token, index: number) => (
          <div key={index}>
            {row.symbol} - {row.name}
          </div>
        ))}
    </div>
  )),
}))

// Mock the LiFi service
jest.mock('../services/lifi.service', () => ({
  getAllTokens: jest.fn(),
}))

// Create a wrapper with React Query provider
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('TokenList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders loading state', async () => {
    // Mock the API to delay response
    ;(getAllTokens as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve([
              {
                address: '0x123',
                symbol: 'ETH',
                name: 'Ethereum',
                decimals: 18,
                chainId: 1,
                logoURI: 'https://example.com/eth.png',
              },
            ])
          }, 100)
        })
    )

    render(<TokenList />, { wrapper: TestWrapper })

    // Check if the component renders the loading state
    expect(screen.getByText('Supported Tokens')).toBeInTheDocument()

    // Check for skeleton elements
    const skeletonElements = document.querySelectorAll('.skeleton')
    expect(skeletonElements.length).toBeGreaterThan(0)
  })

  test('renders token data', async () => {
    // Mock the API to return token data
    ;(getAllTokens as jest.Mock).mockResolvedValue([
      {
        address: '0x123',
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        chainId: 1,
        logoURI: 'https://example.com/eth.png',
      },
      {
        address: '0x456',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        chainId: 1,
        logoURI: 'https://example.com/usdc.png',
      },
    ])

    render(<TokenList />, { wrapper: TestWrapper })

    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByText('Total tokens: 2')).toBeInTheDocument()
    })

    // Check if the tokens are rendered
    expect(screen.getByText('ETH - Ethereum')).toBeInTheDocument()
    expect(screen.getByText('USDC - USD Coin')).toBeInTheDocument()
  })

  test('handles API error', async () => {
    // Mock the API to throw an error
    ;(getAllTokens as jest.Mock).mockRejectedValue(new Error('API error'))

    render(<TokenList />, { wrapper: TestWrapper })

    // Wait for the error message to be displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to load tokens')).toBeInTheDocument()
    })
  })
})
