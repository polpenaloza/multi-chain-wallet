declare module 'sats-connect' {
  export enum AddressPurpose {
    Payment = 'payment',
    Ordinals = 'ordinals',
  }

  export interface BitcoinAddress {
    address: string
    purpose: string
    publicKey?: string
  }

  export interface WalletResponse {
    status: 'success' | 'error'
    result?: {
      addresses: BitcoinAddress[]
    }
    error?: {
      code: number
      message: string
    }
  }

  export interface ConnectParams {
    addresses: AddressPurpose[]
    message?: string
  }

  export function request(
    method: 'wallet_getAccount',
    params: null
  ): Promise<WalletResponse>

  export function request(
    method: 'wallet_connect',
    params: ConnectParams
  ): Promise<WalletResponse>

  export function request(
    method: 'wallet_disconnect',
    params: null
  ): Promise<WalletResponse>

  export default class Wallet {
    static addListener(
      event: 'accountChange' | 'networkChange' | 'disconnect',
      callback: () => void
    ): () => void

    static disconnect(): Promise<void>

    static getInstalledWallets(): Promise<{ name: string; icon: string }[]>
  }
}
