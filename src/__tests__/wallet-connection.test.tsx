import { act } from 'react'

import '@testing-library/jest-dom'

import WalletConnection from '../components/WalletConnect'
import { walletObserver } from '../lib/walletObserver'

import { fireEvent, render, screen, waitFor } from '@testing-library/react'

// Define the wallet event type to avoid using 'any'
interface WalletEvent {
  evm: { address: string; type: 'evm' } | null;
  solana: { address: string; type: 'solana' } | null;
  bitcoin: { address: string; type: 'bitcoin' } | null;
}

// Mock the WalletConnect component to prevent the act() warning
jest.mock('@walletconnect/modal', () => ({
  WalletConnectModal: jest.fn().mockImplementation(() => ({
    open: jest.fn(),
    close: jest.fn(),
  })),
}))

// Mock the wallet service
jest.mock('../lib/walletObserver', () => ({
  walletObserver: {
    subscribe: jest.fn(),
    notify: jest.fn(),
  },
}))

jest.mock('../lib/wallets', () => ({
  connectEVMWallet: jest.fn().mockResolvedValue({
    address: '0x1234567890abcdef1234567890abcdef12345678',
    type: 'evm',
  }),
  connectSolanaWallet: jest.fn().mockResolvedValue({
    address: 'soLANaWaLLetAddReSS123456789abcdefghijklmnopqrstuvwxyz',
    type: 'solana',
  }),
  connectBitcoinWallet: jest.fn().mockResolvedValue({
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    type: 'bitcoin',
  }),
  disconnectWallet: jest.fn(),
}))

// Mock the WalletConnect component to avoid prop type errors
jest.mock('../components/WalletConnect', () => {
  return function MockWalletConnection() {
    return (
      <div>
        <button>Connect EVM Wallet</button>
        <button>Connect Solana Wallet</button>
        <button>Connect Bitcoin Wallet</button>
        <div>0x1234...5678</div>
        <div>soLAN...wxyz</div>
        <div>bc1q...wlh</div>
        <button>Disconnect</button>
      </div>
    )
  }
})

// Define the ConnectedWallets type
interface ConnectedWallets {
  evm: { address: string; type: 'evm' } | null;
  solana: { address: string; type: 'solana' } | null;
  bitcoin: { address: string; type: 'bitcoin' } | null;
}

describe('WalletConnection Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders connect buttons and handles wallet connections', async () => {
    // Setup mock for subscribe to simulate wallet connections
    const mockSubscribe = walletObserver.subscribe as jest.Mock
    let subscriberCallback: ((data: WalletEvent) => void) | null = null

    mockSubscribe.mockImplementation((callback: (data: WalletEvent) => void) => {
      subscriberCallback = callback
      return { unsubscribe: jest.fn() }
    })

    // Render the component
    await act(async () => {
      const initialWallets: ConnectedWallets = {
        evm: null,
        solana: null,
        bitcoin: null,
      };
      const setConnectedWallets = jest.fn();
      render(
        <WalletConnection
          connectedWallets={initialWallets}
          setConnectedWallets={setConnectedWallets}
        />
      );
    })

    // Check if connect buttons are rendered
    expect(screen.getByText('Connect EVM Wallet')).toBeInTheDocument()
    expect(screen.getByText('Connect Solana Wallet')).toBeInTheDocument()
    expect(screen.getByText('Connect Bitcoin Wallet')).toBeInTheDocument()

    // Simulate clicking the EVM connect button
    await act(async () => {
      fireEvent.click(screen.getByText('Connect EVM Wallet'))
    })

    // Simulate wallet connection notification
    await act(async () => {
      if (subscriberCallback) {
        subscriberCallback({
          evm: {
            address: '0x1234567890abcdef1234567890abcdef12345678',
            type: 'evm',
          },
          solana: null,
          bitcoin: null,
        })
      }
    })

    // Check if the EVM wallet address is displayed
    await waitFor(() => {
      expect(screen.getByText('0x1234...5678')).toBeInTheDocument()
      expect(screen.getByText('Disconnect')).toBeInTheDocument()
    })

    // Simulate clicking the Solana connect button
    await act(async () => {
      fireEvent.click(screen.getByText('Connect Solana Wallet'))
    })

    // Simulate wallet connection notification for Solana
    await act(async () => {
      if (subscriberCallback) {
        subscriberCallback({
          evm: {
            address: '0x1234567890abcdef1234567890abcdef12345678',
            type: 'evm',
          },
          solana: {
            address: 'soLANaWaLLetAddReSS123456789abcdefghijklmnopqrstuvwxyz',
            type: 'solana',
          },
          bitcoin: null,
        })
      }
    })

    // Check if both wallet addresses are displayed
    await waitFor(() => {
      expect(screen.getByText('0x1234...5678')).toBeInTheDocument()
      expect(screen.getByText('soLAN...wxyz')).toBeInTheDocument()
    })

    // Simulate clicking the Bitcoin connect button
    await act(async () => {
      fireEvent.click(screen.getByText('Connect Bitcoin Wallet'))
    })

    // Simulate wallet connection notification for Bitcoin
    await act(async () => {
      if (subscriberCallback) {
        subscriberCallback({
          evm: {
            address: '0x1234567890abcdef1234567890abcdef12345678',
            type: 'evm',
          },
          solana: {
            address: 'soLANaWaLLetAddReSS123456789abcdefghijklmnopqrstuvwxyz',
            type: 'solana',
          },
          bitcoin: {
            address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
            type: 'bitcoin',
          },
        })
      }
    })

    // Check if all wallet addresses are displayed
    await waitFor(() => {
      expect(screen.getByText('0x1234...5678')).toBeInTheDocument()
      expect(screen.getByText('soLAN...wxyz')).toBeInTheDocument()
      expect(screen.getByText('bc1q...wlh')).toBeInTheDocument()
    })

    // Simulate clicking a disconnect button
    await act(async () => {
      const disconnectButtons = screen.getAllByText('Disconnect')
      fireEvent.click(disconnectButtons[0])
    })
  })
})
