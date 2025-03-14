import { toast } from 'react-hot-toast'

import * as satsConnect from 'sats-connect'

// Define event types
export type WalletEvent =
  | {
      type: 'connect'
      walletType: 'evm' | 'solana' | 'bitcoin'
      address: string
    }
  | { type: 'disconnect'; walletType: 'evm' | 'solana' | 'bitcoin' }
  | {
      type: 'accountChanged'
      walletType: 'evm' | 'solana' | 'bitcoin'
      address: string
    }

// Observer type
type Observer = (event: WalletEvent) => void

// Type for ethereum request
type EthereumRequest = {
  method: string
  params?: unknown[]
}

// WalletObserver class
class WalletObserver {
  private observers: Observer[] = []
  private isListening = false
  private bitcoinPollingInterval: NodeJS.Timeout | null = null
  private currentAddresses: Record<string, string | null> = {
    evm: null,
    solana: null,
    bitcoin: null,
  }

  // Add an observer
  subscribe(observer: Observer): () => void {
    this.observers.push(observer)

    // Start listening if this is the first observer
    if (this.observers.length === 1 && !this.isListening) {
      this.startListening()
    }

    // Return unsubscribe function
    return () => {
      this.observers = this.observers.filter((obs) => obs !== observer)

      // Stop listening if there are no more observers
      if (this.observers.length === 0 && this.isListening) {
        this.stopListening()
      }
    }
  }

  // Notify all observers
  private notify(event: WalletEvent): void {
    this.observers.forEach((observer) => observer(event))
  }

  // Update current address
  updateAddress(
    walletType: 'evm' | 'solana' | 'bitcoin',
    address: string | null
  ): void {
    const oldAddress = this.currentAddresses[walletType]
    this.currentAddresses[walletType] = address

    // If address changed from null to a value, it's a connect event
    if (oldAddress === null && address !== null) {
      this.notify({
        type: 'connect',
        walletType,
        address,
      })
    }
    // If address changed from a value to null, it's a disconnect event
    else if (oldAddress !== null && address === null) {
      this.notify({
        type: 'disconnect',
        walletType,
      })
    }
    // If address changed from one value to another, it's an account change event
    else if (
      oldAddress !== null &&
      address !== null &&
      oldAddress !== address
    ) {
      this.notify({
        type: 'accountChanged',
        walletType,
        address,
      })

      // Show toast notification for account change
      toast.success(`${walletType.toUpperCase()} wallet account changed`)
    }
  }

  // Start listening for wallet events
  private startListening(): void {
    if (this.isListening) return

    console.log('Starting wallet observers')
    this.isListening = true

    // Setup EVM wallet listeners
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleEVMAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          this.updateAddress('evm', null)
        } else {
          this.updateAddress('evm', accounts[0])
        }
      }

      try {
        // Cast to unknown first as suggested by TypeScript
        const ethereum = window.ethereum as unknown as {
          on: (event: string, handler: (accounts: string[]) => void) => void
          request: (args: EthereumRequest) => Promise<unknown>
        }
        ethereum.on('accountsChanged', handleEVMAccountsChanged)

        // Get initial accounts
        ethereum
          .request({ method: 'eth_accounts' })
          .then((accounts: unknown) => {
            if (
              Array.isArray(accounts) &&
              accounts.length > 0 &&
              typeof accounts[0] === 'string'
            ) {
              this.updateAddress('evm', accounts[0])
            }
          })
          .catch((err: unknown) =>
            console.error('Error getting EVM accounts:', err)
          )
      } catch (err) {
        console.error('Error setting up EVM wallet listeners:', err)
      }
    }

    // Setup Solana wallet listeners
    if (typeof window !== 'undefined' && window.solana) {
      const handleSolanaAccountChange = () => {
        try {
          const solana = window.solana as unknown as {
            publicKey?: { toString: () => string }
            isConnected?: boolean
          }

          if (solana?.publicKey && solana?.isConnected) {
            this.updateAddress('solana', solana.publicKey.toString())
          } else {
            this.updateAddress('solana', null)
          }
        } catch (err) {
          console.error('Error handling Solana account change:', err)
        }
      }

      try {
        const solanaEvents = window.solana as unknown as {
          on: (event: string, handler: () => void) => void
          connect: () => Promise<{ publicKey: { toString: () => string } }>
          isConnected?: boolean
          publicKey?: { toString: () => string }
        }

        solanaEvents.on('connect', handleSolanaAccountChange)
        solanaEvents.on('disconnect', handleSolanaAccountChange)
        solanaEvents.on('accountChanged', handleSolanaAccountChange)

        // Check initial state and attempt auto-reconnect
        if (solanaEvents.isConnected && solanaEvents.publicKey) {
          // Already connected, just update the address
          this.updateAddress('solana', solanaEvents.publicKey.toString())
        } else if (
          solanaEvents.connect &&
          typeof solanaEvents.connect === 'function'
        ) {
          // Try to auto-reconnect silently
          solanaEvents
            .connect()
            .then(({ publicKey }) => {
              if (publicKey) {
                this.updateAddress('solana', publicKey.toString())
                console.log('Successfully auto-reconnected to Phantom wallet')
              }
            })
            .catch((err) => {
              console.log(
                'Phantom auto-reconnect failed, user will need to connect manually',
                err
              )
            })
        } else {
          // Fallback to checking current state
          handleSolanaAccountChange()
        }
      } catch (err) {
        console.error('Error setting up Solana wallet listeners:', err)
      }
    }

    // Setup Bitcoin wallet polling and attempt auto-reconnect
    this.startBitcoinPolling()
    this.attemptBitcoinAutoReconnect()
  }

  // Attempt to auto-reconnect to Bitcoin wallet
  private attemptBitcoinAutoReconnect(): void {
    if (typeof window === 'undefined') return

    // Try to get the current account without prompting the user
    setTimeout(async () => {
      try {
        const response = await satsConnect.request('wallet_getAccount', null)

        if (response.status === 'success' && response.result) {
          // Find the payment address
          const paymentAddressItem = response.result.addresses.find(
            (address) => address.purpose === 'payment'
          )

          if (paymentAddressItem) {
            this.updateAddress('bitcoin', paymentAddressItem.address)
            console.log('Successfully auto-reconnected to Xverse wallet')
          }
        }
      } catch (error) {
        console.log(
          'Xverse auto-reconnect failed, user will need to connect manually',
          error
        )
      }
    }, 1000) // Short delay to ensure wallet extension is fully loaded
  }

  // Start Bitcoin polling
  private startBitcoinPolling(): void {
    if (this.bitcoinPollingInterval) return

    // Poll every 10 seconds instead of 2 seconds to reduce API calls
    this.bitcoinPollingInterval = setInterval(async () => {
      try {
        // Check if the wallet is still connected
        const response = await satsConnect.request('wallet_getAccount', null)

        if (response.status === 'success' && response.result) {
          // Find the payment address
          const paymentAddressItem = response.result.addresses.find(
            (address) => address.purpose === 'payment'
          )

          if (paymentAddressItem) {
            this.updateAddress('bitcoin', paymentAddressItem.address)
          }
        } else {
          this.updateAddress('bitcoin', null)
        }
      } catch {
        // If we get an error, assume the wallet is disconnected
        this.updateAddress('bitcoin', null)
      }
    }, 10000) // Changed from 2000 to 10000 (10 seconds)
  }

  // Stop listening for wallet events
  private stopListening(): void {
    if (!this.isListening) return

    console.log('Stopping wallet observers')
    this.isListening = false

    // Clean up Bitcoin polling
    if (this.bitcoinPollingInterval) {
      clearInterval(this.bitcoinPollingInterval)
      this.bitcoinPollingInterval = null
    }
  }

  // Get current wallet addresses
  getAddresses(): Record<string, string | null> {
    return { ...this.currentAddresses }
  }
}

// Create a singleton instance
export const walletObserver = new WalletObserver()

// Export a hook to use the wallet observer
export function useWalletObserver(callback: Observer): () => void {
  if (typeof window === 'undefined') {
    // Return a no-op function for SSR
    return () => {}
  }

  return walletObserver.subscribe(callback)
}
