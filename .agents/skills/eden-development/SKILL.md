---
name: eden-development
description: Build applications on Eden using current network settings, Foundry, viem, wagmi, and Eden transaction features. Use when configuring an Eden connection, deploying contracts, or integrating an Eden frontend.
---

# Develop on Eden

Eden is an EVM network powered by Celestia for data availability. Use Eden's
network configuration, not Celestia's chain settings.

## Find current documentation

Connect to `https://docs.eden.zone/api/mcp` with Streamable HTTP. The public,
read-only server provides `list_pages`, `read_page`, and `search_docs`.
For example, call `read_page` with `{"pagePath":"/networks/testnet"}` or
`search_docs` with `{"query":"sponsored"}`. A tool response with `isError: true`
is a failed lookup; use `list_pages` to find a valid path.

Without MCP, fetch the [page index](https://docs.eden.zone/llms.txt), then read
the relevant page with `Accept: text/markdown` or append `.md` to its path.
Fetch individual pages before resorting to the full documentation export.

## Choose the relevant workflow

- **Connect a wallet or client:** Read the user's chosen
  [mainnet](https://docs.eden.zone/networks/mainnet) or
  [testnet](https://docs.eden.zone/networks/testnet) reference for current chain ID,
  RPC URL, explorer, and funding information. If the network is unspecified,
  clarify it before preparing transactions.
- **Deploy Solidity contracts:** Follow the
  [Foundry quickstart](https://docs.eden.zone/development-environments/foundry-quickstart).
  Check [supported EIPs](https://docs.eden.zone/development-environments/supported-eips)
  before relying on chain-specific behavior.
- **Build a frontend:** Use the
  [viem quickstart](https://docs.eden.zone/frontend-libraries/viem-quickstart) or
  [wagmi quickstart](https://docs.eden.zone/frontend-libraries/wagmi-quickstart)
  for the user's existing library. Read
  [viem transactions](https://docs.eden.zone/frontend-libraries/viem-transactions)
  when implementing Eden transaction features.
- **Work with tokens or bridging:** Read the
  [token reference](https://docs.eden.zone/tokens/reference) and
  [bridging guide](https://docs.eden.zone/tooling/bridging) before choosing addresses
  or transfer routes.

Use current reference pages instead of hardcoding network values from memory.
Cite the documentation used, and distinguish local checks from confirmed onchain
transactions. This skill grants no permission to sign, deploy, bridge, or spend;
follow the user's authorization. The docs server needs no authentication and must
never receive private keys, wallet recovery phrases, or application secrets.
