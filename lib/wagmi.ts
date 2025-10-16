/**
 * Wagmi Configuration for Eden Testnet
 */

import { defineChain } from 'viem';
import { CHAIN_ID, CHAIN_NAME, RPC_URL, BLOCK_EXPLORER_URL } from './vaultTutorialConfig';

/**
 * Eden Testnet chain configuration
 * Chain ID: 3735928814 (0xDEADBFEE)
 */
export const edenTestnet = defineChain({
  id: CHAIN_ID,
  name: CHAIN_NAME,
  nativeCurrency: {
    decimals: 18,
    name: 'TIA',
    symbol: 'TIA',
  },
  rpcUrls: {
    default: {
      http: [RPC_URL],
    },
    public: {
      http: [RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: BLOCK_EXPLORER_URL,
    },
  },
  testnet: true,
});

