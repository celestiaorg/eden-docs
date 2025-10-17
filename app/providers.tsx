'use client'

/**
 * Providers wrapper for Wagmi and React Query
 * Enables Web3 interactions throughout the app
 */

import { WagmiProvider, createConfig, http } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { injected } from 'wagmi/connectors'
import { edenTestnet } from '../lib/wagmi'

// Create Wagmi config for Eden Testnet
const config = createConfig({
  chains: [edenTestnet],
  connectors: [injected()],
  transports: {
    [edenTestnet.id]: http()
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
