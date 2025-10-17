/**
 * Vault Tutorial Configuration
 * Centralized contract addresses and configuration for the interactive vault tutorial
 */

import { MarketParams } from '@morpho-org/blue-sdk'

// ====================
// Pre-deployed Contracts on Eden Testnet
// ====================

export const MORPHO_BLUE_CORE = '0xe3F8380851ee3A0BBcedDD0bCDe92d423812C1Cd' as const
export const METAMORPHO_FACTORY = '0xb007ca4AD41874640F9458bF3B5e427c31Be7766' as const
export const IRM_MOCK = '0x9F16Bf4ef111fC4cE7A75F9aB3a3e20CD9754c92' as const

// ====================
// Deployed Test Tokens
// Extracted from: ../contracts/broadcast/DeployTokens.s.sol/3735928814/run-latest.json
// ====================

export const LOAN_TOKEN = '0x8a43989648f8b86349a4fe58aa2470261e4cfdfa' as const // fakeUSD
export const COLLATERAL_TOKEN = '0xdab3157df4e5561a14df721f0945cb9b49ab5506' as const // fakeTIA

// ====================
// Oracle
// Extracted from: ../contracts/broadcast/DeployOracleMock.s.sol/3735928814/run-latest.json
// ====================

export const ORACLE_ADDRESS = '0x0878af8baa013f7f6c4687391993b4206b9cde57' as const

// ====================
// Market Parameters
// ====================

export const LLTV = BigInt('800000000000000000') // 80% = 0.8e18

// Create MarketParams instance
const marketParamsInstance = new MarketParams({
  loanToken: LOAN_TOKEN,
  collateralToken: COLLATERAL_TOKEN,
  oracle: ORACLE_ADDRESS,
  irm: IRM_MOCK,
  lltv: LLTV
})

// Export market params
export const marketParams = marketParamsInstance

// Compute market ID from parameters
const COMPUTED_MARKET_ID = marketParamsInstance.id

// Actual deployed market ID (from frontend setup)
const DEPLOYED_MARKET_ID =
  '0x75f28b20c33eb6a853c3bb8fb6bae1b3902f6941ad4f1ebea4b245c00541e95d' as const

// Validate that computed ID matches deployed market
if (String(COMPUTED_MARKET_ID) !== DEPLOYED_MARKET_ID) {
  throw new Error(
    'Market ID mismatch!\n' +
      `Computed:  ${COMPUTED_MARKET_ID}\n` +
      `Deployed:  ${DEPLOYED_MARKET_ID}\n\n` +
      'This means one or more market parameters are incorrect:\n' +
      `- Loan Token: ${LOAN_TOKEN}\n` +
      `- Collateral Token: ${COLLATERAL_TOKEN}\n` +
      `- Oracle: ${ORACLE_ADDRESS}\n` +
      `- IRM: ${IRM_MOCK}\n` +
      `- LLTV: ${LLTV.toString()}`
  )
}

// Export the validated market ID
export const MARKET_ID = COMPUTED_MARKET_ID

// ====================
// Network Constants
// ====================

export const CHAIN_ID = 3735928814
export const CHAIN_NAME = 'Eden Testnet'
export const RPC_URL = 'http://localhost:8080/rpc'

// ====================
// Helpful Constants
// ====================

export const FAUCET_URL = 'https://faucet-eden-testnet.binarybuilders.services' as const
export const BLOCK_EXPLORER_URL = 'https://eden-testnet.blockscout.com' as const

/**
 * Get block explorer URL for a transaction
 */
export function getTxUrl(txHash: string): string {
  return `${BLOCK_EXPLORER_URL}/tx/${txHash}`
}

/**
 * Get block explorer URL for an address
 */
export function getAddressUrl(address: string): string {
  return `${BLOCK_EXPLORER_URL}/address/${address}`
}
