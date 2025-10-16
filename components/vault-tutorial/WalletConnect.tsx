'use client';

/**
 * WalletConnect Component
 * Simple wallet connection UI with network validation
 */

import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useChainId } from 'wagmi';
import { FAUCET_URL } from '../../lib/vaultTutorialConfig';

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function WalletConnect() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId(); // Use Wagmi's useChainId hook - this is more reliable!
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [mounted, setMounted] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Validate Eden Testnet using Wagmi's chainId
  const isCorrectChain = mounted && isConnected && chainId === 3735928814;

  // Function to switch to Eden Testnet
  const handleSwitchNetwork = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask to use this feature');
      return;
    }

        setIsSwitching(true);
        try {
          // Try to switch to Eden Testnet
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xDEADBFEE' }], // 3735928814 in hex
          });
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            try {
              // Add the network to MetaMask
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: '0xDEADBFEE',
                    chainName: 'Eden Testnet',
                    nativeCurrency: {
                      name: 'TIA',
                      symbol: 'TIA',
                      decimals: 18,
                    },
                    rpcUrls: ['http://localhost:3001/api/rpc'],
                    blockExplorerUrls: ['https://eden-testnet.blockscout.com'],
                  },
                ],
              });
            } catch (addError) {
              alert('Failed to add Eden Testnet. Please add it manually in MetaMask.');
            }
          } else if (switchError.code !== 4001) {
            // Only alert if it's not a user rejection
            alert('Failed to switch network. Please try manually in MetaMask.');
          }
        } finally {
          setIsSwitching(false);
        }
  };

  // Show loading state during SSR to match server HTML
  if (!mounted) {
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 my-4 bg-white dark:bg-gray-900">
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">Loading wallet connection...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 my-4 bg-white dark:bg-gray-900">
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Connect your wallet to get started with the tutorial.
          </p>
          <button
            onClick={() => {
              const connector = connectors[0];
              if (connector) connect({ connector });
            }}
            disabled={isPending}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            {isPending ? 'Connecting...' : 'Connect Wallet'}
          </button>
          <p className="text-sm text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
            💡 Need testnet tokens? Visit the{' '}
            <a
              href={FAUCET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Eden Testnet Faucet
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 my-4 bg-white dark:bg-gray-900">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Connected Address:</p>
            <p className="font-mono text-sm">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
          </div>
          <button
            onClick={() => disconnect()}
            className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium px-4 py-2 rounded-lg transition-colors text-sm"
          >
            Disconnect
          </button>
        </div>

        {!isCorrectChain && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-700 dark:text-red-400 text-sm flex items-center gap-2 mb-3">
              <span className="text-lg">⚠️</span>
              <span>
                Wrong network detected. Please switch to Eden Testnet.
              </span>
            </p>
            <button
              onClick={handleSwitchNetwork}
              disabled={isSwitching}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm"
            >
              {isSwitching ? 'Switching...' : 'Switch to Eden Testnet'}
            </button>
          </div>
        )}

        {isCorrectChain && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-green-700 dark:text-green-400 text-sm flex items-center gap-2">
              <span className="text-lg">✓</span>
              <span>Connected to Eden Testnet</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}