'use client'

import { ReactNode, useState } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

interface QueryProviderProps {
  children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
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
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
