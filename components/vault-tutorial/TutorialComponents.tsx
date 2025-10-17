'use client'

/**
 * Wrapper component that exports all tutorial components
 * This ensures they only render on the client side
 */

import WalletConnect from './WalletConnect'
import DeployVault from './DeployVault'
import ConfigureVault from './ConfigureVault'
import GetTestTokens from './GetTestTokens'
import DepositToVault from './DepositToVault'
import VaultStats from './VaultStats'
import OracleControls from './OracleControls'

export {
  WalletConnect,
  DeployVault,
  ConfigureVault,
  GetTestTokens,
  DepositToVault,
  VaultStats,
  OracleControls
}
