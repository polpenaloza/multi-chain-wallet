import { createConfig, http } from 'wagmi'
import { arbitrum, base, mainnet, optimism, polygon } from 'wagmi/chains'
import { injected, metaMask } from 'wagmi/connectors'

export const config = createConfig({
  chains: [mainnet, polygon, optimism, arbitrum, base],
  connectors: [injected(), metaMask()],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
  },
  syncConnectedChain: true,
})
