export type WalletType = {
  address: string
  type: 'evm' | 'solana' | 'bitcoin'
}

export type ConnectedWallets = {
  evm: WalletType | null
  solana: WalletType | null
  bitcoin: WalletType | null
}

export interface Balance {
  token: string
  amount: string
  wallet: string
}
