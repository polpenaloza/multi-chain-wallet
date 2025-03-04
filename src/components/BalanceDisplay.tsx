'use client'

import { useEffect, useMemo, useState } from 'react'

import { useQueries } from '@tanstack/react-query'

import { ConnectedWallets } from '@/types/wallet'

import {
  fetchBitcoinBalances,
  fetchEVMBalances,
  fetchSolanaBalances,
} from '@/services/balance.service'

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

  // Create individual queries for each wallet type
  const walletQueries = useQueries({
    queries: [
      {
        queryKey: ['balances', 'evm', connectedWallets.evm?.address],
        queryFn: () =>
          connectedWallets.evm
            ? fetchEVMBalances(connectedWallets.evm, {})
            : Promise.resolve([]),
        enabled: !!connectedWallets.evm && mounted,
        staleTime: 30 * 1000, // 30 seconds
        refetchInterval: 60 * 1000, // Refresh every minute
        retry: 2,
      },
      {
        queryKey: ['balances', 'solana', connectedWallets.solana?.address],
        queryFn: () =>
          connectedWallets.solana
            ? fetchSolanaBalances(connectedWallets.solana, {})
            : Promise.resolve([]),
        enabled: !!connectedWallets.solana && mounted,
        staleTime: 30 * 1000,
        refetchInterval: 60 * 1000,
        retry: 2,
      },
      {
        queryKey: ['balances', 'bitcoin', connectedWallets.bitcoin?.address],
        queryFn: () =>
          connectedWallets.bitcoin
            ? fetchBitcoinBalances(connectedWallets.bitcoin)
            : Promise.resolve([]),
        enabled: !!connectedWallets.bitcoin && mounted,
        staleTime: 30 * 1000,
        refetchInterval: 60 * 1000,
        retry: 2,
      },
    ],
  })

  // Extract data and loading states for each wallet type
  const [evmQuery, solanaQuery, bitcoinQuery] = walletQueries

  // Refetch all balances
  const refetchAll = () => {
    if (connectedWallets.evm) evmQuery.refetch()
    if (connectedWallets.solana) solanaQuery.refetch()
    if (connectedWallets.bitcoin) bitcoinQuery.refetch()
  }

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

  // Render each wallet section independently
  return (
    <div className='card bg-base-200 p-6'>
      <div className='flex justify-between items-center mb-4'>
        <h3 className='text-lg font-medium'>Wallet Balances</h3>
        <button
          className='btn btn-ghost btn-sm'
          onClick={refetchAll}
          disabled={
            evmQuery.isRefetching ||
            solanaQuery.isRefetching ||
            bitcoinQuery.isRefetching
          }
        >
          {evmQuery.isRefetching ||
          solanaQuery.isRefetching ||
          bitcoinQuery.isRefetching ? (
            <span className='loading loading-spinner loading-xs'></span>
          ) : (
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-5 w-5'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
              />
            </svg>
          )}
        </button>
      </div>

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
          Only native tokens (ETH, SOL, BTC) are displayed due to API
          limitations.
        </span>
      </div>

      <div className='space-y-6'>
        {/* EVM Wallet Section */}
        {connectedWallets.evm && (
          <div className='card bg-base-300 shadow-sm'>
            <div className='card-body p-4'>
              <div className='flex justify-between items-center'>
                <h4 className='card-title text-sm'>
                  {`evm:${connectedWallets.evm.address.substring(0, 6)}...${connectedWallets.evm.address.substring(connectedWallets.evm.address.length - 4)}`}
                </h4>
                {evmQuery.isRefetching && (
                  <span className='loading loading-spinner loading-xs'></span>
                )}
              </div>

              {evmQuery.isLoading && !evmQuery.isRefetching ? (
                <div className='flex items-center gap-2 py-2'>
                  <span className='loading loading-spinner loading-xs'></span>
                  <span className='text-sm'>Fetching EVM balance...</span>
                </div>
              ) : evmQuery.error ? (
                <div className='alert alert-error text-sm py-2 mb-2'>
                  <span>Error loading EVM balances</span>
                  <button
                    className='btn btn-xs'
                    onClick={() => evmQuery.refetch()}
                  >
                    Retry
                  </button>
                </div>
              ) : evmQuery.data && evmQuery.data.length > 0 ? (
                <div className='overflow-x-auto'>
                  <table className='table table-sm'>
                    <thead>
                      <tr>
                        <th>Token</th>
                        <th className='text-right'>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evmQuery.data.map((balance, index) => (
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
              ) : (
                <p className='text-center text-sm py-2'>
                  No EVM balances found
                </p>
              )}
            </div>
          </div>
        )}

        {/* Solana Wallet Section */}
        {connectedWallets.solana && (
          <div className='card bg-base-300 shadow-sm'>
            <div className='card-body p-4'>
              <div className='flex justify-between items-center'>
                <h4 className='card-title text-sm'>
                  {`solana:${connectedWallets.solana.address.substring(0, 6)}...${connectedWallets.solana.address.substring(connectedWallets.solana.address.length - 4)}`}
                </h4>
                {solanaQuery.isRefetching && (
                  <span className='loading loading-spinner loading-xs'></span>
                )}
              </div>

              {solanaQuery.isLoading && !solanaQuery.isRefetching ? (
                <div className='flex items-center gap-2 py-2'>
                  <span className='loading loading-spinner loading-xs'></span>
                  <span className='text-sm'>Fetching Solana balance...</span>
                </div>
              ) : solanaQuery.error ? (
                <div className='alert alert-error text-sm py-2 mb-2'>
                  <span>Error loading Solana balances</span>
                  <button
                    className='btn btn-xs'
                    onClick={() => solanaQuery.refetch()}
                  >
                    Retry
                  </button>
                </div>
              ) : solanaQuery.data && solanaQuery.data.length > 0 ? (
                <div className='overflow-x-auto'>
                  <table className='table table-sm'>
                    <thead>
                      <tr>
                        <th>Token</th>
                        <th className='text-right'>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {solanaQuery.data.map((balance, index) => (
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
              ) : (
                <p className='text-center text-sm py-2'>
                  No Solana balances found
                </p>
              )}
            </div>
          </div>
        )}

        {/* Bitcoin Wallet Section */}
        {connectedWallets.bitcoin && (
          <div className='card bg-base-300 shadow-sm'>
            <div className='card-body p-4'>
              <div className='flex justify-between items-center'>
                <h4 className='card-title text-sm'>
                  {`bitcoin:${connectedWallets.bitcoin.address.substring(0, 6)}...${connectedWallets.bitcoin.address.substring(connectedWallets.bitcoin.address.length - 4)}`}
                </h4>
                {bitcoinQuery.isRefetching && (
                  <span className='loading loading-spinner loading-xs'></span>
                )}
              </div>

              {bitcoinQuery.isLoading && !bitcoinQuery.isRefetching ? (
                <div className='flex items-center gap-2 py-2'>
                  <span className='loading loading-spinner loading-xs'></span>
                  <span className='text-sm'>Fetching Bitcoin balance...</span>
                </div>
              ) : bitcoinQuery.error ? (
                <div className='alert alert-error text-sm py-2 mb-2'>
                  <span>Error loading Bitcoin balances</span>
                  <button
                    className='btn btn-xs'
                    onClick={() => bitcoinQuery.refetch()}
                  >
                    Retry
                  </button>
                </div>
              ) : bitcoinQuery.data && bitcoinQuery.data.length > 0 ? (
                <div className='overflow-x-auto'>
                  <table className='table table-sm'>
                    <thead>
                      <tr>
                        <th>Token</th>
                        <th className='text-right'>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bitcoinQuery.data.map((balance, index) => (
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
              ) : (
                <p className='text-center text-sm py-2'>
                  No Bitcoin balances found
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
