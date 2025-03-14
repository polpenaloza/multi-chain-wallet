# Multi-Chain Wallet

A React-based frontend application that enables users to connect wallets for multiple blockchain protocols (EVM, Solana, and UTXO) and displays their wallet balances. The solution is implemented using TypeScript, Next.js, React Query, and Tailwind CSS with DaisyUI.

## Features

- Connect to multiple blockchain wallets simultaneously:
  - EVM-based wallets (MetaMask)
  - Solana wallets (Phantom)
  - Bitcoin wallets (Xverse)
- View token list from LI.FI API with optimized rendering
- Display wallet balances for connected wallets
- Search and filter tokens and balances
- Responsive design for all screen sizes

## Setup

### Dependencies

- [node](https://nodejs.org/en/download/) v20x
- [nvm](https://github.com/nvm-sh/nvm/tree/master) v0.38.x (optional)
- [pnpm](https://pnpm.io/) v9.x

### Pre-Requisites

- Install pnpm <https://pnpm.io/installation>
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

### Installation and Running

```bash
# Install dependencies
pnpm i

# Run development server
pnpm run dev

# Run tests
pnpm test

# Build for production
pnpm build

# Start production server
pnpm start
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Design Decisions

### Architecture

The application follows a modular architecture with clear separation of concerns:

- **Components**: UI components for wallet connection, token list, and balance display
- **Services**: API services for fetching token data and wallet balances
- **Hooks**: Custom hooks for wallet state management
- **Providers**: Context providers for global state and configuration
- **Types**: TypeScript type definitions for the application

### State Management

- **React Query**: Used for data fetching, caching, and state management for API calls
- **React Hooks**: Used for component-level state management
- **Custom Hooks**: Created for wallet connection and state management

### UI/UX

- **DaisyUI**: Used for UI components and theming
- **Tailwind CSS**: Used for styling and responsive design
- **AG Grid**: Used for efficient rendering of large token lists

### Performance Optimizations

- **Dynamic Imports**: Used for code splitting and lazy loading
- **Memoization**: Used to prevent unnecessary re-renders
- **Pagination**: Implemented for token list to handle large datasets
- **Search Filtering**: Optimized for performance with debouncing

## Challenges and Solutions

### Wallet Connection

**Challenge**: Connecting to multiple blockchain wallets with different APIs and interfaces.

**Solution**: Created a unified wallet observer pattern that abstracts away the differences between wallet providers. This allows for a consistent interface for connecting, disconnecting, and monitoring wallet state changes.

### Token List Rendering

**Challenge**: Efficiently rendering a large list of tokens from the LI.FI API.

**Solution**: Implemented AG Grid for virtualized rendering and pagination. This allows for efficient rendering of large datasets with minimal performance impact.

### Balance Fetching

**Challenge**: Fetching balances for multiple tokens across different blockchain ecosystems.

**Solution**: Created a balance service that handles fetching balances for each wallet type. Used React Query for efficient data fetching, caching, and state management.

### Cross-Chain Compatibility

**Challenge**: Ensuring compatibility across different blockchain ecosystems with varying APIs and data structures.

**Solution**: Created abstraction layers for each blockchain ecosystem to normalize data and provide a consistent interface for the UI.

## Testing

The application includes unit tests for key components and functionality:

- Wallet connection tests
- Token list rendering tests
- Balance display tests

Run tests with:

```bash
pnpm test
```

## Future Improvements

- Add support for more wallet providers
- Implement real-time balance updates
- Add transaction history
- Enhance token search with advanced filtering
- Implement dark/light theme toggle
- Add more comprehensive error handling and recovery
- Expand test coverage with integration and end-to-end tests
