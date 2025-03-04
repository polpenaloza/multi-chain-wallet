'use client'

import { useEffect, useMemo, useState } from 'react'

import { useQuery } from '@tanstack/react-query'

import { Balance, ConnectedWallets } from '@/types/wallet'

import { fetchWalletBalances } from '@/services/balance.service'

interface BalanceDisplayProps {
  connectedWallets: ConnectedWallets
}

export default function BalanceDisplay({
  connectedWallets,
}: BalanceDisplayProps) {
  const [mounted, setMounted] = useState(false)

  // Set mounted state on client-side only
  useEffect(() => {
    setMounted(true)
  }, [])

  // Check if any wallet is connected
  const isAnyWalletConnected = useMemo(
    () => Object.values(connectedWallets).some((wallet) => wallet !== null),
    [connectedWallets]
  )

  // Group balances by wallet - defined before any conditional returns
  const groupBalancesByWallet = (balances: Balance[]) => {
    const grouped: Record<string, Balance[]> = {}

    balances.forEach((balance) => {
      if (!grouped[balance.wallet]) {
        grouped[balance.wallet] = []
      }
      grouped[balance.wallet].push(balance)
    })

    return grouped
  }

  // Fetch balances using React Query
  const {
    data: balances,
    isLoading,
    error,
  } = useQuery<Balance[]>({
    queryKey: ['balances', connectedWallets],
    queryFn: () => fetchWalletBalances(connectedWallets),
    enabled: isAnyWalletConnected && mounted,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refresh every minute
    retry: 2, // Retry failed requests up to 2 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
  })

  // Show a loading skeleton during SSR or before mounting
  if (!mounted) {
    return (
      <div className='card bg-base-200 p-6'>
        <h3 className='text-lg font-medium mb-4'>Wallet Balances</h3>
        <div className='space-y-4'>
          <div className='skeleton h-8 w-full'></div>
          <div className='skeleton h-20 w-full'></div>
          <div className='skeleton h-20 w-full'></div>
        </div>
      </div>
    )
  }

  // If no wallets are connected, show a message
  if (!isAnyWalletConnected) {
    return (
      <div className='card bg-base-200 p-6 text-center'>
        <h3 className='text-lg font-medium mb-2'>Wallet Balances</h3>
        <p>Connect a wallet to view balances</p>
      </div>
    )
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className='card bg-base-200 p-6'>
        <h3 className='text-lg font-medium mb-4'>Wallet Balances</h3>
        <div className='flex justify-center'>
          <span className='loading loading-spinner loading-md'></span>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className='card bg-base-200 p-6'>
        <h3 className='text-lg font-medium mb-2'>Wallet Balances</h3>
        <div className='alert alert-error'>
          <span>
            Error loading balances. Some blockchain APIs may be temporarily
            unavailable.
            {error instanceof Error ? ` (${error.message})` : ''}
          </span>
        </div>
      </div>
    )
  }

  // Show empty state if no balances
  if (!balances || balances.length === 0) {
    return (
      <div className='card bg-base-200 p-6'>
        <h3 className='text-lg font-medium mb-2'>Wallet Balances</h3>
        <p className='text-center'>No balances found</p>
      </div>
    )
  }

  // Use the grouping function
  const balancesByWallet = groupBalancesByWallet(balances)

  // Render balances grouped by wallet
  return (
    <div className='card bg-base-200 p-6'>
      <h3 className='text-lg font-medium mb-4'>Wallet Balances</h3>

      <div className='alert alert-info mb-4 text-sm'>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          fill='none'
          viewBox='0 0 24 24'
          className='stroke-current shrink-0 w-6 h-6'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
          ></path>
        </svg>
        <span>
          Some balances may use mock data due to public API limitations in
          development mode.
        </span>
      </div>

      <div className='space-y-6'>
        {Object.entries(balancesByWallet).map(([wallet, walletBalances]) => (
          <div key={wallet} className='card bg-base-300 shadow-sm'>
            <div className='card-body p-4'>
              <h4 className='card-title text-sm'>{wallet}</h4>

              <div className='overflow-x-auto'>
                <table className='table table-sm'>
                  <thead>
                    <tr>
                      <th>Token</th>
                      <th className='text-right'>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {walletBalances.map((balance, index) => (
                      <tr key={index} className='hover'>
                        <td>{balance.token}</td>
                        <td className='text-right font-mono'>
                          {balance.amount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
