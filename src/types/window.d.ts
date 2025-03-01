declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean
      request: <T>(args: { method: string; params?: unknown[] }) => Promise<T>
    }
  }
}

export {}
