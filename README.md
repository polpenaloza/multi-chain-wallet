# Multi-Chain Wallet

Hey there! 👋 This is my implementation of a multi-chain wallet frontend that lets you connect to different blockchain networks simultaneously. I built this with React, TypeScript, Next.js, and styled it with Tailwind + DaisyUI.

## Live Demo

🚀 **Check out the live demo**: [https://wallet.polpenaloza.dev/](https://wallet.polpenaloza.dev/)

I've hooked this project up to Vercel's build mechanism for continuous deployment, so you can always see the latest version at the URL above!

## What it does

This app lets you:

- Connect to multiple blockchain wallets at the same time:
  - MetaMask for Ethereum and other EVM chains
  - Phantom for Solana
  - Xverse for Bitcoin
- Browse tokens from the LI.FI API (with optimized rendering so it doesn't choke your browser)
- See your actual wallet balances across different chains
- Search and filter through your tokens
- Works great on mobile too!

## Getting it running

> 💡 **Pro tip**: If you just want to see the app in action without setting it up locally, visit the live demo at [https://wallet.polpenaloza.dev/](https://wallet.polpenaloza.dev/)

### What you'll need

- Node.js v20.x (I recommend using nvm to manage Node versions)
- pnpm v9.x for package management

### Nice-to-haves (but optional)

If you want the best experience with reliable RPC connections:

- A Solana API key from [Alchemy](https://www.alchemy.com/)
- A Bitcoin API key from [BlockCypher](https://accounts.blockcypher.com/)

The app will work without these, but you might hit rate limits with the public endpoints.

### Setting up your environment

1. Clone this repo
2. Create a `.env.local` file in the root with your API keys (if you have them):

```sh
# For better Solana RPC access
NEXT_PUBLIC_SOLANA_RPC_URL=https://solana-mainnet.g.alchemy.com/v2/your-api-key-here

# For more reliable Bitcoin balance fetching
NEXT_PUBLIC_BLOCKCYPHER_API_KEY=your-blockcypher-api-key-here
```

### Installation & running locally

```bash
# Get all the dependencies
pnpm i

# Fire up the dev server
pnpm run dev

# Run the tests
pnpm test

# Build for production
pnpm build

# Run the production build
pnpm start
```

Once running, just open [http://localhost:3000](http://localhost:3000) in your browser.

## How I built it

### Architecture

I tried to keep things modular and maintainable:

- **Components**: Split into logical UI pieces for wallet connections, token lists, etc.
- **Services**: Separate API services for different blockchain interactions
- **Hooks**: Custom React hooks to handle wallet state and connections
- **Providers**: Context providers where global state made sense
- **Types**: Proper TypeScript definitions throughout

### State Management

I kept it simple:

- **React Query** for data fetching and caching (works great for the token lists)
- **React's built-in hooks** for component state
- **Custom hooks** to abstract wallet connection logic

### UI/UX Choices

- Used **DaisyUI** components as a foundation
- **Tailwind CSS** for styling (makes responsive design so much easier)
- **AG Grid** for the token list (handles large datasets way better than regular tables)

## Challenges I ran into

### Wallet Connection Headaches

Dealing with multiple wallet providers was tricky since each has its own API quirks. I ended up creating a unified pattern that abstracts away the differences, which made the rest of the app much cleaner.

### Performance with Token Lists

The LI.FI API returns a LOT of tokens. Rendering them all at once killed performance, so I implemented virtualized rendering with AG Grid and added pagination. This made a huge difference.

### Cross-Chain Compatibility

Each blockchain ecosystem has its own way of doing things - from how addresses are formatted to how balances are calculated. I had to create normalization layers to make everything work together smoothly.

## Testing

I've written unit tests for the core functionality:

- Wallet connection/disconnection flows
- Token list rendering
- Balance display logic

Run them with:

```bash
pnpm test
```

## What's next?

If I had more time, I'd love to add:

- Transaction history
- Better token search with more filtering options
- Dark/light theme toggle (who doesn't love dark mode?)
- More robust error handling for edge cases
- More comprehensive test coverage

Feel free to reach out if you have any questions or suggestions!
