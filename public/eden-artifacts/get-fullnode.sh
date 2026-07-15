#!/usr/bin/env bash
# Downloads the Eden full node Docker Compose artifacts for a given network.
#
# Usage:
#   curl -fsSL https://eden-docs.pages.dev/eden-artifacts/get-fullnode.sh | bash
#   curl -fsSL https://eden-docs.pages.dev/eden-artifacts/get-fullnode.sh | bash -s -- testnet
set -euo pipefail

NETWORK="${1:-mainnet}"
case "${NETWORK}" in
mainnet | testnet) ;;
*)
	echo "Usage: get-fullnode.sh [mainnet|testnet]" >&2
	exit 1
	;;
esac

BASE_URL="https://eden-docs.pages.dev/eden-artifacts"
DEST_DIR="eden-fullnode"
SHARED_FILES="compose.yaml,entrypoint.fullnode.sh,init-1-ev-node.sh,init-1-ev-reth-snapshot.sh,init-2-ev-node-snapshot.sh"
NETWORK_FILES=".env,ev-node.genesis.json,ev-reth.genesis.json"

echo "Downloading Eden ${NETWORK} full node artifacts into ./${DEST_DIR}"
mkdir -p "${DEST_DIR}"
cd "${DEST_DIR}"

curl -fsSL --remote-name-all \
	"${BASE_URL}/{${SHARED_FILES}}" \
	"${BASE_URL}/${NETWORK}/{${NETWORK_FILES}}"

chmod +x entrypoint.fullnode.sh init-1-ev-node.sh init-1-ev-reth-snapshot.sh init-2-ev-node-snapshot.sh

echo "Done. Next steps:"
echo "  cd ${DEST_DIR}"
echo "  \$EDITOR .env   # set DA_ADDRESS to your Celestia light node RPC"
echo "  docker compose up -d"
