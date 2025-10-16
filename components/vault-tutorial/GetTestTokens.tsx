'use client';

/**
 * GetTestTokens Component
 * UI for minting test tokens from the faucet
 */

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { faucetERC20Abi } from '../../lib/abis';
import { LOAN_TOKEN, COLLATERAL_TOKEN, getTxUrl } from '../../lib/vaultTutorialConfig';

type TokenType = 'fakeUSD' | 'fakeTIA';

export default function GetTestTokens() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenType>('fakeUSD');
  const [mintAmount, setMintAmount] = useState('100');
  const [cooldownTimer, setCooldownTimer] = useState<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const tokenAddress = selectedToken === 'fakeUSD' ? LOAN_TOKEN : COLLATERAL_TOKEN;

  // Read token data
  const { data: tokenSymbol } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: faucetERC20Abi,
    functionName: 'symbol',
    query: { enabled: !!tokenAddress && isConnected },
  });

  const { data: userBalance, refetch: refetchBalance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: faucetERC20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!tokenAddress && !!address && isConnected },
  });

  const { data: canMint } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: faucetERC20Abi,
    functionName: 'canMint',
    args: address ? [address] : undefined,
    query: { enabled: !!tokenAddress && !!address && isConnected },
  });

  const { data: remainingCooldown } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: faucetERC20Abi,
    functionName: 'remainingCooldown',
    args: address ? [address] : undefined,
    query: { enabled: !!tokenAddress && !!address && isConnected },
  });

  const { data: maxMintPerCall } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: faucetERC20Abi,
    functionName: 'maxMintPerCall',
    query: { enabled: !!tokenAddress && isConnected },
  });

  const { writeContract, data: mintHash, isPending, error: writeError } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash: mintHash });

  // Update cooldown timer
  useEffect(() => {
    if (remainingCooldown && typeof remainingCooldown === 'bigint') {
      setCooldownTimer(Number(remainingCooldown));
    }
  }, [remainingCooldown]);

  // Countdown timer
  useEffect(() => {
    if (cooldownTimer > 0) {
      const interval = setInterval(() => {
        setCooldownTimer((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [cooldownTimer]);

  // Refetch balance after successful mint
  useEffect(() => {
    if (isSuccess) {
      refetchBalance();
    }
  }, [isSuccess, refetchBalance]);

  const handleMint = () => {
    if (!address || !tokenAddress) return;

    const amount = parseEther(mintAmount);

    // @ts-ignore - Wagmi type definitions are overly strict
    writeContract({
      address: tokenAddress as `0x${string}`,
      abi: faucetERC20Abi,
      functionName: 'mint',
      args: [address, amount],
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
          Please connect your wallet to mint test tokens.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 my-4 bg-white dark:bg-gray-900">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Token
          </label>
          <select
            value={selectedToken}
            onChange={(e) => setSelectedToken(e.target.value as TokenType)}
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-4 py-2 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="fakeUSD">fakeUSD (Loan Token)</option>
            <option value="fakeTIA">fakeTIA (Collateral Token)</option>
          </select>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Your Balance:</span>
            <span className="font-mono text-gray-900 dark:text-gray-100">
              {userBalance ? formatEther(userBalance) : '0'} {tokenSymbol || selectedToken}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Max Per Call:</span>
            <span className="font-mono text-gray-900 dark:text-gray-100">
              {maxMintPerCall ? formatEther(maxMintPerCall) : '2000'} tokens
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Amount to Mint
          </label>
          <input
            type="text"
            value={mintAmount}
            onChange={(e) => setMintAmount(e.target.value)}
            placeholder="100"
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-4 py-2 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isPending || !canMint}
          />
        </div>

        <button
          onClick={handleMint}
          disabled={isPending || !canMint || !address}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium px-6 py-3 rounded-lg transition-colors"
        >
          {isPending ? 'Minting...' : canMint ? 'Mint Tokens' : `Cooldown: ${cooldownTimer}s`}
        </button>

        {!canMint && cooldownTimer > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-yellow-700 dark:text-yellow-400 text-sm flex items-center gap-2">
              <span className="text-lg">⏱️</span>
              <span>
                Cooldown active. Please wait {cooldownTimer} seconds before minting again.
              </span>
            </p>
          </div>
        )}

        {writeError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-700 dark:text-red-400 text-sm">
              Error: {writeError.message}
            </p>
          </div>
        )}

        {isSuccess && mintHash && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-green-700 dark:text-green-400 text-sm font-medium flex items-center gap-2 mb-2">
              <span className="text-lg">✓</span>
              <span>Tokens minted successfully!</span>
            </p>
            <a
              href={getTxUrl(mintHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-green-600 dark:text-green-400 hover:underline inline-block"
            >
              View transaction on Explorer →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

