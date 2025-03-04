interface Transaction {
  serialize(): Uint8Array
}

interface PhantomProvider {
  isPhantom?: boolean
  connect: () => Promise<{ publicKey: string }>
  disconnect: () => Promise<void>
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>
  signTransaction: (transaction: Transaction) => Promise<Transaction>
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>
}

interface Window {
  solana?: PhantomProvider
}
