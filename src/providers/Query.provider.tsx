'use client'

import { ReactNode, useState } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

interface QueryProviderProps {
  children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Create a new QueryClient instance for each client
  // This ensures that each client has its own cache
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Prevent automatic refetching on window focus
            refetchOnWindowFocus: false,
            // Retry failed queries with exponential backoff
            retry: 2,
            retryDelay: (attemptIndex) =>
              Math.min(1000 * 2 ** attemptIndex, 30000),
            // Cache time of 5 minutes
            gcTime: 1000 * 60 * 5,
            // Stale time of 30 seconds
            staleTime: 1000 * 30,
            // Disable SSR for all queries to prevent hydration mismatches
            enabled: typeof window !== 'undefined',
          },
          mutations: {
            // Retry failed mutations once
            retry: 1,
            retryDelay: 1000,
          },
        },
      })
  )

  // Wrap in try-catch to prevent any potential errors during initialization
  try {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  } catch (error) {
    console.error('Error initializing QueryProvider:', error)
    // Fallback to rendering children without the provider in case of error
    return <>{children}</>
  }
}
