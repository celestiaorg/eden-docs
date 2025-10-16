'use client';

/**
 * VaultStats Component
 * Display real-time vault metrics
 */

import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { metaMorphoAbi } from '../../lib/abis';
import { getAddressUrl } from '../../lib/vaultTutorialConfig';

export default function VaultStats() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [vaultAddress, setVaultAddress] = useState<string>('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load vault address from localStorage and listen for deployment events
  useEffect(() => {
    const loadVaultAddress = () => {
      const saved = localStorage.getItem('tutorialVaultAddress');
      if (saved) {
        setVaultAddress(saved);
      }
    };

    // Load initially
    loadVaultAddress();

    // Listen for vault deployment events
    const handleVaultDeployed = (event: Event) => {
      const customEvent = event as CustomEvent<{ address: string }>;
      if (customEvent.detail?.address) {
        setVaultAddress(customEvent.detail.address);
      }
    };

    window.addEventListener('vaultDeployed', handleVaultDeployed);

    return () => {
      window.removeEventListener('vaultDeployed', handleVaultDeployed);
    };
  }, []);

  // Read vault data with auto-refresh every 10 seconds
  const { data: totalAssets } = useReadContract({
    address: vaultAddress as `0x${string}`,
    abi: metaMorphoAbi,
    functionName: 'totalAssets',
    query: { enabled: !!vaultAddress, refetchInterval: 10000 },
  });

  const { data: totalSupply } = useReadContract({
    address: vaultAddress as `0x${string}`,
    abi: metaMorphoAbi,
    functionName: 'totalSupply',
    query: { enabled: !!vaultAddress, refetchInterval: 10000 },
  });

  const { data: userShares } = useReadContract({
    address: vaultAddress as `0x${string}`,
    abi: metaMorphoAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!vaultAddress && !!address && isConnected, refetchInterval: 10000 },
  });

  const { data: userAssets } = useReadContract({
    address: vaultAddress as `0x${string}`,
    abi: metaMorphoAbi,
    functionName: 'convertToAssets',
    args: userShares ? [userShares] : undefined,
    query: { enabled: !!vaultAddress && !!userShares, refetchInterval: 10000 },
  });

  // Calculate share price
  const sharePrice =
    totalAssets && totalSupply && totalSupply > BigInt(0)
      ? Number(totalAssets) / Number(totalSupply)
      : 1;

  if (!mounted) {
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 my-4 bg-white dark:bg-gray-900">
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!vaultAddress) {
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 my-4 bg-gray-50 dark:bg-gray-800">
        <p className="text-gray-600 dark:text-gray-400">
          Please deploy a vault first to view its stats.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 my-4 bg-white dark:bg-gray-900">
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Vault Metrics
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">Auto-refreshes every 10s</span>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Vault Address:</p>
          <a
            href={getAddressUrl(vaultAddress)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-blue-600 dark:text-blue-400 hover:underline break-all"
          >
            {vaultAddress}
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Total Assets */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Assets</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {totalAssets ? formatEther(totalAssets) : '0'}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">fakeUSD</p>
          </div>

          {/* Total Supply */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Supply</p>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {totalSupply ? formatEther(totalSupply) : '0'}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">shares</p>
          </div>

          {/* Share Price */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Share Price</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
              {sharePrice.toFixed(6)}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">fakeUSD per share</p>
          </div>

          {/* User Shares */}
          {isConnected && (
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Your Shares</p>
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                {userShares ? formatEther(userShares) : '0'}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                ≈ {userAssets ? formatEther(userAssets) : '0'} fakeUSD
              </p>
            </div>
          )}
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm space-y-2">
          <p className="font-medium text-gray-900 dark:text-gray-100">💡 How to read these metrics:</p>
          <ul className="space-y-1 text-gray-700 dark:text-gray-300 ml-4 list-disc">
            <li>
              <strong>Total Assets:</strong> Total fakeUSD held by the vault
            </li>
            <li>
              <strong>Total Supply:</strong> Total vault shares issued to all depositors
            </li>
            <li>
              <strong>Share Price:</strong> Current value of each share (totalAssets / totalSupply)
            </li>
            <li>
              <strong>Your Shares:</strong> Your portion of the vault's total supply
            </li>
          </ul>
          <p className="text-gray-600 dark:text-gray-400 text-xs pt-2 border-t border-gray-200 dark:border-gray-700">
            As interest accrues from the underlying Morpho Blue market, the total assets increase,
            raising the share price. Your shares become more valuable without you doing anything!
          </p>
        </div>
      </div>
    </div>
  );
}

