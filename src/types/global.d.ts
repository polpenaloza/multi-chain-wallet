interface BitcoinAddressOptions {
  onFinish: (result: {
    addresses: Array<{
      address: string
      publicKey: string
      purpose: number
      addressType: number
      walletType: string
    }>
  }) => void
  onCancel?: () => void
  onError?: (error: Error) => void
}

interface Window {
  bitcoin?: {
    getAddresses: (options: AddressPurpose) => void
    request: () => Promise<Record<string, unknown>>
  }
  ethereum?: {
    request: <T>(args: { method: string; params?: unknown[] }) => Promise<T>
  }
}
