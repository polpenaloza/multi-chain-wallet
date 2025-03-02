declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean
      request: <T>(args: { method: string; params?: unknown[] }) => Promise<T>
    }

    // Bitcoin wallet provider (Xverse)
    bitcoin?: {
      request?: (method: string, params?: unknown) => Promise<unknown>
    }
  }
}

export {}
