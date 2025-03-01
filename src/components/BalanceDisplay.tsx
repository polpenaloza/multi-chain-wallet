'use client'

import { useQuery } from '@tanstack/react-query'

import { Balance, ConnectedWallets } from '@/types/wallet'

interface BalanceDisplayProps {
  connectedWallets: ConnectedWallets
}

export default function BalanceDisplay({
  connectedWallets,
}: BalanceDisplayProps) {
  const {
    data: balances,
    isLoading,
    error,
  } = useQuery<Balance[]>({
    queryKey: ['balances', connectedWallets],
    queryFn: async () => {
      // TODO: Implement balance fetching for connected wallets
      return []
    },
    enabled: Object.values(connectedWallets).some((wallet) => wallet !== null),
  })

  if (!Object.values(connectedWallets).some((wallet) => wallet !== null)) {
    return (
      <div className='text-center p-4'>Connect a wallet to view balances</div>
    )
  }

  if (isLoading)
    return <div className='text-center p-4'>Loading balances...</div>
  if (error)
    return (
      <div className='text-center p-4 text-error'>Error loading balances</div>
    )

  return (
    <div className='overflow-auto max-h-[500px]'>
      <table className='table'>
        <thead>
          <tr>
            <th>Token</th>
            <th>Balance</th>
            <th>Wallet</th>
          </tr>
        </thead>
        <tbody>
          {balances?.map((balance, index) => (
            <tr key={index}>
              <td>{balance.token}</td>
              <td>{balance.amount}</td>
              <td>{balance.wallet}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
