#!/bin/sh
# Fail on any error
set -e

# Fail when using undeclared variables
set -u

# Source shared logging utility
log() {
	level="$1"
	message="$2"
	timestamp=$(date '+%Y-%m-%d %H:%M:%S')

	echo "📝 [${timestamp}] ${level}: ${message}"
}

log "INIT" "Starting EVM Fullnode initialization"
sleep 5

# Function to extract --home value from arguments
get_home_dir() {
	home_dir="${HOME}/.evm"

	# Parse arguments to find --home
	while [ $# -gt 0 ]; do
		case "$1" in
		--home)
			if [ -n "$2" ]; then
				home_dir="$2"
				break
			fi
			;;
		--home=*)
			home_dir="${1#--home=}"
			break
			;;
		esac
		shift
	done

	echo "${home_dir}"
}

# Get the home directory (either from --home flag or default)
CONFIG_HOME=$(get_home_dir "$@")
log "INFO" "Using config home directory: ${CONFIG_HOME}"

if [ ! -f "${CONFIG_HOME}/config/node_key.json" ]; then
	log "INFO" "Node key not found. Initializing new fullnode configuration"

	# Build init flags array
	init_flags="--home=${CONFIG_HOME}"

	INIT_COMMAND="evm init ${init_flags}"
	log "INIT" "Initializing fullnode with command: ${INIT_COMMAND}"
	${INIT_COMMAND}
	log "SUCCESS" "Fullnode initialization completed"
else
	log "INFO" "Node key already exists. Skipping initialization"
fi

# Importing genesis
cp -pr /volumes/sequencer_export/genesis.json "${CONFIG_HOME}/config/genesis.json"
log "SUCCESS" "genesis.json copied to: ${CONFIG_HOME}/config/genesis.json"

# Auto-retrieve genesis hash if not provided
log "INFO" "Checking genesis hash configuration"
if [ -z "${EVM_GENESIS_HASH-}" ] && [ -n "${EVM_ETH_URL-}" ]; then
	log "INFO" "EVM_GENESIS_HASH not provided, attempting to retrieve from ev-reth at: ${EVM_ETH_URL}"

	# Wait for ev-reth to be ready (max 60 seconds)
	retry_count=0
	max_retries=12
	while [ "${retry_count}" -lt "${max_retries}" ]; do
		if curl -s --connect-timeout 5 "${EVM_ETH_URL}" >/dev/null 2>&1; then
			log "SUCCESS" "ev-reth is ready, retrieving genesis hash..."
			break
		fi
		log "INFO" "Waiting for ev-reth to be ready... (attempt $((retry_count + 1))/${max_retries})"
		sleep 5
		retry_count=$((retry_count + 1))
	done

	if [ "${retry_count}" -eq "${max_retries}" ]; then
		log "WARNING" "Could not connect to ev-reth at ${EVM_ETH_URL} after ${max_retries} attempts"
		log "WARNING" "Proceeding without auto-retrieved genesis hash..."
	else
		# Retrieve genesis block hash using curl and shell parsing
		log "NETWORK" "Fetching genesis block from ev-reth..."
		genesis_response=$(curl -s -X POST -H "Content-Type: application/json" \
			--data '{"jsonrpc":"2.0","method":"eth_getBlockByNumber","params":["0x0", false],"id":1}' \
			"${EVM_ETH_URL}" 2>/dev/null)

		if [ $? -eq 0 ] && [ -n "${genesis_response}" ]; then
			# Extract hash using shell parameter expansion and sed
			# Look for "hash":"0x..." pattern and extract the hash value
			genesis_hash=$(echo "${genesis_response}" | sed -n 's/.*"hash":"\([^"]*\)".*/\1/p')

			if [ -n "${genesis_hash}" ] && [ "${genesis_hash#0x}" != "${genesis_hash}" ]; then
				EVM_GENESIS_HASH="${genesis_hash}"
				log "SUCCESS" "Successfully retrieved genesis hash: ${EVM_GENESIS_HASH}"
			else
				log "WARNING" "Could not parse genesis hash from response"
				log "DEBUG" "Response: ${genesis_response}"
			fi
		else
			log "WARNING" "Failed to retrieve genesis block from ev-reth"
		fi
	fi
elif [ -n "${EVM_GENESIS_HASH-}" ]; then
	log "INFO" "Using provided genesis hash: ${EVM_GENESIS_HASH}"
else
	log "INFO" "No genesis hash configuration provided"
fi

# Build start flags array
log "INFO" "Building startup configuration flags"
default_flags=""

# Add required flags if environment variables are set
if [ -n "${EVM_JWT_SECRET_FILE-}" ]; then
	default_flags="${default_flags} --evm.jwt-secret-file ${EVM_JWT_SECRET_FILE}"
	log "DEBUG" "Added JWT secret file flag"
fi

if [ -n "${EVM_GENESIS_HASH-}" ]; then
	default_flags="${default_flags} --evm.genesis-hash ${EVM_GENESIS_HASH}"
	log "DEBUG" "Added genesis hash flag"
fi

if [ -n "${EVM_ENGINE_URL-}" ]; then
	default_flags="${default_flags} --evm.engine-url ${EVM_ENGINE_URL}"
	log "DEBUG" "Added engine URL flag: ${EVM_ENGINE_URL}"
fi

if [ -n "${EVM_ETH_URL-}" ]; then
	default_flags="${default_flags} --evm.eth-url ${EVM_ETH_URL}"
	log "DEBUG" "Added ETH URL flag: ${EVM_ETH_URL}"
fi

log "INFO" "Configuring Data Availability (DA) settings"
if [ -n "${SEQUENCER_P2P_INFO-}" ]; then
	default_flags="${default_flags} --evnode.p2p.peers ${SEQUENCER_P2P_INFO}"
	log "DEBUG" "Added p2p peer flag: ${SEQUENCER_P2P_INFO}"
fi

# Conditionally add DA-related flags
log "INFO" "Configuring Data Availability (DA) settings"
if [ -n "${DA_ADDRESS-}" ]; then
	default_flags="${default_flags} --evnode.da.address ${DA_ADDRESS}"
	log "DEBUG" "Added DA address flag: ${DA_ADDRESS}"
fi

if [ -n "${DA_AUTH_TOKEN-}" ]; then
	default_flags="${default_flags} --evnode.da.auth_token ${DA_AUTH_TOKEN}"
	log "DEBUG" "Added DA auth token flag"
fi

if [ -n "${DA_DATA_NAMESPACE-}" ]; then
	default_flags="${default_flags} --evnode.da.data_namespace ${DA_DATA_NAMESPACE}"
	log "DEBUG" "Added DA data namespace flag: ${DA_DATA_NAMESPACE}"
fi

if [ -n "${DA_HEADER_NAMESPACE-}" ]; then
	default_flags="${default_flags} --evnode.da.namespace ${DA_HEADER_NAMESPACE}"
	log "DEBUG" "Added DA header namespace flag: ${DA_HEADER_NAMESPACE}"
fi

default_flags="${default_flags} --home=${CONFIG_HOME}"

log "SUCCESS" "Configuration flags prepared successfully"

# If no arguments passed, show help
if [ $# -eq 0 ]; then
	log "INFO" "No arguments provided, showing help"
	exec evm
fi

# If first argument is "start", apply default flags
if [ "$1" = "start" ]; then
	shift
	log "INIT" "Starting EVM fullnode with command: evm start ${default_flags} $*"
	log "INFO" "Fullnode is now starting up..."
	eval "exec evm start ${default_flags} \"\$@\""
else
	# For any other command/subcommand, pass through directly
	log "INFO" "Executing command: evm $*"
	exec evm "$@"
fi
