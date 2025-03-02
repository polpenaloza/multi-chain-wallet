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
            // Retry failed queries only once
            retry: 1,
            // Cache time of 5 minutes
            gcTime: 1000 * 60 * 5,
            // Disable SSR for all queries to prevent hydration mismatches
            enabled: typeof window !== 'undefined',
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
