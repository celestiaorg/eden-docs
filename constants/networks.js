export const EDEN_NETWORKS = {
  mainnet: {
    chainId: 42420, // TODO: Replace with actual mainnet chain ID
    rpc: "http://mainnet-rpc.eden.celestia.org", // TODO: Replace with actual mainnet RPC
    explorer: "https://mainnet-explorer.eden.celestia.org", // TODO: Replace with actual mainnet explorer
    name: "Eden Mainnet",
    currency: "TIA",
    blockTime: 2, // TODO: update with block time in seconds
  },
  testnet: {
    chainId: 1234, // TODO: Replace with actual testnet chain ID
    rpc: "http://testnet-rpc.eden.celestia.org", // TODO: Replace with actual testnet RPC
    explorer: "https://testnet-explorer.eden.celestia.org", // TODO: Replace with actual testnet explorer
    name: "Eden Testnet",
    currency: "TIA",
    blockTime: 2, // TODO: update with block time in seconds
  },
};

// Helper functions
export const getNetworkByChainId = (chainId) => {
  return Object.values(EDEN_NETWORKS).find(
    (network) => network.chainId === chainId,
  );
};

export const getNetworkByName = (name) => {
  return Object.values(EDEN_NETWORKS).find(
    (network) => network.name.toLowerCase() === name.toLowerCase(),
  );
};
