# Multi-Chain Wallet

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Setup

### Dependencies

- [node](https://nodejs.org/en/download/) v20x
- [nvm](https://github.com/nvm-sh/nvm/tree/master) v0.38.x (optional)
- [pnpm](https://pnpm.io/) v9.x

### Pre-Requisites

- install pnpm <https://pnpm.io/installation>
- (Optional) Get a Solana API key from [Alchemy](https://www.alchemy.com/) for reliable Solana RPC access
- (Optional) Get a Bitcoin API key from [BlockCypher](https://accounts.blockcypher.com/) for reliable Bitcoin balance fetching

### Environment Setup

1. Create a `.env.local` file in the root directory
2. Add your API keys (if you have them):

```
# Solana API key
NEXT_PUBLIC_SOLANA_RPC_URL=https://solana-mainnet.g.alchemy.com/v2/your-api-key-here

# BlockCypher API key for Bitcoin
NEXT_PUBLIC_BLOCKCYPHER_API_KEY=your-blockcypher-api-key-here
```

### Command lines

```bash
pnpm i
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.
