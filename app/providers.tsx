'use client'

/**
 * Providers wrapper for Wagmi and React Query
 * Enables Web3 interactions throughout the app
 */

import { defineChain } from 'viem'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { injected } from 'wagmi/connectors'

const eden = defineChain({
  id: 714,
  name: 'Eden',
  nativeCurrency: {
    decimals: 18,
    name: 'TIA',
    symbol: 'TIA'
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.eden.gateway.fm/'],
      webSocket: ['wss://rpc.eden.gateway.fm/ws']
    }
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://eden.blockscout.com/'
    }
  }
})

// Create Wagmi config for Eden
const config = createConfig({
  chains: [eden],
  connectors: [injected()],
  transports: {
    [eden.id]: http()
  }
})

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false
    }
  }
})

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
