'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { oracleMockAbi } from '../../lib/abis'
import { ORACLE_ADDRESS, getTxUrl } from '../../lib/vaultTutorialConfig'

const ORACLE_DECIMALS = 36 // Morpho standard: 10^36 for price scaling

export default function OracleControls() {
  const { address, isConnected } = useAccount()
  const [mounted, setMounted] = useState(false)
  const [newPrice, setNewPrice] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  const { data: currentPriceRaw, refetch: refetchPrice } = useReadContract({
    address: ORACLE_ADDRESS as `0x${string}`,
    abi: oracleMockAbi,
    functionName: 'price',
    query: { enabled: !!ORACLE_ADDRESS && isConnected, refetchInterval: 10000 }
  })

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isSuccess) {
      refetchPrice()
      setNewPrice('')
    }
  }, [isSuccess, refetchPrice])

  const handleSetPrice = () => {
    if (!address || !newPrice) return

    try {
      const price = parseUnits(newPrice, ORACLE_DECIMALS)

      // @ts-ignore - Wagmi type definitions are overly strict
      writeContract({
        address: ORACLE_ADDRESS as `0x${string}`,
        abi: oracleMockAbi,
        functionName: 'setPrice',
        args: [price]
      })
    } catch (error) {
      console.error('Set price error:', error)
    }
  }

  const currentPrice = currentPriceRaw
    ? parseFloat(formatUnits(currentPriceRaw, ORACLE_DECIMALS)).toFixed(2)
    : '0.00'

  const isValidPrice = newPrice && parseFloat(newPrice) > 0

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
          Please connect your wallet to control the oracle.
        </p>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 my-4 bg-white dark:bg-gray-900">
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Current Price</p>
          <div className="flex items-center gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex-shrink-0">
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{currentPrice}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">fakeTIA/fakeUSD</p>
            </div>

            <div className="flex gap-2 flex-1">
              <input
                type="number"
                step="0.01"
                min="0"
                value={newPrice}
                onChange={e => setNewPrice(e.target.value)}
                placeholder="Enter new price (e.g., 5.00)"
                className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg px-4 py-2 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isPending}
              />
              <button
                onClick={handleSetPrice}
                disabled={isPending || !isValidPrice}
                className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 disabled:cursor-not-allowed text-white font-medium px-6 py-2 rounded-lg transition-colors whitespace-nowrap"
              >
                {isPending ? 'Setting...' : 'Set Price'}
              </button>
            </div>
          </div>
        </div>

        {hash && (
          <a
            href={getTxUrl(hash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-block"
          >
            View transaction on Explorer →
          </a>
        )}
      </div>
    </div>
  )
}
