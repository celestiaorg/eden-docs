/**
 * Contract ABIs for Vault Tutorial
 */

// Import ABIs from Morpho SDK
export { blueAbi, metaMorphoAbi } from '@morpho-org/blue-sdk-viem'

/**
 * MetaMorpho Factory ABI
 * For creating new vaults via CREATE2
 */
export const metaMorphoFactoryAbi = [
  {
    type: 'function',
    name: 'createMetaMorpho',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'initialOwner', type: 'address' },
      { name: 'initialTimelock', type: 'uint256' },
      { name: 'asset', type: 'address' },
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
      { name: 'salt', type: 'bytes32' }
    ],
    outputs: [{ name: 'metaMorpho', type: 'address' }]
  }
] as const

/**
 * FaucetERC20 ABI
 * ERC20 token with public faucet for testing
 * From: contracts/src/FaucetERC20.sol
 */
export const faucetERC20Abi = [
  {
    type: 'function',
    name: 'name',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }]
  },
  {
    type: 'function',
    name: 'symbol',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }]
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }]
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'totalSupply',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'mint',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: []
  },
  {
    type: 'function',
    name: 'canMint',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    type: 'function',
    name: 'remainingCooldown',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'maxMintPerCall',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'cooldownSeconds',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'lastMintTime',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const

/**
 * OracleMock ABI
 * Simple oracle for testing (Morpho Blue built-in)
 */
export const oracleMockAbi = [
  {
    type: 'function',
    name: 'price',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'setPrice',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'newPrice', type: 'uint256' }],
    outputs: []
  }
] as const
