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

CONFIG_HOME=$(get_home_dir "$@")
log "INFO" "Using config home directory: ${CONFIG_HOME}"

if [ ! -f "${CONFIG_HOME}/config/node_key.json" ]; then
	log "INFO" "Node key not found. Initializing new sequencer configuration"

	# Build init flags array
	init_flags="--home=${CONFIG_HOME}"

	# Add required flags if environment variables are set
	if [ -n "${EVM_SIGNER_PASSPHRASE-}" ]; then
		# Create passphrase file
		PASSPHRASE_FILE="${CONFIG_HOME}/signer_passphrase.txt"
		echo "${EVM_SIGNER_PASSPHRASE}" >"${PASSPHRASE_FILE}"
		chmod 600 "${PASSPHRASE_FILE}"
		init_flags="${init_flags} --evnode.node.aggregator=true --evnode.signer.passphrase_file ${PASSPHRASE_FILE}"
	fi

	INIT_COMMAND="evm init ${init_flags}"
	log "INIT" "Initializing sequencer with command: ${INIT_COMMAND}"
	${INIT_COMMAND}
	log "SUCCESS" "Sequencer initialization completed"
else
	log "INFO" "Node key already exists. Skipping initialization"
fi
