'use client'

/**
 * DeployVault Component
 * UI for deploying a new MetaMorpho vault via the factory
 */

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { metaMorphoFactoryAbi } from '../../lib/abis'
import { METAMORPHO_FACTORY, LOAN_TOKEN, getTxUrl } from '../../lib/vaultTutorialConfig'

export default function DeployVault() {
  const { address, isConnected } = useAccount()
  const [mounted, setMounted] = useState(false)
  const [vaultName, setVaultName] = useState('My Vault')
  const [vaultSymbol, setVaultSymbol] = useState('mvUSD')
  const [deployedVaultAddress, setDeployedVaultAddress] = useState<string>('')

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract()
  const { isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Extract vault address from transaction receipt
  useEffect(() => {
    if (isSuccess && receipt?.logs && receipt.logs.length > 0) {
      // The factory emits a CreateMetaMorpho event
      // The vault address is in the logs
      const vaultAddress = receipt.logs[0]?.address
      if (vaultAddress) {
        setDeployedVaultAddress(vaultAddress)
        // Save to localStorage for next steps
        localStorage.setItem('tutorialVaultAddress', vaultAddress)

        // Dispatch custom event to notify other components
        window.dispatchEvent(
          new CustomEvent('vaultDeployed', { detail: { address: vaultAddress } })
        )
      }
    }
  }, [isSuccess, receipt])

  const handleDeploy = async () => {
    if (!address) return

    // Generate unique salt per user (to avoid collisions)
    const { keccak256, encodePacked } = await import('viem')
    const salt = keccak256(encodePacked(['address', 'string'], [address, vaultName + vaultSymbol]))

    // @ts-ignore - Wagmi type definitions are overly strict here
    writeContract({
      address: METAMORPHO_FACTORY as `0x${string}`,
      abi: metaMorphoFactoryAbi,
      functionName: 'createMetaMorpho',
      args: [address, BigInt(0), LOAN_TOKEN as `0x${string}`, vaultName, vaultSymbol, salt]
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
          Please connect your wallet to deploy a vault.
        </p>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 my-4 bg-white dark:bg-gray-900">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Vault Name
          </label>
          <input
            type="text"
            value={vaultName}
            onChange={e => setVaultName(e.target.value)}
            placeholder="My Vault"
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-4 py-2 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isPending || isSuccess}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Vault Symbol
          </label>
          <input
            type="text"
            value={vaultSymbol}
            onChange={e => setVaultSymbol(e.target.value)}
            placeholder="mvUSD"
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-4 py-2 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isPending || isSuccess}
          />
        </div>

        <button
          onClick={handleDeploy}
          disabled={isPending || isSuccess || !address}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium px-6 py-3 rounded-lg transition-colors"
        >
          {isPending ? 'Deploying...' : isSuccess ? 'Vault Deployed!' : 'Deploy Vault'}
        </button>

        {writeError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-700 dark:text-red-400 text-sm">Error: {writeError.message}</p>
          </div>
        )}

        {isPending && hash && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-blue-700 dark:text-blue-400 text-sm">
              ⏳ Transaction pending...{' '}
              <a
                href={getTxUrl(hash)}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:no-underline"
              >
                View on Explorer
              </a>
            </p>
          </div>
        )}

        {isSuccess && deployedVaultAddress && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-2">
            <p className="text-green-700 dark:text-green-400 text-sm font-medium flex items-center gap-2">
              <span className="text-lg">✓</span>
              <span>Vault deployed successfully!</span>
            </p>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <p className="font-medium mb-1">Vault Address:</p>
              <p className="font-mono text-xs break-all bg-gray-100 dark:bg-gray-800 p-2 rounded">
                {deployedVaultAddress}
              </p>
            </div>
            {hash && (
              <a
                href={getTxUrl(hash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-green-600 dark:text-green-400 hover:underline inline-block"
              >
                View transaction on Explorer →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
