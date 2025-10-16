'use client';

/**
 * DepositToVault Component
 * UI for approving and depositing tokens into the vault
 */

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { faucetERC20Abi, metaMorphoAbi } from '../../lib/abis';
import { LOAN_TOKEN, getTxUrl } from '../../lib/vaultTutorialConfig';

export default function DepositToVault() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [vaultAddress, setVaultAddress] = useState<string>('');
  const [depositAmount, setDepositAmount] = useState('100');

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

  // Read user's fakeUSD balance
  const { data: userBalance, refetch: refetchBalance } = useReadContract({
    address: LOAN_TOKEN as `0x${string}`,
    abi: faucetERC20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && isConnected },
  });

  // Read user's allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: LOAN_TOKEN as `0x${string}`,
    abi: faucetERC20Abi,
    functionName: 'allowance',
    args: address && vaultAddress ? [address, vaultAddress as `0x${string}`] : undefined,
    query: { enabled: !!address && !!vaultAddress && isConnected },
  });

  // Read vault total assets
  const { data: totalAssets, refetch: refetchTotalAssets } = useReadContract({
    address: vaultAddress as `0x${string}`,
    abi: metaMorphoAbi,
    functionName: 'totalAssets',
    query: { enabled: !!vaultAddress },
  });

  // Approve transaction
  const {
    writeContract: approve,
    data: approveHash,
    isPending: isApprovePending,
  } = useWriteContract();
  const { isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });

  // Deposit transaction
  const {
    writeContract: deposit,
    data: depositHash,
    isPending: isDepositPending,
    error: depositError,
  } = useWriteContract();
  const { isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({ hash: depositHash });

  // Refetch after transactions
  useEffect(() => {
    if (isApproveSuccess) {
      refetchAllowance();
    }
  }, [isApproveSuccess, refetchAllowance]);

  useEffect(() => {
    if (isDepositSuccess) {
      refetchBalance();
      refetchAllowance();
      refetchTotalAssets();
    }
  }, [isDepositSuccess, refetchBalance, refetchAllowance, refetchTotalAssets]);

  const needsApproval =
    allowance === undefined ||
    allowance < parseEther(depositAmount || '0');

  const handleApprove = () => {
    if (!vaultAddress) return;
    // @ts-ignore - Wagmi type definitions are overly strict
    approve({
      address: LOAN_TOKEN as `0x${string}`,
      abi: faucetERC20Abi,
      functionName: 'approve',
      args: [vaultAddress as `0x${string}`, parseEther(depositAmount)],
    });
  };

  const handleDeposit = () => {
    if (!vaultAddress || !address) return;
    // @ts-ignore - Wagmi type definitions are overly strict
    deposit({
      address: vaultAddress as `0x${string}`,
      abi: metaMorphoAbi,
      functionName: 'deposit',
      args: [parseEther(depositAmount), address],
    });
  };

  if (!mounted) {
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 my-4 bg-white dark:bg-gray-900">
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 my-4 bg-gray-50 dark:bg-gray-800">
        <p className="text-gray-600 dark:text-gray-400">
          Please connect your wallet to deposit to the vault.
        </p>
      </div>
    );
  }

  if (!vaultAddress) {
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 my-4 bg-gray-50 dark:bg-gray-800">
        <p className="text-gray-600 dark:text-gray-400">
          Please deploy a vault first to deposit tokens.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 my-4 bg-white dark:bg-gray-900">
      <div className="space-y-4">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Your fakeUSD Balance:</span>
            <span className="font-mono text-gray-900 dark:text-gray-100">
              {userBalance ? formatEther(userBalance) : '0'} fakeUSD
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Vault Total Assets:</span>
            <span className="font-mono text-gray-900 dark:text-gray-100">
              {totalAssets ? formatEther(totalAssets) : '0'} fakeUSD
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Deposit Amount (fakeUSD)
          </label>
          <input
            type="text"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="100"
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-4 py-2 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {needsApproval ? (
          <div className="space-y-2">
            <button
              onClick={handleApprove}
              disabled={isApprovePending || !vaultAddress}
              className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 disabled:cursor-not-allowed text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              {isApprovePending ? 'Approving...' : '1. Approve fakeUSD'}
            </button>
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              You need to approve the vault to spend your fakeUSD first
            </p>
          </div>
        ) : (
          <button
            onClick={handleDeposit}
            disabled={isDepositPending || !vaultAddress}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            {isDepositPending ? 'Depositing...' : '2. Deposit to Vault'}
          </button>
        )}

        {approveHash && !isApproveSuccess && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-blue-700 dark:text-blue-400 text-sm">
              ⏳ Approval pending...{' '}
              <a
                href={getTxUrl(approveHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:no-underline"
              >
                View on Explorer
              </a>
            </p>
          </div>
        )}

        {isApproveSuccess && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-green-700 dark:text-green-400 text-sm font-medium flex items-center gap-2">
              <span className="text-lg">✓</span>
              <span>Approval successful! Now you can deposit.</span>
            </p>
          </div>
        )}

        {depositHash && !isDepositSuccess && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-blue-700 dark:text-blue-400 text-sm">
              ⏳ Deposit pending...{' '}
              <a
                href={getTxUrl(depositHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:no-underline"
              >
                View on Explorer
              </a>
            </p>
          </div>
        )}

        {isDepositSuccess && depositHash && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-green-700 dark:text-green-400 text-sm font-medium flex items-center gap-2 mb-2">
              <span className="text-lg">✓</span>
              <span>Deposit successful! You now own vault shares.</span>
            </p>
            <a
              href={getTxUrl(depositHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-green-600 dark:text-green-400 hover:underline inline-block"
            >
              View transaction on Explorer →
            </a>
          </div>
        )}

        {depositError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-700 dark:text-red-400 text-sm">Error: {depositError.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}

