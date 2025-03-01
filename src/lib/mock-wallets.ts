import { AddressPurpose, AddressType } from 'sats-connect'

// Mock implementation for testing without wallet extensions
export function setupMockWallets() {
  if (process.env.NODE_ENV === 'development') {
    // Mock Bitcoin wallet
    window.bitcoin = {
      getAddresses: (options) => {
        setTimeout(() => {
          options.onFinish({
            addresses: [
              {
                address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
                publicKey:
                  '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
                purpose: AddressPurpose.Payment,
                addressType: AddressType.p2wpkh,
                walletType: 'software',
              },
            ],
          })
        }, 500)
      },
      request: () => Promise.resolve({}),
    }

    // Mock Ethereum wallet
    if (!window.ethereum) {
      window.ethereum = {
        request: <T>(args: { method: string; params?: unknown[] }) => {
          if (args.method === 'eth_requestAccounts') {
            return Promise.resolve([
              '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            ] as unknown as T)
          }
          return Promise.resolve(null as unknown as T)
        },
      }
    }

    console.log('Mock wallets initialized for development')
  }
}
