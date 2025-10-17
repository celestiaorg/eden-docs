'use client'

/**
 * ConfigureVault Component
 * UI for configuring vault supply caps and queue
 */

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { metaMorphoAbi } from '../../lib/abis'
import { MARKET_ID, marketParams, getTxUrl } from '../../lib/vaultTutorialConfig'

export default function ConfigureVault() {
  const { address, isConnected } = useAccount()
  const [mounted, setMounted] = useState(false)
  const [vaultAddress, setVaultAddress] = useState<string>('')
  const [capAmount, setCapAmount] = useState('1000000')

  useEffect(() => {
    setMounted(true)
  }, [])

  // Load vault address from localStorage
  useEffect(() => {
    const loadVaultAddress = () => {
      const saved = localStorage.getItem('tutorialVaultAddress')
      if (saved) {
        setVaultAddress(saved)
      }
    }

    // Load initially
    loadVaultAddress()

    // Listen for vault deployment events
    const handleVaultDeployed = (event: Event) => {
      const customEvent = event as CustomEvent<{ address: string }>
      if (customEvent.detail?.address) {
        setVaultAddress(customEvent.detail.address)
      }
    }

    window.addEventListener('vaultDeployed', handleVaultDeployed)

    return () => {
      window.removeEventListener('vaultDeployed', handleVaultDeployed)
    }
  }, [])

  // Check vault ownership
  const { data: vaultOwner } = useReadContract({
    address: vaultAddress as `0x${string}`,
    abi: metaMorphoAbi,
    functionName: 'owner',
    query: { enabled: !!vaultAddress && vaultAddress !== '' }
  })

  // Read current config
  const { data: configData, refetch: refetchConfig } = useReadContract({
    address: vaultAddress as `0x${string}`,
    abi: metaMorphoAbi,
    functionName: 'config',
    args: [MARKET_ID],
    query: { enabled: !!vaultAddress && vaultAddress !== '' }
  })

  const {
    writeContract: submitCap,
    data: submitCapHash,
    isPending: isSubmitCapPending,
    error: submitCapError
  } = useWriteContract()
  const { isSuccess: isSubmitCapSuccess } = useWaitForTransactionReceipt({
    hash: submitCapHash
  })

  const {
    writeContract: acceptCap,
    data: acceptCapHash,
    isPending: isAcceptCapPending
  } = useWriteContract()
  const { isSuccess: isAcceptCapSuccess } = useWaitForTransactionReceipt({
    hash: acceptCapHash
  })

  const {
    writeContract: setQueue,
    data: setQueueHash,
    isPending: isSetQueuePending
  } = useWriteContract()
  const { isSuccess: isSetQueueSuccess } = useWaitForTransactionReceipt({
    hash: setQueueHash
  })

  // Refetch config when transactions succeed
  useEffect(() => {
    if (isSubmitCapSuccess || isAcceptCapSuccess || isSetQueueSuccess) {
      refetchConfig()
    }
  }, [isSubmitCapSuccess, isAcceptCapSuccess, isSetQueueSuccess, refetchConfig])

  const handleSubmitCap = () => {
    if (!vaultAddress) return

    const capValue = parseEther(capAmount)

    // Convert MarketParams SDK object to plain struct with ONLY the 5 required fields
    const marketParamsStruct = {
      loanToken: marketParams.loanToken,
      collateralToken: marketParams.collateralToken,
      oracle: marketParams.oracle,
      irm: marketParams.irm,
      lltv: marketParams.lltv
    }

    // @ts-ignore - Wagmi type definitions are overly strict
    submitCap({
      address: vaultAddress as `0x${string}`,
      abi: metaMorphoAbi,
      functionName: 'submitCap',
      args: [marketParamsStruct, capValue]
    })
  }

  const handleAcceptCap = () => {
    if (!vaultAddress) return

    // Convert MarketParams to plain struct
    const marketParamsStruct = {
      loanToken: marketParams.loanToken,
      collateralToken: marketParams.collateralToken,
      oracle: marketParams.oracle,
      irm: marketParams.irm,
      lltv: marketParams.lltv
    }

    // @ts-ignore - Wagmi type definitions are overly strict
    acceptCap({
      address: vaultAddress as `0x${string}`,
      abi: metaMorphoAbi,
      functionName: 'acceptCap',
      args: [marketParamsStruct]
    })
  }

  const handleSetQueue = () => {
    if (!vaultAddress) return

    // setSupplyQueue expects an array of market IDs (bytes32), not MarketParams
    // @ts-ignore - Wagmi type definitions are overly strict
    setQueue({
      address: vaultAddress as `0x${string}`,
      abi: metaMorphoAbi,
      functionName: 'setSupplyQueue',
      args: [[MARKET_ID]] // Array of market IDs
    })
  }

  if (!mounted) {
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 my-4 bg-white dark:bg-gray-900">
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 my-4 bg-gray-50 dark:bg-gray-800">
        <p className="text-gray-600 dark:text-gray-400">
          Please connect your wallet to configure the vault.
        </p>
      </div>
    )
  }

  if (!vaultAddress) {
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 my-4 bg-gray-50 dark:bg-gray-800">
        <p className="text-gray-600 dark:text-gray-400">
          Please deploy a vault first to configure it.
        </p>
      </div>
    )
  }

  const isOwner = vaultOwner && address && vaultOwner.toLowerCase() === address.toLowerCase()

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 my-4 bg-white dark:bg-gray-900 space-y-6">
      {/* Ownership Warning */}
      {vaultOwner && !isOwner && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400 text-sm">
            ⚠️ You are not the owner of this vault. Only the owner ({vaultOwner.slice(0, 6)}...
            {vaultOwner.slice(-4)}) can configure it.
          </p>
        </div>
      )}

      {/* Supply Cap Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          1. Set Supply Cap
        </h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Cap Amount (fakeUSD)
          </label>
          <input
            type="text"
            value={capAmount}
            onChange={e => setCapAmount(e.target.value)}
            placeholder="1000000"
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-4 py-2 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSubmitCap}
            disabled={isSubmitCapPending || !vaultAddress || !isOwner}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium px-4 py-2 rounded-lg transition-colors flex-1"
          >
            {isSubmitCapPending ? 'Submitting...' : 'Submit Cap'}
          </button>
          <button
            onClick={handleAcceptCap}
            disabled={isAcceptCapPending || !vaultAddress || !isOwner}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white font-medium px-4 py-2 rounded-lg transition-colors flex-1"
          >
            {isAcceptCapPending ? 'Accepting...' : 'Accept Cap'}
          </button>
        </div>
        {configData && configData[0] !== undefined && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Current cap: {formatEther(configData[0])} fakeUSD
          </p>
        )}
        {submitCapHash && (
          <a
            href={getTxUrl(submitCapHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-block"
          >
            View submit cap tx →
          </a>
        )}
        {acceptCapHash && (
          <a
            href={getTxUrl(acceptCapHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-green-600 dark:text-green-400 hover:underline inline-block"
          >
            View accept cap tx →
          </a>
        )}
      </div>

      {/* Supply Queue Section */}
      <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          2. Add Market to Supply Queue
        </h3>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Market ID:</p>
          <p className="font-mono text-xs text-gray-800 dark:text-gray-200 break-all">
            {MARKET_ID}
          </p>
        </div>
        <button
          onClick={handleSetQueue}
          disabled={isSetQueuePending || !vaultAddress || !isOwner}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {isSetQueuePending ? 'Adding...' : 'Add to Supply Queue'}
        </button>
        {setQueueHash && (
          <a
            href={getTxUrl(setQueueHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-block"
          >
            View set queue tx →
          </a>
        )}
      </div>

      {(isSubmitCapSuccess || isAcceptCapSuccess || isSetQueueSuccess) && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-green-700 dark:text-green-400 text-sm flex items-center gap-2">
            <span className="text-lg">✓</span>
            <span>Configuration updated successfully!</span>
          </p>
        </div>
      )}
    </div>
  )
}
